/**
 * KeymapCanvas —— 全尺寸键盘 + 实体鼠标的按键高亮画布。
 *
 * 纯展示组件：所有键位状态由外部解析好的 EffectiveKey 决定，画布本身不做任何层级 /
 * 别名逻辑。布局数据见 keyboard-layout.ts（Source 键名即键 id，直接查表）。
 *
 * 键帽材质：色相随「生效层」变化（layer-colors.ts），通过内联 CSS 变量注入，
 * 立体感与按压态写在 global.css 的 .srp-keycap 规则里。
 *
 * 三态语义
 * - 生效（bind）    → 用该层颜色**填充**键帽
 * - 被解绑（unbind）→ 中性键帽 + 该层颜色**描边**（表示被这层清掉了，但没绑定）
 * - 未绑定          → 纯中性
 */
import type { CSSProperties } from "react";
import { MAIN_ROWS, NAV_ROWS, type KeyDef } from "./keyboard-layout";
import { MouseCanvas } from "./MouseCanvas";
import { MOUSE_KEY_IDS } from "./mouse-layout";
import { keymaps, type EffectiveKey } from "./keymaps-data";
import { layerMaterial, NEUTRAL_KEY, type KeyMaterial } from "./layer-colors";

/** 键帽尺寸。单位之间的缝隙并入多单位键的宽度，保持行宽一致。 */
const UNIT = 42;
const H_GAP = 5;
/** 纵向留出键帽下沿（3px）的余地，否则会被下一行压住 */
const V_GAP = 6;
const BLOCK_GAP = 24;

const keyWidth = (w: number) => w * UNIT + (w - 1) * H_GAP;

/**
 * 画布上有物理位置的键。不在这里的绑定会落到「无对应键位」补充条，
 * 这样删掉小键盘、或以后 cfg 新增没画出来的键，都不会静默丢信息。
 */
const ON_CANVAS = new Set<string>(
  [
    ...MAIN_ROWS.flat().map((k) => k.id),
    ...NAV_ROWS.flat().map((k) => k.id),
    ...MOUSE_KEY_IDS,
  ].filter((id): id is string => Boolean(id)),
);

/** 把材质转成 .srp-keycap 读取的 CSS 变量。 */
const materialVars = (m: KeyMaterial): CSSProperties =>
  ({
    "--key-face-top": m.faceTop,
    "--key-face-bottom": m.faceBottom,
    "--key-edge": m.edge,
    "--key-border": m.border,
    "--key-fg": m.fg,
  }) as CSSProperties;

interface KeyCapProps {
  def: KeyDef;
  effective: Map<string, EffectiveKey>;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

function KeyCap({ def, effective, selectedKey, onSelect }: KeyCapProps) {
  const w = def.w ?? 1;

  if (!def.id) {
    return <div aria-hidden style={{ width: keyWidth(w), height: UNIT }} />;
  }

  const hit = effective.get(def.id);
  const op = hit?.active?.entry.op;
  const bound = op === "bind";
  const cleared = op === "unbind";

  // 填充用生效层的颜色；解绑只用它的描边色，键帽本身保持中性
  const layer = hit?.active?.layer.id;
  const filled = bound && layer ? layerMaterial(layer) : NEUTRAL_KEY;
  const outline = cleared && layer ? layerMaterial(layer) : NEUTRAL_KEY;

  const material: KeyMaterial = cleared
    ? { ...NEUTRAL_KEY, border: outline.border, fg: outline.fg }
    : filled;

  const label =
    def.label +
    (bound
      ? ` → ${hit?.active?.entry.target}`
      : cleared
        ? ` → 已被「${hit?.active?.layer.label}」解绑`
        : " → 未绑定");

  return (
    <button
      type="button"
      onClick={() => onSelect(def.id as string)}
      title={label}
      data-selected={selectedKey === def.id ? "true" : undefined}
      className="srp-keycap relative flex shrink-0 flex-col items-center justify-center"
      style={{ width: keyWidth(w), height: UNIT, ...materialVars(material) }}
    >
      {def.sub && (
        <span className="absolute left-1.5 top-1 text-[9px] leading-none opacity-55">
          {def.sub}
        </span>
      )}
      <span className="text-[11px] font-medium leading-none">{def.label}</span>
    </button>
  );
}

function Row({ keys, ...rest }: { keys: KeyDef[] } & Omit<KeyCapProps, "def">) {
  return (
    <div className="flex" style={{ gap: H_GAP }}>
      {keys.map((def, i) => (
        <KeyCap key={`${def.id ?? "gap"}-${i}`} def={def} {...rest} />
      ))}
    </div>
  );
}

export interface KeymapCanvasProps {
  effective: Map<string, EffectiveKey>;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

export function KeymapCanvas({ effective, selectedKey, onSelect }: KeymapCanvasProps) {
  const shared = { effective, selectedKey, onSelect };
  const mainHeight = 6 * UNIT + 5 * V_GAP;

  // 生效但画布上没有位置的键（例如 demo-hlae 绑的 kp_0~kp_9）
  const extras = [...effective.entries()]
    .filter(([key, item]) => item.active !== null && !ON_CANVAS.has(key))
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="overflow-x-auto rounded-[14px] border border-border p-5"
      style={{
        background: "linear-gradient(180deg, #171b21 0%, #0e1116 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -4px 12px rgba(0,0,0,0.55), 0 14px 30px -14px rgba(0,0,0,0.8)",
      }}
    >
      <div className="flex w-max items-start" style={{ gap: BLOCK_GAP }}>
        {/* 主键区 */}
        <div className="flex flex-col" style={{ gap: V_GAP }}>
          {MAIN_ROWS.map((keys, i) => (
            <Row key={i} keys={keys} {...shared} />
          ))}
        </div>

        {/* 编辑区（上）与方向键（下）：贴住主键区的上下两端，中间自然留白 */}
        <div className="flex flex-col justify-between" style={{ height: mainHeight }}>
          <div className="flex flex-col" style={{ gap: V_GAP }}>
            {NAV_ROWS.slice(0, 2).map((keys, i) => (
              <Row key={i} keys={keys} {...shared} />
            ))}
          </div>
          <div className="flex flex-col" style={{ gap: V_GAP }}>
            {NAV_ROWS.slice(2).map((keys, i) => (
              <Row key={i} keys={keys} {...shared} />
            ))}
          </div>
        </div>

        {/* 实体鼠标：接管原数字小键盘的位置 */}
        <MouseCanvas effective={effective} selectedKey={selectedKey} onSelect={onSelect} />
      </div>

      {extras.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/5 pt-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
            无对应键位
          </span>
          <div className="flex flex-wrap items-center" style={{ gap: H_GAP }}>
            {extras.map(([key]) => (
              <KeyCap
                key={key}
                def={{ id: key, label: keymaps.keyLabels[key] ?? key }}
                {...shared}
              />
            ))}
          </div>
          <span className="text-[11px] text-text-faint">
            这些键在当前层被绑定，但画布上没有对应物理位置（如数字小键盘）。
          </span>
        </div>
      )}
    </div>
  );
}
