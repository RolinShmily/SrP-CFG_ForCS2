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
  cfg: "CFG 配置",
  annotations: "地图指南",
  video: "视频预设",
};

export default function ConfirmAppendModal({ conflicts, onConfirm, onCancel }: Props) {
  const totalConflicts = conflicts.reduce((sum, c) => sum + c.names.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-bg-card border border-border rounded-[var(--radius)] shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-accent" />
            <h2 className="font-display text-base font-semibold text-text">
              发现冲突文件
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-text-faint hover:text-text-muted transition-colors cursor-pointer bg-transparent border-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-text-secondary">
            目标目录中存在 <span className="font-semibold text-accent">{totalConflicts}</span> 个同名文件/目录，
            追加安装将覆盖这些文件：
          </p>

          <div className="space-y-3 max-h-48 overflow-y-auto">
            {conflicts.map((group) => (
              <div key={group.category} className="space-y-1.5">
                <div className="text-xs font-semibold text-text-muted">
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
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-bg-raised/50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-text-muted hover:text-text-secondary rounded-[var(--radius-sm)] transition-colors cursor-pointer bg-transparent border border-border hover:border-border-highlight"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-[var(--radius-sm)] transition-colors cursor-pointer border-none"
          >
            覆盖并继续
          </button>
        </div>
      </div>
    </div>
  );
}
