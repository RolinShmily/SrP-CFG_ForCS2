import { useState, useCallback, useRef } from "react";
import { ArrowDownToLine, FileText, Play, Clock, Info, RefreshCw, Package, Globe, Layers } from "lucide-react";
import type { Page } from "../App";

const items: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "quickstart", label: "快速开始", icon: <Play size={20} /> },
  { id: "download", label: "下载", icon: <ArrowDownToLine size={20} /> },
  { id: "install", label: "安装", icon: <FileText size={20} /> },
  { id: "backup", label: "备份与恢复", icon: <Clock size={20} /> },
  { id: "applied", label: "已应用配置", icon: <Layers size={20} /> },
  { id: "about", label: "关于", icon: <Info size={20} /> },
];

const DEFAULT_WIDTH = 208;
const MIN_WIDTH = 64;
const COLLAPSE_THRESHOLD = 48;
const MAX_WIDTH = 360;

interface Props {
  current: Page;
  onNavigate: (page: Page) => void;
  onCheckUpdate: () => void;
}

export default function Sidebar({ current, onNavigate, onCheckUpdate }: Props) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const collapsed = width <= MIN_WIDTH + 8;

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
        const delta = ev.clientX - startXRef.current;
        const next = Math.min(MAX_WIDTH, Math.max(COLLAPSE_THRESHOLD, startWidthRef.current + delta));
        setWidth(next);
      };

      const onMouseUp = () => {
        draggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        setWidth((prev) => {
          if (prev < MIN_WIDTH + 8) return MIN_WIDTH;
          return prev;
        });

        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [width],
  );

  const handleOpenWebsite = async () => {
    await window.api.openExternal("https://cfg.srprolin.top/");
  };

  return (
    <aside
      className="flex-shrink-0 bg-bg-card border-r border-border flex flex-col relative"
      style={{ width }}
    >
      {/* Logo — slightly larger */}
      <div className="p-5 mb-2 flex items-center justify-center">
        <img
          src="/favicon.ico"
          alt="SrP-CFG"
          className="w-11 h-11 rounded-[10px] object-contain"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}
            className={`w-full flex items-center gap-3 rounded-[6px] font-display text-sm font-medium transition-all duration-200 cursor-pointer border-none ${
              collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
            } ${
              current === item.id
                ? "bg-accent-bg text-accent"
                : "bg-transparent text-text-muted hover:text-text hover:bg-bg-hover"
            }`}
          >
            {item.icon}
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border" style={{ cursor: "default" }}>
        {/* Project website */}
        {!collapsed ? (
          <button
            onClick={handleOpenWebsite}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-text-muted hover:text-accent hover:bg-bg-hover transition-colors cursor-pointer bg-transparent border-none"
          >
            <Globe size={14} />
            <span className="font-display text-xs">项目官网</span>
          </button>
        ) : (
          <button
            onClick={handleOpenWebsite}
            title="项目官网"
            className="w-full flex items-center justify-center py-2.5 text-text-muted hover:text-accent hover:bg-bg-hover transition-colors cursor-pointer bg-transparent border-none"
          >
            <Globe size={16} />
          </button>
        )}

        {/* Check for updates */}
        {!collapsed ? (
          <button
            onClick={onCheckUpdate}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-text-muted hover:text-accent hover:bg-bg-hover transition-colors cursor-pointer bg-transparent border-none"
          >
            <RefreshCw size={14} />
            <span className="font-display text-xs">检查更新</span>
          </button>
        ) : (
          <button
            onClick={onCheckUpdate}
            title="检查更新"
            className="w-full flex items-center justify-center py-2.5 text-text-muted hover:text-accent hover:bg-bg-hover transition-colors cursor-pointer bg-transparent border-none"
          >
            <RefreshCw size={16} />
          </button>
        )}

        {/* Version */}
        <div className={`flex items-center gap-2 px-4 py-2.5 ${collapsed ? "justify-center" : ""}`}>
          <Package size={14} className="text-text-faint shrink-0" />
          {!collapsed && (
            <span className="font-mono text-xs text-text-faint tracking-wider">
              v3.0.0
            </span>
          )}
        </div>
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent/40 transition-colors z-10"
      />
    </aside>
  );
}
