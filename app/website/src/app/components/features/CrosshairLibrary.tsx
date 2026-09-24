/**
 * CrosshairLibrary —— 准星库 / 视角库 / 颜色。
 *
 * 存在的理由：一些功能会把 keyc、keyv 这类入口绑到按键上，用户看到「c06」「v06」
 * 这种黑话时不知道它到底长什么样。这里把 config/ 里的预设原样摊开：
 * 每个预设一张截图位 + 全部参数，参数默认收起。
 *
 * 整体默认折叠（按需求），且完全由数据驱动：
 * - 加一个预设 → 改 config/ 后重新跑 scripts/extract-crosshair.mjs
 * - 加一张截图 → 把 <预设 id>.png 丢进 public/images/crosshair/，无需改代码
 * 所以预设和截图都能持续扩展，这个组件不用动。
 */
import { useState } from "react";
import { Check, ChevronDown, Copy, ImageOff } from "lucide-react";
import { Card } from "@srp-cfg/ui";
import { imageHint, type Preset, crosshair as data } from "./crosshair-data";

type TabId = "crosshair" | "viewmodel" | "color";

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: "crosshair", label: "准星库", hint: `c00 – c07 · ${data.crosshairs.length} 个` },
  { id: "viewmodel", label: "视角库", hint: `v00 – v07 · ${data.viewmodels.length} 个` },
  { id: "color", label: "准星颜色", hint: `${data.colors.length} 种` },
];

/** 复制 alias 名，方便直接粘到控制台或 custom.cfg。 */
function CopyAlias({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // 剪贴板不可用时用户仍可手动选中
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      title={`复制 ${value}`}
      className="flex shrink-0 items-center gap-1 rounded-[5px] border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-muted transition-colors hover:border-border-highlight hover:text-text"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {value}
    </button>
  );
}

/** 截图位：有图显示图，没图显示占位并提示该放哪个文件。 */
function Shot({ preset, kind }: { preset: Preset; kind: string }) {
  return (
    <div className="relative overflow-hidden rounded-[6px] border border-border bg-bg">
      {preset.image ? (
        <img
          src={preset.image}
          alt={`${kind}预设 ${preset.id} 的效果截图`}
          loading="lazy"
          className="h-[148px] w-full object-contain"
        />
      ) : (
        <div className="flex h-[148px] w-full flex-col items-center justify-center gap-1.5 border border-dashed border-border/70 px-3 text-center">
          <ImageOff className="h-4 w-4 text-text-faint" />
          <span className="text-[10px] text-text-faint">尚无截图</span>
          <code className="font-mono text-[9px] leading-4 text-text-faint opacity-70">
            {imageHint(preset.id)}
          </code>
        </div>
      )}
    </div>
  );
}

/** 单个预设卡片：截图 + 编号 + 参数（默认收起）。 */
function PresetCard({ preset, kind }: { preset: Preset; kind: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card padding="none" className="flex flex-col gap-3 p-3">
      <Shot preset={preset} kind={kind} />
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-accent">{preset.id}</span>
        <span className="ml-auto">
          <CopyAlias value={preset.alias} />
        </span>
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 self-start text-[11px] text-text-muted transition-colors hover:text-text"
      >
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
        参数 {preset.convars.length} 项
      </button>
      {open && (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-0.5 border-t border-border pt-2 font-mono text-[10px] leading-4">
          {preset.convars.map((c) => (
            <div key={c.name} className="flex items-baseline justify-between gap-2">
              <dt className="truncate text-text-faint" title={c.name}>
                {c.name}
              </dt>
              <dd className="shrink-0 text-text-secondary">{c.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}

export function CrosshairLibrary() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("crosshair");

  const list = tab === "crosshair" ? data.crosshairs : data.viewmodels;

  return (
    <div className="rounded-[8px] border border-border bg-bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-5 text-left"
      >
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-faint transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
        <span className="text-sm font-semibold text-text">准星 / 视角库</span>
        <span className="text-xs text-text-muted">
          准星 c00–c07、视角 v00–v07 与 {data.colors.length} 种准星颜色的实际样子
        </span>
        <span className="ml-auto shrink-0 font-mono text-[10px] text-text-faint">
          {open ? "收起" : "展开"}
        </span>
      </button>

      {open && (
        <div className="border-t border-border p-5 pt-4">
          <p className="mb-4 text-xs leading-6 text-text-muted">
            循环切换的入口是{" "}
            <code className="font-mono text-text-secondary">{data.cycles.crosshair ?? "keyc"}</code>（准星）与{" "}
            <code className="font-mono text-text-secondary">{data.cycles.viewmodel ?? "keyv"}</code>（视角），
            它们默认绑在按键上，键位见上方键盘图。也可以直接在控制台输入预设名切换。
            这里展示的就是 <code className="font-mono text-text-secondary">config/srp-cfg</code> 里的原值。
          </p>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-[6px] border px-3 py-1.5 text-left transition-colors ${
                  tab === t.id
                    ? "border-border-highlight bg-bg-raised text-text"
                    : "border-border text-text-muted hover:border-border-highlight hover:text-text"
                }`}
              >
                <span className="text-xs font-semibold">{t.label}</span>
                <span className="ml-2 font-mono text-[10px] text-text-faint">{t.hint}</span>
              </button>
            ))}
          </div>

          {tab === "color" ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {data.colors.map((c) => (
                  <div
                    key={c.alias}
                    className="flex items-center gap-3 rounded-[6px] border border-border bg-bg p-2.5"
                  >
                    <span
                      className="h-8 w-8 shrink-0 rounded-[5px] border border-white/15"
                      style={{ background: c.hex }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <CopyAlias value={c.alias} />
                      <div className="mt-1 font-mono text-[10px] text-text-faint">
                        {c.r}, {c.g}, {c.b}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
                  其它准星命令
                </h3>
                <ul className="space-y-1.5">
                  {data.extras.map((e) => (
                    <li key={e.alias} className="flex flex-wrap items-baseline gap-2 text-xs">
                      <CopyAlias value={e.alias} />
                      <span className="text-text-faint">{e.comment || e.body}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((p) => (
                <PresetCard key={p.id} preset={p} kind={tab === "crosshair" ? "准星" : "视角"} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
