/**
 * CommandCard —— 单条指令卡片（对应旧 commands.astro 的 renderCommands 卡片，React 化）。
 * 容器用共享 Card（hoverable 与旧 hover 完全一致）；flag 徽章用共享 Badge；
 * 复制按钮用共享 CopyButton（含“已复制”反馈）；数值说明用 <details> 展开。
 */
import { Link } from "react-router";
import { Badge, Card, CopyButton } from "@srp-cfg/ui";
import type { CommandRecord, CommandValueInfo } from "./commands-data";

function formatRange(range?: { min?: string; max?: string }): string {
  if (!range) return "";
  if (range.min !== undefined && range.max !== undefined) return `${range.min}–${range.max}`;
  if (range.min !== undefined) return `≥ ${range.min}`;
  if (range.max !== undefined) return `≤ ${range.max}`;
  return "";
}

export function ValueDetails({ value }: { value: CommandValueInfo }) {
  const constraint = formatRange(value.constraint);
  const documentedRange = formatRange(value.documented_range);
  const summaryTags = [
    constraint ? `引擎约束 ${constraint}` : "",
    documentedRange ? `说明范围 ${documentedRange}` : "",
    value.options?.length ? `${value.options.length} 个明确取值` : "",
  ].filter(Boolean);

  return (
    <details className="mt-3 rounded-[8px] border border-border/70 bg-bg/45 open:border-accent/25 open:bg-accent-bg/20">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-left marker:hidden">
        <span className="font-display text-xs font-semibold text-text-secondary">数值说明</span>
        <span className="text-right font-mono text-[11px] leading-4 text-text-faint">
          {summaryTags.join(" · ") || "默认值与作用"}
        </span>
      </summary>
      <div className="border-t border-border/60 px-3 pb-3 pt-2.5">
        <p className="text-xs leading-5 text-text-muted">{value.description}</p>
        {value.options?.length ? (
          <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {value.options.map((option) => (
              <div
                key={option.value}
                className="flex min-w-0 items-start gap-2 rounded-[6px] border border-border/70 bg-bg px-2.5 py-2"
              >
                <code className="shrink-0 font-mono text-xs font-bold tabular-nums text-accent-light">
                  {option.value}
                </code>
                <span className="min-w-0 text-xs leading-5 text-text-secondary">{option.label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}

export function CommandCard({ cmd }: { cmd: CommandRecord }) {
  const flags = (cmd.f || []).filter((flag) => !["clientdll", "gamedll", "release"].includes(flag));

  return (
    <Card
      hoverable
      padding="none"
      className="relative flex min-h-[140px] flex-col justify-between p-5"
    >
      <div>
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <Link
            to={`/commands/${cmd.n}`}
            title="查看指令详情"
            className="break-all font-mono text-base font-bold text-accent transition-colors hover:text-accent-light"
          >
            {cmd.n}
          </Link>
          <div className="flex flex-shrink-0 flex-wrap items-center gap-1.5">
            {cmd.t === "var" ? (
              <span className="rounded border border-border bg-bg px-2 py-0.5 font-mono text-xs text-text-muted">
                默认值:{" "}
                <span className="font-bold text-accent-light">
                  {cmd.d !== undefined && cmd.d !== "" ? cmd.d : "无"}
                </span>
              </span>
            ) : (
              <span className="rounded border border-dashed border-border px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-faint">
                Command
              </span>
            )}
          </div>
        </div>
        <p className="mb-1.5 break-words font-body text-sm leading-6 text-text">
          {cmd.cn || "暂无详细中文释义"}
        </p>
        {cmd.en ? (
          <p className="break-words font-body text-xs italic leading-5 text-text-muted">{cmd.en}</p>
        ) : null}
        {cmd.value ? <ValueDetails value={cmd.value} /> : null}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4 border-t border-border/40 pt-3">
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {flags.map((flag) => (
            <Badge
              key={flag}
              variant={flag === "cheat" ? "red" : flag === "archive" ? "teal" : "default"}
              outline
              className={
                flag === "cheat" ? "bg-red/10" : flag === "archive" ? "bg-teal/10" : "bg-bg-raised"
              }
            >
              {flag}
            </Badge>
          ))}
        </div>
        <CopyButton text={cmd.n} className="flex-shrink-0" />
        <Link
          to={`/commands/${cmd.n}`}
          className="flex-shrink-0 rounded-[6px] border border-border bg-bg px-2.5 py-1 font-display text-xs font-semibold text-text-muted transition-colors hover:border-accent-bg hover:text-accent"
        >
          详情
        </Link>
      </div>
    </Card>
  );
}
