import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import {
  Package,
  Trash2,
  FolderOpen,
  Loader2,
  FileText,
  Check,
} from "lucide-react";
import type { UploadedEntry } from "../types";

interface Props {
  selectedFolder: string | null;
  onSelect: (folderName: string | null) => void;
}

export interface UploadedListHandle {
  reload: () => void;
}

const UploadedList = forwardRef<UploadedListHandle, Props>(function UploadedList(
  { selectedFolder, onSelect },
  ref,
) {
  const [entries, setEntries] = useState<UploadedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const list = await window.api.getUploadedEntries();
      setEntries(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useImperativeHandle(ref, () => ({ reload: loadEntries }), [loadEntries]);

  const handleDelete = async (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;
    setDeleting(folderName);
    try {
      await window.api.deleteUploadEntry(folderName);
      if (selectedFolder === folderName) onSelect(null);
      await loadEntries();
    } finally {
      setDeleting(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-text-muted">
        <Loader2 size={16} className="animate-spin mr-2" />
        <span className="text-xs">加载中...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-text-faint">
        <Package size={28} className="mb-2" />
        <p className="text-xs">暂无已上传的配置文件</p>
        <p className="text-xs mt-0.5">上传 .zip / .cfg / .txt 文件即可在此管理</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-muted">
          共 {entries.length} 项
        </span>
        <button
          type="button"
          onClick={() => window.api.openUploadsFolder()}
          className="flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-transparent px-2.5 text-xs text-text-muted transition-colors hover:bg-accent-bg hover:text-accent"
        >
          <FolderOpen size={13} />
          打开目录
        </button>
      </div>

      {entries.map((entry) => {
        const isSelected = selectedFolder === entry.folderName;
        return (
          <div
            key={entry.folderName}
            className={`flex items-stretch rounded-[var(--radius-sm)] border transition-colors ${
              isSelected
                ? "border-accent/30 bg-accent-bg"
                : "border-border bg-bg-raised hover:border-border-highlight"
            }`}
          >
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(isSelected ? null : entry.folderName)}
              className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
            >
                {isSelected ? (
                  <Check size={16} className="text-accent shrink-0" />
                ) : entry.isZip ? (
                  <Package size={16} className="text-text-muted shrink-0" />
                ) : (
                  <FileText size={16} className="text-text-muted shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="truncate font-mono text-sm text-text">
                    {entry.displayName}
                  </div>
                  <div className="text-xs text-text-faint">
                    {formatSize(entry.size)} · {formatDate(entry.timestamp)}
                  </div>
                </div>
            </button>

            <button
              type="button"
              aria-label={`删除 ${entry.displayName}`}
              onClick={(e) => handleDelete(entry.folderName, e)}
              disabled={deleting !== null}
              title="删除"
              className="m-1.5 flex h-8 w-8 shrink-0 items-center justify-center border-none bg-transparent text-text-faint transition-colors hover:bg-red/10 hover:text-red disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting === entry.folderName ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
});

export default UploadedList;
