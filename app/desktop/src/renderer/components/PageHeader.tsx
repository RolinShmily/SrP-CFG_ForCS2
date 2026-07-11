import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  actions,
}: Props) {
  return (
    <header className="flex items-start justify-between gap-5 border-b border-border pb-4">
      <div className="min-w-0">
        {eyebrow && (
          <div className="ui-caption mb-1.5 flex items-center gap-2 font-mono text-accent">
            {icon}
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="ui-page-title">{title}</h1>
        {description && <p className="ui-page-description mt-1">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
