"use client";

import React from "react";
import { MotionConfig } from "motion/react";

/**
 * Global motion policy.
 *
 * `reducedMotion="user"` makes every Motion component in the tree honour the
 * OS-level `prefers-reduced-motion` setting: transform and layout tweens are
 * stripped, opacity fades are kept. Handling it here (once, at the root)
 * avoids per-component media-query branching and therefore any hydration
 * mismatch between the server and the client.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
