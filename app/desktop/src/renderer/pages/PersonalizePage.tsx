import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  FolderOpen,
  Loader2,
  RotateCcw,
  Sparkles,
  UserRoundCog,
  Wand2,
} from "lucide-react";
import type { DetectionResult, UserConfigDocument, VcfgSnapshot } from "../types";
import { PageHeader } from "@srp-cfg/ui";
import { CodeEditor } from "../components/CodeEditor";

interface Props {
  detection: DetectionResult | null;
  onDirtyChange: (dirty: boolean) => void;
}

const PRESETS = [
  {
    id: "none",
    name: "无预设 (纯 CLI 模式)",
    command: "",
    desc: "不绑定任何额外键位，纯净运行 Runtime Core，在控制台直接输入 CLI 命令即可调用全套功能",
  },
  {
    id: "default",
    name: "SrP 推荐模版 (Default)",
    command: "srp_apply_default",
    desc: "SrP-CFG 推荐的开箱即用综合模版，包含全套常用快捷键与功能绑定",
  },
  {
    id: "echo",
    name: "Echo 方案",
    command: "srp_apply_echo",
    desc: "偏向竞技与简约的键位和准星习惯",
  },
  {
    id: "yszh",
    name: "YSZH 方案",
    command: "srp_apply_yszh",
    desc: "侧重道具练习与投掷物快速定位",
  },
  {
    id: "visionl",
    name: "VisionL 方案",
    command: "srp_apply_visionl",
    desc: "针对高刷新率与轻量化 HUD 的定制方案",
  },
  {
    id: "valve",
    name: "CS2 默认设置",
    command: "srp_apply_valve",
    desc: "还原 CS2 官方默认按键与准星设置",
  },
];

export default function PersonalizePage({ detection, onDirtyChange }: Props) {
  const [document, setDocument] = useState<UserConfigDocument | null>(null);
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [vcfgSnapshot, setVcfgSnapshot] = useState<VcfgSnapshot | null>(null);
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

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
      setTimeout(() => setLoading(false), 250);
    }
  }, []);

  useEffect(() => {
    if (!detection) return;
    void load();
  }, [detection?.cs2CfgPath, detection?.userCfgPath, load]);

  const dirty = content !== savedContent;

  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);

  const save = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const next = await window.api.saveUserConfig(content);
      setDocument(next);
      setContent(next.content);
      setSavedContent(next.content);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  }, [content]);

  // 检测当前启用的预设
  const activePreset = useMemo(() => {
    for (const p of PRESETS) {
      if (!p.command) continue;
      const reg = new RegExp(`^\\s*${p.command}\\b`, "m");
      if (reg.test(content)) return p.id;
    }
    return "none";
  }, [content]);

  // 切换预设
  const handleSelectPreset = (presetId: string) => {
    const targetPreset = PRESETS.find((p) => p.id === presetId);
    if (!targetPreset) return;

    if (presetId === "none" || !targetPreset.command) {
      // 注释所有已有的 srp_apply_* 命令
      const lines = content.split(/\r?\n/).map((line) => {
        const match = line.match(/^\s*(srp_apply_(?:default|echo|yszh|visionl|valve))\b/i);
        if (match) {
          return `// ${line.trim()}`;
        }
        return line;
      });
      setContent(lines.join("\n"));
      return;
    }

    let updated = content;
    // 注释或替换已有的预设行
    let found = false;
    const lines = updated.split(/\r?\n/).map((line) => {
      const match = line.match(/^\s*(?:\/\/\s*)?(srp_apply_(?:default|echo|yszh|visionl|valve))\b/i);
      if (match) {
        if (!found) {
          found = true;
          return targetPreset.command;
        }
        return `// ${match[1]}`;
      }
      return line;
    });

    if (found) {
      setContent(lines.join("\n"));
    } else {
      setContent(`${targetPreset.command}\n\n${content}`);
    }
  };

  // VCFG 快照提取
  const handleCaptureSnapshot = async () => {
    setImporting(true);
    try {
      const snap = await window.api.captureVcfgSnapshot();
      setVcfgSnapshot(snap);
    } catch (err) {
      setError(`捕获 VCFG 失败: ${err}`);
    } finally {
      setImporting(false);
    }
  };

  // VCFG 生成并注入代码
  const handleGenerateAndAppend = async () => {
    setGenerating(true);
    try {
      const snippet = await window.api.generateCfgFromSnapshot(importCategories);
      if (snippet) {
        const header = `\n\n// ── 从当前 Steam 账号提取的偏好注入 ──\n`;
        setContent((prev) => `${prev.trimEnd()}${header}${snippet}\n`);
      }
    } catch (err) {
      setError(`生成注入代码失败: ${err}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await window.api.openUserConfigFolder();
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <PageHeader
        title="配置注入 (Config Injection)"
        description="Runtime Core 支持纯 CLI 命令调用；你也可以选择官方推荐方案或在下方 custom.cfg 中编写个人键位与自定义参数。"
      />

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 顶部控制区：预设起点单选 + VCFG 提取 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 预设起点单选 */}
        <div className="lg:col-span-2 bg-bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <UserRoundCog className="w-4 h-4 text-orange-400" />
              Runtime Core 启动方案
            </h2>
            <span className="text-[11px] text-text-muted">
              当前方案: <span className="text-orange-400 font-mono font-medium">
                {PRESETS.find((p) => p.id === activePreset)?.name || activePreset}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {PRESETS.map((p) => {
              const isActive = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`flex flex-col text-left p-2.5 rounded-lg border text-xs transition ${
                    isActive
                      ? "bg-orange-500/10 border-orange-500/60 text-orange-300 shadow-sm"
                      : "bg-bg-raised/40 border-border hover:bg-bg-raised text-text-muted hover:text-text"
                  }`}
                >
                  <div className="font-semibold text-text flex items-center justify-between">
                    <span>{p.name}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-orange-400" />}
                  </div>
                  <span className="text-[11px] text-text-faint mt-1 line-clamp-2 leading-tight">
                    {p.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* VCFG 辅助提取 */}
        <div className="bg-bg-card border border-border rounded-lg p-4 space-y-3 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text flex items-center gap-2 mb-2">
              <Wand2 className="w-4 h-4 text-orange-400" />
              VCFG 偏好一键提取
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              从当前 Steam 登录账号的云端与本机 VCFG 中提取准星、持枪视角与按键绑定，自动转换为 CFG 注入到底部。
            </p>

            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary">
                <input
                  type="checkbox"
                  checked={importCategories.bindings}
                  onChange={(e) =>
                    setImportCategories((prev) => ({ ...prev, bindings: e.target.checked }))
                  }
                  className="accent-orange-500"
                />
                <span>按键绑定</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary">
                <input
                  type="checkbox"
                  checked={importCategories.userConvars}
                  onChange={(e) =>
                    setImportCategories((prev) => ({ ...prev, userConvars: e.target.checked }))
                  }
                  className="accent-orange-500"
                />
                <span>准星与视角</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={handleGenerateAndAppend}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              )}
              <span>提取并填入编辑器</span>
            </button>
          </div>
        </div>
      </div>

      {/* 下部编辑器区 */}
      <div className="flex-1 flex flex-col min-h-[420px]">
        <CodeEditor
          value={content}
          onChange={setContent}
          onSave={save}
          title={document?.path ? `srp-cfg/user/custom.cfg (${document.path})` : "srp-cfg/user/custom.cfg"}
          isSaved={!dirty}
          actions={
            <>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/70 rounded-md text-xs font-medium transition whitespace-nowrap select-none disabled:opacity-50"
                title="重新载入磁盘文件"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-neutral-400 ${loading ? "animate-spin" : ""}`} />
                <span>重载</span>
              </button>
              <button
                type="button"
                onClick={handleOpenFolder}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/70 rounded-md text-xs font-medium transition whitespace-nowrap select-none"
                title="在文件资源管理器中打开 CFG 目录"
              >
                <FolderOpen className="w-3.5 h-3.5 text-neutral-400" />
                <span>打开目录</span>
              </button>
            </>
          }
        />
      </div>

      {saveToast && (
        <div className="fixed bottom-6 right-6 p-3 bg-emerald-600 text-white text-xs font-medium rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-4 h-4" />
          <span>custom.cfg 已成功保存至磁盘！</span>
        </div>
      )}
    </div>
  );
}
