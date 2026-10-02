"use client";

import React from "react";
import { motion, type Variants } from "motion/react";

type Direction = "up" | "down" | "left" | "right" | "none";

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 64 },
  down: { x: 0, y: -64 },
  left: { x: 72, y: 0 },
  right: { x: -72, y: 0 },
  none: { x: 0, y: 0 },
};

/** Camera pitch applied on entry, removed at rest. Gives the page depth. */
const PITCH: Record<Direction, { rx: number; ry: number }> = {
  up: { rx: 9, ry: 0 },
  down: { rx: -9, ry: 0 },
  left: { rx: 0, ry: -7 },
  right: { rx: 0, ry: 7 },
  none: { rx: 0, ry: 0 },
};

const EASE = [0.16, 1, 0.3, 1] as const;

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Direction the element travels from while fading in. */
  direction?: Direction;
  /** Seconds of delay before the animation starts. */
  delay?: number;
  /** Seconds the tween runs for. */
  duration?: number;
  /** Fraction of the element that must be visible before triggering. */
  amount?: number;
  /** Replay the animation every time it leaves and re-enters the viewport. */
  repeat?: boolean;
  /** Adds scale + rotateX so the element rises out of depth. */
  depth?: boolean;
  as?: "div" | "section" | "li" | "span" | "header" | "article";
}

/**
 * Scroll-driven reveal with 3D depth.
 *
 * The page reads as a camera dollying through layered planes: content arrives
 * slightly pitched away from the viewer and settles flat, on a spring.
 * `perspective` is established by an ancestor `.cs2-scene` (or `depth` adds it
 * locally) so rotation is a real projection, not a 2D skew.
 *
 * Accessibility: every animated wrapper carries `data-reveal`, which the
 * `prefers-reduced-motion: reduce` block in `globals.css` pins to
 * `opacity: 1 / transform: none` with `!important`. Because that override is
 * pure CSS it lands before React hydrates, so reduced-motion users never see
 * hidden or displaced content and never see a tween.
 */
export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.9,
  amount = 0.2,
  repeat = false,
  depth = true,
  as = "div",
}: RevealProps) {
  const offset = OFFSET[direction];
  const pitch = PITCH[direction];
  const MotionTag = motion[as];

  return (
    <MotionTag
      data-reveal=""
      className={`${depth ? "cs2-3d" : ""} ${className ?? ""}`}
      initial={{
        opacity: 0,
        x: offset.x,
        y: offset.y,
        rotateX: depth ? pitch.rx : 0,
        rotateY: depth ? pitch.ry : 0,
        scale: depth ? 0.955 : 1,
        // Focus pull: content racks into sharpness instead of just fading in.
        filter: "blur(10px)",
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        filter: "blur(0px)",
      }}
      viewport={{ once: !repeat, amount }}
      transition={{
        duration,
        delay,
        ease: EASE,
        scale: { type: "spring", stiffness: 130, damping: 22, delay },
        filter: { duration: duration * 0.85, delay, ease: EASE },
      }}
    >
      {children}
    </MotionTag>
  );
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 56, rotateX: 8, scale: 0.94, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: EASE },
  },
};

interface RevealStaggerProps {
  children: React.ReactNode;
  className?: string;
  amount?: number;
}

/**
 * Parent that orchestrates a staggered reveal of its `<RevealItem>` children.
 * Owns the `perspective` so children can rotate in real 3D space.
 */
export function RevealStagger({ children, className, amount = 0.15 }: RevealStaggerProps) {
  return (
    <motion.div
      className={`cs2-scene ${className ?? ""}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  );
}

interface RevealItemProps {
  children: React.ReactNode;
  className?: string;
}

/** Child of `<RevealStagger>`; inherits the parent's stagger timing. */
export function RevealItem({ children, className }: RevealItemProps) {
  return (
    <motion.div data-reveal="" className={`cs2-3d ${className ?? ""}`} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
