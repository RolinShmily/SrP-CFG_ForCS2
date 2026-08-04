import { useState, type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

interface CopyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 要复制的内容 */
  text: string;
  /** 复制成功后的提示文案 */
  copiedLabel?: string;
  defaultLabel?: string;
  /** 成功态高亮 */
  highlightOnCopied?: boolean;
  /** 颜色变体（default 为中性，accent/teal/red 用于命令操作按钮） */
  variant?: "default" | "accent" | "teal" | "red";
}

const variantClasses: Record<NonNullable<CopyButtonProps["variant"]>, string> = {
  default: "bg-bg border-border text-text-muted hover:border-accent-bg hover:text-accent",
  accent: "bg-accent-bg border-accent/35 text-accent hover:border-accent/60",
  teal: "bg-teal/5 border-teal/35 text-teal hover:border-teal/65",
  red: "bg-red/5 border-red/40 text-red hover:border-red/60",
};

/**
 * 复制按钮：点击复制 + “已复制”反馈（1.5s 复原）。
 * 源自 Desktop/Website 的 copyCommand 行为，React 化后供两端复用。
 */
export function CopyButton({
  text,
  copiedLabel = "已复制",
  defaultLabel = "复制",
  highlightOnCopied = true,
  variant = "default",
  className,
  onClick,
  children,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard 不可用时静默失败，不阻塞主流程
    }
  };

  // 成功态单独成组，避免与 variant 颜色在 CSS 中互相覆盖
  const colorClasses =
    copied && highlightOnCopied ? "border-green/30 bg-green/5 text-green" : variantClasses[variant];

  return (
    <button
      type="button"
      className={clsx(
        "flex items-center gap-1 rounded-[6px] border px-2.5 py-1 font-display text-xs font-semibold transition-colors cursor-pointer",
        colorClasses,
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {copied ? (
          <polyline points="20 6 9 17 4 12" />
        ) : (
          <>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </>
        )}
      </svg>
      <span>{copied ? copiedLabel : defaultLabel}</span>
      {children}
    </button>
  );
}
