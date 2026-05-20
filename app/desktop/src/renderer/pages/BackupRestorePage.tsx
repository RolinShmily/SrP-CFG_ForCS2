import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  FileText,
  Map,
  Monitor,
  Loader2,
  ChevronDown,
  RotateCcw,
  AlertTriangle,
  Save,
  Trash2,
  ExternalLink,
} from "lucide-react";
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
  const [busy, setBusy] = useState<string | null>(null);

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

  // ── Generic action wrapper ────────────────────────────────────
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

  // ── Helpers ──────────────────────────────────────────────────
  type CatEntry = { key: "cfg" | "annotations" | "video"; data: CategoryData };
  const toCategories = (data: ResData | SaveData): CatEntry[] =>
    (["cfg", "annotations", "video"] as const).map((k) => ({ key: k, data: data[k] }));
  const hasItems = (c: CatEntry) => c.data.files.length > 0 || c.data.dirs.length > 0;

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

  // ── Category header with buttons ─────────────────────────────
  function CategoryHeader({
    prefix,
    catKey,
    totalItems,
    accentLabel,
    buttons,
  }: {
    prefix: string;
    catKey: string;
    totalItems: number;
    accentLabel?: string;
    buttons: React.ReactNode;
  }) {
    const isOpen = expanded[`${prefix}-${catKey}`] ?? false;
    return (
      <div
        onClick={() => toggle(`${prefix}-${catKey}`)}
        className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          {sectionIcons[catKey]}
          <span className="text-xs font-semibold text-text-secondary">
            {sectionLabels[catKey]}
          </span>
          <span className={`text-[10px] ${accentLabel ? "text-accent/70" : "text-text-faint"}`}>
            {totalItems} {accentLabel ?? "项"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {buttons}
          <ChevronDown
            size={14}
            className={`text-text-faint transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>
    );
  }

  // ── Action buttons ───────────────────────────────────────────
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
    color: "accent" | "red" | "green";
    icon: React.ReactNode;
    label: string;
  }) {
    const colorMap = {
      accent: "text-accent hover:bg-accent/10 border-accent/20",
      red: "text-red-400 hover:bg-red-500/10 border-red-400/20",
      green: "text-green hover:bg-green/10 border-green/20",
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

  // ── Render a single item row ─────────────────────────────────
  function ItemRow({
    name,
    isDir,
    buttons,
  }: {
    name: string;
    isDir: boolean;
    buttons: React.ReactNode;
  }) {
    return (
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-bg-raised border border-border rounded-[var(--radius-sm)] text-xs">
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
        <div className="flex items-center gap-1 shrink-0">{buttons}</div>
      </div>
    );
  }

  const resCats = resData ? toCategories(resData) : [];
  const saveCats = saveData ? toCategories(saveData) : [];

  const hasResEntries = resCats.some(hasItems);
  const hasSaveEntries = saveCats.some(hasItems);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">备份与恢复</h1>

      {/* ── 配置备份 (save.json) ─────────────────────────────── */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Save size={16} className="text-green" />
            <h2 className="font-display text-sm font-semibold text-text-secondary">配置备份</h2>
            <span className="text-xs text-text-faint">覆盖安装前自动备份的文件</span>
          </div>
          {hasSaveEntries && (
            <SmallBtn
              busyKey="save:restoreAll"
              currentBusy={busy}
              onClick={(e) => {
                e.stopPropagation();
                runAction("save:restoreAll", () => window.api.restoreFromSave());
              }}
              color="green"
              icon={<RotateCcw size={12} />}
              label="全部恢复"
            />
          )}
        </div>

        {!hasSaveEntries ? (
          <p className="text-xs text-text-faint py-3 text-center">暂无配置备份</p>
        ) : (
          saveCats.filter(hasItems).map((cat) => {
            const totalItems = cat.data.files.length + cat.data.dirs.length;
            const isOpen = expanded[`save-${cat.key}`] ?? false;
            return (
              <div key={`save-${cat.key}`} className="border border-border rounded-[var(--radius-sm)]">
                <CategoryHeader
                  prefix="save"
                  catKey={cat.key}
                  totalItems={totalItems}
                  buttons={
                    <>
                      <SmallBtn
                        busyKey={`save:restore:${cat.key}`}
                        currentBusy={busy}
                        onClick={(e) => {
                          e.stopPropagation();
                          runAction(`save:restore:${cat.key}`, () => window.api.restoreSaveCategory(cat.key));
                        }}
                        color="green"
                        icon={<RotateCcw size={10} />}
                        label="恢复"
                      />
                      <SmallBtn
                        busyKey={`save:clear:${cat.key}`}
                        currentBusy={busy}
                        onClick={(e) => {
                          e.stopPropagation();
                          runAction(`save:clear:${cat.key}`, () => window.api.clearSaveCategory(cat.key));
                        }}
                        color="red"
                        icon={<Trash2 size={10} />}
                        label="删除"
                      />
                    </>
                  }
                />
                {isOpen && (
                  <div className="px-3 pb-3 space-y-1">
                    {[...cat.data.dirs.map((n) => ({ name: n, isDir: true })), ...cat.data.files.map((n) => ({ name: n, isDir: false }))].map(
                      ({ name, isDir }) => (
                        <ItemRow
                          key={name}
                          name={name}
                          isDir={isDir}
                          buttons={
                            <>
                              <SmallBtn
                                busyKey={`save:item:restore:${cat.key}/${name}`}
                                currentBusy={busy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  runAction(`save:item:restore:${cat.key}/${name}`, () => window.api.restoreSaveItem(cat.key, name));
                                }}
                                color="green"
                                icon={<RotateCcw size={10} />}
                                label="恢复"
                              />
                              <SmallBtn
                                busyKey={`save:item:delete:${cat.key}/${name}`}
                                currentBusy={busy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  runAction(`save:item:delete:${cat.key}/${name}`, () => window.api.deleteSaveItem(cat.key, name));
                                }}
                                color="red"
                                icon={<Trash2 size={10} />}
                                label="删除"
                              />
                              <SmallBtn
                                busyKey={`save:item:open:${cat.key}/${name}`}
                                currentBusy={busy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  runAction(`save:item:open:${cat.key}/${name}`, () => window.api.openItem("save", cat.key, name));
                                }}
                                color="accent"
                                icon={<ExternalLink size={10} />}
                                label="打开"
                              />
                            </>
                          }
                        />
                      ),
                    )}
                    {cat.data.path && (
                      <p className="text-[10px] text-text-faint font-mono break-all pt-1">{cat.data.path}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── 冲突恢复 (res.json) ──────────────────────────────── */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-accent" />
          <h2 className="font-display text-sm font-semibold text-text-secondary">冲突恢复</h2>
          <span className="text-xs text-text-faint">用户原有重名文件</span>
        </div>

        {!hasResEntries ? (
          <p className="text-xs text-text-faint py-3 text-center">暂无冲突恢复文件</p>
        ) : (
          resCats.filter(hasItems).map((cat) => {
            const totalItems = cat.data.files.length + cat.data.dirs.length;
            const isOpen = expanded[`res-${cat.key}`] ?? false;
            return (
              <div key={`res-${cat.key}`} className="border border-border rounded-[var(--radius-sm)]">
                <CategoryHeader
                  prefix="res"
                  catKey={cat.key}
                  totalItems={totalItems}
                  accentLabel="个冲突文件"
                  buttons={
                    <>
                      <SmallBtn
                        busyKey={`res:restore:${cat.key}`}
                        currentBusy={busy}
                        onClick={(e) => {
                          e.stopPropagation();
                          runAction(`res:restore:${cat.key}`, () => window.api.restoreResCategory(cat.key));
                        }}
                        color="green"
                        icon={<RotateCcw size={10} />}
                        label="恢复"
                      />
                      <SmallBtn
                        busyKey={`res:clear:${cat.key}`}
                        currentBusy={busy}
                        onClick={(e) => {
                          e.stopPropagation();
                          runAction(`res:clear:${cat.key}`, () => window.api.clearResCategory(cat.key));
                        }}
                        color="red"
                        icon={<Trash2 size={10} />}
                        label="删除"
                      />
                    </>
                  }
                />
                {isOpen && (
                  <div className="px-3 pb-3 space-y-1">
                    {[...cat.data.dirs.map((n) => ({ name: n, isDir: true })), ...cat.data.files.map((n) => ({ name: n, isDir: false }))].map(
                      ({ name, isDir }) => (
                        <ItemRow
                          key={name}
                          name={name}
                          isDir={isDir}
                          buttons={
                            <>
                              <SmallBtn
                                busyKey={`res:item:restore:${cat.key}/${name}`}
                                currentBusy={busy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  runAction(`res:item:restore:${cat.key}/${name}`, () => window.api.restoreFromRes(cat.key, name));
                                }}
                                color="green"
                                icon={<RotateCcw size={10} />}
                                label="恢复"
                              />
                              <SmallBtn
                                busyKey={`res:item:delete:${cat.key}/${name}`}
                                currentBusy={busy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  runAction(`res:item:delete:${cat.key}/${name}`, () => window.api.deleteResItem(cat.key, name));
                                }}
                                color="red"
                                icon={<Trash2 size={10} />}
                                label="删除"
                              />
                              <SmallBtn
                                busyKey={`res:item:open:${cat.key}/${name}`}
                                currentBusy={busy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  runAction(`res:item:open:${cat.key}/${name}`, () => window.api.openItem("res", cat.key, name));
                                }}
                                color="accent"
                                icon={<ExternalLink size={10} />}
                                label="打开"
                              />
                            </>
                          }
                        />
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Open folders ──────────────────────────────────────── */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-3">
        <h2 className="font-display text-sm font-semibold text-text-secondary">文件位置浏览</h2>
        <p className="text-sm text-text-muted">打开备份或恢复文件所在目录，查看和管理文件。</p>
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
