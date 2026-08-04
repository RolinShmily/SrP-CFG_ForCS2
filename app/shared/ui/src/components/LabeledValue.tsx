import type { ReactNode } from "react";

interface LabeledValueProps {
  label: string;
  value: ReactNode;
  /** value 为空时的占位文本 */
  placeholder?: string;
  /** 小图标（可选） */
  icon?: ReactNode;
  /** label 列宽（Tailwind 类） */
  labelWidth?: string;
}

/**
 * 标签 + 值 行。源自 Desktop 的 PathRow，泛化后供两端使用。
 */
export function LabeledValue({
  label,
  value,
  placeholder = "未设置",
  icon,
  labelWidth = "w-32",
}: LabeledValueProps) {
  return (
    <div className="flex items-start gap-3">
      {icon && <span className="shrink-0 text-text-faint">{icon}</span>}
      <span className={`shrink-0 text-xs leading-[1.125rem] text-text-muted ${labelWidth}`}>
        {label}
      </span>
      <span
        className={
          value
            ? "min-w-0 break-all font-mono text-xs text-text-secondary"
            : "min-w-0 break-all font-mono text-xs text-text-faint"
        }
      >
        {value ?? placeholder}
      </span>
    </div>
  );
}
