/**
 * 实体鼠标的几何数据（俯视）。
 *
 * 参考的是「上：两个主键 + 中央滚轮；中：掌托；左：两个侧键」这种常见俯视造型。
 * 坐标即 SVG viewBox（186 × 282），与键盘行高对齐，正好接管原数字小键盘的位置。
 *
 * 每个部件都是「带逐角半径的多边形」——同一个梯形的「圆润前脸」与「与机身相接的
 * 直角边」需要不同半径，所以半径按顶点单独给，而不是整条路径一个值。
 *
 * 键位对照（Source 键名 → 图上位置）
 *   mouse1     左键        mouse2     右键        mouse3     滚轮中段（滚轮按下）
 *   mwheelup   滚轮上段    mwheeldown 滚轮下段
 *   mouse4     侧键 4      mouse5     侧键 5
 *   mouse_x    掌托区 ↔    mouse_y    掌托区 ↕   （配置里绑定为 yaw / pitch）
 */

export type Pt = readonly [number, number];

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const len = (a: Pt) => Math.hypot(a[0], a[1]);
const dist = (a: Pt, b: Pt) => len(sub(a, b));

/** 单位向量：从 from 指向 to。 */
function unit(from: Pt, to: Pt): Pt {
  const d = sub(to, from);
  const l = len(d) || 1;
  return [d[0] / l, d[1] / l];
}

const fmt = (p: Pt) => `${round(p[0])} ${round(p[1])}`;
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * 多边形 → 带圆角的 SVG path。
 * 半径按顶点给（顺序同 points），并夹到相邻边长的一半，避免圆角互相吃掉。
 */
export function roundedPolygon(points: readonly Pt[], radii: readonly number[]): string {
  const n = points.length;
  const out: string[] = [];

  for (let i = 0; i < n; i++) {
    const cur = points[i];
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];

    const r = Math.min(radii[i] ?? 0, dist(prev, cur) / 2, dist(next, cur) / 2);
    const toPrev = unit(cur, prev);
    const toNext = unit(cur, next);

    const a: Pt = [cur[0] + toPrev[0] * r, cur[1] + toPrev[1] * r];
    const b: Pt = [cur[0] + toNext[0] * r, cur[1] + toNext[1] * r];

    out.push(`${i === 0 ? "M" : "L"} ${fmt(a)}`);
    out.push(`Q ${fmt(cur)} ${fmt(b)}`);
  }

  return `${out.join(" ")} Z`;
}

/** 多边形面积质心，用于把标注放在形状正中。 */
export function centroid(points: readonly Pt[]): Pt {
  const n = points.length;
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % n];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  area *= 0.5;
  return [cx / (6 * area), cy / (6 * area)];
}

export interface MousePart {
  /** Source 键名；装饰件留空 */
  id?: string;
  /** 图内主标注 */
  main?: string;
  /** 图内副标注：Source 键名，让读代码的人对得上 cfg */
  sub?: string;
  /** 图内是否直接显示生效目标（形状够大才开） */
  showTarget?: boolean;
  /** 悬停提示 */
  title?: string;
  points: readonly Pt[];
  radii: readonly number[];
  /** 侧键沿机身弧度倾斜 */
  rotate?: { deg: number; cx: number; cy: number };
  /** 不可点击的机身件 */
  decorative?: boolean;
  /** 机身件自定义填充 / 描边（机身要能看出轮廓，滚轮槽要读作凹槽） */
  fill?: string;
  stroke?: string;
}

/** 画布尺寸：宽度对齐原小键盘占位，高度对齐键盘 6 行。 */
export const MOUSE_VIEW = { w: 186, h: 282 } as const;

/**
 * 图形实际占用的纵向范围（含下沿与落影）。
 * 渲染时按这一段裁切再等比放大到 MOUSE_VIEW.h，鼠标才与键盘一样高，
 * 不会因为上下留白而显得比键盘短一截。
 */
export const MOUSE_CROP = { y: 6, h: 254 } as const;

/** 键帽下沿厚度，与 .srp-keycap 的 --key-depth 保持一致。 */
export const MOUSE_DEPTH = 4;

/**
 * 绘制顺序（后绘制的盖住先绘制的）：
 * 机身 → 左右主键 → 滚轮槽 → 滚轮三段 → 侧键 → 掌托轴标。
 */
export const MOUSE_PARTS: readonly MousePart[] = [
  // 机身掌托（垫底，不可点）：比键盘外壳亮一档，否则侧键看上去是浮在半空的
  {
    decorative: true,
    fill: "#1d242c",
    stroke: "rgba(255,255,255,0.10)",
    points: [
      [10, 134],
      [176, 134],
      [168, 252],
      [18, 252],
    ],
    radii: [4, 4, 48, 48],
  },

  // 左键 / 右键：前脸圆润，内侧与机身相接处接近直角。
  // 前沿宽度约为最宽处的 71%（对齐参考图比例；收得太狠会变成蝴蝶结而不是鼠标）
  {
    id: "mouse1",
    main: "左键",
    sub: "mouse1",
    showTarget: true,
    title: "左键",
    points: [
      [34, 14],
      [91, 14],
      [91, 128],
      [10, 128],
    ],
    radii: [16, 6, 4, 4],
  },
  {
    id: "mouse2",
    main: "右键",
    sub: "mouse2",
    showTarget: true,
    title: "右键",
    points: [
      [95, 14],
      [152, 14],
      [176, 128],
      [95, 128],
    ],
    radii: [6, 16, 4, 4],
  },

  // 滚轮槽（机身件，读作凹槽）
  {
    decorative: true,
    fill: "#0f1419",
    stroke: "rgba(255,255,255,0.05)",
    points: [
      [80, 18],
      [106, 18],
      [106, 114],
      [80, 114],
    ],
    radii: [12, 12, 12, 12],
  },

  // 滚轮三段：上滚 / 中键（滚轮按下）/ 下滚
  {
    id: "mwheelup",
    main: "▲",
    title: "滚轮上滚",
    points: [
      [83, 22],
      [103, 22],
      [103, 50],
      [83, 50],
    ],
    radii: [10, 10, 4, 4],
  },
  {
    id: "mouse3",
    main: "●",
    title: "滚轮按下（中键）",
    points: [
      [83, 52],
      [103, 52],
      [103, 80],
      [83, 80],
    ],
    radii: [4, 4, 4, 4],
  },
  {
    id: "mwheeldown",
    main: "▼",
    title: "滚轮下滚",
    points: [
      [83, 82],
      [103, 82],
      [103, 110],
      [83, 110],
    ],
    radii: [4, 4, 10, 10],
  },

  // 侧键：沿机身左弧倾斜
  {
    id: "mouse4",
    main: "4",
    title: "侧键 4",
    points: [
      [4, 152],
      [32, 152],
      [32, 184],
      [4, 184],
    ],
    radii: [7, 7, 7, 7],
    rotate: { deg: 7, cx: 18, cy: 168 },
  },
  {
    id: "mouse5",
    main: "5",
    title: "侧键 5",
    points: [
      [4, 194],
      [32, 194],
      [32, 226],
      [4, 226],
    ],
    radii: [7, 7, 7, 7],
    rotate: { deg: 7, cx: 18, cy: 210 },
  },

  // 掌托上的两个移动轴：配置里 mouse_x→yaw、mouse_y→pitch
  {
    id: "mouse_x",
    main: "↔",
    sub: "mouse_x",
    showTarget: true,
    title: "鼠标左右移动",
    points: [
      [30, 172],
      [92, 172],
      [92, 212],
      [30, 212],
    ],
    radii: [10, 10, 10, 10],
  },
  {
    id: "mouse_y",
    main: "↕",
    sub: "mouse_y",
    showTarget: true,
    title: "鼠标前后移动",
    points: [
      [96, 172],
      [158, 172],
      [158, 212],
      [96, 212],
    ],
    radii: [10, 10, 10, 10],
  },
];

/** 鼠标覆盖的全部 Source 键名。 */
export const MOUSE_KEY_IDS: string[] = MOUSE_PARTS.map((p) => p.id).filter(
  (id): id is string => Boolean(id),
);
