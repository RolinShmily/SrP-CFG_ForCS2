import { useState, useCallback, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { Upload, CheckCircle } from "lucide-react";

interface Props {
  onUploadComplete: () => void;
  disabled?: boolean;
}

export default function UploadZone({ onUploadComplete, disabled }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFiles = useCallback(
    async (filePaths: string[]) => {
      if (filePaths.length === 0 || uploading) return;
      setUploading(true);
      setUploadSuccess(false);
      try {
        const entry = await window.api.uploadFiles(filePaths);
        if (entry) {
          setUploadSuccess(true);
          onUploadComplete();
        }
      } finally {
        setUploading(false);
      }
    },
    [uploading, onUploadComplete],
  );

  // L2.2 遗留收尾：Tauri 拖拽由窗口层拦截（HTML5 drop 不触发），
  // 经 onDragDropEvent 获取真实文件/文件夹路径（含 tauri://drag-drop 事件）。
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let cancelled = false;
    getCurrentWebview()
      .onDragDropEvent((event) => {
        if (cancelled) return;
        if (event.payload.type === "enter" || event.payload.type === "over") {
          if (!disabled) setIsDragging(true);
        } else if (event.payload.type === "leave") {
          setIsDragging(false);
        } else if (event.payload.type === "drop") {
          setIsDragging(false);
          if (disabled) return;
          handleFiles(window.api.getFilePaths(event.payload.paths));
        }
      })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {
        // 非 Tauri 环境（如纯 vite dev 预览）下无拖拽事件，忽略
      });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [handleFiles, disabled]);

  // L2.2 遗留收尾：文件选择改用 @tauri-apps/plugin-dialog 原生对话框
  // （Tauri 下 File 对象无真实路径，无法走原 <input type="file"> 流程）。
  const handleClick = useCallback(async () => {
    if (disabled) return;
    const selected = await open({
      multiple: true,
      directory: false,
      filters: [{ name: "配置文件", extensions: ["zip", "cfg", "txt"] }],
    });
    if (!selected) return;
    const paths = (Array.isArray(selected) ? selected : [selected]).filter(
      (p): p is string => typeof p === "string",
    );
    handleFiles(window.api.getFilePaths(paths));
  }, [disabled, handleFiles]);

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-busy={uploading}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleClick();
          }
        }}
        className={`
          relative flex flex-col items-center justify-center gap-3 p-8
          border-2 border-dashed rounded-[var(--radius)] transition-all duration-200 cursor-pointer
          ${disabled
            ? "border-border bg-bg-card/50 opacity-50 cursor-not-allowed"
            : isDragging
              ? "border-accent bg-accent-bg scale-[1.01]"
              : "border-border-highlight bg-bg-card hover:border-accent/50 hover:bg-bg-hover"
          }
        `}
      >
        {uploading ? (
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
        ) : (
          <Upload size={32} className={isDragging ? "text-accent" : "text-text-muted"} />
        )}

        <div className="text-center">
          <p className="ui-body">
            {uploading ? "正在处理..." : "拖拽文件/文件夹到此处，或点击选择"}
          </p>
          <p className="ui-caption mt-1 text-text-faint">
            支持 .zip、.cfg、.txt 文件及文件夹
          </p>
        </div>
      </div>

      {uploadSuccess && (
        <div role="status" className="flex items-center gap-2 px-3 py-2 bg-green/5 border border-green/20 rounded-[var(--radius-sm)]">
          <CheckCircle size={14} className="text-green shrink-0" />
          <span className="text-xs text-green font-medium">上传成功</span>
        </div>
      )}
    </div>
  );
}
