import type { JSX } from "react";
import type { Page } from "../App";

const items: { id: Page; label: string; icon: string }[] = [
  { id: "quickstart", label: "快速开始", icon: "quickstart" },
  { id: "download", label: "下载", icon: "download" },
  { id: "install", label: "安装", icon: "install" },
  { id: "backup", label: "备份与恢复", icon: "backup" },
  { id: "about", label: "关于", icon: "about" },
];

const icons: Record<string, JSX.Element> = {
  install: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  download: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
    </svg>
  ),
  quickstart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  backup: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  about: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

interface Props {
  current: Page;
  onNavigate: (page: Page) => void;
}

export default function Sidebar({ current, onNavigate }: Props) {
  return (
    <aside className="w-52 flex-shrink-0 bg-bg-card border-r border-border flex flex-col">
      <div className="p-5 mb-2">
        <div className="w-10 h-10 rounded-[10px] bg-accent-bg border border-[rgba(232,121,12,0.12)] flex items-center justify-center mb-3">
          <span className="font-display text-lg font-bold text-accent">S</span>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] font-display text-sm font-medium transition-all duration-200 cursor-pointer border-none ${
              current === item.id
                ? "bg-accent-bg text-accent"
                : "bg-transparent text-text-muted hover:text-text hover:bg-bg-hover"
            }`}
          >
            {icons[item.icon]}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <span className="font-mono text-[10px] text-text-faint tracking-wider">v0.1.0</span>
      </div>
    </aside>
  );
}
