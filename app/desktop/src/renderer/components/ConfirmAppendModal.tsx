import { useEffect } from "react";
import { AlertTriangle, FileText, FolderOpen, X } from "lucide-react";

interface ConflictGroup {
  category: string;
  names: string[];
}

interface Props {
  conflicts: ConflictGroup[];
  onConfirm: () => void;
  onCancel: () => void;
}

const categoryLabels: Record<string, string> = {
  gameCfg: "游戏 CFG",
  userCfg: "账号 CFG（实验性）",
  annotations: "地图指南",
  video: "视频预设",
};

export default function ConfirmAppendModal({ conflicts, onConfirm, onCancel }: Props) {
  const totalConflicts = conflicts.reduce((sum, c) => sum + c.names.length, 0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="append-conflict-title"
        aria-describedby="append-conflict-description"
        className="relative mx-4 w-full max-w-md overflow-hidden rounded-[var(--radius)] border border-border bg-bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-accent" />
            <h2 id="append-conflict-title" className="ui-section-title">
              发现冲突文件
            </h2>
          </div>
          <button
            type="button"
            autoFocus
            aria-label="关闭冲突提示"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center border-none bg-transparent text-text-faint transition-colors hover:bg-bg-hover hover:text-text"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <p id="append-conflict-description" className="ui-body">
            目标目录中存在 <span className="font-semibold text-accent">{totalConflicts}</span> 个同名文件/目录，
            追加安装将覆盖这些文件：
          </p>

          <div className="space-y-3 max-h-48 overflow-y-auto">
            {conflicts.map((group) => (
              <div key={group.category} className="space-y-1.5">
                <div className="ui-caption font-semibold">
                  {categoryLabels[group.category] ?? group.category}
                </div>
                {group.names.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 px-3 py-1.5 bg-bg-raised border border-border rounded-[var(--radius-sm)] text-xs font-mono text-text"
                  >
                    {name.endsWith("/") ? (
                      <FolderOpen size={12} className="text-text-faint shrink-0" />
                    ) : (
                      <FileText size={12} className="text-text-faint shrink-0" />
                    )}
                    <span className="truncate">{name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-bg-raised/50 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-9 rounded-[var(--radius-sm)] border border-border bg-transparent px-4 text-sm text-text-muted transition-colors hover:border-border-highlight hover:text-text-secondary"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-9 rounded-[var(--radius-sm)] border-none bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent/90"
          >
            覆盖并继续
          </button>
        </div>
      </div>
    </div>
  );
}
