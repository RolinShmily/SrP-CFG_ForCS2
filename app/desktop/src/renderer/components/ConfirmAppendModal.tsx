import { AlertTriangle, FileText, FolderOpen } from "lucide-react";
import { Modal } from "@srp-cfg/ui";

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

  return (
    <Modal
      open
      title="发现冲突文件"
      icon={<AlertTriangle size={18} />}
      onClose={onCancel}
      labelledBy="append-conflict-title"
      footer={
        <>
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
        </>
      }
    >
      <p id="append-conflict-description" className="ui-body">
        目标目录中存在 <span className="font-semibold text-accent">{totalConflicts}</span> 个同名文件/目录，
        追加安装将覆盖这些文件：
      </p>

      <div className="mt-4 space-y-3 max-h-48 overflow-y-auto">
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
    </Modal>
  );
}
