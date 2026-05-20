import { useState, useEffect, useCallback } from "react";
import { FolderOpen, FileText, Map, Monitor, Loader2, ChevronDown, Trash2, PackageX, ExternalLink } from "lucide-react";
import type { InstalledData, CategoryData } from "../types";

const sectionIcons: Record<string, React.ReactNode> = {
  cfg: <FileText size={18} className="text-accent" />,
  annotations: <Map size={18} className="text-accent" />,
  video: <Monitor size={18} className="text-accent" />,
};

const sectionLabels: Record<string, string> = {
  cfg: "CFG 配置",
  annotations: "地图指南",
  video: "视频预设",
};

function SmallBtn({
  busyKey,
  currentBusy,
  onClick,
  color,
  icon,
  label,
}: {
  busyKey: string;
  currentBusy: string | null;
  onClick: (e: React.MouseEvent) => void;
  color: "accent" | "red";
  icon: React.ReactNode;
  label: string;
}) {
  const colorMap = {
    accent: "text-accent hover:bg-accent/10 border-accent/20",
    red: "text-red-400 hover:bg-red-500/10 border-red-400/20",
  };
  return (
    <button
      onClick={onClick}
      disabled={currentBusy !== null}
      className={`flex items-center gap-1 px-2 py-1 text-[10px] bg-bg-card disabled:opacity-40 disabled:cursor-not-allowed rounded-[var(--radius-sm)] transition-colors cursor-pointer border ${colorMap[color]}`}
    >
      {currentBusy === busyKey ? <Loader2 size={10} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

export default function AppliedConfigPage() {
  const [data, setData] = useState<InstalledData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const installed = await window.api.getInstalledData();
      setData(installed);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const runAction = async (key: string, action: () => Promise<any>) => {
    if (busy) return;
    setBusy(key);
    try {
      await action();
      await loadData();
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <h1 className="font-display text-2xl font-bold">已应用配置</h1>
        <div className="flex items-center justify-center py-12 text-text-muted">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  const categories: { key: keyof InstalledData; data: CategoryData }[] = data
    ? [
        { key: "cfg", data: data.cfg },
        { key: "annotations", data: data.annotations },
        { key: "video", data: data.video },
      ]
    : [];

  const hasAnyEntries = categories.some(
    (c) => c.data.files.length > 0 || c.data.dirs.length > 0,
  );

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">已应用配置</h1>

      {!hasAnyEntries && (
        <div className="bg-bg-card border border-border rounded-[var(--radius)] p-6 text-center text-text-faint text-sm">
          暂无已安装的配置文件
        </div>
      )}

      {categories.map((cat) => {
        const isOpen = expanded[cat.key] ?? false;
        const totalItems = cat.data.files.length + cat.data.dirs.length;
        if (totalItems === 0) return null;

        return (
          <div
            key={cat.key}
            className="bg-bg-card border border-border rounded-[var(--radius)]"
          >
            {/* Header */}
            <div
              onClick={() => toggle(cat.key)}
              className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                {sectionIcons[cat.key]}
                <h2 className="font-display text-sm font-semibold text-text-secondary">
                  {sectionLabels[cat.key]}
                </h2>
                <span className="text-xs text-text-faint">
                  {totalItems} 项
                </span>
              </div>
              <div className="flex items-center gap-2">
                {cat.data.path && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.api.openExternal(cat.data.path);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-muted hover:text-accent hover:bg-accent-bg rounded-[var(--radius-sm)] transition-colors cursor-pointer bg-transparent border border-border"
                  >
                    <FolderOpen size={13} />
                    打开目标目录
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    runAction(`uninstall:${cat.key}`, () => window.api.clearInstallCategory(cat.key));
                  }}
                  disabled={busy !== null}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed rounded-[var(--radius-sm)] transition-colors cursor-pointer bg-transparent border border-red-400/20"
                >
                  {busy === `uninstall:${cat.key}` ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <PackageX size={13} />
                  )}
                  卸载配置
                </button>
                <ChevronDown
                  size={16}
                  className={`text-text-faint transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
            </div>

            {/* Body */}
            {isOpen && (
              <div className="px-4 pb-4 pt-0 space-y-1">
                {/* Dirs */}
                {[...cat.data.dirs.map((n) => ({ name: n, isDir: true })), ...cat.data.files.map((n) => ({ name: n, isDir: false }))].map(
                  ({ name, isDir }) => {
                    const itemKey = `${cat.key}/${name}`;
                    return (
                      <div
                        key={name}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-bg-raised border border-border rounded-[var(--radius-sm)] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isDir ? (
                            <FolderOpen size={12} className="text-text-faint shrink-0" />
                          ) : (
                            <FileText size={12} className="text-text-faint shrink-0" />
                          )}
                          <span className="truncate font-mono text-text">
                            {name}{isDir ? "/" : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <SmallBtn
                            busyKey={`delete:${itemKey}`}
                            currentBusy={busy}
                            onClick={(e) => {
                              e.stopPropagation();
                              runAction(`delete:${itemKey}`, () => window.api.deleteInstalledItem(cat.key, name));
                            }}
                            color="red"
                            icon={<Trash2 size={10} />}
                            label="删除"
                          />
                          <SmallBtn
                            busyKey={`open:${itemKey}`}
                            currentBusy={busy}
                            onClick={(e) => {
                              e.stopPropagation();
                              runAction(`open:${itemKey}`, () => window.api.openItem("install", cat.key, name));
                            }}
                            color="accent"
                            icon={<ExternalLink size={10} />}
                            label="打开"
                          />
                        </div>
                      </div>
                    );
                  },
                )}

                {/* Target path */}
                {cat.data.path && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-[10px] text-text-faint font-mono break-all">
                      {cat.data.path}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
