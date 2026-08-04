import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

/**
 * 页面级标题头。源自 Desktop 的 PageHeader，
 * 样式用 Tailwind token 类替代了原 .ui-* 自定义类，两端通用。
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-5 border-b border-border pb-4">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1.5 flex items-center gap-2 font-mono text-xs leading-[1.125rem] text-accent">
            {icon}
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="font-display text-2xl font-bold leading-8 text-text">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-[72ch] text-sm leading-[1.375rem] text-text-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
