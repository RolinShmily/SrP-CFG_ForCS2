import React, { useEffect, useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { Copy, Save, FileCode, Check } from "lucide-react";
import { cs2CfgLanguage } from "../lib/cs2-cfg-lang";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onSave?: () => void;
  title?: string;
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
  height?: string;
  placeholder?: string;
  isSaved?: boolean;
  actions?: React.ReactNode;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  onSave,
  title = "脚本编辑器",
  readOnly = false,
  minHeight = "360px",
  maxHeight,
  height = "100%",
  placeholder = "// 在此编写或修改脚本...",
  isSaved = true,
  actions,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (onSave && !readOnly) {
          onSave();
        }
      }
    },
    [onSave, readOnly]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // 解析展示用的文件名与父级路径
  const { fileName, dirPath } = useMemo(() => {
    if (!title) return { fileName: "脚本编辑器", dirPath: "" };
    const normalized = title.replace(/\\/g, "/");
    const lastSlash = normalized.lastIndexOf("/");
    if (lastSlash === -1) {
      return { fileName: title, dirPath: "" };
    }
    return {
      fileName: normalized.substring(lastSlash + 1),
      dirPath: normalized.substring(0, lastSlash + 1),
    };
  }, [title]);

  return (
    <div className="flex flex-col h-full border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900/90 shadow-lg">
      {/* 顶部工具条 */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-950 border-b border-neutral-800 text-xs min-h-[42px]">
        {/* 左侧路径与保存状态 */}
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-3 overflow-hidden">
          <FileCode className="w-4 h-4 text-orange-400 shrink-0" />
          
          <div className="flex items-center gap-1.5 min-w-0 truncate" title={title}>
            <span className="font-mono font-semibold text-neutral-200 text-xs truncate">
              {fileName}
            </span>
            {dirPath && (
              <span className="font-mono text-neutral-500 text-[11px] truncate hidden md:inline">
                ({dirPath})
              </span>
            )}
          </div>

          {!readOnly && (
            <span
              className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium flex items-center gap-1 select-none whitespace-nowrap ${
                isSaved
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSaved ? "bg-emerald-400" : "bg-amber-400 animate-ping"
                }`}
              />
              <span>{isSaved ? "已保存" : "未保存 (Ctrl+S)"}</span>
            </span>
          )}

          {readOnly && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-neutral-800 text-neutral-400 border border-neutral-700 whitespace-nowrap">
              只读模式
            </span>
          )}
        </div>

        {/* 右侧操作按钮组 */}
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          {actions}

          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/70 rounded-md text-xs font-medium transition whitespace-nowrap select-none"
            title="复制全部代码"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>复制</span>
              </>
            )}
          </button>

          {!readOnly && onSave && (
            <button
              type="button"
              onClick={onSave}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition whitespace-nowrap select-none ${
                isSaved
                  ? "bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 border border-neutral-700/50"
                  : "bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-sm shadow-orange-950/40 border border-orange-500/50"
              }`}
              title="保存修改 (Ctrl+S)"
            >
              <Save className={`w-3.5 h-3.5 ${isSaved ? "text-neutral-500" : "text-white"}`} />
              <span>保存</span>
            </button>
          )}
        </div>
      </div>

      {/* CodeMirror 容器 */}
      <div className="flex-1 overflow-auto text-sm font-mono leading-relaxed bg-[#282c34]">
        <CodeMirror
          value={value}
          height={height}
          minHeight={minHeight}
          maxHeight={maxHeight}
          theme={oneDark}
          extensions={[cs2CfgLanguage]}
          editable={!readOnly}
          placeholder={placeholder}
          onChange={(val) => {
            if (onChange && !readOnly) {
              onChange(val);
            }
          }}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: false,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </div>
    </div>
  );
};
