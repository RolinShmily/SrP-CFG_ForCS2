/**
 * Features —— 架构分层（对应原 Features.astro，React 化）。
 * 区块标题用共享 SectionHeader（@srp-cfg/ui）；下方 Features / Modes 面板用共享 Card。
 */
import { Blocks, CloudCog, SlidersHorizontal, UserRoundCog } from "lucide-react";
import { Card, SectionHeader } from "@srp-cfg/ui";

const layers = [
  {
    index: "A",
    icon: Blocks,
    title: "Runtime Core",
    owner: "项目维护",
    desc: "永久注册 alias、Feature、Mode 与帮助入口，不在启动时偷改你的普通偏好。",
  },
  {
    index: "B",
    icon: SlidersHorizontal,
    title: "Preset 案例",
    owner: "按需调用",
    desc: "Default、Echo、YSZH、VisionL 是可审查的起点，不是四套独立发行包。",
  },
  {
    index: "C",
    icon: UserRoundCog,
    title: "User",
    owner: "当前用户",
    desc: "custom.cfg 是唯一个人窗口；Preset 之后的命令拥有最终覆盖权，并在更新时受保护。",
  },
  {
    index: "D",
    icon: CloudCog,
    title: "VCFG / Cloud",
    owner: "CS2 管理",
    desc: "游戏继续序列化最终绑定与 ConVar；安装器只读解析，不在背后覆盖 Valve 文件。",
  },
];

const features = ["crosshair-view", "autoview", "knife", "zeus"];
const modes = ["practice", "preview", "guidemake", "demo-hlae"];

function ModulePanel({
  eyebrow,
  title,
  countLabel,
  countTone,
  items,
}: {
  eyebrow: string;
  title: string;
  countLabel: string;
  countTone: "teal" | "accent";
  items: string[];
}) {
  return (
    <Card padding="none" className="p-6 sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint">
            {eyebrow}
          </p>
          <h3 className="mt-1 font-display text-xl font-bold">{title}</h3>
        </div>
        <span
          className={countTone === "teal" ? "font-mono text-xs text-teal" : "font-mono text-xs text-accent"}
        >
          {countLabel}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <code
            key={item}
            className="rounded-md border border-border bg-bg-raised px-3 py-2 font-mono text-xs text-text-secondary"
          >
            {item}
          </code>
        ))}
      </div>
    </Card>
  );
}

export function Features() {
  return (
    <section id="architecture" className="home-section scroll-mt-24 border-b border-border py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-7">
        <SectionHeader
          index="01"
          label="Architecture"
          title="不是一包偏好，而是一套边界明确的运行时"
          description="v3 把“功能实现”“可选案例”“个人差异”和“游戏持久状态”拆开。每一层只有一个主人，也只有一种职责。"
          align="left"
        />

        <div className="grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 xl:grid-cols-4">
          {layers.map((layer) => (
            <article
              key={layer.index}
              className="group relative min-h-[270px] border-b border-r border-border bg-bg-card/55 p-6 transition-colors duration-200 hover:bg-bg-hover sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-accent/20 bg-accent-bg text-accent">
                  <layer.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="font-mono text-xs text-text-faint">{layer.index}</span>
              </div>
              <h3 className="mt-8 font-display text-xl font-bold text-text">{layer.title}</h3>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.13em] text-accent">
                {layer.owner}
              </p>
              <p className="mt-4 text-sm leading-7 text-text-secondary">{layer.desc}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ModulePanel
            eyebrow="Always available"
            title="Features"
            countLabel="04 MODULES"
            countTone="teal"
            items={features}
          />
          <ModulePanel
            eyebrow="Explicit workspace"
            title="Modes"
            countLabel="04 MODULES"
            countTone="accent"
            items={modes}
          />
        </div>
      </div>
    </section>
  );
}
