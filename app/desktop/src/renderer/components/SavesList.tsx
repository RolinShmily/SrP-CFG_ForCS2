import { useState, useEffect, useCallback } from "react";
import { FolderArchive, RotateCcw, HardDrive, Loader2, Trash2 } from "lucide-react";
import type { BackupEntry } from "../types";

interface Props {
  onRestore?: () => void;
}

export default function SavesList({ onRestore }: Props) {
  const [entries, setEntries] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const list = await window.api.getBackupEntries();
      setEntries(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleRestore = async (folderName: string) => {
    if (restoring || deleting) return;
    setRestoring(folderName);
    try {
      await window.api.restoreFromSave(folderName);
      onRestore?.();
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (folderName: string) => {
    if (deleting || restoring) return;
    setDeleting(folderName);
    try {
      await window.api.deleteBackup(folderName);
      await loadEntries();
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-text-muted">
        <Loader2 size={18} className="animate-spin mr-2" />
        <span className="text-sm">加载中...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-text-faint">
        <FolderArchive size={32} className="mb-2" />
        <p className="text-sm">暂无备份记录</p>
        <p className="text-xs mt-1">安装配置后可进行备份</p>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-secondary">备份列表</h3>
        <button
          onClick={loadEntries}
          className="text-xs text-text-faint hover:text-text-muted transition-colors cursor-pointer bg-transparent border-none"
        >
          刷新
        </button>
      </div>

      {entries.map((entry) => (
        <div
          key={entry.folderName}
          className="flex items-center justify-between px-3 py-2.5 bg-bg-card border border-border rounded-[var(--radius-sm)] hover:border-border-highlight transition-colors"
        >
          <div className="flex items-center gap-3">
            <HardDrive size={16} className="text-text-muted shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-text">
                  {entry.folderName === "latest" ? "最近备份" : entry.folderName}
                </span>
                {entry.folderName === "latest" && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded">
                    最新
                  </span>
                )}
              </div>
              <div className="text-xs text-text-faint mt-0.5">
                {formatDate(entry.timestamp)} · {entry.fileCount} 个文件
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleRestore(entry.folderName)}
              disabled={restoring !== null || deleting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-raised hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed text-text-secondary rounded-[var(--radius-sm)] transition-colors cursor-pointer border border-border"
            >
              {restoring === entry.folderName ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RotateCcw size={12} />
              )}
              恢复
            </button>
            <button
              onClick={() => handleDelete(entry.folderName)}
              disabled={restoring !== null || deleting !== null}
              title="删除"
              className="p-1.5 text-text-faint hover:text-red disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer bg-transparent border-none"
            >
              {deleting === entry.folderName ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
