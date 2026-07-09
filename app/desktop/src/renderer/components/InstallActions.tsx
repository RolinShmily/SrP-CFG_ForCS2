import { useState } from "react";
import { Layers, Plus, Loader2, Folder } from "lucide-react";
import type { InstallMode, InstallResult, AppendConflictResult } from "../types";
import ConfirmAppendModal from "./ConfirmAppendModal";

interface Props {
  hasSource: boolean;
  selectedDownload: string | null;
  selectedUpload: string | null;
  onInstallComplete?: () => void;
}

function isConflictResult(r: InstallResult | AppendConflictResult): r is AppendConflictResult {
  return typeof r === "object" && r !== null && "needsConfirm" in r;
}

export default function InstallActions({ hasSource, selectedDownload, selectedUpload, onInstallComplete }: Props) {
  const [installing, setInstalling] = useState(false);
  const [conflictData, setConflictData] = useState<AppendConflictResult | null>(null);
  const [usePersonalCfg, setUsePersonalCfg] = useState(true);

  const handleInstall = async (mode: InstallMode) => {
    if (installing || !hasSource) return;
    setInstalling(true);
    try {
      let result: InstallResult | AppendConflictResult;
      if (selectedDownload) {
        result = await window.api.installFromDownload(selectedDownload, mode, usePersonalCfg);
      } else {
        result = await window.api.installFromUpload(selectedUpload!, mode, usePersonalCfg);
      }

      if (isConflictResult(result) && result.needsConfirm) {
        setConflictData(result);
        return;
      }

      onInstallComplete?.();
    } finally {
      setInstalling(false);
    }
  };

  const handleConfirmAppend = async (proceed: boolean) => {
    const folderName = selectedDownload || selectedUpload;
    const source = selectedDownload ? "download" : "upload";
    setConflictData(null);
    setInstalling(true);
    try {
      await window.api.confirmAppend(folderName!, source, proceed, usePersonalCfg);
      onInstallComplete?.();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {/* CFG Install Target Toggle */}
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <span className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
            <Folder size={14} />
            CFG 安装目标
          </span>
          <div className="flex rounded-[var(--radius-sm)] overflow-hidden border border-border">
            <button
              onClick={() => setUsePersonalCfg(false)}
              disabled={installing}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-none ${
                !usePersonalCfg
                  ? "bg-accent text-white"
                  : "bg-bg-raised text-text-muted hover:text-text"
              }`}
            >
              游戏 CFG
            </button>
            <button
              onClick={() => setUsePersonalCfg(true)}
              disabled={installing}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-none ${
                usePersonalCfg
                  ? "bg-accent text-white"
                  : "bg-bg-raised text-text-muted hover:text-text"
              }`}
            >
              用户 CFG
            </button>
          </div>
          <span className="text-xs text-text-faint">
            {usePersonalCfg
              ? "配置安装到 userdata 用户 CFG 文件夹，局内修改不会被覆盖"
              : "配置安装到 csgo 游戏 CFG 文件夹，局内修改会随游戏重置而丢失"}
          </span>
        </div>

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
        <div className="grid grid-cols-2 gap-3 text-xs text-text-faint">
          <div className="px-2 py-1.5 bg-bg-card rounded-[var(--radius-sm)]">
            清空暂存区，替换为选中的文件，部署到{usePersonalCfg ? "用户" : "游戏"}目录
          </div>
          <div className="px-2 py-1.5 bg-bg-card rounded-[var(--radius-sm)]">
            保留已有文件，合并选中的文件，部署到{usePersonalCfg ? "用户" : "游戏"}目录
          </div>
        </div>
      </div>

      {conflictData && (
        <ConfirmAppendModal
          conflicts={conflictData.conflicts}
          onConfirm={() => handleConfirmAppend(true)}
          onCancel={() => handleConfirmAppend(false)}
        />
      )}
    </>
  );
}
