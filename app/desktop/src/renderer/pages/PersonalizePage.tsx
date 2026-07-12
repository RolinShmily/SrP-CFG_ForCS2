import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Braces,
  Check,
  Copy,
  Database,
  FolderOpen,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
  Undo2,
  UserRoundCog,
  Wand2,
} from "lucide-react";
import type { DetectionResult, UserConfigDocument, VcfgSnapshot } from "../types";
import PageHeader from "../components/PageHeader";

interface Props {
  detection: DetectionResult | null;
  onDirtyChange: (dirty: boolean) => void;
}

function formatModifiedAt(value: number | null): string {
  if (!value) return "尚未写入磁盘";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export default function PersonalizePage({ detection, onDirtyChange }: Props) {
  const [document, setDocument] = useState<UserConfigDocument | null>(null);
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [vcfgSnapshot, setVcfgSnapshot] = useState<VcfgSnapshot | null>(null);
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [importCategories, setImportCategories] = useState({
    bindings: true,
    analogBindings: false,
    userConvars: true,
    machineConvars: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await window.api.getUserConfig();
      setDocument(next);
      setContent(next.content);
      setSavedContent(next.content);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!detection) return;
    void load();
  }, [detection?.cs2CfgPath, detection?.userCfgPath, load]);

  const dirty = content !== savedContent;
  const lineCount = useMemo(() => (content.length === 0 ? 0 : content.split(/\r?\n/).length), [content]);

  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const preventClose = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventClose);
    return () => window.removeEventListener("beforeunload", preventClose);
  }, [dirty]);

  const save = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const next = await window.api.saveUserConfig(content);
      setDocument(next);
      setContent(next.content);
      setSavedContent(next.content);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  }, [content]);

  const copyCommand = useCallback(async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
      window.setTimeout(() => setCopiedCommand(null), 1600);
    } catch {
      setError(`无法写入剪贴板，请手动复制 ${command}`);
    }
  }, []);

  const setBasePreset = useCallback((preset: string) => {
    const command = `srp_apply_${preset}`;
    const presetLine = /^\s*(?:\/\/\s*)?(srp_apply_(?:default|echo|yszh|visionl))\s*$/i;
    let selected = false;
    const lines = content.split(/\r?\n/).map((line) => {
      const match = line.match(presetLine);
      if (!match) return line;
      const current = match[1].toLowerCase();
      if (current === command && !selected) {
        selected = true;
        return command;
      }
      return `// ${current}`;
    });

    if (!selected) lines.unshift(command, "");
    setContent(lines.join("\n"));
  }, [content]);

  const clearBasePreset = useCallback(() => {
    const presetLine = /^\s*(?:\/\/\s*)?(srp_apply_(?:default|echo|yszh|visionl))\s*$/i;
    setContent(content.split(/\r?\n/).map((line) => {
      const match = line.match(presetLine);
      return match ? `// ${match[1].toLowerCase()}` : line;
    }).join("\n"));
  }, [content]);

  const captureSnapshot = useCallback(async () => {
    setImporting(true);
    setError("");
    try {
      const snapshot = await window.api.captureVcfgSnapshot();
      if (!snapshot) {
        setError("未检测到用户 CFG 目录，无法读取 VCFG 状态");
        setVcfgSnapshot(null);
      } else if (
        Object.keys(snapshot.bindings).length === 0 &&
        Object.keys(snapshot.analogBindings).length === 0 &&
        Object.keys(snapshot.userConvars).length === 0 &&
        Object.keys(snapshot.machineConvars).length === 0
      ) {
        setError("VCFG 文件为空或不存在，请先在游戏中修改设置后重试");
        setVcfgSnapshot(null);
      } else {
        setVcfgSnapshot(snapshot);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setVcfgSnapshot(null);
    } finally {
      setImporting(false);
    }
  }, []);

  const insertImportedCfg = useCallback(async () => {
    if (!vcfgSnapshot) return;
    setGenerating(true);
    setError("");
    try {
      const generated = await window.api.generateCfgFromSnapshot(importCategories);
      if (!generated || !generated.trim()) {
        setError("所选类别中没有可写入的内容");
        return;
      }
      const timestamp = new Date().toLocaleString("zh-CN");
      const vcfgBlock = [
        `// ─── VCFG Import Layer (${timestamp}) ───`,
        generated,
        `// ─── VCFG Import Layer End ───`,
      ].join("\n");

      // 1. 移除已有的 VCFG 导入块（"VCFG Import Layer" 到 "VCFG Import Layer End"）
      const lines = content.split(/\r?\n/);
      const cleaned: string[] = [];
      let skipping = false;
      for (const line of lines) {
        if (!skipping && line.includes("VCFG Import Layer") && !line.includes("End") && line.trimStart().startsWith("//")) {
          skipping = true;
          continue;
        }
        if (skipping && line.includes("VCFG Import Layer End")) {
          skipping = false;
          continue;
        }
        if (skipping) continue;
        cleaned.push(line);
      }

      // 2. 在 Preset Layer End 和 User Layer 之间插入
      const presetEndIdx = cleaned.findIndex((l) => l.includes("Preset Layer End"));
      const userLayerIdx = cleaned.findIndex((l) => l.includes("SrP-CFG User Layer"));
      if (presetEndIdx >= 0 && userLayerIdx >= 0 && userLayerIdx > presetEndIdx) {
        cleaned.splice(userLayerIdx, 0, vcfgBlock, "");
      } else {
        // 空文件或无标记：从头部插入
        cleaned.unshift(vcfgBlock, "");
      }

      setContent(cleaned.join("\n"));
      setVcfgSnapshot(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setGenerating(false);
    }
  }, [content, vcfgSnapshot, importCategories]);

  const undoVcfgImport = useCallback(() => {
    const lines = content.split(/\r?\n/);
    const result: string[] = [];
    let skipping = false;
    let found = false;
    for (const line of lines) {
      if (!skipping && line.includes("VCFG Import Layer") && !line.includes("End") && line.trimStart().startsWith("//")) {
        skipping = true;
        found = true;
        continue;
      }
      if (skipping && line.includes("VCFG Import Layer End")) {
        skipping = false;
        continue;
      }
      if (skipping) continue;
      result.push(line);
    }
    if (!found) {
      setError("没有找到可撤销的 VCFG 导入块");
      return;
    }
    setContent(result.join("\n"));
  }, [content]);

  const hasActivePreset = /^\s*srp_apply_(?:default|echo|yszh|visionl)\s*$/mi.test(content);
  const hasVcfgImport = content.includes("VCFG Import Layer") && content.includes("VCFG Import Layer End");

  if (!detection || loading) {
    return (
      <div className="min-h-full flex items-center justify-center text-text-muted">
        <Loader2 size={22} className="animate-spin mr-3 text-accent" />
        正在定位你的 SrP-CFG 用户层…
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        eyebrow="USER CONFIGURATION"
        icon={<UserRoundCog size={14} />}
        title="我的配置"
        description="这是你与 Runtime 之间的唯一配置入口。选择一个内置 Preset 起点，再在下面写个人差异；更新、恢复与卸载 Runtime 时都会保留此文件。"
        actions={(
          <div className={`rounded-full border px-3 py-1.5 font-mono text-xs ${dirty ? "border-accent/50 bg-accent-bg text-accent" : "border-green/30 bg-green/5 text-green"}`}>
            {dirty ? "有未保存修改" : "已保存"}
          </div>
        )}
      />

      <section className="grid grid-cols-1 items-stretch gap-3 2xl:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="rounded-[var(--radius)] border border-border bg-bg-card p-4">
          <div className="flex items-center gap-2 text-teal">
            <Braces size={17} />
            <span className="font-display text-sm font-semibold">Runtime</span>
          </div>
          <p className="mt-2 font-mono text-xs text-text">功能与 alias</p>
          <p className="mt-1 text-xs text-text-muted">每次启动先注册，不主动应用偏好</p>
        </div>
        <ArrowRight size={18} className="hidden self-center text-text-faint lg:block" />
        <div className="rounded-[var(--radius)] border border-accent/35 bg-accent-bg p-4 shadow-[inset_3px_0_0_var(--color-accent)]">
          <div className="flex items-center gap-2 text-accent">
            <ShieldCheck size={17} />
            <span className="font-display text-sm font-semibold">User</span>
          </div>
          <p className="mt-2 font-mono text-xs text-text">custom.cfg</p>
          <p className="mt-1 text-xs text-text-muted">Preset 起点 + 个人覆盖，内容归你</p>
        </div>
        <ArrowRight size={18} className="hidden self-center text-text-faint lg:block" />
        <div className="rounded-[var(--radius)] border border-border bg-bg-card p-4">
          <div className="flex items-center gap-2 text-blue">
            <Database size={17} />
            <span className="font-display text-sm font-semibold">CS2 状态</span>
          </div>
          <p className="mt-2 font-mono text-xs text-text">VCFG / Steam Cloud</p>
          <p className="mt-1 text-xs text-text-muted">游戏决定何时保存最终绑定与 ConVar</p>
        </div>
      </section>

      <div className="ui-body flex gap-3 rounded-[var(--radius)] border border-teal/25 bg-teal/5 px-4 py-3">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-teal" />
        <div className="space-y-1">
          <p>
            Runtime 本身不选择偏好。若在 custom.cfg 中启用 <code className="font-mono text-xs text-text">srp_apply_yszh</code>，每次启动会先应用 YSZH，再继续执行它下面的个人命令。
          </p>
          <p className="text-xs text-text-muted">
            不启用任何 srp_apply_* 时，普通游戏设置可继续由 VCFG / Steam Cloud 管理。
          </p>
        </div>
      </div>

      <section className="rounded-[var(--radius)] border border-border bg-bg-card px-4 py-3">
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="min-w-0">
            <h2 className="ui-panel-title">选择 custom.cfg 的 Preset 起点</h2>
            <p className="mt-1 text-xs text-text-muted">
              选择后更新编辑器草稿中的 srp_apply_* 行，不会立即写盘。只保留一个起点，个人差异写在它后面。
            </p>
          </div>
          <select
            value={
              hasActivePreset
                ? content.match(/^\s*srp_apply_(\w+)/mi)?.[1] ?? "vcfg"
                : "vcfg"
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === "vcfg") clearBasePreset();
              else setBasePreset(value);
            }}
            className="min-h-8 shrink-0 rounded-[var(--radius-sm)] border border-border bg-bg-raised px-3 py-1.5 font-mono text-xs text-text transition-colors hover:border-border-highlight focus:border-accent/60 focus:outline-none 2xl:w-auto"
          >
            <option value="vcfg">VCFG 托管</option>
            {["default", "echo", "yszh", "visionl"].map((preset) => (
              <option key={preset} value={preset}>
                srp_apply_{preset}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-bg-card px-4 py-3">
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div className="min-w-0">
            <h2 className="ui-panel-title">写入 VCFG 当前配置</h2>
            <p className="mt-1 text-xs text-text-muted">
              读取当前 VCFG 中的按键绑定与偏好设置，对比 Valve 默认值后只写入你改过的项。写入到 Preset 起点和个人自定义之间的独立分区，可随时撤销。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 2xl:justify-end">
            {hasVcfgImport && (
              <button
                type="button"
                onClick={undoVcfgImport}
                className="flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-red/40 bg-red/5 px-2.5 font-mono text-xs text-red transition-colors hover:border-red/60 hover:bg-red/10"
              >
                <Undo2 size={13} />
                撤销 VCFG 写入
              </button>
            )}
            <button
              type="button"
              onClick={() => void captureSnapshot()}
              disabled={!detection?.userCfgPath || importing}
              className="flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-bg-raised px-2.5 font-mono text-xs text-text-secondary transition-colors hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              {importing ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
              {vcfgSnapshot ? "重新读取" : "读取 VCFG"}
            </button>
          </div>
        </div>

        {vcfgSnapshot && (
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            <p className="text-xs text-text-muted">
              勾选要写入的内容，点击"写入 custom.cfg"将命令插入到 Preset 起点和个人自定义之间的分区。重复写入会替换上一次的内容；可点击"撤销 VCFG 写入"一键移除。
            </p>
            <div className="flex flex-wrap gap-2">
              {([
                { key: "bindings", label: "按键绑定", count: Object.keys(vcfgSnapshot.bindings).length },
                { key: "analogBindings", label: "模拟轴绑定", count: Object.keys(vcfgSnapshot.analogBindings).length },
                { key: "userConvars", label: "个人偏好", count: Object.keys(vcfgSnapshot.userConvars).length },
                { key: "machineConvars", label: "机器设置", count: Object.keys(vcfgSnapshot.machineConvars).length },
              ] as const).map(({ key, label, count }) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setImportCategories((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className={`flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 font-mono text-xs transition-colors ${
                    importCategories[key]
                      ? "border-accent/50 bg-accent-bg text-accent"
                      : "border-border bg-bg-raised text-text-muted hover:border-accent/45 hover:text-accent"
                  }`}
                >
                  {importCategories[key] ? <Check size={13} /> : <Braces size={13} />}
                  {label}
                  <span className="ml-0.5 opacity-60">({count})</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void insertImportedCfg()}
                disabled={generating}
                className="flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-accent bg-accent px-3 text-xs font-semibold text-bg transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                写入 custom.cfg
              </button>
            </div>
          </div>
        )}
      </section>

      {!document?.runtimeInstalled && (
        <div className="flex gap-3 rounded-[var(--radius)] border border-red/30 bg-red/5 px-4 py-3 text-sm text-text-secondary">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red" />
          <p>目标目录中尚未检测到 Runtime。你可以预先保存个人配置，但它要在安装 Runtime Core 后才会随 autoexec 自动执行。</p>
        </div>
      )}

      <section className="overflow-hidden rounded-[var(--radius)] border border-border bg-[#090b11] shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-bg-card px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent-glow)]" />
              <span className="font-mono text-xs text-text">srp-cfg/user/custom.cfg</span>
              <span className="ui-micro rounded bg-bg-raised px-1.5 py-0.5 font-mono">
                {document?.target === "account" ? "账号 CFG 目录" : "游戏 CFG 目录"}
              </span>
            </div>
            <p className="ui-micro mt-1 truncate font-mono select-text" title={document?.path ?? undefined}>
              {document?.path ?? "未找到可用路径"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void window.api.openUserConfigFolder().catch((reason) => setError(String(reason)))}
              disabled={!document?.path}
              className="flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-bg-raised px-3 text-xs text-text-secondary transition-colors hover:border-border-highlight hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FolderOpen size={14} /> 打开目录
            </button>
            <button
              type="button"
              onClick={() => {
                if (dirty && !window.confirm("重新读取会丢弃尚未保存的修改，继续吗？")) return;
                void load();
              }}
              className="flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-bg-raised px-3 text-xs text-text-secondary transition-colors hover:border-border-highlight hover:text-text"
            >
              <RotateCcw size={14} /> 重新读取
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={!document?.path || !dirty || saving}
              className="flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-accent bg-accent px-3 text-xs font-semibold text-bg transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:border-border disabled:bg-bg-raised disabled:text-text-faint"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              保存
            </button>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
              event.preventDefault();
              if (dirty && !saving) void save();
            }
          }}
          spellCheck={false}
          aria-label="个人 CFG 编辑器"
          className="block min-h-[420px] w-full resize-y bg-transparent px-5 py-4 font-mono text-[13px] leading-6 text-[#d8dee9] outline-none select-text placeholder:text-text-faint"
          placeholder="// 在这里写入你的灵敏度、准星、声音、HUD、按键或个人 alias"
        />

        <div className="ui-micro flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border bg-bg-card px-4 py-2 font-mono">
          <span>{lineCount} lines · UTF-8 · {formatModifiedAt(document?.modifiedAt ?? null)}</span>
          <span>Ctrl + S 保存</span>
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-[var(--radius-sm)] border border-red/30 bg-red/5 px-4 py-2.5 text-sm text-red">
          {error}
        </div>
      )}

      <section className="divide-y divide-border rounded-[var(--radius)] border border-border bg-bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-display text-sm font-semibold">让当前游戏会话立即生效</p>
            <p className="mt-0.5 text-xs text-text-muted">保存后执行重载；它会重新注册 Runtime，再按 custom.cfg 中的顺序执行 Preset 起点和个人差异。</p>
          </div>
          <button
            type="button"
            onClick={() => void copyCommand("srp_reload")}
            className="flex min-h-8 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] border border-border-highlight bg-bg-raised px-3 font-mono text-xs text-text transition-colors hover:border-accent/60 hover:text-accent"
          >
            {copiedCommand === "srp_reload" ? <Check size={14} className="text-green" /> : <Copy size={14} />}
            {copiedCommand === "srp_reload" ? "已复制" : "srp_reload"}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-display text-sm font-semibold">临时回到 Valve 测试基线</p>
            <p className="mt-0.5 text-xs text-text-muted">只重置当前状态，不修改 custom.cfg 或直接写 VCFG；测试结束后用 srp_reload 返回个人配置。</p>
          </div>
          <button
            type="button"
            onClick={() => void copyCommand("srp_reset_valve")}
            className="flex min-h-8 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] border border-accent/35 bg-accent-bg px-3 font-mono text-xs text-accent transition-colors hover:border-accent/65"
          >
            {copiedCommand === "srp_reset_valve" ? <Check size={14} className="text-green" /> : <Copy size={14} />}
            {copiedCommand === "srp_reset_valve" ? "已复制" : "srp_reset_valve"}
          </button>
        </div>
      </section>
    </div>
  );
}
