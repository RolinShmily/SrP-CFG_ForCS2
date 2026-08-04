import type { HTMLAttributes } from "react";
import { clsx } from "clsx";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** 高度（Tailwind 类，如 h-40） */
  height?: string;
}

/**
 * 加载占位骨架。源自 Desktop/Website 的 animate-pulse 卡片占位。
 */
export function Skeleton({ height = "h-24", className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "animate-pulse rounded-xl border border-border bg-bg-raised/60",
        height,
        className,
      )}
      {...props}
    />
  );
}
