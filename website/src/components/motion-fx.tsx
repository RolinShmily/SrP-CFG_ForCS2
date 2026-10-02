"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

/**
 * Scroll-linked camera pitch.
 * *
 * The element is pitched away from the viewer as it enters from the bottom,
 * flattens as it crosses the middle of the viewport, and tips slightly away
 * again as it leaves the top. This is what turns a scrolling column into a
 * dolly move instead of a stack of flat panels.
 *
 * Transform-only (no layout), driven by motion values, so no React re-renders
 * happen during scroll. `prefers-reduced-motion` zeroes `.cs2-3d` in CSS.
 */
export function ScrollTilt({
  children,
  className,
  /** Peak pitch, in degrees, while the element sits at the viewport edges. */
  maxPitch = 11,
  /** Depth scale at the viewport edges. */
  minScale = 0.95,
  /** How far the element drifts vertically across its scroll range, in px. */
  drift = 40,
}: {
  children: React.ReactNode;
  className?: string;
  maxPitch?: number;
  minScale?: number;
  drift?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    restDelta: 0.0005,
  });

  // 0 = entering from below, 0.5 = centred, 1 = leaving past the top.
  const rotateX = useTransform(
    smooth,
    [0, 0.35, 0.5, 0.65, 1],
    [maxPitch, maxPitch * 0.25, 0, -maxPitch * 0.2, -maxPitch * 0.55]
  );
  const scale = useTransform(smooth, [0, 0.5, 1], [minScale, 1, minScale * 0.985]);
  const y = useTransform(smooth, [0, 1], [drift, -drift]);

  return (
    <div ref={ref} className={`cs2-scene ${className ?? ""}`}>
      <motion.div className="cs2-3d" style={{ rotateX, scale, y }}>
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Pointer-driven 3D tilt.
 *
 * Rotation is a function of the cursor's position inside the card, resolved
 * entirely through motion values (`useMotionValue` + `useTransform` +
 * `useSpring`), so pointer movement never re-renders React.
 *
 */
export function TiltCard({
  children,
  className,
  /** Maximum rotation away from the resting plane, in degrees. */
  intensity = 7,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const spring = { stiffness: 160, damping: 20, mass: 0.6 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);

  const rotateY = useTransform(sx, [0, 1], [-intensity, intensity]);
  const rotateX = useTransform(sy, [0, 1], [intensity, -intensity]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div
      ref={ref}
      className={`cs2-scene ${className ?? ""}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
    >
      <motion.div className="cs2-tilt h-full" style={{ rotateX, rotateY }}>
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Depth parallax for background artwork layers.
 *
 * Moves a decorative layer at a different rate than the page, which reads as
 * the layer sitting further from the camera. Purely additive decoration.
 */
export function Parallax({
  children,
  className,
  distance = 90,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  return (
    <div ref={ref} className={className}>
      <motion.div className="cs2-3d" style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}
