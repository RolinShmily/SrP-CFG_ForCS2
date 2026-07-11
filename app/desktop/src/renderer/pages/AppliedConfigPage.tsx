import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  ChevronDown,
  Database,
  ExternalLink,
  FileText,
  FolderOpen,
  Loader2,
  Map,
  Monitor,
  PackageX,
  ShieldCheck,
  Trash2,
  UserRoundCog,
} from "lucide-react";
import type { CategoryData, InstalledData, UserConfigDocument } from "../types";
import PageHeader from "../components/PageHeader";

type CategoryKey = "gameCfg" | "userCfg" | "annotations" | "video";

const categoryMeta: Record<CategoryKey, { label: string; description: string; icon: React.ReactNode }> = {
  gameCfg: {
    label: "游戏目录 Runtime",
    description: "game/csgo/cfg 中由安装器追踪的 CFG 文件",
    icon: <FileText size={18} className="text-teal" />,
  },
  userCfg: {
    label: "账号目录 Runtime（实验性）",
    description: "userdata 账号 CFG 目录中的受管文件",
    icon: <FileText size={18} className="text-accent-light" />,
  },
  annotations: {
    label: "地图指南",
    description: "annotations/local 中由安装器部署的内容",
    icon: <Map size={18} className="text-accent" />,
  },
  video: {
    label: "视频配置",
    description: "账号目录中的 cs2_video.txt",
    icon: <Monitor size={18} className="text-accent" />,
  },
};

function itemCount(category: CategoryData): number {
  return category.files.length + category.dirs.length;
}

function SmallButton({
  busy,
  busyKey,
  label,
  icon,
  tone,
  onClick,
}: {
  busy: string | null;
  busyKey: string;
  label: string;
  icon: React.ReactNode;
  tone: "accent" | "red";
  onClick: (event: React.MouseEvent) => void;
}) {
  const colors = tone === "red"
    ? "border-red-400/20 text-red-400 hover:bg-red-500/10"
    : "border-accent/20 text-accent hover:bg-accent/10";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy !== null}
      className={`flex min-h-7 items-center gap-1 rounded-[var(--radius-sm)] border bg-bg-card px-2 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${colors}`}
    >
      {busy === busyKey ? <Loader2 size={12} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

export default function AppliedConfigPage() {
  const [installed, setInstalled] = useState<InstalledData | null>(null);
  const [userConfig, setUserConfig] = useState<UserConfigDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextInstalled, nextUser] = await Promise.all([
        window.api.getInstalledData(),
        window.api.getUserConfig(),
      ]);
      setInstalled(nextInstalled);
      setUserConfig(nextUser);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const categories = useMemo(() => {
    if (!installed) return [];
    return (Object.keys(categoryMeta) as CategoryKey[])
      .map((key) => ({ key, data: installed[key] }))
      .filter(({ data }) => itemCount(data) > 0);
  }, [installed]);

  const totalManaged = categories.reduce((sum, category) => sum + itemCount(category.data), 0);
  const runtimeCategory = categories.find(({ key }) => key === "gameCfg" || key === "userCfg");
  const runtimeTarget = runtimeCategory?.key === "userCfg" ? "账号 CFG（实验性）" : "游戏 CFG";

  const runAction = async (key: string, action: () => Promise<unknown>) => {
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
        <PageHeader title="当前安装" description="核对 Runtime、用户配置和安装器受管清单。" />
        <div className="flex items-center justify-center py-12 text-text-muted">
          <Loader2 size={20} className="mr-2 animate-spin" />
          <span className="text-sm">正在核对 Runtime 与用户文件…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="当前安装"
        description="查看安装器负责的 Runtime 文件；VCFG 与用户 custom.cfg 不会混入受管清单。"
      />

      <section className="grid grid-cols-1 gap-3 2xl:grid-cols-3">
        <div className="rounded-[var(--radius)] border border-border bg-bg-card p-4">
          <div className="flex items-center gap-2 text-teal">
            <Boxes size={17} />
            <span className="font-display text-sm font-semibold">Runtime</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-text">{userConfig?.runtimeInstalled ? "已检测到" : "未检测到"}</p>
          <p className="mt-1 text-xs text-text-muted">{runtimeCategory ? `安装目标：${runtimeTarget}` : "没有安装器追踪的 CFG 目录"}</p>
        </div>

        <div className="rounded-[var(--radius)] border border-accent/30 bg-accent-bg p-4">
          <div className="flex items-center gap-2 text-accent">
            <UserRoundCog size={17} />
            <span className="font-display text-sm font-semibold">用户配置</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-text">{userConfig?.exists ? "已保存并受保护" : "尚未写入"}</p>
          <p className="ui-micro mt-1 truncate font-mono" title={userConfig?.path ?? undefined}>{userConfig?.path ?? "未检测到路径"}</p>
        </div>

        <div className="rounded-[var(--radius)] border border-border bg-bg-card p-4">
          <div className="flex items-center gap-2 text-blue">
            <Database size={17} />
            <span className="font-display text-sm font-semibold">安装器清单</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-text">{totalManaged} 个顶层受管项</p>
          <p className="mt-1 text-xs text-text-muted">只记录安装器部署的 CFG、指南与视频文件</p>
        </div>
      </section>

      <div className="ui-body flex gap-3 rounded-[var(--radius)] border border-teal/25 bg-teal/5 px-4 py-3">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-teal" />
        <p>
          删除单项或整个类别只处理安装器清单中的 Runtime 资产；
          <code className="mx-1 font-mono text-xs text-text">srp-cfg/user/custom.cfg</code>
          会被先保存再原样放回。游戏管理的 VCFG 也不会被删除。
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-border bg-bg-card p-8 text-center">
          <PackageX size={28} className="mx-auto mb-2 text-text-faint" />
          <p className="text-sm text-text-muted">安装器当前没有追踪到已部署配置</p>
          {userConfig?.runtimeInstalled && (
            <p className="mt-1 text-xs text-text-faint">检测到 Runtime 文件，但它可能是手动安装或来自旧清单。</p>
          )}
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
          {categories.map(({ key, data }) => {
            const meta = categoryMeta[key];
            const isOpen = expanded[key] ?? false;
            const items = [
              ...data.dirs.map((name) => ({ name, isDir: true })),
              ...data.files.map((name) => ({ name, isDir: false })),
            ];
            return (
              <div key={key} className="rounded-[var(--radius)] border border-border bg-bg-card">
                <div className="flex flex-wrap items-stretch justify-between gap-y-2 border-b border-transparent">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded((current) => ({ ...current, [key]: !isOpen }))}
                    className="flex min-w-0 basis-72 flex-1 items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        {meta.icon}
                        <h2 className="ui-panel-title">{meta.label}</h2>
                        <span className="text-xs text-text-faint">{items.length} 项</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-text-faint">{meta.description}</p>
                    </div>
                    <ChevronDown size={16} className={`ml-3 shrink-0 text-text-faint transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className="ml-auto flex shrink-0 items-center px-4">
                    <button
                      type="button"
                      onClick={(event) => {
                        if (!window.confirm(`移除 ${meta.label} 中的全部受管项？用户 custom.cfg 会被保留。`)) return;
                        void runAction(`uninstall:${key}`, () => window.api.clearInstallCategory(key));
                      }}
                      disabled={busy !== null}
                      className="flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-red-400/20 px-2.5 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {busy === `uninstall:${key}` ? <Loader2 size={13} className="animate-spin" /> : <PackageX size={13} />}
                      移除本类
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="space-y-1 px-4 pb-4">
                    {items.map(({ name, isDir }) => {
                      const itemKey = `${key}/${name}`;
                      return (
                        <div key={name} className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-border bg-bg-raised px-2.5 py-1.5 text-xs">
                          <div className="flex min-w-0 items-center gap-2">
                            {isDir ? <FolderOpen size={12} className="shrink-0 text-text-faint" /> : <FileText size={12} className="shrink-0 text-text-faint" />}
                            <span className="truncate font-mono text-text">{name}{isDir ? "/" : ""}</span>
                          </div>
                          <div className="ml-auto flex shrink-0 items-center gap-1">
                            <SmallButton
                              busy={busy}
                              busyKey={`delete:${itemKey}`}
                              label="删除"
                              icon={<Trash2 size={12} />}
                              tone="red"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (!window.confirm(`删除受管项 ${name}${isDir ? "/" : ""}？`)) return;
                                void runAction(`delete:${itemKey}`, () => window.api.deleteInstalledItem(key, name));
                              }}
                            />
                            <SmallButton
                              busy={busy}
                              busyKey={`open:${itemKey}`}
                              label="打开"
                              icon={<ExternalLink size={12} />}
                              tone="accent"
                              onClick={(event) => {
                                event.stopPropagation();
                                void runAction(`open:${itemKey}`, () => window.api.openItem("install", key, name));
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {data.path && <p className="ui-micro border-t border-border pt-2 font-mono break-all">{data.path}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
