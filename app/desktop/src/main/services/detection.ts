import * as fs from "fs";
import * as path from "path";
import Winreg = require("winreg");
import type {
  DetectionResult,
  SteamUser,
  Cs2InstallState,
  LogEntry,
} from "../../renderer/types";

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
  for (const rp of REGISTRY_PATHS) {
    const val = await readRegistryValue(rp.hive, rp.key, rp.value);
    if (!val) continue;

    const p = val.replace(/\//g, "\\").replace(/\\$/, "");
    const exe = path.join(p, "steam.exe");
    if (fs.existsSync(p) && fs.existsSync(exe)) {
      log({
        category: "path-detection",
        level: "success",
        message: `Steam 路径：${p}`,
      });
      return p;
    }
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
): string[] | null {
  const vdf = path.join(steamRoot, "steamapps", "libraryfolders.vdf");
  if (!fs.existsSync(vdf)) {
    log({
      category: "path-detection",
      level: "error",
      message: "未找到 libraryfolders.vdf",
    });
    return null;
  }
  return parseLibraryPaths(fs.readFileSync(vdf, "utf-8"));
}

function cs2GameDir(library: string): string {
  return path.join(
    library,
    "steamapps",
    "common",
    "Counter-Strike Global Offensive",
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
    const stateFlags = parseAcfValue(content, "StateFlags");
    const installDir = cs2GameDir(lib);

    if (stateFlags === "4") {
      log({
        category: "steam-status",
        level: "success",
        message: "CS2 已安装",
        detail: installDir,
      });
      return { state: "installed", installDir };
    }

    if (stateFlags === "6") {
      log({
        category: "steam-status",
        level: "warning",
        message: "CS2 有可用更新",
        detail: installDir,
      });
      return { state: "needs-update", installDir };
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
        message: `全局CFG 路径：${cfg}`,
      });
      return cfg;
    }
  }

  log({
    category: "path-detection",
    level: "error",
    message: "未找到 全局CFG 路径",
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

export function detectVideoCfgPath(
  steamRoot: string,
  userId: string,
  log: LogFn,
): string | null {
  const videoCfgDir = path.join(
    steamRoot,
    "userdata",
    userId,
    "730",
    "local",
    "cfg",
  );

  if (fs.existsSync(videoCfgDir)) {
    log({
      category: "path-detection",
      level: "success",
      message: `用户CFG(视频预设)路径：${videoCfgDir}`,
    });
    return videoCfgDir;
  }

  try {
    fs.mkdirSync(videoCfgDir, { recursive: true });
    log({
      category: "path-detection",
      level: "success",
      message: `用户CFG(视频预设)路径（已自动创建）：${videoCfgDir}`,
    });
    log({
      category: "path-detection",
      level: "warning",
      message: "首次创建可能需要启动一次游戏",
    });
    return videoCfgDir;
  } catch (e: any) {
    log({
      category: "path-detection",
      level: "error",
      message: `无法创建用户CFG目录：${e.message}`,
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

  // Match each user block: "7656119..." { ... }
  const userBlockRe = /"(\d{17,})"\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = userBlockRe.exec(content)) !== null) {
    const steamId64 = match[1];
    const block = match[2];

    const personaName =
      block.match(/"PersonaName"\s+"([^"]+)"/)?.[1] ?? undefined;
    const allowAutoLogin =
      block.match(/"AllowAutoLogin"\s+"(\d+)"/)?.[1] === "1";

    const accountId = (BigInt(steamId64) - STEAM_ID_OFFSET).toString();

    const user: SteamUser = { steamId64, accountId, personaName };
    users.push(user);

    if (allowAutoLogin) {
      currentUser = user;
    }
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
      videoCfgPath: null,
      steamUsers: [],
      currentUser: null,
      hasAutoLoginUser: false,
    };
  }

  const libraries = readLibraryPaths(steamPath, log);
  const libs = libraries ?? [];

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

  let videoCfgPath: string | null = null;
  if (currentUser) {
    videoCfgPath = detectVideoCfgPath(steamPath, currentUser.accountId, log);
  }

  return {
    steamPath,
    cs2InstallState,
    cs2InstallDir,
    cs2CfgPath,
    annotationsPath,
    videoCfgPath,
    steamUsers: users,
    currentUser,
    hasAutoLoginUser,
  };
}
