import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type BadgeVariant = "default" | "accent" | "green" | "red" | "teal";
type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  /** 是否描边样式 */
  outline?: boolean;
  /** 尺寸：sm（text-[10px]，默认）| md（text-xs） */
  size?: BadgeSize;
}

const variantClasses: Record<BadgeVariant, { text: string; border: string; bg: string }> = {
  default: { text: "text-text-faint", border: "border-border", bg: "bg-bg-raised" },
  accent: { text: "text-accent", border: "border-accent/20", bg: "bg-accent-bg" },
  green: { text: "text-green", border: "border-green/20", bg: "bg-green/10" },
  red: { text: "text-red", border: "border-red/20", bg: "bg-red/10" },
  teal: { text: "text-teal", border: "border-teal/20", bg: "bg-teal/10" },
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
};

/**
 * 小标签 / 徽章。源自 Desktop 安装包 flag 标签样式。
 */
export function Badge({
  children,
  variant = "default",
  outline = false,
  size = "sm",
  className,
  ...props
}: BadgeProps) {
  const v = variantClasses[variant];
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded font-mono font-semibold",
        sizeClasses[size],
        outline ? `${v.text} border ${v.border}` : `${v.text} ${v.bg}`,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
