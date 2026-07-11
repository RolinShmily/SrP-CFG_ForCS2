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
  Database,
  ShieldCheck,
} from "lucide-react";
import type { ResData, SaveData, CategoryData, UserConfigDocument } from "../types";
import PageHeader from "../components/PageHeader";

const sectionIcons: Record<string, React.ReactNode> = {
  gameCfg: <FileText size={16} className="text-teal" />,
  userCfg: <FileText size={16} className="text-accent-light" />,
  annotations: <Map size={16} className="text-accent" />,
  video: <Monitor size={16} className="text-accent" />,
};
const sectionLabels: Record<string, string> = {
  gameCfg: "游戏 CFG",
  userCfg: "账号 CFG（实验性）",
  annotations: "地图指南",
  video: "视频预设",
};

export default function BackupRestorePage() {
  const [resData, setResData] = useState<ResData | null>(null);
  const [saveData, setSaveData] = useState<SaveData | null>(null);
  const [userConfig, setUserConfig] = useState<UserConfigDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, save, user] = await Promise.all([
        window.api.getResData(),
        window.api.getSaveData(),
        window.api.getUserConfig(),
      ]);
      setResData(res);
      setSaveData(save);
      setUserConfig(user);
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
  type CatEntry = { key: "gameCfg" | "userCfg" | "annotations" | "video"; data: CategoryData };
  const toCategories = (data: ResData | SaveData): CatEntry[] =>
    (["gameCfg", "userCfg", "annotations", "video"] as const).map((k) => ({ key: k, data: data[k] }));
  const hasItems = (c: CatEntry) => c.data.files.length > 0 || c.data.dirs.length > 0;

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="恢复中心" description="加载 Runtime 回滚、安装前原文件和 VCFG 快照状态。" />
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
      <div className="flex flex-wrap items-stretch justify-between gap-y-2">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => toggle(`${prefix}-${catKey}`)}
          className="flex min-w-0 basis-72 flex-1 items-center justify-between px-3 py-2 text-left"
        >
          <div className="flex min-w-0 items-center gap-2">
            {sectionIcons[catKey]}
            <span className="text-xs font-semibold text-text-secondary">
              {sectionLabels[catKey]}
            </span>
            <span className={`text-xs ${accentLabel ? "text-accent" : "text-text-faint"}`}>
              {totalItems} {accentLabel ?? "项"}
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`text-text-faint transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        <div className="ml-auto flex shrink-0 items-center gap-1 px-3">
          {buttons}
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
        type="button"
        onClick={onClick}
        disabled={currentBusy !== null}
        className={`flex min-h-7 items-center gap-1 px-2 text-xs bg-bg-card disabled:opacity-40 disabled:cursor-not-allowed rounded-[var(--radius-sm)] transition-colors border ${colorMap[color]}`}
      >
        {currentBusy === busyKey ? <Loader2 size={12} className="animate-spin" /> : icon}
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
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-border bg-bg-raised px-2.5 py-1.5 text-xs">
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
        <div className="ml-auto flex shrink-0 items-center gap-1">{buttons}</div>
      </div>
    );
  }

  const resCats = resData ? toCategories(resData) : [];
  const saveCats = saveData ? toCategories(saveData) : [];

  const hasResEntries = resCats.some(hasItems);
  const hasSaveEntries = saveCats.some(hasItems);

  return (
    <div className="space-y-6">
      <PageHeader
        title="恢复中心"
        description="这里只管理安装器移动过的文件；用户配置与游戏持久状态有各自边界。"
      />

      <div className="flex items-start gap-3 rounded-[var(--radius)] border border-teal/25 bg-teal/5 px-4 py-3">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-teal" />
        <div className="ui-body min-w-0">
          <p><code className="font-mono text-xs text-text">srp-cfg/user/custom.cfg</code> 不属于 Runtime 回滚项，下面的恢复、删除和卸载操作都会保留它。</p>
          <p className="ui-micro mt-1 truncate font-mono" title={userConfig?.path ?? undefined}>{userConfig?.path ?? "尚未检测到用户配置路径"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* ── Runtime rollback (save.json) ─────────────────────── */}
        <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Save size={16} className="text-green" />
              <h2 className="ui-panel-title">上一个 Runtime 版本</h2>
              <span className="text-xs text-text-faint">再次覆盖安装前自动保留的受管文件</span>
            </div>
            <div className="flex items-center gap-2">
              {hasSaveEntries && (
                <SmallBtn
                  busyKey="save:restoreAll"
                  currentBusy={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!window.confirm("回滚全部受管文件到上一个安装版本？user/custom.cfg 会被保留。")) return;
                    runAction("save:restoreAll", () => window.api.restoreFromSave());
                  }}
                  color="green"
                  icon={<RotateCcw size={12} />}
                  label="回滚全部"
                />
              )}
              <button
                type="button"
                onClick={() => window.api.openSaveFolder()}
                className="flex min-h-8 items-center gap-1.5 px-2.5 text-xs text-text-muted hover:text-accent hover:bg-accent-bg rounded-[var(--radius-sm)] transition-colors bg-transparent border border-border"
              >
                <FolderOpen size={13} />
                打开目录
              </button>
            </div>
          </div>

          {!hasSaveEntries ? (
            <p className="text-xs text-text-faint py-3 text-center">暂无可回滚的上一个 Runtime 版本</p>
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
                            if (!window.confirm(`回滚 ${sectionLabels[cat.key]} 到上一个安装版本？`)) return;
                            runAction(`save:restore:${cat.key}`, () => window.api.restoreSaveCategory(cat.key));
                          }}
                          color="green"
                          icon={<RotateCcw size={12} />}
                          label="回滚"
                        />
                        <SmallBtn
                          busyKey={`save:clear:${cat.key}`}
                          currentBusy={busy}
                          onClick={(e) => {
                            e.stopPropagation();
                            runAction(`save:clear:${cat.key}`, () => window.api.clearSaveCategory(cat.key));
                          }}
                          color="red"
                          icon={<Trash2 size={12} />}
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
                                  icon={<RotateCcw size={12} />}
                                  label="回滚"
                                />
                                <SmallBtn
                                  busyKey={`save:item:delete:${cat.key}/${name}`}
                                  currentBusy={busy}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    runAction(`save:item:delete:${cat.key}/${name}`, () => window.api.deleteSaveItem(cat.key, name));
                                  }}
                                  color="red"
                                  icon={<Trash2 size={12} />}
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
                                  icon={<ExternalLink size={12} />}
                                  label="打开"
                                />
                              </>
                            }
                          />
                        ),
                      )}
                      {cat.data.path && (
                        <p className="text-xs text-text-faint font-mono break-all pt-1">{cat.data.path}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Pre-install originals (res.json) ────────────────── */}
        <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <AlertTriangle size={16} className="text-accent" />
              <h2 className="ui-panel-title">安装前原文件</h2>
              <span className="text-xs text-text-faint">首次安装时为同名 Runtime 项让位的内容</span>
            </div>
            <button
              type="button"
              onClick={() => window.api.openResFolder()}
              className="flex min-h-8 items-center gap-1.5 px-2.5 text-xs text-text-muted hover:text-accent hover:bg-accent-bg rounded-[var(--radius-sm)] transition-colors bg-transparent border border-border"
            >
              <FolderOpen size={13} />
              打开目录
            </button>
          </div>

          {!hasResEntries ? (
            <p className="text-xs text-text-faint py-3 text-center">没有安装前原文件需要处理</p>
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
                    accentLabel="个原始项"
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
                          icon={<RotateCcw size={12} />}
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
                          icon={<Trash2 size={12} />}
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
                                  icon={<RotateCcw size={12} />}
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
                                  icon={<Trash2 size={12} />}
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
                                  icon={<ExternalLink size={12} />}
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
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius)] border border-border bg-bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-accent-bg border border-accent/10 flex items-center justify-center shrink-0">
            <Database size={16} className="text-accent" />
          </div>
          <div>
            <h2 className="ui-panel-title">VCFG 原始状态快照</h2>
            <p className="ui-caption mt-1">
              当安装器无法确认上传的自定义 CFG 只注册 Runtime 时，会按 Steam 账号保存可读 JSON 基线。
              它只用于审计和比较，不会覆盖 CS2/Steam Cloud 管理的 VCFG，也不是一键恢复点。
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.api.openVcfgSnapshotsFolder()}
          className="flex min-h-8 shrink-0 items-center gap-1.5 px-2.5 text-xs text-text-muted hover:text-accent hover:bg-accent-bg rounded-[var(--radius-sm)] transition-colors bg-transparent border border-border"
        >
          <FolderOpen size={13} />
          打开快照目录
        </button>
      </div>
    </div>
  );
}
