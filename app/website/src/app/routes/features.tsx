/**
 * 功能页 /features —— 以可交互键盘讲清按键。
 *
 * 阶段 1（当前）：只读画布。
 * - 双轴选择：预设（5 个）× 模块开关（4 feature + 5 mode，按开启顺序叠加）
 * - 高亮 = 按层依次应用后的「生效键位」，与游戏内真实行为一致；颜色按层区分
 * - 切换器上带源码标识（presets/default、modes/demo-hlae 这种），方便对照仓库文件
 * - 点键看详情：生效来源、被哪些层碰过、alias 链
 * 阶段 2 计划：对 alias 命令改键 + 导出 custom.cfg 片段；阶段 3：准星 / 视角库。
 */
import { useMemo, useState } from "react";
import type { MetaFunction } from "react-router";
import { Card, SectionHeader } from "@srp-cfg/ui";
import { Info, Keyboard } from "lucide-react";
import { KeymapCanvas } from "../components/features/KeymapCanvas";
import { layerAccent } from "../components/features/layer-colors";
import {
  keymaps,
  moduleLayers,
  presetLayers,
  resolveAliasChain,
  resolveKeymap,
  type KeymapLayer,
} from "../components/features/keymaps-data";

export const meta: MetaFunction = () => [
  { title: "功能 — SrP-CFG" },
  {
    name: "description",
    content:
      "以可交互键盘查看 SrP-CFG 各功能与会话模式的默认按键，自定义绑定后复制进 custom.cfg",
  },
];

const DEFAULT_PRESET = "presets/default";

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

  const effective = useMemo(() => resolveKeymap(presetId, enabled), [presetId, enabled]);

  const stats = useMemo(() => {
    let bound = 0;
    let cleared = 0;
    for (const item of effective.values()) {
      if (item.active?.entry.op === "bind") bound++;
      else if (item.active?.entry.op === "unbind") cleared++;
    }
    return { bound, cleared };
  }, [effective]);

  const activeLayers = useMemo(
    () =>
      [presetId, ...enabled]
        .map((id) => keymaps.layers.find((l) => l.id === id))
        .filter((l): l is KeymapLayer => Boolean(l)),
    [presetId, enabled],
  );

  const selected = selectedKey ? effective.get(selectedKey) : undefined;

  const toggleModule = (id: string) =>
    setEnabled((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <section className="pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-7">
        <SectionHeader
          level="h1"
          label="Features"
          title="功能"
          description="用一张可交互的键盘讲清 SrP-CFG 的默认按键与自定义绑定，替代原来难以翻阅的文档页。"
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
                  <span className="font-mono text-text-secondary">{layer.id}</span>
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
              <span>点击任意按键查看它的生效来源、层级覆盖历史与 alias 链。</span>
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
              </div>

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
                      <span className="h-2.5 w-2.5 shrink-0 self-center rounded-[3px]" style={{ background: accent.fg }} />
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

        <div className="mt-6 flex items-start gap-3 rounded-[8px] border border-border bg-bg-card p-4 text-xs leading-6 text-text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-faint" />
          <span>
            按键数据由 <code className="font-mono text-text-secondary">scripts/extract-keymaps.mjs</code>{" "}
            从 <code className="font-mono text-text-secondary">config/srp-cfg</code> 直接生成，与仓库里的
            cfg 同源，不做第二份手写映射。交互式改键与导出 custom.cfg 片段将在下一阶段加入。
          </span>
        </div>
      </div>
    </section>
  );
}
