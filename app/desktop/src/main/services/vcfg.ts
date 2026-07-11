import * as fs from "fs";
import * as path from "path";
import type { VcfgStateSummary } from "../../renderer/types";

interface VdfNode {
  [key: string]: string | VdfNode;
}

export interface VcfgSnapshot {
  schemaVersion: 1;
  capturedAt: number;
  userCfgPath: string;
  bindings: Record<string, string>;
  analogBindings: Record<string, string>;
  userConvars: Record<string, string>;
  machineConvars: Record<string, string>;
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
