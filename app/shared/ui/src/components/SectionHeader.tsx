import type { ReactNode } from "react";
import { clsx } from "clsx";

interface SectionHeaderProps {
  label?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  /** 渲染的标题级别，默认 h2 */
  level?: "h1" | "h2" | "h3";
  index?: string;
}

/**
 * 区块标题头。合并了 Desktop PageHeader（eyebrow）与 Website SectionHeader（label/index/align）的能力。
 */
export function SectionHeader({
  label,
  title,
  description,
  align = "center",
  level = "h2",
  index,
}: SectionHeaderProps) {
  const Tag = level;
  return (
    <div
      className={clsx(
        "flex flex-col gap-2.5",
        align === "center" ? "items-center text-center" : "items-start text-left",
      )}
    >
      {(label || index) && (
        <div className="flex items-center gap-2 font-mono text-xs tracking-wide text-accent uppercase">
          {index && <span className="text-text-faint">{index}</span>}
          {label && <span>{label}</span>}
        </div>
      )}
      <Tag className="font-display text-2xl font-bold leading-8 text-text sm:text-3xl sm:leading-9">
        {title}
      </Tag>
      {description && (
        <p className="max-w-[72ch] text-sm leading-6 text-text-muted sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
