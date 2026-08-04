import { useEffect, type ReactNode } from "react";
import { clsx } from "clsx";

interface ModalProps {
  open: boolean;
  title?: string;
  /** 标题左侧图标 */
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** 底部操作区 */
  footer?: ReactNode;
  /** 面板最大宽度（Tailwind 类） */
  maxWidth?: string;
  /** 内容区可滚动（面板限高，用于长内容弹窗） */
  scrollable?: boolean;
  /** 面板最大高度（Tailwind 类，scrollable 时生效） */
  maxHeight?: string;
  labelledBy?: string;
}

/**
 * 通用模态框。源自 Desktop ConfirmAppendModal / UpdateModal 的公共结构：
 * 遮罩 + 居中面板 + 标题栏（关闭按钮）+ 内容 + 底部操作区。
 * Esc 关闭、遮罩点击关闭、focus-visible 样式内置。
 */
export function Modal({
  open,
  title,
  icon,
  onClose,
  children,
  footer,
  maxWidth = "max-w-md",
  scrollable = false,
  maxHeight = "max-h-[80vh]",
  labelledBy,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={clsx(
          "relative mx-4 w-full overflow-hidden rounded-[var(--radius)] border border-border bg-bg-card shadow-2xl",
          maxWidth,
          scrollable && `flex flex-col ${maxHeight}`,
        )}
      >
        {(title || icon) && (
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              {icon && <span className="text-accent">{icon}</span>}
              <h2 id={labelledBy} className="font-display text-base font-semibold leading-6 text-text">
                {title}
              </h2>
            </div>
            <button
              type="button"
              autoFocus
              aria-label="关闭"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center border-none bg-transparent text-text-faint transition-colors hover:bg-bg-hover hover:text-text"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className={clsx("px-5 py-4", scrollable && "flex-1 overflow-y-auto")}>
          {children}
        </div>
        {footer && (
          <div
            className={clsx(
              "flex flex-wrap items-center justify-end gap-3 border-t border-border bg-bg-raised/50 px-5 py-4",
              scrollable && "shrink-0",
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
