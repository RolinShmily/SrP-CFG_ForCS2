import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
import extractZip from "extract-zip";
import type {
  UploadEntry,
  UploadFileInfo,
  BackupEntry,
  DownloadEntry,
  InstallMode,
  LogEntry,
} from "../../renderer/types";

// ── Constants ────────────────────────────────────────────────

let _srpBase: string | null = null;

function getBase(): string {
  if (!_srpBase) {
    _srpBase = path.join(app.getPath("appData"), "srp-cfg");
  }
  return _srpBase;
}

const DIRS = {
  cfg: "cfg",
  annotations: "annotations",
  video: "video",
  tmp: "tmp",
  saves: "saves",
  downloads: "downloads",
} as const;

const MAX_UPLOADS = 100;
const ALLOWED_EXTENSIONS = new Set([".cfg", ".txt"]);

export type LogFn = (entry: Omit<LogEntry, "timestamp">) => void;

// ── Paths ────────────────────────────────────────────────────

export function getStagingPath(dir: keyof typeof DIRS): string {
  return path.join(getBase(), DIRS[dir]);
}

export function getSavesPath(): string {
  return path.join(getBase(), DIRS.saves);
}

export function getDownloadsPath(): string {
  return path.join(getBase(), DIRS.downloads);
}

export function getTmpPath(): string {
  return path.join(getBase(), DIRS.tmp);
}

// ── Initialization ───────────────────────────────────────────

export function initializeStagingArea(log: LogFn): void {
  for (const dir of Object.values(DIRS)) {
    fs.mkdirSync(path.join(getBase(), dir), { recursive: true });
  }

  // Clear tmp on startup
  const tmpDir = path.join(getBase(), DIRS.tmp);
  clearDirectory(tmpDir);
  log({
    category: "file-ops",
    level: "info",
    message: "临时目录已清空",
  });
}

// ── Staging File Listing ──────────────────────────────────────

export interface StagingSection {
  key: string;
  label: string;
  path: string;
  files: string[];
}

export function listStagingFiles(): StagingSection[] {
  const sections: StagingSection[] = [
    { key: "cfg", label: "CFG 配置", path: getStagingPath("cfg"), files: [] },
    { key: "annotations", label: "地图指南", path: getStagingPath("annotations"), files: [] },
    { key: "video", label: "视频预设", path: getStagingPath("video"), files: [] },
  ];

  for (const section of sections) {
    if (fs.existsSync(section.path)) {
      section.files = walkSync(section.path).map((f) =>
        path.relative(section.path, f).replace(/\\/g, "/"),
      );
    }
  }

  return sections;
}

// ── Helpers ──────────────────────────────────────────────────

function clearDirectory(dir: string): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    fs.rmSync(full, { recursive: true, force: true });
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

function countFilesRecursive(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      count += countFilesRecursive(path.join(dir, entry.name));
    } else {
      count++;
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

function generateTimestampFolderName(scanDir?: string): string {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  let maxSeq = 0;
  const dir = scanDir ?? getTmpPath();
  if (fs.existsSync(dir)) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith(date)) {
        const seq = parseInt(entry.name.slice(date.length + 1), 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    }
  }

  return `${date}-${String(maxSeq + 1).padStart(4, "0")}`;
}

function getFileInfo(filePath: string, baseDir: string): UploadFileInfo {
  const name = path.basename(filePath);
  const ext = path.extname(name).toLowerCase();
  const rel = path.relative(baseDir, filePath);

  let type: UploadFileInfo["type"] = "unsupported";
  if (ext === ".cfg") type = "cfg";
  else if (ext === ".txt") type = "txt";

  const stat = fs.statSync(filePath);
  return { name, relativePath: rel, type, size: stat.size };
}

function countUploads(): number {
  const tmpDir = getTmpPath();
  if (!fs.existsSync(tmpDir)) return 0;
  return fs
    .readdirSync(tmpDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}-\d{4}$/.test(d.name))
    .length;
}

// ── Upload ───────────────────────────────────────────────────

export async function uploadFiles(
  filePaths: string[],
  log: LogFn,
): Promise<UploadEntry | null> {
  if (countUploads() >= MAX_UPLOADS) {
    log({
      category: "file-ops",
      level: "error",
      message: `上传次数已达上限（${MAX_UPLOADS}次），请先安装或清理`,
    });
    return null;
  }

  // ── ZIP-only upload: store as-is (download-like logic) ──────
  const allZip =
    filePaths.length > 0 &&
    filePaths.every((fp) => {
      try {
        return fs.statSync(fp).isFile() && path.extname(fp).toLowerCase() === ".zip";
      } catch {
        return false;
      }
    });

  if (allZip) {
    let firstEntry: UploadEntry | null = null;

    for (const zipPath of filePaths) {
      if (countUploads() >= MAX_UPLOADS) {
        log({
          category: "file-ops",
          level: "warning",
          message: `已达到上传上限，跳过剩余文件`,
        });
        break;
      }

      const folderName = generateTimestampFolderName();
      const uploadDir = path.join(getTmpPath(), folderName);
      fs.mkdirSync(uploadDir, { recursive: true });

      const fileName = path.basename(zipPath);
      fs.copyFileSync(zipPath, path.join(uploadDir, fileName));

      const stat = fs.statSync(zipPath);
      log({
        category: "file-ops",
        level: "success",
        message: `ZIP 已上传：${fileName}`,
        detail: `${(stat.size / 1024 / 1024).toFixed(1)} MB`,
      });

      if (!firstEntry) {
        firstEntry = {
          folderName,
          timestamp: Date.now(),
          fileCount: 1,
          files: [
            { name: fileName, relativePath: fileName, type: "txt", size: stat.size },
          ],
        };
      }
    }

    return firstEntry;
  }

  // ── Non-ZIP / mixed upload: extract ZIPs and process ───────
  const folderName = generateTimestampFolderName();
  const uploadDir = path.join(getTmpPath(), folderName);
  fs.mkdirSync(uploadDir, { recursive: true });

  let allFiles: string[] = [];
  const unsupportedSkipped: string[] = [];

  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) {
      log({
        category: "file-ops",
        level: "warning",
        message: `文件不存在：${filePath}`,
      });
      continue;
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      for (const f of walkSync(filePath)) {
        const ext = path.extname(f).toLowerCase();
        if (ALLOWED_EXTENSIONS.has(ext)) {
          allFiles.push(f);
        } else {
          unsupportedSkipped.push(path.basename(f));
        }
      }
    } else {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".zip") {
        const tempExtractDir = path.join(uploadDir, `_extract_${Date.now()}`);
        fs.mkdirSync(tempExtractDir, { recursive: true });
        try {
          await extractZip(filePath, { dir: tempExtractDir });
          for (const f of walkSync(tempExtractDir)) {
            const fExt = path.extname(f).toLowerCase();
            if (ALLOWED_EXTENSIONS.has(fExt)) {
              allFiles.push(f);
            } else {
              unsupportedSkipped.push(path.basename(f));
            }
          }
        } finally {
          fs.rmSync(tempExtractDir, { recursive: true, force: true });
        }
      } else if (ALLOWED_EXTENSIONS.has(ext)) {
        allFiles.push(filePath);
      } else {
        unsupportedSkipped.push(path.basename(filePath));
      }
    }
  }

  if (unsupportedSkipped.length > 0) {
    log({
      category: "file-ops",
      level: "warning",
      message: `已过滤 ${unsupportedSkipped.length} 个不支持的文件`,
      detail: unsupportedSkipped.slice(0, 10).join(", ") +
        (unsupportedSkipped.length > 10 ? "..." : ""),
    });
  }

  if (allFiles.length === 0) {
    fs.rmSync(uploadDir, { recursive: true, force: true });
    log({
      category: "file-ops",
      level: "error",
      message: "未找到任何 .cfg 或 .txt 文件",
    });
    return null;
  }

  for (const src of allFiles) {
    let relPath: string;

    const basename = path.basename(src);
    if (src.includes(uploadDir)) {
      relPath = path.relative(uploadDir, src);
    } else {
      const dir = path.dirname(src);
      const parentName = path.basename(dir);
      if (parentName === "." || parentName === path.basename(path.dirname(src))) {
        relPath = basename;
      } else {
        relPath = path.relative(path.dirname(src), src);
      }
    }

    const dst = path.join(uploadDir, relPath);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }

  const finalFiles = walkSync(uploadDir);
  const files = finalFiles.map((f) => getFileInfo(f, uploadDir));

  log({
    category: "file-ops",
    level: "success",
    message: `上传完成：${files.length} 个文件`,
    detail: folderName,
  });

  return { folderName, timestamp: Date.now(), fileCount: files.length, files };
}

// ── Upload History ───────────────────────────────────────────

export function getLatestUpload(): UploadEntry | null {
  const tmpDir = getTmpPath();
  if (!fs.existsSync(tmpDir)) return null;

  const folders = fs
    .readdirSync(tmpDir, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() && /^\d{4}-\d{2}-\d{2}-\d{4}$/.test(d.name),
    )
    .map((d) => d.name)
    .sort()
    .reverse();

  if (folders.length === 0) return null;

  const folderName = folders[0];
  const dir = path.join(tmpDir, folderName);
  const files = walkSync(dir).map((f) => getFileInfo(f, dir));

  return { folderName, timestamp: Date.now(), fileCount: files.length, files };
}

export function getUploadHistory(): UploadEntry[] {
  const tmpDir = getTmpPath();
  if (!fs.existsSync(tmpDir)) return [];

  return fs
    .readdirSync(tmpDir, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() && /^\d{4}-\d{2}-\d{2}-\d{4}$/.test(d.name),
    )
    .map((d) => {
      const dir = path.join(tmpDir, d.name);
      const files = walkSync(dir).map((f) => getFileInfo(f, dir));
      return {
        folderName: d.name,
        timestamp: Date.now(),
        fileCount: files.length,
        files,
      };
    })
    .sort((a, b) => b.folderName.localeCompare(a.folderName));
}

// ── Staging Operations ───────────────────────────────────────

function classifyFile(
  relativePath: string,
): "cfg" | "annotations" | "video" | "unsupported" {
  const lower = relativePath.toLowerCase();

  if (lower.includes("annotations")) return "annotations";
  if (lower.endsWith(".cfg")) return "cfg";
  if (path.basename(lower) === "cs2_video.txt") return "video";

  return "unsupported";
}

function clearStagingDirs(): void {
  clearDirectory(getStagingPath("cfg"));
  clearDirectory(getStagingPath("annotations"));
  clearDirectory(getStagingPath("video"));
}

export function processUploadToStaging(
  uploadFolder: string,
  mode: InstallMode,
  log: LogFn,
): { cfgCount: number; annotationsCount: number; videoCount: number } {
  log({
    category: "install",
    level: "progress",
    message: mode === "overlay" ? "覆盖安装：清空暂存区..." : "追加安装：合并文件...",
  });

  if (mode === "overlay") {
    clearStagingDirs();
  }

  const cfgDir = getStagingPath("cfg");
  const annotationsDir = getStagingPath("annotations");
  const videoDir = getStagingPath("video");

  const allFiles = walkSync(uploadFolder);
  let cfgCount = 0;
  let annotationsCount = 0;
  let videoCount = 0;
  let unsupportedCount = 0;

  for (const file of allFiles) {
    const rel = path.relative(uploadFolder, file);
    const category = classifyFile(rel);

    try {
      switch (category) {
        case "cfg": {
          const dst = path.join(cfgDir, rel);
          fs.mkdirSync(path.dirname(dst), { recursive: true });
          fs.copyFileSync(file, dst);
          cfgCount++;
          break;
        }
        case "annotations": {
          // Preserve sub-path after "annotations/"
          const annIdx = rel.toLowerCase().indexOf("annotations");
          const subPath = rel.slice(annIdx + "annotations".length).replace(/^[/\\]+/, "");
          const dst = path.join(annotationsDir, subPath || path.basename(rel));
          fs.mkdirSync(path.dirname(dst), { recursive: true });
          fs.copyFileSync(file, dst);
          annotationsCount++;
          break;
        }
        case "video": {
          const dst = path.join(videoDir, "cs2_video.txt");
          fs.copyFileSync(file, dst);
          videoCount++;
          break;
        }
        default:
          unsupportedCount++;
      }
    } catch (e: any) {
      log({
        category: "file-ops",
        level: "error",
        message: `文件复制失败：${rel}`,
        detail: e.message,
      });
    }
  }

  if (cfgCount > 0) {
    log({ category: "install", level: "success", message: `CFG 文件：${cfgCount} 个` });
  }
  if (annotationsCount > 0) {
    log({
      category: "install",
      level: "success",
      message: `地图指南文件：${annotationsCount} 个`,
    });
  }
  if (videoCount > 0) {
    log({ category: "install", level: "success", message: `视频预设文件：${videoCount} 个` });
  }
  if (unsupportedCount > 0) {
    log({
      category: "file-ops",
      level: "warning",
      message: `跳过 ${unsupportedCount} 个不支持的文件`,
    });
  }

  return { cfgCount, annotationsCount, videoCount };
}

// ── Backup / Restore ─────────────────────────────────────────

function resolveSaveName(savesDir: string, baseName: string): string {
  let name = baseName;
  let i = 1;
  while (fs.existsSync(path.join(savesDir, name))) {
    name = `${baseName}-${i}`;
    i++;
  }
  return name;
}

export function moveToSaves(folderName: string, log: LogFn): void {
  const srcDir = path.join(getTmpPath(), folderName);
  if (!fs.existsSync(srcDir)) return;

  const savesDir = getSavesPath();
  fs.mkdirSync(savesDir, { recursive: true });

  const saveName = resolveSaveName(savesDir, folderName);
  fs.renameSync(srcDir, path.join(savesDir, saveName));

  log({
    category: "backup",
    level: "info",
    message: `已备份：${folderName}`,
  });
}

export function backupAllUploads(log: LogFn): number {
  const tmpDir = getTmpPath();
  const savesDir = getSavesPath();
  if (!fs.existsSync(tmpDir)) return 0;

  fs.mkdirSync(savesDir, { recursive: true });

  const folders = fs
    .readdirSync(tmpDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}-\d{4}$/.test(d.name))
    .map((d) => d.name)
    .sort();

  if (folders.length === 0) {
    log({
      category: "backup",
      level: "warning",
      message: "没有可备份的上传记录",
    });
    return 0;
  }

  let count = 0;
  for (const folderName of folders) {
    const saveName = resolveSaveName(savesDir, folderName);
    fs.renameSync(
      path.join(tmpDir, folderName),
      path.join(savesDir, saveName),
    );
    count++;
  }

  log({
    category: "backup",
    level: "success",
    message: `已备份 ${count} 项上传记录`,
  });

  return count;
}

export function deleteBackup(folderName: string, log: LogFn): void {
  const dir = path.join(getSavesPath(), folderName);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    log({
      category: "backup",
      level: "info",
      message: `已删除备份：${folderName}`,
    });
  }
}

export function getBackupEntries(log: LogFn): BackupEntry[] {
  const savesDir = getSavesPath();
  if (!fs.existsSync(savesDir)) return [];

  const entries: BackupEntry[] = [];

  for (const entry of fs.readdirSync(savesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(savesDir, entry.name);
    const fileCount = countFilesRecursive(dir);
    entries.push({
      folderName: entry.name,
      timestamp: fs.statSync(dir).mtimeMs,
      fileCount,
    });
  }

  return entries.sort((a, b) => {
    if (a.folderName === "latest") return -1;
    if (b.folderName === "latest") return 1;
    return b.folderName.localeCompare(a.folderName);
  });
}

export function restoreFromSaves(
  folderName: string,
  log: LogFn,
): boolean {
  const srcDir = path.join(getSavesPath(), folderName);
  if (!fs.existsSync(srcDir)) {
    log({
      category: "backup",
      level: "error",
      message: `备份不存在：${folderName}`,
    });
    return false;
  }

  log({
    category: "backup",
    level: "progress",
    message: `正在恢复备份：${folderName}`,
  });

  // Copy save contents back to staging dirs (flat restore)
  const cfgDir = getStagingPath("cfg");
  const annotationsDir = getStagingPath("annotations");
  const videoDir = getStagingPath("video");

  clearStagingDirs();

  const allFiles = walkSync(srcDir);
  let restored = 0;

  for (const file of allFiles) {
    const rel = path.relative(srcDir, file);
    const category = classifyFile(rel);

    try {
      switch (category) {
        case "cfg": {
          const dst = path.join(cfgDir, rel);
          fs.mkdirSync(path.dirname(dst), { recursive: true });
          fs.copyFileSync(file, dst);
          restored++;
          break;
        }
        case "annotations": {
          const annIdx = rel.toLowerCase().indexOf("annotations");
          const subPath = rel.slice(annIdx + "annotations".length).replace(/^[/\\]+/, "");
          const dst = path.join(annotationsDir, subPath || path.basename(rel));
          fs.mkdirSync(path.dirname(dst), { recursive: true });
          fs.copyFileSync(file, dst);
          restored++;
          break;
        }
        case "video": {
          const dst = path.join(videoDir, "cs2_video.txt");
          fs.copyFileSync(file, dst);
          restored++;
          break;
        }
      }
    } catch {
      // Skip files that fail to copy
    }
  }

  log({
    category: "backup",
    level: "success",
    message: `恢复完成，共 ${restored} 个文件`,
  });

  return true;
}

// ── Uploaded Entries ─────────────────────────────────────────

export interface UploadedEntry {
  folderName: string;
  displayName: string;
  timestamp: number;
  size: number;
  fileCount: number;
  isZip: boolean;
}

export function getUploadedEntries(): UploadedEntry[] {
  const tmpDir = getTmpPath();
  if (!fs.existsSync(tmpDir)) return [];

  const entries: UploadedEntry[] = [];

  for (const entry of fs.readdirSync(tmpDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!/^\d{4}-\d{2}-\d{2}-\d{4}$/.test(entry.name)) continue;

    const dir = path.join(tmpDir, entry.name);
    const allFiles = walkSync(dir);
    const zipFiles = allFiles.filter((f) => f.endsWith(".zip"));

    if (zipFiles.length > 0) {
      const stat = fs.statSync(zipFiles[0]);
      entries.push({
        folderName: entry.name,
        displayName: path.basename(zipFiles[0]),
        timestamp: stat.mtimeMs,
        size: stat.size,
        fileCount: 1,
        isZip: true,
      });
    } else {
      const cfgTxtFiles = allFiles.filter((f) => {
        const ext = path.extname(f).toLowerCase();
        return ext === ".cfg" || ext === ".txt";
      });
      if (cfgTxtFiles.length === 0) continue;

      let totalSize = 0;
      for (const f of cfgTxtFiles) totalSize += fs.statSync(f).size;

      entries.push({
        folderName: entry.name,
        displayName: `${cfgTxtFiles.length} 个文件`,
        timestamp: fs.statSync(dir).mtimeMs,
        size: totalSize,
        fileCount: cfgTxtFiles.length,
        isZip: false,
      });
    }
  }

  return entries.sort((a, b) => b.folderName.localeCompare(a.folderName));
}

export async function installFromUpload(
  folderName: string,
  mode: InstallMode,
  log: LogFn,
): Promise<{ cfgCount: number; annotationsCount: number; videoCount: number } | null> {
  const dir = path.join(getTmpPath(), folderName);
  if (!fs.existsSync(dir)) {
    log({
      category: "install",
      level: "error",
      message: `上传记录不存在：${folderName}`,
    });
    return null;
  }

  const zipFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".zip"));

  if (zipFiles.length > 0) {
    const zipPath = path.join(dir, zipFiles[0]);
    const tempExtractDir = path.join(dir, `_extract_${Date.now()}`);

    try {
      log({
        category: "install",
        level: "progress",
        message: `解压上传包：${zipFiles[0]}`,
      });

      await extractZip(zipPath, { dir: tempExtractDir });
      return processUploadToStaging(tempExtractDir, mode, log);
    } catch (e: any) {
      log({
        category: "install",
        level: "error",
        message: `解压失败：${e.message}`,
      });
      return null;
    } finally {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    }
  }

  return processUploadToStaging(dir, mode, log);
}

export function deleteUploadEntry(folderName: string, log: LogFn): void {
  const dir = path.join(getTmpPath(), folderName);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    log({
      category: "file-ops",
      level: "info",
      message: `已删除上传：${folderName}`,
    });
  }
}

// ── Downloads ────────────────────────────────────────────────

import * as https from "https";
import * as http from "http";

export async function downloadFromUrl(
  url: string,
  fileName: string,
  log: LogFn,
): Promise<DownloadEntry | null> {
  const dlBase = getDownloadsPath();
  const folderName = generateTimestampFolderName(dlBase);
  const dlDir = path.join(dlBase, folderName);
  fs.mkdirSync(dlDir, { recursive: true });

  const filePath = path.join(dlDir, fileName);

  log({
    category: "file-ops",
    level: "progress",
    message: `正在下载：${fileName}`,
  });

  try {
    await new Promise<void>((resolve, reject) => {
      const mod = url.startsWith("https") ? https : http;
      const req = mod.get(url, { headers: { "User-Agent": "SrP-CFG-Installer", "Referer": "cfg.srprolin.top" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Follow redirect
          const redirectMod = res.headers.location.startsWith("https") ? https : http;
          redirectMod.get(res.headers.location, (redirectRes) => {
            if (redirectRes.statusCode !== 200) {
              reject(new Error(`HTTP ${redirectRes.statusCode}`));
              return;
            }
            const stream = fs.createWriteStream(filePath);
            redirectRes.pipe(stream);
            stream.on("finish", () => { stream.close(); resolve(); });
            stream.on("error", reject);
          }).on("error", reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        const stream = fs.createWriteStream(filePath);
        res.pipe(stream);
        stream.on("finish", () => { stream.close(); resolve(); });
        stream.on("error", reject);
      });

      req.on("error", reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error("timeout"));
      });
    });

    const stat = fs.statSync(filePath);
    log({
      category: "file-ops",
      level: "success",
      message: `下载完成：${fileName}`,
      detail: `${(stat.size / 1024 / 1024).toFixed(1)} MB`,
    });

    return { folderName, fileName, timestamp: Date.now(), size: stat.size };
  } catch (e: any) {
    // Clean up on failure
    fs.rmSync(dlDir, { recursive: true, force: true });
    log({
      category: "file-ops",
      level: "error",
      message: `下载失败：${fileName}`,
      detail: e.message,
    });
    return null;
  }
}

export function getDownloadEntries(): DownloadEntry[] {
  const dlDir = getDownloadsPath();
  if (!fs.existsSync(dlDir)) return [];

  const entries: DownloadEntry[] = [];

  for (const entry of fs.readdirSync(dlDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(dlDir, entry.name);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".zip"));
    if (files.length === 0) continue;

    const fileName = files[0];
    const filePath = path.join(dir, fileName);
    const stat = fs.statSync(filePath);

    entries.push({
      folderName: entry.name,
      fileName,
      timestamp: stat.mtimeMs,
      size: stat.size,
    });
  }

  return entries.sort((a, b) => b.folderName.localeCompare(a.folderName));
}

export function deleteDownload(folderName: string, log: LogFn): void {
  const dir = path.join(getDownloadsPath(), folderName);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    log({
      category: "file-ops",
      level: "info",
      message: `已删除下载：${folderName}`,
    });
  }
}

export async function installFromDownload(
  folderName: string,
  mode: InstallMode,
  log: LogFn,
): Promise<{ cfgCount: number; annotationsCount: number; videoCount: number } | null> {
  const dlDir = getDownloadsPath();
  const dir = path.join(dlDir, folderName);
  if (!fs.existsSync(dir)) {
    log({
      category: "install",
      level: "error",
      message: `下载记录不存在：${folderName}`,
    });
    return null;
  }

  const zipFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".zip"));
  if (zipFiles.length === 0) {
    log({
      category: "install",
      level: "error",
      message: `未找到 ZIP 文件：${folderName}`,
    });
    return null;
  }

  const zipPath = path.join(dir, zipFiles[0]);
  const tempExtractDir = path.join(dir, `_extract_${Date.now()}`);

  try {
    log({
      category: "install",
      level: "progress",
      message: `解压预设包：${zipFiles[0]}`,
    });

    await extractZip(zipPath, { dir: tempExtractDir });
    return processUploadToStaging(tempExtractDir, mode, log);
  } catch (e: any) {
    log({
      category: "install",
      level: "error",
      message: `解压失败：${e.message}`,
    });
    return null;
  } finally {
    fs.rmSync(tempExtractDir, { recursive: true, force: true });
  }
}
