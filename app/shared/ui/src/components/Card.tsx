import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** 悬停高亮边框 */
  hoverable?: boolean;
  /** 内边距尺寸 */
  padding?: "none" | "sm" | "md" | "lg";
}

const paddings: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

/**
 * 通用卡片容器：使用全局 design tokens（bg-bg-card / border-border）。
 * 两端（Desktop / Website）token 同名，值随应用主题自动适配。
 */
export function Card({
  children,
  hoverable = false,
  padding = "md",
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius)] border border-border bg-bg-card",
        paddings[padding],
        hoverable &&
          "transition-all duration-200 hover:border-border-highlight hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
