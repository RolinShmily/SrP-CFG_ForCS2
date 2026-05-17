import { useState } from "react";
import { Layers, Plus, Loader2 } from "lucide-react";
import type { InstallMode, InstallResult } from "../types";

interface Props {
  hasSource: boolean;
  selectedDownload: string | null;
  selectedUpload: string | null;
  onInstallComplete?: (result: InstallResult) => void;
}

export default function InstallActions({
  hasSource,
  selectedDownload,
  selectedUpload,
  onInstallComplete,
}: Props) {
  const [installing, setInstalling] = useState(false);

  const handleInstall = async (mode: InstallMode) => {
    if (installing || !hasSource) return;
    setInstalling(true);
    try {
      let result: InstallResult;
      if (selectedDownload) {
        result = await window.api.installFromDownload(selectedDownload, mode);
      } else {
        result = await window.api.installFromUpload(selectedUpload!, mode);
      }
      onInstallComplete?.(result);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleInstall("overlay")}
          disabled={!hasSource || installing}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-[var(--radius)] font-medium text-sm transition-colors cursor-pointer border-none"
        >
          {installing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Layers size={16} />
          )}
          覆盖安装
        </button>

        <button
          onClick={() => handleInstall("append")}
          disabled={!hasSource || installing}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-accent/20 hover:bg-accent/30 disabled:opacity-40 disabled:cursor-not-allowed text-accent rounded-[var(--radius)] font-medium text-sm transition-colors cursor-pointer border border-accent/30"
        >
          {installing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          追加安装
        </button>
      </div>

      {/* Mode descriptions */}
      <div className="grid grid-cols-2 gap-3 text-[11px] text-text-faint">
        <div className="px-2 py-1.5 bg-bg-card rounded-[var(--radius-sm)]">
          清空暂存区，替换为选中的文件，创建符号链接
        </div>
        <div className="px-2 py-1.5 bg-bg-card rounded-[var(--radius-sm)]">
          保留已有文件，合并选中的文件，重新创建符号链接
        </div>
      </div>
    </div>
  );
}
