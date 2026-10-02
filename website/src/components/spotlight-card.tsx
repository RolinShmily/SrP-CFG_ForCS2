"use client";

import React, { useRef, useState } from "react";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: "orange" | "blue" | "emerald";
  /** `raised` sits above sibling layers, `well` recedes into the band. */
  tone?: "base" | "raised" | "well";
}

/**
 * Opaque inner-layer panel.
 *
 * Follows the official CS2 layer model: panels are solid surfaces separated
 * from the band by a 1px hairline, never by a drop shadow. The cursor
 * spotlight is the only motion cue, and it is additive light rather than
 * elevation, so the panel keeps its flat, printed quality in both themes.
 */
export function SpotlightCard({
  children,
  className = "",
  glowColor = "orange",
  tone = "base",
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const glowStyles = {
    orange: "rgba(255, 158, 0, 0.13)",
    blue: "rgba(76, 147, 247, 0.13)",
    emerald: "rgba(16, 185, 129, 0.13)",
  };

  const hoverBorder = {
    orange: "hover:border-[#ff9e00]/55",
    blue: "hover:border-[#4c93f7]/55",
    emerald: "hover:border-[#10b981]/55",
  };

  const toneClass =
    tone === "raised" ? "cs2-inner-raised" : tone === "well" ? "cs2-inner-well" : "cs2-inner";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`group relative transition-[border-color,transform] duration-300 hover:-translate-y-0.5 overflow-hidden ${toneClass} ${hoverBorder[glowColor]} ${className}`}
      {...props}
    >
      {/* Cursor-following light. Additive, never a shadow. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(420px circle at ${position.x}px ${position.y}px, ${glowStyles[glowColor]}, transparent 68%)`,
        }}
      />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
