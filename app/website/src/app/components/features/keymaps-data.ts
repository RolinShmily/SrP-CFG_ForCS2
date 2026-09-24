/**
 * 按键数据的类型与「生效键位」解析。
 *
 * 数据由 scripts/extract-keymaps.mjs 从 config/srp-cfg 生成（唯一真源），随 bundle 打包，
 * 与指令页 commands.json 同一套做法，不做运行时 fetch。
 *
 * 生效键位的语义 = 按层依次写入，后者覆盖前者：
 *   预设 keymap → 已开启的模块 keymap（按用户开启顺序）→ 个人改键层
 * 这与游戏里的真实行为一致：预设先应用，之后按下的每个入口键（如 P → srp_practice_keys）
 * 都会再覆盖一批键位，而 custom.cfg 跑在整套 runtime 之后，所以个人改键总是压在最上面。
 */
import keymapsJson from "../../../data/generated/keymaps.json" with { type: "json" };

export interface KeymapEntry {
  op: "bind" | "unbind";
  key: string;
  /** 仅 op === "bind" 有值 */
  target?: string;
  comment: string;
}

export type LayerKind = "preset" | "feature" | "mode" | "user";

export interface KeymapLayer {
  id: string;
  kind: LayerKind;
  name: string;
  label: string;
  file: string;
  /** 应用本层 keymap 的入口 alias（如 srp_practice_keys）；预设为 null */
  entryAlias: string | null;
  entries: KeymapEntry[];
}

export interface AliasDef {
  name: string;
  body: string;
  comment: string;
  definedIn: string;
  /** 来源分组：用来在改键选单里按配置块归类 */
  group: AliasGroup;
  /** 注释是脚本按 body 自动生成的摘要（与 body 信息重复，展示时不必两条都列） */
  autoComment: boolean;
  /** 是否被这 14 层 keymap 直接或间接引用到 */
  reachable: boolean;
}

export type AliasGroup =
  | "preset"
  | "entry"
  | "feature"
  | "mode"
  | "crosshair"
  | "spawn"
  | "runtime"
  | "other";

/** 选单里的分组顺序与标题；hint 是该组对应的仓库路径。 */
export const ALIAS_GROUPS: { id: AliasGroup; label: string; hint: string }[] = [
  { id: "entry", label: "模块入口", hint: "runtime/commands.cfg" },
  { id: "preset", label: "预设入口", hint: "runtime/commands.cfg" },
  { id: "feature", label: "功能命令", hint: "features/*/runtime.cfg" },
  { id: "mode", label: "模式命令", hint: "modes/*/runtime.cfg" },
  { id: "crosshair", label: "准星库", hint: "features/crosshair-view/library" },
  { id: "spawn", label: "地图出生点", hint: "modes/practice/spawn" },
  { id: "runtime", label: "运行时", hint: "runtime/aliases.cfg" },
  { id: "other", label: "其他", hint: "" },
];

export interface KeymapsData {
  layers: KeymapLayer[];
  aliasCatalog: AliasDef[];
  keyLabels: Record<string, string>;
  keysUsed: string[];
}

export const keymaps = keymapsJson as KeymapsData;

export const presetLayers = keymaps.layers.filter((l) => l.kind === "preset");
export const moduleLayers = keymaps.layers.filter((l) => l.kind !== "preset");

/** 全部 alias（包含未被任何 keymap 引用的），按名字索引。 */
export const aliasByName = new Map<string, AliasDef>(
  keymaps.aliasCatalog.map((a) => [a.name, a]),
);

/** alias 名 → 是否为可绑定的命令（存在即可选）。 */
export const hasAlias = (name: string) => aliasByName.has(name);

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

/**
 * 个人改键层：合成层，永远排在最后，对应 custom.cfg 里写在 preset 行之后的个人覆盖。
 * 一个键的值是 alias / 命令字符串；`null` 表示把这个键清空（unbind）。
 */
export const USER_LAYER: KeymapLayer = {
  id: "user/rebinds",
  kind: "user",
  name: "rebinds",
  label: "我的改键",
  file: "srp-cfg/user/custom.cfg",
  entryAlias: null,
  entries: [],
};

export type RebindMap = Record<string, string | null>;

/**
 * 把个人改键叠到生效结果上，返回新 Map（不改传入的）。
 * 叠加后画布、详情面板、计数全都自动跟着变——它们本就只认这个 Map。
 */
export function applyRebinds(
  effective: Map<string, EffectiveKey>,
  rebinds: RebindMap,
): Map<string, EffectiveKey> {
  const keys = Object.keys(rebinds);
  if (keys.length === 0) return effective;

  const out = new Map(effective);
  for (const key of keys) {
    const target = rebinds[key];
    const entry: KeymapEntry = target
      ? { op: "bind", key, target, comment: "来自你的个人改键。" }
      : { op: "unbind", key, comment: "你把这个键清空了。" };
    const prev = out.get(key);
    out.set(key, {
      key,
      active: { layer: USER_LAYER, entry },
      history: [...(prev?.history ?? []), { layer: USER_LAYER, entry }],
    });
  }
  return out;
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
      if (token && aliasByName.has(token)) return token;
    }
    return null;
  };

  let current = firstAlias(target);
  while (current && !seen.has(current) && steps.length < limit) {
    seen.add(current);
    const def = aliasByName.get(current) as AliasDef;
    steps.push({ name: current, def });
    current = firstAlias(def.body);
  }
  return steps;
}
