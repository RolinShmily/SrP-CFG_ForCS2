import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import archiver from "archiver";
import extractZip from "extract-zip";
import Winreg = require("winreg");

export interface DetectedPaths {
  steamPath: string | null;
  cs2CfgPath: string | null;
  videoCfgPath: string | null;
  annotationsPath: string | null;
}

export interface InstallOptions {
  sourcePath: string;
  isZip: boolean;
  installCfg: boolean;
  installVideo: boolean;
  installAnnotations: boolean;
}

type LogFn = (msg: string) => void;

let logFn: LogFn = () => {};

export function setLogFn(fn: LogFn) {
  logFn = fn;
}

function log(msg: string) {
  logFn(msg);
}

// ── Path Detection ──────────────────────────────────────────

async function readRegistryValue(
  hive: string,
  key: string,
  value: string,
): Promise<string | null> {
  try {
    const reg = new Winreg({ hive: hive as any, key });
    const result = await promisifyRegGet(reg, value);
    return result;
  } catch {
    return null;
  }
}

function promisifyRegGet(reg: Winreg.Registry, value: string): Promise<string | null> {
  return new Promise((resolve) => {
    reg.get(value, (err: Error | null, item: Winreg.RegistryItem | null) => {
      if (err || !item) resolve(null);
      else resolve(item.value);
    });
  });
}

const REGISTRY_PATHS: Array<{ hive: string; key: string; value: string }> = [
  { hive: "HKCU", key: "\\Software\\Valve\\Steam", value: "SteamPath" },
  { hive: "HKCU", key: "\\Software\\Valve\\Steam", value: "InstallPath" },
  { hive: "HKLM", key: "\\SOFTWARE\\Valve\\Steam", value: "InstallPath" },
  { hive: "HKLM", key: "\\SOFTWARE\\Wow6432Node\\Valve\\Steam", value: "InstallPath" },
];

export async function detectSteamPath(): Promise<string | null> {
  for (const rp of REGISTRY_PATHS) {
    const val = await readRegistryValue(rp.hive, rp.key, rp.value);
    if (!val) continue;

    const p = val.replace(/\//g, "\\").replace(/\\$/, "");
    const exe = path.join(p, "steam.exe");
    if (fs.existsSync(p) && fs.existsSync(exe)) {
      log(`[OK] Steam 路径：${p}`);
      return p;
    }
  }

  log("[!] 未找到 Steam 路径");
  return null;
}

function parseLibraryPaths(vdfContent: string): string[] {
  const matches = vdfContent.matchAll(/"path"\s+"([^"]+)"/g);
  return [...matches].map((m) => m[1].replace(/\\\\/g, "\\"));
}

function cs2GameDir(library: string): string {
  return path.join(library, "steamapps", "common", "Counter-Strike Global Offensive");
}

function readLibraryPaths(steamRoot: string): string[] | null {
  const vdf = path.join(steamRoot, "steamapps", "libraryfolders.vdf");
  if (!fs.existsSync(vdf)) {
    log("[!] 未找到 libraryfolders.vdf");
    return null;
  }
  return parseLibraryPaths(fs.readFileSync(vdf, "utf-8"));
}

export async function detectCs2CfgPath(steamRoot: string, libraries?: string[]): Promise<string | null> {
  const libs = libraries ?? readLibraryPaths(steamRoot);
  if (!libs) return null;

  for (const lib of libs) {
    const cfg = path.join(cs2GameDir(lib), "game", "csgo", "cfg");
    if (fs.existsSync(cfg)) {
      log(`[OK] 全局CFG 路径：${cfg}`);
      return cfg;
    }
  }

  log("[!] 未找到 全局CFG 路径");
  return null;
}

export async function detectAnnotationsPath(steamRoot: string, libraries?: string[]): Promise<string | null> {
  const libs = libraries ?? readLibraryPaths(steamRoot);
  if (!libs) return null;

  for (const lib of libs) {
    const csgo = path.join(cs2GameDir(lib), "game", "csgo");
    if (!fs.existsSync(csgo)) continue;

    const annotations = path.join(csgo, "annotations", "local");
    if (fs.existsSync(annotations)) {
      log(`[OK] 地图指南 路径：${annotations}`);
      return annotations;
    }

    try {
      fs.mkdirSync(annotations, { recursive: true });
      log(`[OK] 地图指南 路径（已自动创建）：${annotations}`);
      log("[!] 提示：首次创建可能需要启动一次游戏");
      return annotations;
    } catch (e: any) {
      log(`[!] 无法创建地图指南目录：${e.message}`);
      return null;
    }
  }

  log("[!] 未找到 CS2 游戏目录");
  return null;
}

export async function detectVideoCfgPath(steamRoot: string, userId: string): Promise<string | null> {
  const videoCfgDir = path.join(steamRoot, "userdata", userId, "730", "local", "cfg");

  if (fs.existsSync(videoCfgDir)) {
    log(`[OK] 用户CFG(视频预设)路径：${videoCfgDir}`);
    return videoCfgDir;
  }

  try {
    fs.mkdirSync(videoCfgDir, { recursive: true });
    log(`[OK] 用户CFG(视频预设)路径（已自动创建）：${videoCfgDir}`);
    log("[!] 提示：首次创建可能需要启动一次游戏");
    return videoCfgDir;
  } catch (e: any) {
    log(`[!] 无法创建用户CFG目录：${e.message}`);
    return null;
  }
}

export async function detectAllPaths(): Promise<DetectedPaths> {
  const steamPath = await detectSteamPath();
  if (!steamPath) {
    return { steamPath: null, cs2CfgPath: null, videoCfgPath: null, annotationsPath: null };
  }

  const libraries = readLibraryPaths(steamPath);
  const cs2CfgPath = await detectCs2CfgPath(steamPath, libraries ?? undefined);
  const annotationsPath = await detectAnnotationsPath(steamPath, libraries ?? undefined);

  return { steamPath, cs2CfgPath, videoCfgPath: null, annotationsPath };
}

// ── Steam Users ─────────────────────────────────────────────

export function getSteamUsers(steamRoot: string): string[] {
  const userdata = path.join(steamRoot, "userdata");
  if (!fs.existsSync(userdata)) return [];

  return fs
    .readdirSync(userdata, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d+$/.test(d.name))
    .map((d) => d.name);
}

// ── Backup ──────────────────────────────────────────────────

function backupToZip(srcDir: string, label: string): Promise<string> {
  const backupPath = path.join(path.dirname(srcDir), `${label}_backup.zip`);

  if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(backupPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(backupPath));
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(srcDir, false);
    archive.finalize();
  });
}

async function createBackup(srcDir: string, label: string): Promise<string | null> {
  if (!fs.existsSync(srcDir)) return null;
  try {
    log(`[~] 正在备份${label}...`);
    const zip = await backupToZip(srcDir, label);
    log(`[OK] 备份完成：${zip}`);
    return zip;
  } catch (e: any) {
    log(`[!] 备份失败：${e.message}`);
    return null;
  }
}

// ── Installation ────────────────────────────────────────────

async function installFromZip(
  zipPath: string,
  cs2CfgPath: string | null,
  videoCfgPath: string | null,
  annotationsPath: string | null,
  opts: { installCfg: boolean; installVideo: boolean; installAnnotations: boolean },
): Promise<void> {
  log(`[~] 开始安装：${path.basename(zipPath)}`);

  const tempDir = path.join(os.tmpdir(), `CS2Installer_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    log("[~] 解压 ZIP 中...");
    await extractZip(zipPath, { dir: tempDir });
    log("[OK] 解压完成。");

    const allFiles = walkSync(tempDir);

    if (opts.installCfg && cs2CfgPath) {
      const count = copyFilesFromList(allFiles, tempDir, cs2CfgPath, (f) => f.endsWith(".cfg"));
      if (count > 0) log(`[OK] CFG 复制完成！（已复制 ${count} 个 .cfg 文件）`);
      else log("[!] 未找到 CFG 文件。");
    }

    if (opts.installVideo && videoCfgPath) {
      const srcFile = allFiles.find((f) => path.basename(f).toLowerCase() === "cs2_video.txt");
      if (srcFile) {
        fs.copyFileSync(srcFile, path.join(videoCfgPath, "cs2_video.txt"));
        log("[OK] 用户CFG(视频预设)复制完成！");
      } else {
        log("[!] 未找到 cs2_video.txt 文件。");
      }
    }

    if (opts.installAnnotations && annotationsPath) {
      const count = copyAnnotations(tempDir, annotationsPath);
      if (count > 0) log(`[OK] 地图指南复制完成！（已复制 ${count} 个文件）`);
      else log("[!] 未找到地图指南文件。");
    }
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch { /* temp cleanup best-effort */ }
  }

  log("[OK] 安装完成！");
}

function installFromFiles(
  files: string[],
  cs2CfgPath: string | null,
  videoCfgPath: string | null,
  annotationsPath: string | null,
  opts: { installCfg: boolean; installVideo: boolean; installAnnotations: boolean },
): void {
  log(`[~] 开始安装 ${files.length} 个文件...`);

  let cfgCount = 0;
  let txtCount = 0;
  let annCount = 0;
  let skipped = 0;

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const name = path.basename(file);

    if (opts.installCfg && name.endsWith(".cfg") && cs2CfgPath) {
      try {
        fs.copyFileSync(file, path.join(cs2CfgPath, name));
        cfgCount++;
      } catch (e: any) {
        log(`  [!] 复制失败：${name} (${e.message})`);
      }
    } else if (opts.installVideo && name.toLowerCase() === "cs2_video.txt" && videoCfgPath) {
      try {
        fs.copyFileSync(file, path.join(videoCfgPath, name));
        txtCount++;
      } catch (e: any) {
        log(`  [!] 复制失败：${name} (${e.message})`);
      }
    } else if (opts.installAnnotations && annotationsPath) {
      const annDir = findAnnotationsDirInPath(file);
      if (annDir) {
        try {
          const rel = path.relative(annDir, file);
          const target = path.join(annotationsPath, rel);
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.copyFileSync(file, target);
          annCount++;
        } catch (e: any) {
          log(`  [!] 复制失败：${name} (${e.message})`);
        }
      } else {
        skipped++;
      }
    } else {
      skipped++;
    }
  }

  if (cfgCount > 0) log(`  [OK] 已复制 ${cfgCount} 个 CFG 文件`);
  if (txtCount > 0) log(`  [OK] 已复制 ${txtCount} 个 cs2_video.txt 文件`);
  if (annCount > 0) log(`  [OK] 已复制 ${annCount} 个地图指南文件`);
  if (skipped > 0) log(`  [~] 跳过 ${skipped} 个非目标文件`);

  log("[OK] 文件复制完成！");
}

// ── File Helpers ────────────────────────────────────────────

function copyFilesFromList(
  files: string[],
  srcRoot: string,
  dst: string,
  filter: (name: string) => boolean,
): number {
  let count = 0;

  for (const file of files) {
    if (!filter(file)) continue;
    const rel = path.relative(srcRoot, file);
    const target = path.join(dst, rel);
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(file, target);
      count++;
    } catch (e: any) {
      log(`  [!] 复制失败：${rel} (${e.message})`);
    }
  }

  return count;
}

function copyAnnotations(src: string, annotationsPath: string): number {
  fs.mkdirSync(annotationsPath, { recursive: true });
  const annSrc = path.join(src, "annotations");
  if (!fs.existsSync(annSrc)) return 0;

  let count = 0;
  for (const dir of fs.readdirSync(annSrc, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const srcDir = path.join(annSrc, dir.name);
    const dstDir = path.join(annotationsPath, dir.name);
    fs.mkdirSync(dstDir, { recursive: true });

    for (const file of walkSync(srcDir)) {
      const rel = path.relative(srcDir, file);
      const target = path.join(dstDir, rel);
      try {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(file, target);
        count++;
      } catch (e: any) {
        log(`  [!] 复制失败：${dir.name}/${rel} (${e.message})`);
      }
    }
  }

  return count;
}

function walkSync(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkSync(full));
    else results.push(full);
  }
  return results;
}

function findAnnotationsDirInPath(file: string): string | null {
  const dir = path.dirname(file);
  const idx = dir.toLowerCase().indexOf("annotations");
  if (idx >= 0) return dir.substring(0, idx + "annotations".length);
  return null;
}

// ── Public: Full install flow ───────────────────────────────

export async function performInstall(
  opts: InstallOptions,
  cs2CfgPath: string | null,
  videoCfgPath: string | null,
  annotationsPath: string | null,
): Promise<void> {
  // Backup before install
  if (opts.installCfg && cs2CfgPath) await createBackup(cs2CfgPath, "cfg");
  if (opts.installVideo && videoCfgPath) await createBackup(videoCfgPath, "user_cfg");
  if (opts.installAnnotations && annotationsPath) await createBackup(annotationsPath, "annotations");

  if (opts.isZip) {
    await installFromZip(opts.sourcePath, cs2CfgPath, videoCfgPath, annotationsPath, opts);
  } else {
    installFromFiles([opts.sourcePath], cs2CfgPath, videoCfgPath, annotationsPath, opts);
  }
}

// ── Backup-only flow ─────────────────────────────────────────

export async function backupCurrentConfigs(
  cs2CfgPath: string | null,
  videoCfgPath: string | null,
  annotationsPath: string | null,
): Promise<void> {
  log("[~] 开始备份当前配置...");
  let count = 0;
  if (cs2CfgPath && fs.existsSync(cs2CfgPath)) {
    await createBackup(cs2CfgPath, "cfg");
    count++;
  }
  if (videoCfgPath && fs.existsSync(videoCfgPath)) {
    await createBackup(videoCfgPath, "user_cfg");
    count++;
  }
  if (annotationsPath && fs.existsSync(annotationsPath)) {
    await createBackup(annotationsPath, "annotations");
    count++;
  }
  if (count === 0) {
    log("[!] 没有可备份的配置目录");
  } else {
    log(`[OK] 备份完成（共 ${count} 项）`);
  }
}

// ── Restore from backup ZIP ──────────────────────────────────

export async function restoreFromBackupZip(
  zipPath: string,
  cs2CfgPath: string | null,
  videoCfgPath: string | null,
  annotationsPath: string | null,
): Promise<void> {
  log(`[~] 开始恢复备份：${path.basename(zipPath)}`);

  const tempDir = path.join(os.tmpdir(), `CS2Restore_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    log("[~] 解压备份文件...");
    await extractZip(zipPath, { dir: tempDir });
    log("[OK] 解压完成。");

    // Detect what's in the backup and restore accordingly
    const entries = fs.readdirSync(tempDir, { withFileTypes: true });

    for (const entry of entries) {
      const src = path.join(tempDir, entry.name);
      if (!entry.isDirectory()) continue;

      // Match backup directory naming convention
      if (entry.name.startsWith("cfg_backup") || entry.name.includes("cfg")) {
        if (cs2CfgPath) {
          copyDirContents(src, cs2CfgPath);
          log("[OK] 已恢复全局 CFG 配置");
        }
      } else if (entry.name.startsWith("user_cfg") || entry.name.includes("user_cfg")) {
        if (videoCfgPath) {
          copyDirContents(src, videoCfgPath);
          log("[OK] 已恢复视频预设配置");
        }
      } else if (entry.name.startsWith("annotations")) {
        if (annotationsPath) {
          copyDirContents(src, annotationsPath);
          log("[OK] 已恢复地图指南配置");
        }
      }
    }

    // If no directories found, try flat restore to CFG path
    const hasDirs = entries.some((e) => e.isDirectory());
    if (!hasDirs && cs2CfgPath) {
      copyFilesRecursive(tempDir, cs2CfgPath);
      log("[OK] 已恢复配置（扁平结构）");
    }

    log("[OK] 恢复完成！");
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch { /* temp cleanup best-effort */ }
  }
}

function copyDirContents(src: string, dst: string): void {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDirContents(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

function copyFilesRecursive(src: string, dst: string): void {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyFilesRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

// ── Backup folder opener ────────────────────────────────────

export function getBackupDir(cfgPath: string | null): string | null {
  if (!cfgPath) return null;
  return path.dirname(cfgPath);
}
