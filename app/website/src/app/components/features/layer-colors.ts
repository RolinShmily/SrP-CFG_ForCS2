/**
 * 层级配色与键帽材质：预设与各功能 / 模式各自一种颜色，画布与图例共用。
 *
 * 分配原则（按感知可辨性，而非机械均分色环）
 * - 预设之间互斥，永远只会看到一个，所以它们的色相只需彼此"是个不同颜色"即可；
 *   真正要拉开的是「模块 vs 模块」和「预设 vs 模块」。
 * - 9 个功能 / 模式按 40° 均分色相，任意两个模块都能分辨。
 * - 5 个预设改用**低饱和高亮度**的底色调（S 42% / L 74%）：色相即使与某个模块接近，
 *   饱和度与明度的差异也会让人读成「底色」而不是「叠加层」。
 *
 * 键帽材质：每个状态给三组值 —— 顶面渐变的两端 + 下沿实体边（立体感的来源），
 * 由 KeymapCanvas 组装成 box-shadow / linear-gradient，不使用动态 Tailwind 类。
 *
 * 未在表中登记的层（将来 cfg 新增模块）用 id 哈希派生稳定色相，保证不会没有颜色。
 */

export interface KeyMaterial {
  /** 顶面渐变起点（较亮） */
  faceTop: string;
  /** 顶面渐变终点（较暗） */
  faceBottom: string;
  /** 下沿实体边：`0 Npx 0` 的那一层，键帽厚度感全靠它 */
  edge: string;
  /** 描边 */
  border: string;
  /** 键帽文字 */
  fg: string;
}

/** 未绑定 / 装饰键的中性材质。 */
export const NEUTRAL_KEY: KeyMaterial = {
  faceTop: "#2b323a",
  faceBottom: "#1f242b",
  edge: "#0e1216",
  border: "rgba(255,255,255,0.07)",
  fg: "#8b95a1",
};

/** 预设：低饱和底色调 */
const PRESET_STYLE = { s: 42, l: 74 };
/** 功能 / 模式：高饱和叠加调 */
const MODULE_STYLE = { s: 78, l: 62 };

/** 预设色相（互斥，5 个） */
const PRESET_HUES: Record<string, number> = {
  "presets/default": 20,
  "presets/echo": 92,
  "presets/valve": 164,
  "presets/visionl": 236,
  "presets/yszh": 308,
};

/** 功能 / 模式色相（按 40° 均分，9 个） */
const MODULE_HUES: Record<string, number> = {
  "features/autoview": 0,
  "features/crosshair-view": 40,
  "features/knife": 80,
  "features/zeus": 120,
  "modes/practice": 160,
  "modes/preview": 200,
  "modes/guidemake": 240,
  "modes/demo-hlae": 280,
  "modes/pwa-prac": 320,
};

/** 未登记层的兜底色相：稳定哈希，同一 id 永远同一颜色。 */
function fallbackHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

const isPreset = (id: string) => id.startsWith("presets/");

/** 个人改键层的特殊色：用近中性亮色，它不属于任何配置层，不该和它们抢色相。 */
const USER_LAYER_ID = "user/rebinds";
const USER_MATERIAL = {
  faceTop: "hsl(0 0% 88% / 0.55)",
  faceBottom: "hsl(0 0% 62% / 0.38)",
  edge: "hsl(0 0% 18%)",
  border: "hsl(0 0% 92% / 0.62)",
  fg: "hsl(0 0% 98%)",
};

function hueOf(layerId: string): number {
  const preset = isPreset(layerId);
  return (preset ? PRESET_HUES[layerId] : MODULE_HUES[layerId]) ?? fallbackHue(layerId);
}

/** 某一层的键帽材质。 */
export function layerMaterial(layerId: string): KeyMaterial {
  if (layerId === USER_LAYER_ID) return USER_MATERIAL;

  const preset = isPreset(layerId);
  const hue = hueOf(layerId);
  const { s, l } = preset ? PRESET_STYLE : MODULE_STYLE;

  return {
    faceTop: `hsl(${hue} ${s}% ${l}% / 0.62)`,
    faceBottom: `hsl(${hue} ${s}% ${Math.max(l - 22, 12)}% / 0.42)`,
    edge: `hsl(${hue} ${Math.round(s * 0.5)}% 17%)`,
    border: `hsl(${hue} ${s}% ${l}% / 0.6)`,
    fg: `hsl(${hue} ${Math.min(s + 12, 92)}% ${Math.min(l + 14, 88)}%)`,
  };
}

/** 图例 / chip 用的纯色（不带材质）。 */
export function layerAccent(layerId: string): { fg: string; bg: string; border: string } {
  if (layerId === USER_LAYER_ID) {
    return {
      fg: USER_MATERIAL.fg,
      bg: "hsl(0 0% 92% / 0.14)",
      border: USER_MATERIAL.border,
    };
  }

  const preset = isPreset(layerId);
  const hue = hueOf(layerId);
  const { s, l } = preset ? PRESET_STYLE : MODULE_STYLE;
  return {
    fg: `hsl(${hue} ${Math.min(s + 12, 92)}% ${Math.min(l + 14, 88)}%)`,
    bg: `hsl(${hue} ${s}% ${l}% / 0.14)`,
    border: `hsl(${hue} ${s}% ${l}% / 0.52)`,
  };
}
