import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** 操作按钮区 */
  action?: ReactNode;
}

/**
 * 空状态 / 无结果提示。
 */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      {icon && <div className="mb-1 text-text-faint">{icon}</div>}
      <p className="text-text-muted">{title}</p>
      {description && <p className="text-xs text-text-faint">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
