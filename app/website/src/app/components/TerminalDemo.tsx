/**
 * TerminalDemo —— 动态交互式终端演示卡。
 * 具备实时执行追踪、仿真控制台输出、层级检查与交互式步进回放。
 */
import React, { useState, useEffect, useRef } from "react";
import {
  Check,
  Cloud,
  FileCode2,
  Play,
  RotateCcw,
  Terminal,
  UserRoundCog,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge } from "@srp-cfg/ui";
import { LATEST_VERSION } from "../../data/version";

const traceSteps = [
  {
    step: "01",
    label: "GAME STATE",
    title: "CS2 载入 VCFG",
    detail: "bindings + archived ConVars",
    owner: "VALVE OWNED",
    icon: Cloud,
    tone: "teal",
    logLines: [
      "[CS2] Loading user cloud configuration from cs2_user_keys.vcfg",
      "[CS2] Restoring 18 cached convars from cs2_user_convars_0_slot0.vcfg",
      "[CS2] Active player slot 0 initialized.",
    ],
  },
  {
    step: "02",
    label: "RUNTIME",
    title: "runtime/init.cfg",
    detail: "aliases · features · modes · helps",
    owner: "PROJECT",
    icon: FileCode2,
    tone: "accent",
    logLines: [
      "[SrP-CFG] Executing autoexec.cfg -> runtime/init.cfg",
      "[SrP-CFG] Registered 32 core aliases (crosshair-view, autoview, knife, zeus)",
      "[SrP-CFG] Practice & Preview session modes armed.",
    ],
  },
  {
    step: "03",
    label: "USER",
    title: "user/custom.cfg",
    detail: "Preset 起点 → 个人最终覆盖",
    owner: "YOU",
    icon: UserRoundCog,
    tone: "accent",
    logLines: [
      "[SrP-CFG] Loading personal override user/custom.cfg",
      "[SrP-CFG] Applied template: RoL1n 自用模版 + VCFG preference injection",
      "[SrP-CFG] Runtime ready in 1.4ms (0 conflicts, 100% deterministic).",
    ],
  },
] as const;

export function TerminalDemo() {
  const [activeTab, setActiveTab] = useState<"trace" | "console" | "layers">("trace");
  const [activeStep, setActiveStep] = useState<number>(2); // 0, 1, 2
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // 初始化控制台日志
  useEffect(() => {
    setConsoleLogs([
      "// SrP-CFG Runtime Boot Engine v" + LATEST_VERSION,
      "// Type 'help' or inspect trace below for details.",
      ...traceSteps[0].logLines,
      ...traceSteps[1].logLines,
      ...traceSteps[2].logLines,
    ]);
  }, []);

  // 步进播放逻辑
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= traceSteps.length - 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1400);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleRunSimulation = () => {
    setActiveStep(0);
    setIsPlaying(true);
  };

  return (
    <div
      className="group relative overflow-hidden rounded-[20px] border border-border/80 bg-[#090b10] shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300 hover:border-accent/30 hover:shadow-[0_28px_90px_rgba(242,138,26,0.12)]"
      aria-label="SrP-CFG 启动执行轨迹仿真终端"
    >
      {/* 顶部激光扫描指示线 */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-80" />

      {/* 顶部标题栏与标签页 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-bg-raised/80 px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
          <span className="ml-2 hidden font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint sm:inline">
            runtime_trace.vcfg
          </span>
        </div>

        {/* 交互 Tab 选项卡 */}
        <div className="flex items-center rounded-lg border border-border/60 bg-bg/70 p-0.5 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("trace")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
              activeTab === "trace"
                ? "bg-accent/15 text-accent shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            执行时序
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("console")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
              activeTab === "console"
                ? "bg-accent/15 text-accent shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Terminal className="h-3 w-3" />
            实机控制台
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("layers")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
              activeTab === "layers"
                ? "bg-accent/15 text-accent shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Layers className="h-3 w-3" />
            分层剖析
          </button>
        </div>
      </div>

      {/* 主展示区 */}
      <div className="p-4 sm:p-6">
        {activeTab === "trace" && (
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-dashed border-border/80 pb-3 font-mono text-[11px] uppercase tracking-[0.13em] text-text-faint">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Deterministic Execution
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={isPlaying}
                  className="inline-flex items-center gap-1 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent transition hover:bg-accent/20 active:scale-95 disabled:opacity-50"
                  title="点击模拟执行完整启动时序"
                >
                  {isPlaying ? (
                    <>
                      <RotateCcw className="h-3 w-3 animate-spin" />
                      执行中...
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 fill-accent" />
                      运行仿真
                    </>
                  )}
                </button>
              </div>
            </div>

            <ol className="relative space-y-3">
              {/* 贯穿步骤的动态发光轨道线 */}
              <div className="absolute left-[1.6rem] top-4 bottom-4 w-0.5 bg-border sm:left-[2.2rem]" />
              <div
                className="absolute left-[1.6rem] top-4 w-0.5 bg-gradient-to-b from-teal via-accent to-emerald-400 transition-all duration-500 sm:left-[2.2rem]"
                style={{
                  height: `${((activeStep + 1) / traceSteps.length) * 80}%`,
                }}
              />

              {traceSteps.map((item, idx) => {
                const isSelected = activeStep === idx;
                const isPassed = activeStep > idx;

                return (
                  <li
                    key={item.step}
                    onClick={() => setActiveStep(idx)}
                    className={`group/item relative grid cursor-pointer grid-cols-[2rem_1fr] gap-3 rounded-[var(--radius)] border p-3.5 transition-all duration-200 sm:grid-cols-[2rem_2.5rem_1fr_auto] sm:items-center sm:p-4 ${
                      isSelected
                        ? item.tone === "teal"
                          ? "border-teal/50 bg-teal/5 shadow-[0_4px_24px_rgba(45,212,191,0.12)] ring-1 ring-teal/30"
                          : "border-accent/50 bg-accent/5 shadow-[0_4px_24px_rgba(242,138,26,0.12)] ring-1 ring-accent/30"
                        : "border-border/70 bg-bg-card/80 hover:border-border hover:bg-bg-raised/70"
                    }`}
                  >
                    <span
                      className={`font-mono text-xs font-bold transition-colors ${
                        isSelected
                          ? item.tone === "teal"
                            ? "text-teal"
                            : "text-accent"
                          : isPassed
                            ? "text-emerald-400"
                            : "text-text-faint"
                      }`}
                    >
                      {item.step}
                    </span>

                    <span
                      className={`hidden h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border transition-transform duration-200 group-hover/item:scale-105 sm:flex ${
                        isSelected
                          ? item.tone === "teal"
                            ? "border-teal/40 bg-teal/15 text-teal shadow-[0_0_12px_rgba(45,212,191,0.25)]"
                            : "border-accent/40 bg-accent/15 text-accent shadow-[0_0_12px_rgba(242,138,26,0.25)]"
                          : "border-border bg-bg-raised text-text-muted"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                    </span>

                    <span className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint">
                          {item.label}
                        </span>
                        {isSelected && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                        )}
                      </div>
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
                      className="col-start-2 mt-2 w-fit rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] sm:col-auto sm:mt-0"
                    >
                      {item.owner}
                    </Badge>
                  </li>
                );
              })}
            </ol>

            {/* 底部当前执行阶段状态小卡 */}
            <div className="mt-4 rounded-[var(--radius)] border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 font-mono text-xs text-emerald-400 transition-all">
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 truncate">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="truncate">
                    当前时序：{traceSteps[activeStep].title} — 零冲突确定性执行
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-text-faint">
                  {activeStep + 1} / 3
                </span>
              </span>
            </div>
          </div>
        )}

        {activeTab === "console" && (
          <div className="font-mono text-xs">
            <div className="h-[280px] overflow-y-auto rounded-lg border border-border/60 bg-[#06080c] p-3.5 leading-relaxed text-text-secondary">
              {consoleLogs.map((log, i) => {
                const isComment = log.startsWith("//");
                const isHighlight = log.includes("Done") || log.includes("ready");
                const isValve = log.includes("[CS2]");
                const isSrp = log.includes("[SrP-CFG]");

                return (
                  <div
                    key={i}
                    className={`py-0.5 transition-colors hover:bg-white/[0.02] ${
                      isComment
                        ? "text-text-faint italic"
                        : isHighlight
                          ? "font-semibold text-emerald-400"
                          : isValve
                            ? "text-teal/90"
                            : isSrp
                              ? "text-accent-light"
                              : "text-text-secondary"
                    }`}
                  >
                    {log}
                  </div>
                );
              })}
              <div className="mt-2 flex items-center gap-1.5 text-accent">
                <span className="animate-pulse">❯</span>
                <span className="animate-pulse text-text-faint">_</span>
              </div>
              <div ref={consoleBottomRef} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-text-faint">
              <span>CS2 In-Game VConsole output simulation</span>
              <button
                type="button"
                onClick={() =>
                  setConsoleLogs((prev) => [
                    ...prev,
                    `[SrP-CFG] echo test ping -> OK (${Date.now() % 1000}ms)`,
                  ])
                }
                className="text-accent hover:underline"
              >
                + 发送测试 Ping
              </button>
            </div>
          </div>
        )}

        {activeTab === "layers" && (
          <div className="space-y-3 font-mono text-xs">
            <div className="rounded-lg border border-teal/20 bg-teal/5 p-3">
              <div className="flex items-center justify-between text-teal">
                <span className="font-bold">Layer A: Valve Cloud (VCFG)</span>
                <span className="text-[10px] uppercase">ReadOnly by SrP</span>
              </div>
              <p className="mt-1 text-[11px] text-text-muted">
                cs2_user_keys.vcfg + cs2_user_convars.vcfg。Valve
                引擎持久化，SrP 仅做无损差分分析。
              </p>
            </div>

            <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
              <div className="flex items-center justify-between text-accent">
                <span className="font-bold">Layer B: SrP Runtime Core</span>
                <span className="text-[10px] uppercase">Immutable CFG</span>
              </div>
              <p className="mt-1 text-[11px] text-text-muted">
                autoexec.cfg + runtime/init.cfg。提供 36+ 项 Alias、模块开关与帮助系统，随更新无缝升级。
              </p>
            </div>

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="font-bold">Layer C: User Override (custom.cfg)</span>
                <span className="text-[10px] uppercase">Protected Always</span>
              </div>
              <p className="mt-1 text-[11px] text-text-muted">
                唯一的个性化入口。预设模版起点 + VCFG 偏好提取 + 个人终极覆盖，安装时受全量灾备快照守护。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
