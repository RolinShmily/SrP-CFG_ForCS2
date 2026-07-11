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
  const [installingMode, setInstallingMode] = useState<InstallMode | null>(null);
  const [conflictData, setConflictData] = useState<AppendConflictResult | null>(null);
  const [usePersonalCfg, setUsePersonalCfg] = useState(false);
  const installing = installingMode !== null;

  const handleInstall = async (mode: InstallMode) => {
    if (installing || !hasSource) return;
    setInstallingMode(mode);
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
      setInstallingMode(null);
    }
  };

  const handleConfirmAppend = async (proceed: boolean) => {
    const folderName = selectedDownload || selectedUpload;
    const source = selectedDownload ? "download" : "upload";
    setConflictData(null);
    setInstallingMode("append");
    try {
      await window.api.confirmAppend(folderName!, source, proceed, usePersonalCfg);
      onInstallComplete?.();
    } finally {
      setInstallingMode(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {/* CFG Install Target Toggle */}
        <fieldset className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
          <legend className="sr-only">CFG 安装目标</legend>
          <span className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
            <Folder size={14} />
            CFG 安装目标
          </span>
          <div className="flex rounded-[var(--radius-sm)] overflow-hidden border border-border">
            <button
              type="button"
              aria-pressed={!usePersonalCfg}
              onClick={() => setUsePersonalCfg(false)}
              disabled={installing}
              className={`min-h-8 border-none px-3 text-xs font-medium transition-colors ${
                !usePersonalCfg
                  ? "bg-accent text-white"
                  : "bg-bg-raised text-text-muted hover:text-text"
              }`}
            >
              游戏目录（推荐）
            </button>
            <button
              type="button"
              aria-pressed={usePersonalCfg}
              onClick={() => setUsePersonalCfg(true)}
              disabled={installing}
              className={`min-h-8 border-none px-3 text-xs font-medium transition-colors ${
                usePersonalCfg
                  ? "bg-accent text-white"
                  : "bg-bg-raised text-text-muted hover:text-text"
              }`}
            >
              账号目录（实验性）
            </button>
          </div>
          <span className="min-w-[16rem] flex-1 text-xs text-text-faint">
            {usePersonalCfg
              ? "实验性账号 CFG 目标；不保证 exec 搜索优先级，也不会阻止设置进入 VCFG/Steam Cloud"
              : "脚本安装到 game/csgo/cfg；个人 custom.cfg 会在后续模板操作中保留"}
          </span>
        </fieldset>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <button
            type="button"
            onClick={() => handleInstall("overlay")}
            disabled={!hasSource || installing}
            className="flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius)] border-none bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {installingMode === "overlay" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Layers size={16} />
            )}
            覆盖安装
          </button>

          <button
            type="button"
            onClick={() => handleInstall("append")}
            disabled={!hasSource || installing}
            className="flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius)] border border-accent/30 bg-accent/20 px-4 text-sm font-medium text-accent transition-colors hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {installingMode === "append" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            追加安装
          </button>
        </div>

        {/* Mode descriptions */}
        <div className="grid grid-cols-1 gap-3 text-xs text-text-faint xl:grid-cols-2">
          <div className="rounded-[var(--radius-sm)] bg-bg-card px-2 py-1.5">
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
