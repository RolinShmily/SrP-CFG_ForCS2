import * as fs from "fs";
import * as path from "path";
import Winreg from "winreg";
import type {
  DetectionResult,
  SteamUser,
  Cs2InstallState,
  LogEntry,
} from "../../renderer/types";
import { inspectVcfgState } from "./vcfg";

// ── Log helper type ──────────────────────────────────────────

export type LogFn = (entry: Omit<LogEntry, "timestamp">) => void;

// ── Registry ─────────────────────────────────────────────────

async function readRegistryValue(
  hive: string,
  key: string,
  value: string,
): Promise<string | null> {
  try {
    const reg = new Winreg({ hive: hive as any, key });
    return await promisifyRegGet(reg, value);
  } catch {
    return null;
  }
}

function promisifyRegGet(
  reg: Winreg.Registry,
  value: string,
): Promise<string | null> {
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
  {
    hive: "HKLM",
    key: "\\SOFTWARE\\Wow6432Node\\Valve\\Steam",
    value: "InstallPath",
  },
];

// ── Steam Detection ──────────────────────────────────────────

export async function detectSteamPath(log: LogFn): Promise<string | null> {
  const candidates = new Set<string>();

  for (const rp of REGISTRY_PATHS) {
    const val = await readRegistryValue(rp.hive, rp.key, rp.value);
    if (!val) continue;
    const p = val.replace(/\//g, "\\").replace(/\\$/, "");
    if (fs.existsSync(p)) {
      candidates.add(p);
    }
  }

  const defaultPaths = [
    "C:\\Program Files (x86)\\Steam",
    "C:\\Program Files\\Steam",
    "C:\\Steam",
    "D:\\Steam",
    "E:\\Steam",
  ];
  for (const p of defaultPaths) {
    if (fs.existsSync(p)) {
      candidates.add(p);
    }
  }

  let bestPath: string | null = null;
  let bestScore = -1;

  for (const p of candidates) {
    const exe = path.join(p, "steam.exe");
    if (!fs.existsSync(exe)) continue;

    let score = 1;
    const loginVdf = path.join(p, "config", "loginusers.vdf");
    const userdata = path.join(p, "userdata");
    const libVdf = path.join(p, "steamapps", "libraryfolders.vdf");

    if (fs.existsSync(loginVdf)) score += 10;
    if (fs.existsSync(userdata)) score += 10;
    if (fs.existsSync(libVdf)) score += 5;

    if (score > bestScore) {
      bestScore = score;
      bestPath = p;
    }
  }

  if (bestPath) {
    log({
      category: "path-detection",
      level: "success",
      message: `Steam 路径：${bestPath}`,
    });
    return bestPath;
  }

  log({
    category: "path-detection",
    level: "error",
    message: "未找到 Steam 路径",
  });
  return null;
}

// ── VDF Parsing ──────────────────────────────────────────────

function parseLibraryPaths(vdfContent: string): string[] {
  const matches = vdfContent.matchAll(/"path"\s+"([^"]+)"/g);
  return [...matches].map((m) => m[1].replace(/\\\\/g, "\\"));
}

export function readLibraryPaths(
  steamRoot: string,
  log: LogFn,
): string[] {
  const vdf = path.join(steamRoot, "steamapps", "libraryfolders.vdf");
  let paths: string[] = [];
  if (fs.existsSync(vdf)) {
    paths = parseLibraryPaths(fs.readFileSync(vdf, "utf-8"));
  } else {
    log({
      category: "path-detection",
      level: "warning",
      message: "未找到 libraryfolders.vdf，将仅尝试 Steam 根路径",
    });
  }

  if (!paths.includes(steamRoot)) {
    paths.unshift(steamRoot);
  }
  return paths;
}

function cs2GameDir(library: string, content?: string): string {
  const folderName =
    (content ? parseAcfValue(content, "installdir") : null) ||
    "Counter-Strike Global Offensive";
  return path.join(
    library,
    "steamapps",
    "common",
    folderName,
  );
}

// ── CS2 Install State ────────────────────────────────────────

function parseAcfValue(content: string, key: string): string | null {
  const match = content.match(new RegExp(`"${key}"\\s+"([^"]+)"`));
  return match ? match[1] : null;
}

export function detectCs2InstallState(
  steamRoot: string,
  libraries: string[],
  log: LogFn,
): { state: Cs2InstallState; installDir: string | null } {
  for (const lib of libraries) {
    const manifestPath = path.join(
      lib,
      "steamapps",
      "appmanifest_730.acf",
    );
    if (!fs.existsSync(manifestPath)) continue;

    const content = fs.readFileSync(manifestPath, "utf-8");
    const stateFlagsStr = parseAcfValue(content, "StateFlags");
    const installDir = cs2GameDir(lib, content);

    if (stateFlagsStr) {
      const flags = parseInt(stateFlagsStr, 10);
      if (!isNaN(flags) && ((flags & 4) !== 0 || flags === 4)) {
        if ((flags & 2) !== 0) {
          log({
            category: "steam-status",
            level: "warning",
            message: "CS2 有可用更新",
            detail: installDir,
          });
          return { state: "needs-update", installDir };
        }

        log({
          category: "steam-status",
          level: "success",
          message: "CS2 已安装",
          detail: installDir,
        });
        return { state: "installed", installDir };
      }
    }
  }

  log({
    category: "steam-status",
    level: "error",
    message: "未检测到 CS2 安装",
  });
  return { state: "not-installed", installDir: null };
}

// ── CS2 Paths ────────────────────────────────────────────────

export function detectCs2CfgPath(
  libraries: string[],
  log: LogFn,
): string | null {
  for (const lib of libraries) {
    const cfg = path.join(cs2GameDir(lib), "game", "csgo", "cfg");
    if (fs.existsSync(cfg)) {
      log({
        category: "path-detection",
        level: "success",
        message: `游戏CFG 路径：${cfg}`,
      });
      return cfg;
    }
  }

  log({
    category: "path-detection",
    level: "error",
    message: "未找到 游戏CFG 路径",
  });
  return null;
}

export function detectAnnotationsPath(
  libraries: string[],
  log: LogFn,
): string | null {
  for (const lib of libraries) {
    const csgo = path.join(cs2GameDir(lib), "game", "csgo");
    if (!fs.existsSync(csgo)) continue;

    const annotations = path.join(csgo, "annotations", "local");
    if (fs.existsSync(annotations)) {
      log({
        category: "path-detection",
        level: "success",
        message: `地图指南 路径：${annotations}`,
      });
      return annotations;
    }

    try {
      fs.mkdirSync(annotations, { recursive: true });
      log({
        category: "path-detection",
        level: "success",
        message: `地图指南 路径（已自动创建）：${annotations}`,
      });
      log({
        category: "path-detection",
        level: "warning",
        message: "首次创建可能需要启动一次游戏",
      });
      return annotations;
    } catch (e: any) {
      log({
        category: "path-detection",
        level: "error",
        message: `无法创建地图指南目录：${e.message}`,
      });
      return null;
    }
  }

  log({
    category: "path-detection",
    level: "error",
    message: "未找到 CS2 游戏目录",
  });
  return null;
}

export function detectUserCfgPath(
  steamRoot: string,
  userId: string,
  log: LogFn,
): string | null {
  const userCfgDir = path.join(
    steamRoot,
    "userdata",
    userId,
    "730",
    "local",
    "cfg",
  );

  if (fs.existsSync(userCfgDir)) {
    log({
      category: "path-detection",
      level: "success",
      message: `账号本地状态目录：${userCfgDir}`,
    });
    return userCfgDir;
  }

  try {
    fs.mkdirSync(userCfgDir, { recursive: true });
    log({
      category: "path-detection",
      level: "success",
      message: `账号本地状态目录（已自动创建）：${userCfgDir}`,
    });
    log({
      category: "path-detection",
      level: "warning",
      message: "首次创建可能需要启动一次游戏",
    });
    return userCfgDir;
  } catch (e: any) {
    log({
      category: "path-detection",
      level: "error",
      message: `无法创建账号本地状态目录：${e.message}`,
    });
    return null;
  }
}

// ── Steam Users (from loginusers.vdf) ────────────────────────

const STEAM_ID_OFFSET = 76561197960265728n;

export function detectSteamUsers(
  steamRoot: string,
  log: LogFn,
): {
  users: SteamUser[];
  currentUser: SteamUser | null;
  hasAutoLoginUser: boolean;
} {
  const vdfPath = path.join(steamRoot, "config", "loginusers.vdf");
  if (!fs.existsSync(vdfPath)) {
    log({
      category: "steam-status",
      level: "warning",
      message: "未找到 loginusers.vdf",
    });
    return { users: [], currentUser: null, hasAutoLoginUser: false };
  }

  const content = fs.readFileSync(vdfPath, "utf-8");
  const users: SteamUser[] = [];
  let currentUser: SteamUser | null = null;
  let maxTimestampUser: SteamUser | null = null;
  let maxTimestamp = -1;

  // Match each user block: "7656119..." { ... }
  const userBlockRe = /"(\d{17,})"\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = userBlockRe.exec(content)) !== null) {
    const steamId64 = match[1];
    const block = match[2];

    const personaName =
      block.match(/"PersonaName"\s+"([^"]+)"/)?.[1] ?? undefined;

    const autoLogin =
      block.match(/"AutoLogin"\s+"(\d+)"/)?.[1] === "1";
    const allowAutoLogin =
      block.match(/"AllowAutoLogin"\s+"(\d+)"/)?.[1] === "1";
    const mostRecent =
      block.match(/"mostrecent"\s+"(\d+)"/)?.[1] === "1";
    const isAutoLogin = autoLogin || allowAutoLogin || mostRecent;

    const timestampStr = block.match(/"Timestamp"\s+"(\d+)"/)?.[1];
    const timestamp = timestampStr ? parseInt(timestampStr, 10) : 0;

    const accountId = (BigInt(steamId64) - STEAM_ID_OFFSET).toString();

    const user: SteamUser = { steamId64, accountId, personaName };
    users.push(user);

    if (isAutoLogin && !currentUser) {
      currentUser = user;
    }

    if (timestamp > maxTimestamp) {
      maxTimestamp = timestamp;
      maxTimestampUser = user;
    }
  }

  // Fallback: If no account is explicitly marked as auto-login, pick the most recent account
  if (!currentUser && maxTimestampUser) {
    currentUser = maxTimestampUser;
  } else if (!currentUser && users.length === 1) {
    currentUser = users[0];
  }

  const hasAutoLoginUser = currentUser !== null;

  if (currentUser) {
    log({
      category: "steam-status",
      level: "success",
      message: `当前登录用户：${currentUser.personaName ?? currentUser.accountId}`,
      detail: `SteamID64: ${currentUser.steamId64}`,
    });
  } else if (users.length > 0) {
    log({
      category: "steam-status",
      level: "warning",
      message: "未检测到自动登录用户，请登录 Steam",
    });
  } else {
    log({
      category: "steam-status",
      level: "warning",
      message: "未找到任何 Steam 用户记录",
    });
  }

  return { users, currentUser, hasAutoLoginUser };
}

// ── Orchestrator ─────────────────────────────────────────────

export async function detectAll(log: LogFn): Promise<DetectionResult> {
  const steamPath = await detectSteamPath(log);
  if (!steamPath) {
    return {
      steamPath: null,
      cs2InstallState: "not-installed",
      cs2InstallDir: null,
      cs2CfgPath: null,
      annotationsPath: null,
      userCfgPath: null,
      vcfgState: inspectVcfgState(null),
      steamUsers: [],
      currentUser: null,
      hasAutoLoginUser: false,
    };
  }

  const libs = readLibraryPaths(steamPath, log);
  const { state: cs2InstallState, installDir: cs2InstallDir } =
    libs.length > 0
      ? detectCs2InstallState(steamPath, libs, log)
      : { state: "not-installed" as Cs2InstallState, installDir: null };

  const cs2CfgPath =
    libs.length > 0 ? detectCs2CfgPath(libs, log) : null;
  const annotationsPath =
    libs.length > 0 ? detectAnnotationsPath(libs, log) : null;

  const { users, currentUser, hasAutoLoginUser } = detectSteamUsers(
    steamPath,
    log,
  );

  let userCfgPath: string | null = null;
  if (currentUser) {
    userCfgPath = detectUserCfgPath(steamPath, currentUser.accountId, log);
  }

  return {
    steamPath,
    cs2InstallState,
    cs2InstallDir,
    cs2CfgPath,
    annotationsPath,
    userCfgPath,
    vcfgState: inspectVcfgState(userCfgPath),
    steamUsers: users,
    currentUser,
    hasAutoLoginUser,
  };
}
