/**
 * TerminalDemo —— 终端演示卡（对应原 TerminalDemo.astro，React 化）。
 * 展示 v3 启动执行轨迹（GAME STATE → RUNTIME → USER）。
 * owner 徽章使用共享 Badge（@srp-cfg/ui，outline + teal/default 变体）。
 */
import { Check, Cloud, FileCode2, UserRoundCog } from "lucide-react";
import { Badge } from "@srp-cfg/ui";

// TODO(L3.2 下载页)：LATEST_VERSION 来自 data/version.ts（顶层 await），暂以静态 "3" 渲染，
// 待下载页迁移时改 SSG loader / 构建期注入。
const LATEST_VERSION = "3";

const trace = [
  {
    step: "01",
    label: "GAME STATE",
    title: "CS2 载入 VCFG",
    detail: "bindings + archived ConVars",
    owner: "VALVE OWNED",
    icon: Cloud,
    tone: "teal",
  },
  {
    step: "02",
    label: "RUNTIME",
    title: "runtime/init.cfg",
    detail: "aliases · features · modes · helps",
    owner: "PROJECT",
    icon: FileCode2,
    tone: "accent",
  },
  {
    step: "03",
    label: "USER",
    title: "user/custom.cfg",
    detail: "Preset 起点 → 个人最终覆盖",
    owner: "YOU",
    icon: UserRoundCog,
    tone: "accent",
  },
] as const;

export function TerminalDemo() {
  return (
    <div
      className="overflow-hidden rounded-[18px] border border-border bg-[#0b0e14] shadow-[0_28px_90px_rgba(0,0,0,0.42)]"
      aria-label="SrP-CFG v3 启动执行轨迹"
    >
      <div className="flex items-center justify-between border-b border-border bg-bg-raised/70 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-red/70"></span>
          <span className="h-2 w-2 rounded-full bg-accent-light/70"></span>
          <span className="h-2 w-2 rounded-full bg-green/70"></span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint">
          runtime_boot_trace / v{LATEST_VERSION}
        </span>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-dashed border-border pb-3 font-mono text-[11px] uppercase tracking-[0.13em] text-text-faint">
          <span>Execution order</span>
          <span className="text-green">deterministic</span>
        </div>

        <ol className="space-y-2.5">
          {trace.map((item) => (
            <li
              key={item.step}
              className="grid grid-cols-[2rem_1fr] gap-3 rounded-[var(--radius)] border border-border bg-bg-card p-3.5 sm:grid-cols-[2rem_2.5rem_1fr_auto] sm:items-center sm:p-4"
            >
              <span className="font-mono text-xs text-text-faint">{item.step}</span>
              <span
                className={[
                  "hidden h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border sm:flex",
                  item.tone === "teal"
                    ? "border-teal/20 bg-teal/5 text-teal"
                    : "border-accent/20 bg-accent-bg text-accent",
                ].join(" ")}
              >
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint">
                  {item.label}
                </span>
                <strong className="mt-0.5 block font-display text-base font-semibold text-text">
                  {item.title}
                </strong>
                <span className="mt-0.5 block break-words font-mono text-[11px] text-text-muted">
                  {item.detail}
                </span>
              </span>
              <Badge
                variant={item.tone === "teal" ? "teal" : "default"}
                outline
                className="col-start-2 mt-2 w-fit rounded-full px-2 py-1 uppercase tracking-[0.12em] sm:col-auto sm:mt-0"
              >
                {item.owner}
              </Badge>
            </li>
          ))}
        </ol>

        <div className="mt-4 rounded-[var(--radius)] border border-green/20 bg-green/5 px-4 py-3 font-mono text-xs text-green">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Runtime → Preset? → User → VCFG may save result
          </span>
        </div>
      </div>
    </div>
  );
}
