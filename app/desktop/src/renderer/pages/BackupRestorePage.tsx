import { FolderOpen } from "lucide-react";
import SavesList from "../components/SavesList";

export default function BackupRestorePage() {
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">备份与恢复</h1>

      {/* Backup & Restore */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-4">
        <h2 className="font-display text-sm font-semibold text-text-secondary">
          备份记录
        </h2>
        <SavesList />
      </div>

      {/* Open Backup Folder */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-3">
        <h2 className="font-display text-sm font-semibold text-text-secondary">
          备份文件位置
        </h2>
        <p className="text-sm text-text-muted">
          打开备份文件所在目录，查看和管理所有备份存档。
        </p>
        <button
          onClick={() => window.api.openBackupFolder()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-sm)] font-display font-semibold text-sm transition-all cursor-pointer border border-border bg-transparent text-text-secondary hover:border-border-highlight hover:text-text"
        >
          <FolderOpen size={16} />
          打开备份文件夹
        </button>
      </div>
    </div>
  );
}
