import { useRef, useEffect, useState, useCallback } from "react";
import { Terminal, Trash2, PanelRightClose, PanelRightOpen } from "lucide-react";
import type { LogEntry, LogCategory, LogLevel } from "../types";

const CATEGORY_COLORS: Record<LogCategory, string> = {
  "path-detection": "text-teal",
  "steam-status": "text-accent",
  "file-ops": "text-blue",
  install: "text-green",
  backup: "text-purple",
  symlink: "text-cyan",
};

const CATEGORY_LABELS: Record<LogCategory, string> = {
  "path-detection": "路径",
  "steam-status": "Steam",
  "file-ops": "文件",
  install: "安装",
  backup: "备份",
  symlink: "链接",
};

const LEVEL_STYLES: Record<LogLevel, string> = {
  info: "text-text-secondary",
  success: "text-green",
  warning: "text-accent-light",
  error: "text-red font-semibold",
  progress: "text-text-muted italic",
};

const MIN_WIDTH = 280;
const COLLAPSE_THRESHOLD = 180;
const MAX_WIDTH = 640;
const DEFAULT_WIDTH = 400;

interface Props {
  logs: LogEntry[];
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function LogPanel({ logs, onClear, isOpen, onToggle }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (ev: MouseEvent) => {
        if (!draggingRef.current) return;
        const delta = startXRef.current - ev.clientX;
        const next = startWidthRef.current + delta;

        if (next < COLLAPSE_THRESHOLD) {
          draggingRef.current = false;
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
          onToggle();
          return;
        }

        setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)));
      };

      const onMouseUp = () => {
        draggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [width, onToggle],
  );

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute top-2 right-2 z-10 p-2 bg-bg-card border border-border rounded-[var(--radius-sm)] text-text-muted hover:text-text hover:bg-bg-hover transition-colors cursor-pointer"
        title="展开日志面板"
      >
        <PanelRightOpen size={16} />
      </button>
    );
  }

  return (
    <div
      className="flex-shrink-0 bg-bg-card border-l border-border flex flex-col relative"
      style={{ width }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent/40 transition-colors z-10"
      />

      {/* Header — matches collapsed expand button height */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red" />
            <span className="w-2.5 h-2.5 rounded-full bg-accent-light" />
            <span className="w-2.5 h-2.5 rounded-full bg-green" />
          </div>
          <Terminal size={14} className="text-text-muted ml-1" />
          <span className="font-mono text-xs text-text-muted">日志</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="p-2 text-text-faint hover:text-text-muted transition-colors cursor-pointer bg-transparent border-none"
            title="清空日志"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onToggle}
            className="p-2 text-text-faint hover:text-text-muted transition-colors cursor-pointer bg-transparent border-none"
            title="收起日志面板"
          >
            <PanelRightClose size={16} />
          </button>
        </div>
      </div>

      {/* Log entries — selectable text */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5 select-text">
        {logs.length === 0 && (
          <div className="text-center text-text-faint text-xs py-8">
            暂无日志
          </div>
        )}
        {logs.map((entry, i) => (
          <LogRow key={i} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const time = new Date(entry.timestamp);
  const timeStr = [
    String(time.getHours()).padStart(2, "0"),
    String(time.getMinutes()).padStart(2, "0"),
    String(time.getSeconds()).padStart(2, "0"),
  ].join(":");

  const categoryColor = CATEGORY_COLORS[entry.category];
  const levelStyle = LEVEL_STYLES[entry.level];
  const categoryLabel = CATEGORY_LABELS[entry.category];

  return (
    <div className="font-mono text-[11px] leading-relaxed px-1 py-0.5 rounded hover:bg-bg-hover/50 select-text">
      <div className="flex items-start gap-1.5">
        <span className="text-text-faint shrink-0">{timeStr}</span>
        <span className={`${categoryColor} shrink-0 font-semibold`}>
          [{categoryLabel}]
        </span>
        <span className={levelStyle}>{entry.message}</span>
      </div>
      {entry.detail && (
        <div className="ml-[7.5rem] text-text-faint text-[10px] select-text">
          {entry.detail}
        </div>
      )}
    </div>
  );
}
