import { useState, useEffect, useCallback } from "react";
import { FolderOpen, FileText, Map, Monitor, Loader2, ChevronDown, RotateCcw, AlertTriangle, Save } from "lucide-react";
import type { ResData, SaveData, CategoryData } from "../types";

const sectionIcons: Record<string, React.ReactNode> = {
  cfg: <FileText size={16} className="text-accent" />,
  annotations: <Map size={16} className="text-accent" />,
  video: <Monitor size={16} className="text-accent" />,
};

const sectionLabels: Record<string, string> = {
  cfg: "CFG 配置",
  annotations: "地图指南",
  video: "视频预设",
};

export default function BackupRestorePage() {
  const [resData, setResData] = useState<ResData | null>(null);
  const [saveData, setSaveData] = useState<SaveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [restoring, setRestoring] = useState<string | null>(null);
  const [restoringSave, setRestoringSave] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, save] = await Promise.all([
        window.api.getResData(),
        window.api.getSaveData(),
      ]);
      setResData(res);
      setSaveData(save);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleRestoreRes = async (category: string, name: string) => {
    const key = `${category}/${name}`;
    if (restoring) return;
    setRestoring(key);
    try {
      await window.api.restoreFromRes(category, name);
      await loadData();
    } finally {
      setRestoring(null);
    }
  };

  const handleRestoreSave = async () => {
    if (restoringSave) return;
    setRestoringSave(true);
    try {
      await window.api.restoreFromSave();
      await loadData();
    } finally {
      setRestoringSave(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <h1 className="font-display text-2xl font-bold">备份与恢复</h1>
        <div className="flex items-center justify-center py-12 text-text-muted">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  // Check if res has any entries
  const resCategories: { key: keyof ResData; data: CategoryData }[] = resData
    ? [
        { key: "cfg", data: resData.cfg },
        { key: "annotations", data: resData.annotations },
        { key: "video", data: resData.video },
      ]
    : [];
  const hasResEntries = resCategories.some(
    (c) => c.data.files.length > 0 || c.data.dirs.length > 0,
  );

  // Check if save has any entries
  const saveCategories: { key: keyof SaveData; data: CategoryData }[] = saveData
    ? [
        { key: "cfg", data: saveData.cfg },
        { key: "annotations", data: saveData.annotations },
        { key: "video", data: saveData.video },
      ]
    : [];
  const hasSaveEntries = saveCategories.some(
    (c) => c.data.files.length > 0 || c.data.dirs.length > 0,
  );

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">备份与恢复</h1>

      {/* ── Conflict Recovery (res.json) ───────────────────── */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-accent" />
          <h2 className="font-display text-sm font-semibold text-text-secondary">
            冲突恢复
          </h2>
          <span className="text-xs text-text-faint">安装时被替换的原文件</span>
        </div>

        {!hasResEntries ? (
          <p className="text-xs text-text-faint py-3 text-center">暂无冲突恢复文件</p>
        ) : (
          resCategories.map((cat) => {
            if (cat.data.files.length === 0 && cat.data.dirs.length === 0) return null;
            const isOpen = expanded[cat.key] ?? false;
            const totalItems = cat.data.files.length + cat.data.dirs.length;

            return (
              <div
                key={cat.key}
                className="border border-border rounded-[var(--radius-sm)]"
              >
                <div
                  onClick={() => toggle(cat.key)}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    {sectionIcons[cat.key]}
                    <span className="text-xs font-semibold text-text-secondary">
                      {sectionLabels[cat.key]}
                    </span>
                    <span className="text-[10px] text-accent/70">
                      {totalItems} 个冲突文件
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-text-faint transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </div>

                {isOpen && (
                  <div className="px-3 pb-3 space-y-1">
                    {[...cat.data.dirs.map((n) => ({ name: n, isDir: true })), ...cat.data.files.map((n) => ({ name: n, isDir: false }))].map(
                      ({ name, isDir }) => {
                        const restoreKey = `${cat.key}/${name}`;
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreRes(cat.key, name);
                              }}
                              disabled={restoring !== null}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] bg-bg-card hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed text-accent rounded-[var(--radius-sm)] transition-colors cursor-pointer border border-accent/20 shrink-0"
                            >
                              {restoring === restoreKey ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <RotateCcw size={10} />
                              )}
                              恢复
                            </button>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Config Backup (save.json) ─────────────────────── */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Save size={16} className="text-green" />
            <h2 className="font-display text-sm font-semibold text-text-secondary">
              配置备份
            </h2>
            <span className="text-xs text-text-faint">覆盖安装前自动备份的文件</span>
          </div>
          {hasSaveEntries && (
            <button
              onClick={handleRestoreSave}
              disabled={restoringSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-raised hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed text-text-secondary rounded-[var(--radius-sm)] transition-colors cursor-pointer border border-border"
            >
              {restoringSave ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RotateCcw size={12} />
              )}
              全部恢复
            </button>
          )}
        </div>

        {!hasSaveEntries ? (
          <p className="text-xs text-text-faint py-3 text-center">暂无配置备份</p>
        ) : (
          saveCategories.map((cat) => {
            if (cat.data.files.length === 0 && cat.data.dirs.length === 0) return null;
            const isOpen = expanded[`save-${cat.key}`] ?? false;

            return (
              <div
                key={`save-${cat.key}`}
                className="border border-border rounded-[var(--radius-sm)]"
              >
                <div
                  onClick={() => toggle(`save-${cat.key}`)}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    {sectionIcons[cat.key]}
                    <span className="text-xs font-semibold text-text-secondary">
                      {sectionLabels[cat.key]}
                    </span>
                    <span className="text-[10px] text-text-faint">
                      {cat.data.files.length + cat.data.dirs.length} 项
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-text-faint transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </div>

                {isOpen && (
                  <div className="px-3 pb-3 space-y-1">
                    {[...cat.data.dirs, ...cat.data.files].map((name) => (
                      <div
                        key={name}
                        className="flex items-center gap-2 px-2.5 py-1.5 bg-bg-raised border border-border rounded-[var(--radius-sm)] text-xs font-mono text-text"
                      >
                        <FileText size={12} className="text-text-faint shrink-0" />
                        <span className="truncate">{name}</span>
                      </div>
                    ))}
                    {cat.data.path && (
                      <p className="text-[10px] text-text-faint font-mono break-all pt-1">
                        {cat.data.path}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Open folders ──────────────────────────────── */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-3">
        <h2 className="font-display text-sm font-semibold text-text-secondary">
          文件位置浏览
        </h2>
        <p className="text-sm text-text-muted">
          打开备份或恢复文件所在目录，查看和管理文件。
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.api.openSaveFolder()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-sm)] font-display font-semibold text-sm transition-all cursor-pointer border border-border bg-transparent text-text-secondary hover:border-border-highlight hover:text-text"
          >
            <Save size={16} />
            打开备份文件夹
          </button>
          <button
            onClick={() => window.api.openResFolder()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-sm)] font-display font-semibold text-sm transition-all cursor-pointer border border-border bg-transparent text-text-secondary hover:border-border-highlight hover:text-text"
          >
            <AlertTriangle size={16} />
            打开恢复文件夹
          </button>
        </div>
      </div>
    </div>
  );
}
