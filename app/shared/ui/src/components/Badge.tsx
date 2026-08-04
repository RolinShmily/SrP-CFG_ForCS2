import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type BadgeVariant = "default" | "accent" | "green" | "red" | "teal";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  /** 是否描边样式 */
  outline?: boolean;
}

const variantClasses: Record<BadgeVariant, { text: string; border: string; bg: string }> = {
  default: { text: "text-text-faint", border: "border-border", bg: "bg-bg-raised" },
  accent: { text: "text-accent", border: "border-accent/20", bg: "bg-accent-bg" },
  green: { text: "text-green", border: "border-green/20", bg: "bg-green/10" },
  red: { text: "text-red", border: "border-red/20", bg: "bg-red/10" },
  teal: { text: "text-teal", border: "border-teal/20", bg: "bg-teal/10" },
};

/**
 * 小标签 / 徽章。源自 Desktop 安装包 flag 标签样式。
 */
export function Badge({
  children,
  variant = "default",
  outline = false,
  className,
  ...props
}: BadgeProps) {
  const v = variantClasses[variant];
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold",
        outline ? `${v.text} border ${v.border}` : `${v.text} ${v.bg}`,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
