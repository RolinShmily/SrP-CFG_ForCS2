/**
 * MouseCanvas —— 俯视实体鼠标，接管原数字小键盘的位置。
 *
 * 与键盘键帽共用同一套材质语言（layer-colors.ts + 下沿实体边），但用 SVG 绘制，
 * 因为鼠标的形状是带逐角半径的梯形 / 弧形机身，CSS 圆角盒模型表达不了。
 *
 * 立体感做法与键帽一一对应：
 *   顶面 = 路径填充 + 共用竖向明暗渐变（objectBoundingBox，一份渐变适配任意形状）
 *   下沿 = 同路径向下平移 MOUSE_DEPTH 的实体色
 *   落影 = 再下移并高斯模糊的黑色路径
 *
 * 键位分三档信息密度（形状越大写得越多）：
 *   主键 / 掌托轴标 = 中文名 + Source 键名 + 生效目标
 *   侧键            = 编号 4 / 5（细节看悬停与详情面板）
 *   滚轮三段        = ▲ ● ▼
 */
import type { MouseEvent, KeyboardEvent } from "react";
import type { EffectiveKey } from "./keymaps-data";
import { layerMaterial, NEUTRAL_KEY, type KeyMaterial } from "./layer-colors";
import {
  centroid,
  MOUSE_CROP,
  MOUSE_DEPTH,
  MOUSE_PARTS,
  MOUSE_VIEW,
  roundedPolygon,
  type MousePart,
} from "./mouse-layout";

interface MouseCanvasProps {
  effective: Map<string, EffectiveKey>;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

export function MouseCanvas({ effective, selectedKey, onSelect }: MouseCanvasProps) {
  const renderPart = (part: MousePart, index: number) => {
    const d = roundedPolygon(part.points, part.radii);
    const [cx, cy] = centroid(part.points);
    const id = part.id;

    const hit = id ? effective.get(id) : undefined;
    const op = hit?.active?.entry.op;
    const layer = hit?.active?.layer.id;
    const layerMat = layer ? layerMaterial(layer) : NEUTRAL_KEY;

    // 与键帽同语义：生效=该层颜色填充；被解绑=中性填充+该层描边；未绑定=中性
    let material: KeyMaterial = NEUTRAL_KEY;
    if (op === "bind" && layer) material = layerMat;
    else if (op === "unbind" && layer) {
      material = { ...NEUTRAL_KEY, border: layerMat.border, fg: layerMat.fg };
    }

    const selected = Boolean(id) && selectedKey === id;
    const target = op === "bind" ? hit?.active?.entry.target : undefined;

    const transform = part.rotate
      ? `rotate(${part.rotate.deg} ${part.rotate.cx} ${part.rotate.cy})`
      : undefined;

    // 标注纵向排布：有大目标就三行，否则两行 / 一行
    const rows = part.sub ? (part.showTarget ? 3 : 2) : 1;
    const lineY = (i: number) => cy + (i - (rows - 1) / 2) * 13;

    const handleKey = (e: KeyboardEvent<SVGGElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (id) onSelect(id);
      }
    };
    const handleClick = (e: MouseEvent<SVGGElement>) => {
      e.stopPropagation();
      if (id) onSelect(id);
    };

    const interactive = !part.decorative && Boolean(id);

    return (
      <g
        key={part.id ?? `deco-${index}`}
        transform={transform}
        onClick={interactive ? handleClick : undefined}
        onKeyDown={interactive ? handleKey : undefined}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        className={interactive ? "cursor-pointer outline-none" : undefined}
      >
        {part.title && <title>{part.title}</title>}

        {/* 落影 */}
        <path
          d={d}
          transform={`translate(0 ${MOUSE_DEPTH + 2})`}
          fill="#000"
          opacity={part.decorative ? 0.35 : 0.5}
          filter="url(#mouse-blur)"
        />
        {/* 下沿实体边 */}
        <path
          d={d}
          transform={`translate(0 ${MOUSE_DEPTH})`}
          fill={part.decorative ? "#0a0d11" : material.edge}
        />
        {/* 顶面 */}
        <path
          d={d}
          fill={part.decorative ? (part.fill ?? "#141a20") : material.faceTop}
          stroke={
            part.decorative ? (part.stroke ?? "rgba(255,255,255,0.05)") : material.border
          }
          strokeWidth={1}
        />
        {/* 共用的上亮下暗 */}
        <path d={d} fill="url(#mouse-shade)" pointerEvents="none" />

        {selected && (
          <path d={d} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={2} />
        )}

        {/* 标注 */}
        {!part.decorative && (
          <g pointerEvents="none" textAnchor="middle" dominantBaseline="middle">
            {part.main && (
              <text
                x={cx}
                y={lineY(rows === 1 ? 0 : 0)}
                fontSize={part.sub ? 12 : 11}
                fill={material.fg}
                fontWeight={part.sub ? 600 : 400}
              >
                {part.main}
              </text>
            )}
            {part.sub && (
              <text
                x={cx}
                y={lineY(1)}
                fontSize={8}
                fill={material.fg}
                opacity={0.72}
                className="font-mono"
              >
                {part.sub}
              </text>
            )}
            {part.showTarget && (
              <text
                x={cx}
                y={lineY(2)}
                fontSize={9}
                fill={op === "bind" ? material.fg : "#6b7480"}
                opacity={op === "bind" ? 0.95 : 1}
                className="font-mono"
              >
                {target ?? (op === "unbind" ? "unbind" : "未绑定")}
              </text>
            )}
          </g>
        )}
      </g>
    );
  };

  // 裁掉上下留白后等比放大，使鼠标与键盘 6 行同高
  const scale = MOUSE_VIEW.h / MOUSE_CROP.h;

  return (
    <svg
      width={MOUSE_VIEW.w * scale}
      height={MOUSE_VIEW.h}
      viewBox={`0 ${MOUSE_CROP.y} ${MOUSE_VIEW.w} ${MOUSE_CROP.h}`}
      role="group"
      aria-label="鼠标按键"
      className="shrink-0"
      style={{ filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.45))" }}
    >
      <defs>
        {/* 一份竖向明暗，靠 objectBoundingBox 适配任意形状 */}
        <linearGradient id="mouse-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.34" />
        </linearGradient>
        <filter id="mouse-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {MOUSE_PARTS.map(renderPart)}
    </svg>
  );
}
