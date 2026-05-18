import { useState, useEffect, useCallback } from "react";
import { FolderOpen, FileText, Map, Monitor, Loader2, ChevronDown, Trash2 } from "lucide-react";
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

export default function AppliedConfigPage() {
  const [data, setData] = useState<InstalledData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleDelete = async (category: string, name: string) => {
    const key = `${category}/${name}`;
    if (deleting) return;
    setDeleting(key);
    try {
      await window.api.deleteInstalledItem(category, name);
      await loadData();
    } finally {
      setDeleting(null);
    }
  };

  const handleOpenFolder = async (path: string) => {
    await window.api.openExternal(path);
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
                      handleOpenFolder(cat.data.path);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-muted hover:text-accent hover:bg-accent-bg rounded-[var(--radius-sm)] transition-colors cursor-pointer bg-transparent border border-border"
                  >
                    <FolderOpen size={13} />
                    打开目标目录
                  </button>
                )}
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
                {cat.data.dirs.map((name) => {
                  const delKey = `${cat.key}/${name}`;
                  return (
                    <div
                      key={name}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 bg-bg-raised border border-border rounded-[var(--radius-sm)] text-xs font-mono text-text"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FolderOpen size={12} className="text-text-faint shrink-0" />
                        <span className="truncate">{name}/</span>
                      </div>
                      <button
                        onClick={() => handleDelete(cat.key, name)}
                        disabled={deleting !== null}
                        title="删除"
                        className="p-1.5 text-text-faint hover:text-red disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer bg-transparent border-none shrink-0"
                      >
                        {deleting === delKey ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  );
                })}

                {/* Files */}
                {cat.data.files.map((name) => {
                  const delKey = `${cat.key}/${name}`;
                  return (
                    <div
                      key={name}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 bg-bg-raised border border-border rounded-[var(--radius-sm)] text-xs font-mono text-text"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={12} className="text-text-faint shrink-0" />
                        <span className="truncate">{name}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(cat.key, name)}
                        disabled={deleting !== null}
                        title="删除"
                        className="p-1.5 text-text-faint hover:text-red disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer bg-transparent border-none shrink-0"
                      >
                        {deleting === delKey ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  );
                })}

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
