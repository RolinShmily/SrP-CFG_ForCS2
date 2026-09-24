/**
 * 功能页 /features —— 以可交互键盘讲清按键，并在其上做个人改键。
 *
 * 阶段 1：只读画布。双轴选择（预设 × 模块开关），按开启顺序叠加出「生效键位」，
 *          按层着色，点键看详情。
 * 阶段 2：个人改键。改键叠成一个合成层「我的改键」压在最上面（对应 custom.cfg 写在
 *          preset 行之后），所以画布 / 计数 / 详情全自动跟着变；再按上下文导出成
 *          custom.cfg 片段（预设=普通 bind，模块=包住入口 alias，原因见 rebind-export.ts）。
 *
 * 改键按「上下文」分组存储：上下文 = 当前预设 + 当前已开模块及其顺序。
 * 同一按键出现在多个上下文时，导出片段里后面的段覆盖前面的。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MetaFunction } from "react-router";
import { Card, SectionHeader } from "@srp-cfg/ui";
import { Check, Copy, Download, Info, Keyboard, RotateCcw, Undo2 } from "lucide-react";
import { CfgHighlight } from "../components/features/CfgHighlight";
import { CommandPicker } from "../components/features/CommandPicker";
import { CrosshairLibrary } from "../components/features/CrosshairLibrary";
import { KeymapCanvas } from "../components/features/KeymapCanvas";
import { layerAccent } from "../components/features/layer-colors";
import {
  applyRebinds,
  keymaps,
  moduleLayers,
  presetLayers,
  resolveAliasChain,
  resolveKeymap,
  USER_LAYER,
  type KeymapLayer,
  type RebindMap,
} from "../components/features/keymaps-data";
import { generateRebindCfg } from "../components/features/rebind-export";

export const meta: MetaFunction = () => [
  { title: "功能 — SrP-CFG" },
  {
    name: "description",
    content:
      "以可交互键盘查看 SrP-CFG 各功能与会话模式的默认按键，自定义绑定后导出进 custom.cfg",
  },
];

const DEFAULT_PRESET = "presets/default";
const STORAGE_KEY = "srp_user_rebinds";

/** 上下文签名：预设 + 已开模块（含顺序，因为顺序决定覆盖关系）。 */
const ctxSig = (presetId: string, modules: string[]) => `${presetId}|${modules.join(",")}`;

const splitSig = (sig: string): { presetId: string; moduleIds: string[] } => {
  const [presetId, mods] = sig.split("|");
  return { presetId, moduleIds: mods ? mods.split(",") : [] };
};

type RebindStore = Record<string, RebindMap>;

const EMPTY: RebindMap = {};

function loadStore(): RebindStore {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as RebindStore) : {};
  } catch {
    return {};
  }
}

/** 入口键：哪个键会应用这个模块的 keymap（cfg 里绑到 entryAlias 的那个键）。 */
const entryKeyOf = (entryAlias: string | null): string | null => {
  if (!entryAlias) return null;
  for (const layer of keymaps.layers) {
    const hit = layer.entries.find((e) => e.op === "bind" && e.target === entryAlias);
    if (hit) return hit.key;
  }
  return null;
};

/** 切换器按钮：中文名 + 源码标识（+ 可选的入口键），颜色即该层在画布上的颜色。 */
function LayerButton({
  layer,
  active,
  entryKey,
  onClick,
}: {
  layer: KeymapLayer;
  active: boolean;
  entryKey?: string | null;
  onClick: () => void;
}) {
  const accent = layerAccent(layer.id);
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${layer.label} · ${layer.file}`}
      className="flex flex-col items-start gap-1 rounded-[8px] border border-border bg-bg-raised px-3 py-2 text-left transition-colors hover:border-border-highlight"
      style={active ? { borderColor: accent.border, background: accent.bg } : undefined}
    >
      <span className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: accent.fg, opacity: active ? 1 : 0.45 }}
        />
        <span
          className="text-xs font-semibold text-text-secondary"
          style={active ? { color: accent.fg } : undefined}
        >
          {layer.label}
        </span>
        {entryKey && (
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-faint">
            {entryKey}
          </kbd>
        )}
      </span>
      <span className="pl-4 font-mono text-[10px] leading-none text-text-faint">{layer.id}</span>
    </button>
  );
}

export default function FeaturesPage() {
  const [presetId, setPresetId] = useState(DEFAULT_PRESET);
  // 数组顺序 = 开启顺序，后者覆盖前者（与「先按 P 再按 [」的真实行为一致）
  const [enabled, setEnabled] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [store, setStore] = useState<RebindStore>(loadStore);
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // 隐私模式下写不进去，不影响本次会话的改键
    }
  }, [store]);

  const sig = ctxSig(presetId, enabled);
  const rebinds = store[sig] ?? EMPTY;

  const effective = useMemo(
    () => applyRebinds(resolveKeymap(presetId, enabled), rebinds),
    [presetId, enabled, rebinds],
  );

  const stats = useMemo(() => {
    let bound = 0;
    let cleared = 0;
    for (const item of effective.values()) {
      if (item.active?.entry.op === "bind") bound++;
      else if (item.active?.entry.op === "unbind") cleared++;
    }
    return { bound, cleared };
  }, [effective]);

  const activeLayers = useMemo(() => {
    const list = [presetId, ...enabled]
      .map((id) => keymaps.layers.find((l) => l.id === id))
      .filter((l): l is KeymapLayer => Boolean(l));
    return Object.keys(rebinds).length > 0 ? [...list, USER_LAYER] : list;
  }, [presetId, enabled, rebinds]);

  /** alias 名 → 当前生效键位里绑它的键，供选单提示「已被占用」。 */
  const usage = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of effective.values()) {
      const t = item.active?.entry.op === "bind" ? item.active.entry.target : undefined;
      if (t && !map.has(t)) map.set(t, item.key);
    }
    return map;
  }, [effective]);

  const selected = selectedKey ? effective.get(selectedKey) : undefined;
  const selectedRebind = selectedKey && selectedKey in rebinds ? rebinds[selectedKey] : undefined;

  const toggleModule = (id: string) =>
    setEnabled((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const writeRebind = useCallback(
    (key: string, target: string | null | undefined) => {
      setStore((prev) => {
        const current = { ...(prev[sig] ?? {}) };
        if (target === undefined) delete current[key];
        else current[key] = target;
        const next = { ...prev };
        if (Object.keys(current).length === 0) delete next[sig];
        else next[sig] = current;
        return next;
      });
    },
    [sig],
  );

  const totalRebinds = useMemo(
    () => Object.values(store).reduce((n, r) => n + Object.keys(r).length, 0),
    [store],
  );

  const exported = useMemo(
    () =>
      generateRebindCfg(
        Object.entries(store).map(([s, r]) => ({ ...splitSig(s), rebinds: r })),
      ),
    [store],
  );

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exported.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // 剪贴板不可用（非 https / 无权限）时用户仍可从预览区手动复制
    }
  };

  const downloadExport = () => {
    const blob = new Blob([exported.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "custom.cfg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-7">
        <SectionHeader
          level="h1"
          label="Features"
          title="功能"
          description="用一张可交互的键盘讲清 SrP-CFG 的默认按键与自定义绑定，改完直接导出进 custom.cfg。"
        />

        {/* ── 选择器：预设 × 模块 ─────────────────────────────── */}
        <div className="mb-6 space-y-5 rounded-[8px] border border-border bg-bg-card p-5">
          <div>
            <div className="mb-2.5 flex items-baseline gap-2">
              <span className="text-xs font-semibold text-text-muted">预设</span>
              <span className="font-mono text-[10px] text-text-faint">presets/*/keymap.cfg</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {presetLayers.map((layer) => (
                <LayerButton
                  key={layer.id}
                  layer={layer}
                  active={presetId === layer.id}
                  onClick={() => setPresetId(layer.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2.5 flex items-baseline gap-2">
              <span className="text-xs font-semibold text-text-muted">模块</span>
              <span className="font-mono text-[10px] text-text-faint">
                features/*/keymap.cfg · modes/*/keymap.cfg
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {moduleLayers.map((layer) => (
                <LayerButton
                  key={layer.id}
                  layer={layer}
                  active={enabled.includes(layer.id)}
                  entryKey={entryKeyOf(layer.entryAlias)}
                  onClick={() => toggleModule(layer.id)}
                />
              ))}
            </div>
          </div>

          {/* 当前生效层：把画布上的颜色和具体层对上 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3">
            <span className="text-[11px] text-text-muted">当前生效层（按叠加顺序）</span>
            {activeLayers.map((layer, i) => {
              const accent = layerAccent(layer.id);
              return (
                <span key={layer.id} className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-text-faint">{i + 1}.</span>
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: accent.fg }} />
                  <span className="font-mono text-text-secondary">{layer.label}</span>
                </span>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3 text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-[3px] border border-white/25 bg-white/20" />
              生效绑定 {stats.bound}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-[3px] border-2 border-white/40 bg-transparent" />
              被上层解绑 {stats.cleared}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-[3px] border border-border bg-bg-raised" />
              未绑定
            </span>
            {totalRebinds > 0 && (
              <span className="flex items-center gap-1.5 text-text-secondary">
                <span className="inline-block h-3 w-3 rounded-[3px] border border-white/60 bg-white/70" />
                我的改键 {totalRebinds} 处
              </span>
            )}
            <span className="text-text-faint">
              共 {keymaps.layers.length} 层 · 数据由 config/ 生成
            </span>
          </div>
        </div>

        {/* ── 画布 ───────────────────────────────────────────── */}
        <KeymapCanvas effective={effective} selectedKey={selectedKey} onSelect={setSelectedKey} />

        {/* ── 详情面板 ───────────────────────────────────────── */}
        <div className="mt-6">
          {!selected ? (
            <Card padding="none" className="flex items-center gap-3 p-5 text-sm text-text-muted">
              <Keyboard className="h-4 w-4 shrink-0 text-text-faint" />
              <span>点击任意按键查看它的生效来源、层级覆盖历史与 alias 链，并可直接改键。</span>
            </Card>
          ) : (
            <Card padding="none" className="p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-border pb-3">
                <kbd className="rounded border border-border bg-bg-raised px-2 py-1 font-mono text-xs text-text">
                  {selectedKey}
                </kbd>
                <span className="text-sm font-semibold text-text">
                  {keymaps.keyLabels[selectedKey ?? ""] ?? selectedKey}
                </span>
                {selected.active?.entry.op === "bind" && (
                  <span
                    className="rounded px-2 py-1 font-mono text-xs"
                    style={{
                      background: layerAccent(selected.active.layer.id).bg,
                      color: layerAccent(selected.active.layer.id).fg,
                    }}
                  >
                    {selected.active.entry.target}
                  </span>
                )}
                {selected.active?.entry.op === "unbind" && (
                  <span className="text-xs text-text-muted">
                    已被「{selected.active.layer.label}」解绑
                  </span>
                )}

                <div className="ml-auto flex flex-wrap items-center gap-2">
                  {selectedRebind !== undefined && (
                    <button
                      type="button"
                      onClick={() => writeRebind(selectedKey as string, undefined)}
                      className="flex items-center gap-1.5 rounded-[6px] border border-border px-2.5 py-1.5 text-xs text-text-muted hover:border-border-highlight hover:text-text"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      撤销改键
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPicking((v) => !v)}
                    className="rounded-[6px] border px-2.5 py-1.5 text-xs"
                    style={{
                      borderColor: layerAccent(USER_LAYER.id).border,
                      color: layerAccent(USER_LAYER.id).fg,
                    }}
                  >
                    {picking ? "收起选单" : "改键…"}
                  </button>
                </div>
              </div>

              {picking && selectedKey && (
                <div className="mb-4">
                  <CommandPicker
                    onPick={(target) => {
                      writeRebind(selectedKey, target);
                      setPicking(false);
                    }}
                    usage={usage}
                  />
                </div>
              )}

              {selected.active?.entry.op === "bind" && selected.active.entry.comment && (
                <p className="mb-4 text-sm leading-7 text-text-secondary">
                  {selected.active.entry.comment}
                </p>
              )}

              <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
                层级覆盖（按应用顺序）
              </h3>
              <ol className="mb-4 space-y-1.5">
                {selected.history.map((hit, i) => {
                  const accent = layerAccent(hit.layer.id);
                  return (
                    <li key={i} className="flex flex-wrap items-baseline gap-2 text-xs">
                      <span className="text-text-faint">{i + 1}.</span>
                      <span
                        className="h-2.5 w-2.5 shrink-0 self-center rounded-[3px]"
                        style={{ background: accent.fg }}
                      />
                      <span className="font-semibold" style={{ color: accent.fg }}>
                        {hit.layer.label}
                      </span>
                      <span className="font-mono text-text-faint">{hit.layer.id}</span>
                      {hit.entry.op === "bind" ? (
                        <span className="font-mono text-text-secondary">{hit.entry.target}</span>
                      ) : (
                        <span className="text-text-muted">unbind</span>
                      )}
                      {hit.entry.comment && (
                        <span className="text-text-faint">— {hit.entry.comment}</span>
                      )}
                    </li>
                  );
                })}
              </ol>

              {selected.active?.entry.op === "bind" &&
                (() => {
                  const chain = resolveAliasChain(selected.active.entry.target ?? "");
                  if (chain.length === 0) return null;
                  return (
                    <>
                      <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
                        alias 链
                      </h3>
                      <ol className="space-y-1.5">
                        {chain.map((step, i) => (
                          <li key={i} className="text-xs leading-6">
                            <span className="font-mono text-accent">{step.name}</span>
                            <span className="text-text-faint"> — {step.def.comment}</span>
                            <div className="font-mono text-[11px] text-text-faint opacity-70">
                              {step.def.body}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </>
                  );
                })()}
            </Card>
          )}
        </div>

        {/* ── 导出 ───────────────────────────────────────────── */}
        {/* ── 准星 / 视角库（默认折叠）───── */}
        <div className="mt-6">
          <CrosshairLibrary />
        </div>

        <div className="mt-6">
          <Card padding="none" className="p-5">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-semibold text-text">导出个人改键</h2>
              {exported.count > 0 ? (
                <span className="text-xs text-text-muted">
                  共 {exported.count} 条，分 {Object.keys(store).length} 个上下文
                </span>
              ) : (
                <span className="text-xs text-text-muted">
                  还没有改键。点画布上的按键，再点「改键…」选一个命令。
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  disabled={exported.count === 0}
                  onClick={copyExport}
                  className="flex items-center gap-1.5 rounded-[6px] border border-border px-3 py-1.5 text-xs text-text-muted hover:border-border-highlight hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "已复制" : "复制片段"}
                </button>
                <button
                  type="button"
                  disabled={exported.count === 0}
                  onClick={downloadExport}
                  className="flex items-center gap-1.5 rounded-[6px] border border-border px-3 py-1.5 text-xs text-text-muted hover:border-border-highlight hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download className="h-3.5 w-3.5" />
                  下载 custom.cfg
                </button>
                {totalRebinds > 0 && (
                  <button
                    type="button"
                    onClick={() => setStore({})}
                    className="flex items-center gap-1.5 rounded-[6px] border border-border px-3 py-1.5 text-xs text-text-muted hover:border-border-highlight hover:text-text"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    清空全部
                  </button>
                )}
              </div>
            </div>

            {exported.count > 0 && <CfgHighlight code={exported.text} />}

            {exported.skipped.length > 0 && (
              <p className="mt-2 text-xs text-text-muted">
                ⚠ {exported.skipped.length} 条含引号或空格，无法安全写出，已在片段末尾列出。
              </p>
            )}
          </Card>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-[8px] border border-border bg-bg-card p-4 text-xs leading-6 text-text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-faint" />
          <span>
            按键数据由 <code className="font-mono text-text-secondary">scripts/extract-keymaps.mjs</code>{" "}
            从 <code className="font-mono text-text-secondary">config/srp-cfg</code> 直接生成，与仓库里的
            cfg 同源。导出片段里预设部分是普通 bind、模块部分会包住入口 alias，
            这样按下入口键应用键盘映射时你的改键不会被覆盖。
          </span>
        </div>
      </div>
    </section>
  );
}
