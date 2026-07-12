import * as fs from "fs";
import * as path from "path";
import type { VcfgStateSummary, VcfgSnapshot } from "../../renderer/types";

interface VdfNode {
  [key: string]: string | VdfNode;
}


function tokenize(content: string): string[] {
  const tokens: string[] = [];
  let index = 0;

  while (index < content.length) {
    const char = content[index];
    if (/\s/.test(char)) {
      index++;
      continue;
    }
    if (char === "/" && content[index + 1] === "/") {
      index = content.indexOf("\n", index + 2);
      if (index === -1) break;
      continue;
    }
    if (char === "{" || char === "}") {
      tokens.push(char);
      index++;
      continue;
    }
    if (char !== '"') {
      index++;
      continue;
    }

    index++;
    let value = "";
    while (index < content.length) {
      const current = content[index++];
      // CS2's generated KeyValues uses a literal backslash key as "\";
      // do not apply JSON/C-style escape handling here.
      if (current === '"') {
        break;
      } else {
        value += current;
      }
    }
    tokens.push(value);
  }

  return tokens;
}

function parseNode(tokens: string[], cursor: { value: number }): VdfNode {
  const node: VdfNode = {};
  while (cursor.value < tokens.length) {
    const key = tokens[cursor.value++];
    if (key === "}") break;
    const value = tokens[cursor.value++];
    if (value === "{") node[key] = parseNode(tokens, cursor);
    else if (value !== undefined) node[key] = value;
  }
  return node;
}

function parseVcfg(filePath: string): VdfNode | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const tokens = tokenize(fs.readFileSync(filePath, "utf-8"));
    const cursor = { value: 0 };
    const rootKey = tokens[cursor.value++];
    if (!rootKey || tokens[cursor.value++] !== "{") return null;
    return { [rootKey]: parseNode(tokens, cursor) };
  } catch {
    return null;
  }
}

function child(node: VdfNode | null, ...keys: string[]): VdfNode | null {
  let current: string | VdfNode | undefined = node ?? undefined;
  for (const key of keys) {
    if (!current || typeof current === "string") return null;
    current = current[key];
  }
  return current && typeof current !== "string" ? current : null;
}

function countEntries(node: VdfNode | null): number {
  return node ? Object.keys(node).length : 0;
}

function stringEntries(node: VdfNode | null): Record<string, string> {
  if (!node) return {};
  return Object.fromEntries(
    Object.entries(node).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

export function captureVcfgSnapshot(userCfgPath: string): VcfgSnapshot {
  const keys = parseVcfg(path.join(userCfgPath, "cs2_user_keys_0_slot0.vcfg"));
  const userConvars = parseVcfg(path.join(userCfgPath, "cs2_user_convars_0_slot0.vcfg"));
  const machineConvars = parseVcfg(path.join(userCfgPath, "cs2_machine_convars.vcfg"));

  return {
    schemaVersion: 1,
    capturedAt: Date.now(),
    userCfgPath,
    bindings: stringEntries(child(keys, "config", "bindings")),
    analogBindings: stringEntries(child(keys, "config", "analogbindings")),
    userConvars: stringEntries(child(userConvars, "config", "convars")),
    machineConvars: stringEntries(child(machineConvars, "config", "convars")),
  };
}

export interface SnapshotToCfgOptions {
  bindings: boolean;
  analogBindings: boolean;
  userConvars: boolean;
  machineConvars: boolean;
}

/** Parse a .cfg file and extract convar → value pairs, skipping comments/echo/exec/bind. */
export function parseCfgConvars(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  try {
    const lines = fs.readFileSync(filePath, "utf-8").split(/\r?\n/);
    const result: Record<string, string> = {};
    for (const raw of lines) {
      const commentIdx = raw.indexOf("//");
      const code = (commentIdx >= 0 ? raw.slice(0, commentIdx) : raw).trim();
      if (!code) continue;
      if (/^(?:echo|exec|bind|binddefaults|firstperson)\b/i.test(code)) continue;
      const match = code.match(/^(\S+)\s+(?:"([^"]*)"|(\S+))$/);
      if (match) result[match[1]] = match[2] ?? match[3];
    }
    return result;
  } catch {
    return {};
  }
}

/** Normalize boolean literals so "true"/"1" and "false"/"0" compare equal. */
function normalizeCfgValue(v: string): string {
  if (v === "true" || v === "True") return "1";
  if (v === "false" || v === "False") return "0";
  return v;
}

/** Convert a VcfgSnapshot into CS2 CFG text lines, filtered by category.
 *  Convars are diffed against the optional Valve baseline; only non-default values are emitted. */
export function snapshotToCfg(
  snapshot: VcfgSnapshot,
  options: SnapshotToCfgOptions,
  baseline: Record<string, string> = {},
): string {
  const sections: string[] = [];

  if (options.bindings) {
    const entries = Object.entries(snapshot.bindings).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length) {
      sections.push("// ── 按键绑定 ──");
      for (const [key, cmd] of entries) sections.push(`bind "${key}" "${cmd}"`);
    }
  }

  if (options.analogBindings) {
    const entries = Object.entries(snapshot.analogBindings).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length) {
      sections.push("// ── 模拟轴绑定 ──");
      for (const [axis, cmd] of entries) sections.push(`bind "${axis}" "${cmd}"`);
    }
  }

  if (options.userConvars) {
    const entries = Object.entries(snapshot.userConvars)
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([name, value]) => {
        const def = baseline[name];
        return def === undefined || normalizeCfgValue(def) !== normalizeCfgValue(value);
      });
    if (entries.length) {
      sections.push("// ── 个人偏好设置（仅与 Valve 默认值不同的项）──");
      for (const [convar, value] of entries) {
        sections.push(value.includes(" ") ? `${convar} "${value}"` : `${convar} ${value}`);
      }
    }
  }

  if (options.machineConvars) {
    const entries = Object.entries(snapshot.machineConvars)
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([name, value]) => {
        const def = baseline[name];
        return def === undefined || normalizeCfgValue(def) !== normalizeCfgValue(value);
      });
    if (entries.length) {
      sections.push("// ── 机器设置（仅与 Valve 默认值不同的项）──");
      for (const [convar, value] of entries) {
        sections.push(value.includes(" ") ? `${convar} "${value}"` : `${convar} ${value}`);
      }
    }
  }

  return sections.join("\n");
}

export function saveVcfgBaseline(
  userCfgPath: string,
  snapshotRoot: string,
  accountId: string,
): { path: string; created: boolean } {
  const accountDir = path.join(snapshotRoot, accountId);
  const baselinePath = path.join(accountDir, "baseline.json");
  if (fs.existsSync(baselinePath)) return { path: baselinePath, created: false };

  fs.mkdirSync(accountDir, { recursive: true });
  fs.writeFileSync(
    baselinePath,
    JSON.stringify(captureVcfgSnapshot(userCfgPath), null, 2),
    "utf-8",
  );
  return { path: baselinePath, created: true };
}

export function inspectVcfgState(userCfgPath: string | null): VcfgStateSummary {
  if (!userCfgPath) {
    return {
      available: false,
      bindings: 0,
      analogBindings: 0,
      cloudConvars: 0,
      machineConvars: 0,
      hasCloudMirror: false,
      hasVideoConfig: false,
    };
  }

  const keysPath = path.join(userCfgPath, "cs2_user_keys_0_slot0.vcfg");
  const userConvarsPath = path.join(userCfgPath, "cs2_user_convars_0_slot0.vcfg");
  const machineConvarsPath = path.join(userCfgPath, "cs2_machine_convars.vcfg");
  const keys = parseVcfg(keysPath);
  const userConvars = parseVcfg(userConvarsPath);
  const machineConvars = parseVcfg(machineConvarsPath);
  const bindings = stringEntries(child(keys, "config", "bindings"));

  return {
    available: Boolean(keys || userConvars || machineConvars),
    bindings: Object.keys(bindings).length,
    analogBindings: countEntries(child(keys, "config", "analogbindings")),
    cloudConvars: countEntries(child(userConvars, "config", "convars")),
    machineConvars: countEntries(child(machineConvars, "config", "convars")),
    hasCloudMirror:
      fs.existsSync(`${keysPath}_lastclouded`) ||
      fs.existsSync(`${userConvarsPath}_lastclouded`),
    hasVideoConfig: fs.existsSync(path.join(userCfgPath, "cs2_video.txt")),
  };
}
