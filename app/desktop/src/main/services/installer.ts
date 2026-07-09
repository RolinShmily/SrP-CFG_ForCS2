import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import { app, shell } from "electron";
import type { LogEntry } from "../../renderer/types";

export type LogFn = (entry: Omit<LogEntry, "timestamp">) => void;

// ── Types ────────────────────────────────────────────────────

interface CategoryData {
  files: string[];
  dirs: string[];
  path: string;
}

interface InstallState {
  cfg: CategoryData;
  gameCfg: CategoryData;
  userCfg: CategoryData;
  annotations: CategoryData;
  video: CategoryData;
}

interface InstallFile {
  install: InstallState;
}

interface ResFile {
  res: InstallState;
}

interface SaveFile {
  save: InstallState;
}

export type CategoryKey = "cfg" | "gameCfg" | "userCfg" | "annotations" | "video";

export interface GamePaths {
  cfgPath: string | null;
  annotationsPath: string | null;
  videoPath: string | null;
}

export interface DeployResult {
  filesInstalled: number;
  dirsInstalled: number;
}

export interface AppendConflictResult {
  needsConfirm: boolean;
  conflicts: { category: CategoryKey; names: string[] }[];
}

// ── Base Path ────────────────────────────────────────────────

let _base: string | null = null;

function getBase(): string {
  if (!_base) _base = path.join(app.getPath("appData"), "srp-cfg");
  return _base;
}

function jsonPath(name: string): string {
  return path.join(getBase(), name);
}

// ── JSON Read/Write ──────────────────────────────────────────

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ── Install State ────────────────────────────────────────────

function emptyCategory(): CategoryData {
  return { files: [], dirs: [], path: "" };
}
function emptyInstallState(): InstallState {
  return {
    cfg: emptyCategory(),
    gameCfg: emptyCategory(),
    userCfg: emptyCategory(),
    annotations: emptyCategory(),
    video: emptyCategory(),
  };
}

function migrateState(state: unknown): void {
  if (!state || typeof state !== "object") return;
  const rec = state as Record<string, unknown>;
  if (!("cfg" in rec) || "gameCfg" in rec) return;
  const cfg = rec.cfg;
  if (!cfg || typeof cfg !== "object") return;
  const cfgObj = cfg as Record<string, unknown>;
  const cfgPath = typeof cfgObj.path === "string" ? cfgObj.path : "";
  if (cfgPath.includes("userdata")) {
    rec.userCfg = cfg;
    rec.gameCfg = { files: [], dirs: [], path: "" };
  } else {
    rec.gameCfg = cfg;
    rec.userCfg = { files: [], dirs: [], path: "" };
  }
  delete rec.cfg;
}

export function loadInstallData(): InstallFile {
  const data = readJson<InstallFile>(jsonPath("install.json"));
  if (data) migrateState(data.install);
  return data ?? { install: emptyInstallState() };
}

function loadResData(): ResFile {
  const data = readJson<ResFile>(jsonPath("res.json"));
  if (data) migrateState(data.res);
  return data ?? { res: emptyInstallState() };
}

function loadSaveData(): SaveFile {
  const data = readJson<SaveFile>(jsonPath("save.json"));
  if (data) migrateState(data.save);
  return data ?? { save: emptyInstallState() };
}

function writeInstall(data: InstallFile): void {
  writeJson(jsonPath("install.json"), data);
}

function writeRes(data: ResFile): void {
  writeJson(jsonPath("res.json"), data);
}

function writeSave(data: SaveFile): void {
  writeJson(jsonPath("save.json"), data);
}

// ── Path Update (from detection) ─────────────────────────────

export function updateInstallPaths(gamePaths: GamePaths): void {
  const data = loadInstallData();
  if (gamePaths.cfgPath) data.install.gameCfg.path = gamePaths.cfgPath;
  if (gamePaths.cfgPath) data.install.userCfg.path = gamePaths.cfgPath;
  if (gamePaths.annotationsPath) data.install.annotations.path = gamePaths.annotationsPath;
  if (gamePaths.videoPath) data.install.video.path = gamePaths.videoPath;
  writeInstall(data);
}

// ── Helpers ──────────────────────────────────────────────────

function walkTopLevel(dir: string): { files: string[]; dirs: string[] } {
  if (!fs.existsSync(dir)) return { files: [], dirs: [] };
  const files: string[] = [];
  const dirs: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) dirs.push(entry.name);
    else files.push(entry.name);
  }
  return { files, dirs };
}

function removeEntry(baseDir: string, name: string, isDir: boolean): void {
  const full = path.join(baseDir, name);
  if (!fs.existsSync(full)) return;
  if (isDir) fs.rmSync(full, { recursive: true, force: true });
  else fs.unlinkSync(full);
}

function copyDirRecursive(src: string, dst: string): void {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDirRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

function copyStagingToGame(stagingDir: string, gameDir: string): { files: number; dirs: number } {
  if (!fs.existsSync(stagingDir)) return { files: 0, dirs: 0 };
  fs.mkdirSync(gameDir, { recursive: true });
  let files = 0;
  let dirs = 0;
  for (const entry of fs.readdirSync(stagingDir, { withFileTypes: true })) {
    const src = path.join(stagingDir, entry.name);
    const dst = path.join(gameDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(src, dst);
      dirs++;
    } else {
      fs.copyFileSync(src, dst);
      files++;
    }
  }
  return { files, dirs };
}

// ── Move file/dir to a target base under <category>/ ──────────

function moveToTarget(
  targetBase: string,
  category: CategoryKey,
  gameFilePath: string,
  name: string,
  isDir: boolean,
  log: LogFn,
  label: string,
): void {
  const dst = path.join(targetBase, category, name);

  if (isDir) {
    fs.mkdirSync(dst, { recursive: true });
    copyDirRecursive(gameFilePath, dst);
    fs.rmSync(gameFilePath, { recursive: true, force: true });
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(gameFilePath, dst);
    fs.unlinkSync(gameFilePath);
  }

  log({
    category: "install",
    level: "info",
    message: `${label}已转移：${name}`,
    detail: "可在「备份与恢复」中恢复",
  });
}


// ── Categories helper ────────────────────────────────────────

type CatEntry = {
  key: CategoryKey;
  staging: string;
  game: string | null;
  label: string;
};

function getCategories(stagingPaths: { cfg: string; annotations: string; video: string }, gamePaths: GamePaths): CatEntry[] {
  return [
    { key: "gameCfg", staging: stagingPaths.cfg, game: gamePaths.cfgPath, label: "游戏 CFG" },
    { key: "userCfg", staging: stagingPaths.cfg, game: gamePaths.videoPath, label: "用户 CFG" },
    { key: "annotations", staging: stagingPaths.annotations, game: gamePaths.annotationsPath, label: "地图指南" },
    { key: "video", staging: stagingPaths.video, game: gamePaths.videoPath, label: "视频预设" },
  ];
}

function hasEntries(cat: CatEntry): boolean {
  if (!cat.game || !fs.existsSync(cat.staging)) return false;
  if (cat.key === "video" && fs.readdirSync(cat.staging).length === 0) return false;
  const entries = walkTopLevel(cat.staging);
  return entries.files.length > 0 || entries.dirs.length > 0;
}

// ── Overlay Install ──────────────────────────────────────────

export function deployOverlay(
  stagingPaths: { cfg: string; annotations: string; video: string },
  gamePaths: GamePaths,
  usePersonalCfg: boolean,
  log: LogFn,
): DeployResult {
  log({ category: "install", level: "progress", message: "覆盖部署到游戏目录..." });

  const installData = loadInstallData();
  const saveData = loadSaveData();
  const resData = loadResData();
  const saveBase = path.join(getBase(), "save");
  const resBase = path.join(getBase(), "res");

  let totalFiles = 0;
  let totalDirs = 0;

  for (const cat of getCategories(stagingPaths, gamePaths)) {
    if (cat.key === "gameCfg" && usePersonalCfg) continue;
    if (cat.key === "userCfg" && !usePersonalCfg) continue;

    if (!hasEntries(cat)) continue;

    const stagingEntries = walkTopLevel(cat.staging);
    fs.mkdirSync(cat.game!, { recursive: true });

    const prevFiles = installData.install[cat.key].files;
    const prevDirs = installData.install[cat.key].dirs;

    // 1. Move all previously installed files → save/
    for (const name of prevFiles) {
      const gamePath = path.join(cat.game!, name);
      if (!fs.existsSync(gamePath)) continue;
      moveToTarget(saveBase, cat.key, gamePath, name, false, log, "已安装备份");
    }
    for (const name of prevDirs) {
      const gamePath = path.join(cat.game!, name);
      if (!fs.existsSync(gamePath)) continue;
      moveToTarget(saveBase, cat.key, gamePath, name, true, log, "已安装备份");
    }
    saveData.save[cat.key].files = [...prevFiles];
    saveData.save[cat.key].dirs = [...prevDirs];

    // 2. On fresh install (install.json empty), move conflicting user files → res/
    if (prevFiles.length === 0 && prevDirs.length === 0) {
      for (const name of stagingEntries.files) {
        const gameFile = path.join(cat.game!, name);
        if (!fs.existsSync(gameFile)) continue;
        moveToTarget(resBase, cat.key, gameFile, name, false, log, "冲突文件");
        if (!resData.res[cat.key].files.includes(name)) {
          resData.res[cat.key].files.push(name);
        }
      }
      for (const name of stagingEntries.dirs) {
        const gameDir = path.join(cat.game!, name);
        if (!fs.existsSync(gameDir)) continue;
        moveToTarget(resBase, cat.key, gameDir, name, true, log, "冲突文件");
        if (!resData.res[cat.key].dirs.includes(name)) {
          resData.res[cat.key].dirs.push(name);
        }
      }
    }

    // 3. Copy staging → game
    const result = copyStagingToGame(cat.staging, cat.game!);
    totalFiles += result.files;
    totalDirs += result.dirs;

    // 4. Update install data
    installData.install[cat.key].files = [...stagingEntries.files];
    installData.install[cat.key].dirs = [...stagingEntries.dirs];

    log({
      category: "install",
      level: "success",
      message: `${cat.label}：${result.files} 个文件，${result.dirs} 个目录已部署`,
    });
  }

  // Update paths
  if (gamePaths.cfgPath) {
    saveData.save.gameCfg.path = gamePaths.cfgPath;
    resData.res.gameCfg.path = gamePaths.cfgPath;
  }

  if (gamePaths.cfgPath) {
    saveData.save.userCfg.path = gamePaths.cfgPath;
    resData.res.userCfg.path = gamePaths.cfgPath;
  }
  if (gamePaths.annotationsPath) {
    saveData.save.annotations.path = gamePaths.annotationsPath;
    resData.res.annotations.path = gamePaths.annotationsPath;
  }
  if (gamePaths.videoPath) {
    saveData.save.video.path = gamePaths.videoPath;
    resData.res.video.path = gamePaths.videoPath;
  }

  writeSave(saveData);
  writeRes(resData);
  writeInstall(installData);

  log({ category: "install", level: "success", message: `部署完成：${totalFiles} 个文件，${totalDirs} 个目录` });

  return { filesInstalled: totalFiles, dirsInstalled: totalDirs };
}

// ── Append Install (first pass — check conflicts) ────────────

export function checkAppendConflicts(
  stagingPaths: { cfg: string; annotations: string; video: string },
  gamePaths: GamePaths,
  usePersonalCfg?: boolean,
): AppendConflictResult {
  const conflicts: { category: CategoryKey; names: string[] }[] = [];

  for (const cat of getCategories(stagingPaths, gamePaths)) {
    if (cat.key === "gameCfg" && usePersonalCfg) continue;
    if (cat.key === "userCfg" && !usePersonalCfg) continue;

    if (!hasEntries(cat)) continue;

    const stagingEntries = walkTopLevel(cat.staging);
    const names: string[] = [];

    for (const name of [...stagingEntries.files, ...stagingEntries.dirs]) {
      const gamePath = path.join(cat.game!, name);
      if (fs.existsSync(gamePath)) {
        names.push(name);
      }
    }

    if (names.length > 0) {
      conflicts.push({ category: cat.key, names });
    }
  }

  const totalConflicts = conflicts.reduce((sum, c) => sum + c.names.length, 0);

  if (totalConflicts > 3) {
    return { needsConfirm: false, conflicts }; // Caller should reject
  }

  if (totalConflicts > 0) {
    return { needsConfirm: true, conflicts }; // Caller should prompt user
  }

  return { needsConfirm: false, conflicts: [] }; // No conflicts, proceed
}

// ── Append Install (execute — after conflict resolution) ─────

export function deployAppend(
  stagingPaths: { cfg: string; annotations: string; video: string },
  gamePaths: GamePaths,
  overwriteConflicts: boolean,
  usePersonalCfg: boolean,
  log: LogFn,
): DeployResult {
  log({ category: "install", level: "progress", message: "追加部署到游戏目录..." });

  const installData = loadInstallData();
  let totalFiles = 0;
  let totalDirs = 0;

  for (const cat of getCategories(stagingPaths, gamePaths)) {
    if (cat.key === "gameCfg" && usePersonalCfg) continue;
    if (cat.key === "userCfg" && !usePersonalCfg) continue;

    if (!hasEntries(cat)) continue;

    const stagingEntries = walkTopLevel(cat.staging);
    fs.mkdirSync(cat.game!, { recursive: true });

    // Handle conflicts for append
    if (overwriteConflicts) {
      for (const name of [...stagingEntries.files, ...stagingEntries.dirs]) {
        const gamePath = path.join(cat.game!, name);
        if (!fs.existsSync(gamePath)) continue;
        const isDir = fs.statSync(gamePath).isDirectory();
        removeEntry(cat.game!, name, isDir);
        log({ category: "install", level: "info", message: `已覆盖：${name}` });
      }
    }

    // Copy staging → game
    const result = copyStagingToGame(cat.staging, cat.game!);
    totalFiles += result.files;
    totalDirs += result.dirs;

    // Merge into install data
    const existing = installData.install[cat.key];
    const fileSet = new Set([...existing.files, ...stagingEntries.files]);
    const dirSet = new Set([...existing.dirs, ...stagingEntries.dirs]);
    installData.install[cat.key].files = [...fileSet];
    installData.install[cat.key].dirs = [...dirSet];

    log({
      category: "install",
      level: "success",
      message: `${cat.label}：${result.files} 个文件，${result.dirs} 个目录已部署`,
    });
  }

  writeInstall(installData);

  log({ category: "install", level: "success", message: `追加部署完成：${totalFiles} 个文件，${totalDirs} 个目录` });

  return { filesInstalled: totalFiles, dirsInstalled: totalDirs };
}

// ── Delete Installed Item ────────────────────────────────────

export function deleteInstalledItem(
  category: CategoryKey,
  name: string,
  gamePaths: GamePaths,
  log: LogFn,
): boolean {
  const installData = loadInstallData();
  const catData = installData.install[category];

  const isFile = catData.files.includes(name);
  const isDir = catData.dirs.includes(name);

  if (!isFile && !isDir) {
    log({ category: "file-ops", level: "error", message: `未找到已安装项：${name}` });
    return false;
  }

  // Delete from game dir
  let gameDir: string | null = null;
  if (category === "gameCfg") gameDir = gamePaths.cfgPath;
  else if (category === "userCfg") gameDir = gamePaths.videoPath;
  else if (category === "annotations") gameDir = gamePaths.annotationsPath;
  else if (category === "video") gameDir = gamePaths.videoPath;

  if (gameDir) {
    removeEntry(gameDir, name, isDir);
  }

  // Update install.json
  if (isFile) {
    catData.files = catData.files.filter((f) => f !== name);
  } else {
    catData.dirs = catData.dirs.filter((d) => d !== name);
  }
  writeInstall(installData);

  log({ category: "file-ops", level: "success", message: `已删除：${name}` });
  return true;
}

// ── Restore from res (recover user's original same-name files) ─

export function restoreFromRes(
  category: CategoryKey,
  name: string,
  gamePaths: GamePaths,
  log: LogFn,
): boolean {
  const resDir = path.join(getBase(), "res");
  const srcPath = path.join(resDir, category, name);

  if (!fs.existsSync(srcPath)) {
    log({ category: "file-ops", level: "error", message: `恢复源不存在：${name}` });
    return false;
  }

  let gameDir: string | null = null;
  if (category === "gameCfg") gameDir = gamePaths.cfgPath;
  else if (category === "userCfg") gameDir = gamePaths.videoPath;
  else if (category === "annotations") gameDir = gamePaths.annotationsPath;
  else if (category === "video") gameDir = gamePaths.videoPath;

  if (!gameDir) {
    log({ category: "file-ops", level: "error", message: `未检测到游戏目录，无法恢复：${category}` });
    return false;
  }

  const dstPath = path.join(gameDir, name);
  const isDir = fs.statSync(srcPath).isDirectory();

  try {
    if (fs.existsSync(dstPath)) {
      const stat = fs.lstatSync(dstPath);
      if (stat.isDirectory()) fs.rmSync(dstPath, { recursive: true, force: true });
      else fs.unlinkSync(dstPath);
    }

    if (isDir) {
      copyDirRecursive(srcPath, dstPath);
      fs.rmSync(srcPath, { recursive: true, force: true });
    } else {
      fs.copyFileSync(srcPath, dstPath);
      fs.unlinkSync(srcPath);
    }

    // Update res.json
    const resData = loadResData();
    resData.res[category].files = resData.res[category].files.filter((f) => f !== name);
    resData.res[category].dirs = resData.res[category].dirs.filter((d) => d !== name);
    writeRes(resData);

    // Remove from install.json if present
    const installData = loadInstallData();
    installData.install[category].files = installData.install[category].files.filter((f) => f !== name);
    installData.install[category].dirs = installData.install[category].dirs.filter((d) => d !== name);
    writeInstall(installData);

    // Clean up empty dirs in res
    const parentDir = path.dirname(srcPath);
    if (parentDir !== path.join(resDir, category) && fs.existsSync(parentDir) && fs.readdirSync(parentDir).length === 0) {
      fs.rmdirSync(parentDir);
    }

    log({ category: "file-ops", level: "success", message: `已恢复冲突项：${name}`, detail: dstPath });
    return true;
  } catch (e: unknown) {
    log({ category: "file-ops", level: "error", message: `恢复失败：${name}`, detail: e instanceof Error ? e.message : String(e) });
    return false;
  }
}

// ── Restore from save ────────────────────────────────────────

export function restoreFromSave(
  gamePaths: GamePaths,
  log: LogFn,
): boolean {
  const saveData = loadSaveData();
  const saveDir = path.join(getBase(), "save");

  if (!fs.existsSync(saveDir)) {
    log({ category: "backup", level: "error", message: "备份目录不存在" });
    return false;
  }

  log({ category: "backup", level: "progress", message: "正在从备份恢复..." });

  const categories: { key: CategoryKey; game: string | null }[] = [
    { key: "gameCfg", game: gamePaths.cfgPath },
    { key: "userCfg", game: gamePaths.videoPath },
    { key: "annotations", game: gamePaths.annotationsPath },
    { key: "video", game: gamePaths.videoPath },
  ];

  let restored = 0;

  for (const cat of categories) {
    if (!cat.game) continue;

    const catSaveDir = path.join(saveDir, cat.key);
    if (!fs.existsSync(catSaveDir)) continue;

    for (const entry of fs.readdirSync(catSaveDir, { withFileTypes: true })) {
      const src = path.join(catSaveDir, entry.name);
      const dst = path.join(cat.game, entry.name);

      try {
        if (entry.isDirectory()) {
          copyDirRecursive(src, dst);
        } else {
          fs.mkdirSync(path.dirname(dst), { recursive: true });
          fs.copyFileSync(src, dst);
        }
        restored++;
      } catch {
        // Skip failed files
      }
    }
  }

  // Overwrite install.json with save's entries + current paths
  const installData = loadInstallData();
  for (const cat of categories) {
    installData.install[cat.key].files = [...saveData.save[cat.key].files];
    installData.install[cat.key].dirs = [...saveData.save[cat.key].dirs];
  }
  writeInstall(installData);

  log({ category: "backup", level: "success", message: `备份恢复完成，共 ${restored} 项` });
  return true;
}

// ── Delete single res item ────────────────────────────────────

export function deleteResItem(
  category: CategoryKey,
  name: string,
  log: LogFn,
): boolean {
  const resData = loadResData();
  const catData = resData.res[category];

  const isFile = catData.files.includes(name);
  const isDir = catData.dirs.includes(name);

  if (!isFile && !isDir) {
    log({ category: "file-ops", level: "error", message: `未找到冲突恢复项：${name}` });
    return false;
  }

  removeEntry(path.join(getBase(), "res", category), name, isDir);

  if (isFile) catData.files = catData.files.filter((f) => f !== name);
  else catData.dirs = catData.dirs.filter((d) => d !== name);
  writeRes(resData);

  log({ category: "file-ops", level: "success", message: `已删除冲突恢复项：${name}` });
  return true;
}

// ── Clear entire res category ─────────────────────────────────

export function clearResCategory(
  category: CategoryKey,
  log: LogFn,
): void {
  const catDir = path.join(getBase(), "res", category);
  if (fs.existsSync(catDir)) {
    fs.rmSync(catDir, { recursive: true, force: true });
    fs.mkdirSync(catDir, { recursive: true });
  }

  const resData = loadResData();
  resData.res[category].files = [];
  resData.res[category].dirs = [];
  writeRes(resData);

  log({ category: "file-ops", level: "success", message: `已清除 ${category} 冲突恢复文件` });
}

// ── Delete single save item ───────────────────────────────────

export function deleteSaveItem(
  category: CategoryKey,
  name: string,
  log: LogFn,
): boolean {
  const saveData = loadSaveData();
  const catData = saveData.save[category];

  const isFile = catData.files.includes(name);
  const isDir = catData.dirs.includes(name);

  if (!isFile && !isDir) {
    log({ category: "file-ops", level: "error", message: `未找到配置备份项：${name}` });
    return false;
  }

  removeEntry(path.join(getBase(), "save", category), name, isDir);

  if (isFile) catData.files = catData.files.filter((f) => f !== name);
  else catData.dirs = catData.dirs.filter((d) => d !== name);
  writeSave(saveData);

  log({ category: "file-ops", level: "success", message: `已删除配置备份项：${name}` });
  return true;
}

// ── Clear entire save category ────────────────────────────────

export function clearSaveCategory(
  category: CategoryKey,
  log: LogFn,
): void {
  const catDir = path.join(getBase(), "save", category);
  if (fs.existsSync(catDir)) {
    fs.rmSync(catDir, { recursive: true, force: true });
    fs.mkdirSync(catDir, { recursive: true });
  }

  const saveData = loadSaveData();
  saveData.save[category].files = [];
  saveData.save[category].dirs = [];
  writeSave(saveData);

  log({ category: "file-ops", level: "success", message: `已清除 ${category} 配置备份` });
}

// ── Restore entire save category ─────────────────────────────

export function restoreSaveCategory(
  category: CategoryKey,
  gamePaths: GamePaths,
  log: LogFn,
): number {
  const saveData = loadSaveData();
  const catData = saveData.save[category];

  if (catData.files.length === 0 && catData.dirs.length === 0) return 0;

  let gameDir: string | null = null;
  if (category === "gameCfg") gameDir = gamePaths.cfgPath;
  else if (category === "userCfg") gameDir = gamePaths.videoPath;
  else if (category === "annotations") gameDir = gamePaths.annotationsPath;
  else if (category === "video") gameDir = gamePaths.videoPath;

  if (!gameDir) {
    log({ category: "file-ops", level: "error", message: `未检测到游戏目录，无法恢复：${category}` });
    return 0;
  }

  const saveDir = path.join(getBase(), "save", category);
  let restored = 0;

  for (const name of [...catData.dirs, ...catData.files]) {
    const src = path.join(saveDir, name);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(gameDir, name);
    try {
      const isDir = fs.statSync(src).isDirectory();
      if (isDir) copyDirRecursive(src, dst);
      else { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); }
      restored++;
    } catch { /* skip */ }
  }

  // Update install.json
  const installData = loadInstallData();
  installData.install[category].files = [...catData.files];
  installData.install[category].dirs = [...catData.dirs];
  writeInstall(installData);

  // Clear save
  fs.rmSync(saveDir, { recursive: true, force: true });
  fs.mkdirSync(saveDir, { recursive: true });
  saveData.save[category].files = [];
  saveData.save[category].dirs = [];
  writeSave(saveData);

  log({ category: "backup", level: "success", message: `已恢复 ${category} 配置备份，共 ${restored} 项` });
  return restored;
}

// ── Restore single save item ─────────────────────────────────

export function restoreSaveItem(
  category: CategoryKey,
  name: string,
  gamePaths: GamePaths,
  log: LogFn,
): boolean {
  const saveData = loadSaveData();
  const catData = saveData.save[category];
  const isFile = catData.files.includes(name);
  const isDir = catData.dirs.includes(name);

  if (!isFile && !isDir) {
    log({ category: "file-ops", level: "error", message: `未找到配置备份项：${name}` });
    return false;
  }

  let gameDir: string | null = null;
  if (category === "gameCfg") gameDir = gamePaths.cfgPath;
  else if (category === "userCfg") gameDir = gamePaths.videoPath;
  else if (category === "annotations") gameDir = gamePaths.annotationsPath;
  else if (category === "video") gameDir = gamePaths.videoPath;

  if (!gameDir) {
    log({ category: "file-ops", level: "error", message: `未检测到游戏目录，无法恢复：${category}` });
    return false;
  }

  const src = path.join(getBase(), "save", category, name);
  if (!fs.existsSync(src)) {
    log({ category: "file-ops", level: "error", message: `恢复源不存在：${name}` });
    return false;
  }

  const dst = path.join(gameDir, name);
  try {
    if (fs.existsSync(dst)) {
      if (fs.statSync(dst).isDirectory()) fs.rmSync(dst, { recursive: true, force: true });
      else fs.unlinkSync(dst);
    }
    if (isDir) copyDirRecursive(src, dst);
    else { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); }
    fs.rmSync(src, { recursive: true, force: true });
  } catch (e: unknown) {
    log({ category: "file-ops", level: "error", message: `恢复失败：${name}`, detail: e instanceof Error ? e.message : String(e) });
    return false;
  }

  if (isFile) catData.files = catData.files.filter((f) => f !== name);
  else catData.dirs = catData.dirs.filter((d) => d !== name);
  writeSave(saveData);

  const installData = loadInstallData();
  if (isFile && !installData.install[category].files.includes(name)) installData.install[category].files.push(name);
  if (isDir && !installData.install[category].dirs.includes(name)) installData.install[category].dirs.push(name);
  writeInstall(installData);

  log({ category: "file-ops", level: "success", message: `已恢复配置备份项：${name}` });
  return true;
}

// ── Restore entire res category ──────────────────────────────

export function restoreResCategory(
  category: CategoryKey,
  gamePaths: GamePaths,
  log: LogFn,
): number {
  const resData = loadResData();
  const catData = resData.res[category];

  if (catData.files.length === 0 && catData.dirs.length === 0) return 0;

  let gameDir: string | null = null;
  if (category === "gameCfg") gameDir = gamePaths.cfgPath;
  else if (category === "userCfg") gameDir = gamePaths.videoPath;
  else if (category === "annotations") gameDir = gamePaths.annotationsPath;
  else if (category === "video") gameDir = gamePaths.videoPath;

  if (!gameDir) {
    log({ category: "file-ops", level: "error", message: `未检测到游戏目录，无法恢复：${category}` });
    return 0;
  }

  const resDir = path.join(getBase(), "res", category);
  let restored = 0;

  for (const name of [...catData.dirs, ...catData.files]) {
    const src = path.join(resDir, name);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(gameDir, name);
    try {
      if (fs.existsSync(dst)) {
        if (fs.statSync(dst).isDirectory()) fs.rmSync(dst, { recursive: true, force: true });
        else fs.unlinkSync(dst);
      }
      const isDir = fs.statSync(src).isDirectory();
      if (isDir) copyDirRecursive(src, dst);
      else { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); }
      restored++;
    } catch { /* skip */ }
  }

  // Clear res
  fs.rmSync(resDir, { recursive: true, force: true });
  fs.mkdirSync(resDir, { recursive: true });
  resData.res[category].files = [];
  resData.res[category].dirs = [];
  writeRes(resData);

  log({ category: "file-ops", level: "success", message: `已恢复 ${category} 冲突文件，共 ${restored} 项` });
  return restored;
}

// ── Uninstall installed category ─────────────────────────────

export function clearInstallCategory(
  category: CategoryKey,
  gamePaths: GamePaths,
  log: LogFn,
): number {
  const installData = loadInstallData();
  const catData = installData.install[category];

  if (catData.files.length === 0 && catData.dirs.length === 0) return 0;

  let gameDir: string | null = null;
  if (category === "gameCfg") gameDir = gamePaths.cfgPath;
  else if (category === "userCfg") gameDir = gamePaths.videoPath;
  else if (category === "annotations") gameDir = gamePaths.annotationsPath;
  else if (category === "video") gameDir = gamePaths.videoPath;

  if (!gameDir) {
    log({ category: "file-ops", level: "error", message: `未检测到游戏目录，无法卸载：${category}` });
    return 0;
  }

  let removed = 0;
  for (const name of [...catData.files, ...catData.dirs]) {
    const isDir = catData.dirs.includes(name);
    removeEntry(gameDir, name, isDir);
    removed++;
  }

  catData.files = [];
  catData.dirs = [];
  writeInstall(installData);

  log({ category: "file-ops", level: "success", message: `已卸载 ${category} 配置，共 ${removed} 项` });
  return removed;
}

// ── Open item (file in notepad / dir in explorer) ────────────

export function openItem(
  storage: "install" | "save" | "res",
  category: CategoryKey,
  name: string,
  gamePaths: GamePaths,
  log: LogFn,
): boolean {
  let filePath: string;

  if (storage === "install") {
    let gameDir: string | null = null;
    if (category === "gameCfg") gameDir = gamePaths.cfgPath;
    else if (category === "userCfg") gameDir = gamePaths.videoPath;
    else if (category === "annotations") gameDir = gamePaths.annotationsPath;
    else if (category === "video") gameDir = gamePaths.videoPath;
    if (!gameDir) {
      log({ category: "file-ops", level: "error", message: `未检测到游戏目录` });
      return false;
    }
    filePath = path.join(gameDir, name);
  } else {
    filePath = path.join(getBase(), storage, category, name);
  }

  if (!fs.existsSync(filePath)) {
    log({ category: "file-ops", level: "error", message: `文件不存在：${name}` });
    return false;
  }

  const isDir = fs.statSync(filePath).isDirectory();
  if (isDir) {
    shell.openPath(filePath);
  } else {
    spawn("notepad.exe", [filePath], { detached: true, stdio: "ignore" }).unref();
  }
  return true;
}

// ── Get data for renderer ────────────────────────────────────

export function getInstalledData(): InstallState {
  return loadInstallData().install;
}

export function getResData(): InstallState {
  return loadResData().res;
}

export function getSaveData(): InstallState {
  return loadSaveData().save;
}
