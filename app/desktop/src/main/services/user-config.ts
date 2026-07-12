import * as fs from "fs";
import * as path from "path";
import type { GamePaths } from "./installer";

const USER_CONFIG_RELATIVE = path.join("srp-cfg", "user", "custom.cfg");
const RUNTIME_RELATIVE = path.join("srp-cfg", "runtime", "init.cfg");
const MAX_USER_CONFIG_BYTES = 256 * 1024;

export const DEFAULT_USER_CONFIG = `// ─── SrP-CFG Preset Layer ───
// 第一步：从下面四个 Preset 起点中选择一个，删除该行开头的 //。
// 只启用一个；如果完全依赖游戏设置与 VCFG，也可以一个都不启用。
//
// srp_apply_default
// srp_apply_echo
// srp_apply_yszh
// srp_apply_visionl
//
// 想从 Valve 基线重新测试：控制台执行 srp_reset_valve；
// ─── Preset Layer End ───

// ─── SrP-CFG User Layer ───
// 第二步：把自己的灵敏度、准星、HUD、声音、按键和 alias 写在所选命令下面。
// 后面的命令会覆盖 Preset 中的同名设置；不要直接修改 runtime/features/modes/presets。
// 安装器更新、恢复或卸载 Runtime 时都会保护本文件。
//
// 示例（删除行首 // 后生效）：
// sensitivity 1.00
// c06
// cyan
// bind "mouse4" "+voicerecord"
// alias "mypractice" "srp_practice_keys"
//
// 修改并保存本文件后执行 srp_reload，再应用"Preset 起点 → 个人差异"。
// ─── User Layer End ───
`;

export type UserConfigTarget = "game" | "account";

export interface UserConfigDocument {
  path: string | null;
  target: UserConfigTarget | null;
  exists: boolean;
  runtimeInstalled: boolean;
  content: string;
  modifiedAt: number | null;
}

interface Candidate {
  baseDir: string;
  target: UserConfigTarget;
  customPath: string;
  runtimePath: string;
  score: number;
  modifiedAt: number;
}

function candidate(baseDir: string, target: UserConfigTarget): Candidate {
  const customPath = path.join(baseDir, USER_CONFIG_RELATIVE);
  const runtimePath = path.join(baseDir, RUNTIME_RELATIVE);
  const autoexecPath = path.join(baseDir, "autoexec.cfg");
  let score = 0;
  // The editor must follow the active Runtime location. A stale custom.cfg in the
  // other supported target must never outrank the directory that autoexec loads.
  if (fs.existsSync(autoexecPath)) score += 500;
  if (fs.existsSync(runtimePath)) score += 1000;
  if (fs.existsSync(customPath)) score += 100;
  const modifiedAt = [autoexecPath, runtimePath, customPath]
    .filter((filePath) => fs.existsSync(filePath))
    .reduce((latest, filePath) => Math.max(latest, fs.statSync(filePath).mtimeMs), 0);
  return { baseDir, target, customPath, runtimePath, score, modifiedAt };
}

function resolveCandidate(gamePaths: GamePaths): Candidate | null {
  const candidates: Candidate[] = [];
  if (gamePaths.gameCfgPath) candidates.push(candidate(gamePaths.gameCfgPath, "game"));
  if (gamePaths.userCfgPath) candidates.push(candidate(gamePaths.userCfgPath, "account"));
  candidates.sort((left, right) =>
    right.score - left.score ||
    right.modifiedAt - left.modifiedAt ||
    (left.target === "game" ? -1 : 1),
  );
  return candidates[0] ?? null;
}

export function readUserConfig(gamePaths: GamePaths): UserConfigDocument {
  const selected = resolveCandidate(gamePaths);
  if (!selected) {
    return {
      path: null,
      target: null,
      exists: false,
      runtimeInstalled: false,
      content: DEFAULT_USER_CONFIG,
      modifiedAt: null,
    };
  }

  const exists = fs.existsSync(selected.customPath) && fs.statSync(selected.customPath).isFile();
  const runtimeInstalled = fs.existsSync(selected.runtimePath);

  return {
    path: selected.customPath,
    target: selected.target,
    exists,
    runtimeInstalled,
    content: exists ? fs.readFileSync(selected.customPath, "utf-8") : DEFAULT_USER_CONFIG,
    modifiedAt: exists ? fs.statSync(selected.customPath).mtimeMs : null,
  };
}

export function saveUserConfig(gamePaths: GamePaths, content: string): UserConfigDocument {
  if (typeof content !== "string") throw new Error("个人配置内容无效");
  if (content.includes("\0")) throw new Error("个人配置不能包含 NUL 字符");
  if (Buffer.byteLength(content, "utf-8") > MAX_USER_CONFIG_BYTES) {
    throw new Error("个人配置不能超过 256 KiB");
  }

  const selected = resolveCandidate(gamePaths);
  if (!selected) throw new Error("尚未检测到可用的 CS2 CFG 目录");

  const normalized = content.length === 0 || content.endsWith("\n") ? content : `${content}\n`;
  fs.mkdirSync(path.dirname(selected.customPath), { recursive: true });
  fs.writeFileSync(selected.customPath, normalized, "utf-8");
  return readUserConfig(gamePaths);
}

export function getUserConfigFolder(gamePaths: GamePaths): string | null {
  const selected = resolveCandidate(gamePaths);
  if (!selected) return null;
  const folder = path.dirname(selected.customPath);
  fs.mkdirSync(folder, { recursive: true });
  return folder;
}
