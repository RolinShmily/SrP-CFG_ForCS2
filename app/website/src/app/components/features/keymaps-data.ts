/**
 * 按键数据的类型与「生效键位」解析。
 *
 * 数据由 scripts/extract-keymaps.mjs 从 config/srp-cfg 生成（唯一真源），随 bundle 打包，
 * 与指令页 commands.json 同一套做法，不做运行时 fetch。
 *
 * 生效键位的语义 = 按层依次写入，后者覆盖前者：
 *   预设 keymap → 已开启的模块 keymap（按用户开启顺序）
 * 这与游戏里的真实行为一致：预设先应用，之后按下的每个入口键（如 P → srp_practice_keys）
 * 都会再覆盖一批键位。
 */
import keymapsJson from "../../../../public/data/keymaps.json";

export interface KeymapEntry {
  op: "bind" | "unbind";
  key: string;
  /** 仅 op === "bind" 有值 */
  target?: string;
  comment: string;
}

export interface KeymapLayer {
  id: string;
  kind: "preset" | "feature" | "mode";
  name: string;
  label: string;
  file: string;
  /** 应用本层 keymap 的入口 alias（如 srp_practice_keys）；预设为 null */
  entryAlias: string | null;
  entries: KeymapEntry[];
}

export interface AliasDef {
  body: string;
  comment: string;
  definedIn: string;
}

export interface KeymapsData {
  layers: KeymapLayer[];
  aliases: Record<string, AliasDef>;
  keyLabels: Record<string, string>;
  keysUsed: string[];
}

export const keymaps = keymapsJson as KeymapsData;

export const presetLayers = keymaps.layers.filter((l) => l.kind === "preset");
export const moduleLayers = keymaps.layers.filter((l) => l.kind !== "preset");

/** 某个键在某一层里的记录。 */
export interface KeyHit {
  layer: KeymapLayer;
  entry: KeymapEntry;
}

/** 生效结果：最终状态 + 该键被哪些层碰过的完整历史。 */
export interface EffectiveKey {
  key: string;
  /** 最终生效的层；被最后一层解绑或从未绑定时为 null */
  active: KeyHit | null;
  /** 按应用顺序，所有碰到这个键的层 */
  history: KeyHit[];
}

/**
 * 解析生效键位。
 * @param presetId   选中的预设层 id
 * @param moduleIds  已开启的模块层 id，数组顺序 = 用户开启顺序（后者覆盖前者）
 */
export function resolveKeymap(
  presetId: string,
  moduleIds: string[],
): Map<string, EffectiveKey> {
  const order: KeymapLayer[] = [
    ...keymaps.layers.filter((l) => l.id === presetId),
    ...moduleIds
      .map((id) => keymaps.layers.find((l) => l.id === id))
      .filter((l): l is KeymapLayer => Boolean(l)),
  ];

  const result = new Map<string, EffectiveKey>();
  for (const layer of order) {
    for (const entry of layer.entries) {
      let item = result.get(entry.key);
      if (!item) {
        item = { key: entry.key, active: null, history: [] };
        result.set(entry.key, item);
      }
      item.history.push({ layer, entry });
      // unbind 也要覆盖：它表示「本层把这个键清掉了」
      item.active = { layer, entry };
    }
  }
  return result;
}

/** 沿 alias 链展开，供详情面板解释「这个键到底做了什么」。 */
export interface AliasStep {
  name: string;
  def: AliasDef;
}

export function resolveAliasChain(target: string, limit = 6): AliasStep[] {
  const steps: AliasStep[] = [];
  const seen = new Set<string>();

  const firstAlias = (cmd: string): string | null => {
    for (const part of cmd.split(";")) {
      const token = part.trim().split(/\s+/)[0];
      if (token && keymaps.aliases[token]) return token;
    }
    return null;
  };

  let current = firstAlias(target);
  while (current && !seen.has(current) && steps.length < limit) {
    seen.add(current);
    const def = keymaps.aliases[current];
    steps.push({ name: current, def });
    current = firstAlias(def.body);
  }
  return steps;
}
