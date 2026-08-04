/**
 * 文档中心索引页 /docs（对应原 pages/docs/index.astro + DocsIndexLayout.astro，React 化）。
 * 分组数据来自 Velite（docs-data.ts）；data-astro-prefetch 已删除，内链用 <Link>。
 */
import type { MetaFunction } from "react-router";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Crosshair,
  Gauge,
  MessageCircleQuestion,
  Search,
  Terminal,
  Wrench,
} from "lucide-react";
import { Link } from "react-router";
import { indexGroups } from "../components/docs/docs-data";

export const meta: MetaFunction = () => [
  { title: "文档中心 — SrP-CFG" },
  {
    name: "description",
    content:
      "SrP-CFG v3 架构、安装、功能、模式、恢复边界与 CS2 VCFG 参考文档。",
  },
];

const groupIcons = [BookOpen, Crosshair, Boxes, Terminal];

const featured = [
  {
    href: "/docs/srpcfg-1",
    eyebrow: "01 / Understand",
    title: "先理解四层边界",
    description: "分清 Runtime、Preset、User 与 VCFG，避免把脚本能力、个人覆盖和游戏持久状态混为一谈。",
    icon: Boxes,
  },
  {
    href: "/docs/srpcfg-3",
    eyebrow: "02 / Install",
    title: "安装并选择使用模式",
    description: "安装唯一 Runtime Core，再决定只使用功能，还是选一个 Preset 起点并继续写个人差异。",
    icon: Gauge,
  },
  {
    href: "/docs/helps",
    eyebrow: "03 / Operate",
    title: "在控制台找到功能",
    description: "从 srp_help 进入完整帮助树；普通入口只应用设置，带 _keys 的入口才会接管物理按键。",
    icon: Terminal,
  },
];

export default function DocsPage() {
  return (
    <>
      <section className="border-b border-border bg-[radial-gradient(circle_at_18%_18%,rgba(242,138,26,0.09),transparent_34%)]">
        <div className="mx-auto max-w-[1280px] px-5 pb-14 pt-16 sm:px-7 sm:pb-20 sm:pt-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,760px)_300px] lg:items-end lg:gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                Documentation / v3
              </p>
              <h1 className="mt-4 max-w-[760px] font-display text-[clamp(2.75rem,8vw,6rem)] font-bold leading-[0.94] tracking-[-0.04em] text-text">
                从边界出发，
                <br />
                再开始配置。
              </h1>
              <p className="mt-6 max-w-[700px] text-base leading-8 text-text-secondary sm:text-lg">
                文档按“架构 → 安装 → 功能 → 模式 → 参考”组织。先确定谁负责保存状态，再选择会覆盖哪些设置与按键的入口。
              </p>
            </div>

            <aside className="border-l-2 border-accent pl-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint">
                Fast path
              </p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                首次使用按前三张卡片阅读；遇到具体 ConVar 数值问题，直接进入指令中心。
              </p>
              <Link
                to="/commands"
                className="mt-4 inline-flex min-h-11 items-center gap-2 font-display text-sm font-bold text-accent no-underline transition-colors hover:text-accent-light"
              >
                <Search className="h-4 w-4" />
                检索 CS2 指令与数值
                <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius)] border border-border bg-border md:grid-cols-3">
            {featured.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="group min-h-[230px] bg-bg-card p-6 no-underline transition-colors hover:bg-bg-hover sm:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
                      {item.eyebrow}
                    </span>
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="mt-10 font-display text-xl font-bold leading-tight text-text group-hover:text-accent">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-text-muted">{item.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
                    开始阅读
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-14 sm:px-7 sm:py-20">
        <div className="mb-9 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
              Browse all
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-text sm:text-4xl">
              按任务浏览
            </h2>
          </div>
          <p className="font-mono text-xs text-text-faint">
            {indexGroups.reduce((n, g) => n + g.docs.length, 0)} 篇文档 · {indexGroups.length} 个分组
          </p>
        </div>

        <div className="space-y-12">
          {indexGroups.map((group, groupIndex) => {
            const GroupIcon = groupIcons[groupIndex] ?? BookOpen;
            return (
              <section
                key={group.label}
                aria-labelledby={`docs-group-${groupIndex}`}
                className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10"
              >
                <header>
                  <div className="flex items-center gap-2 text-accent">
                    <GroupIcon className="h-4 w-4" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em]">
                      {String(groupIndex + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3
                    id={`docs-group-${groupIndex}`}
                    className="mt-3 font-display text-xl font-bold text-text"
                  >
                    {group.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{group.description}</p>
                </header>

                <div className="grid gap-3 md:grid-cols-2">
                  {group.docs.map((doc) => (
                    <Link
                      key={doc.slug}
                      to={`/docs/${doc.slug}`}
                      className="group flex min-h-[132px] flex-col justify-between rounded-[var(--radius-sm)] border border-border bg-bg-card p-5 no-underline transition-colors hover:border-border-highlight hover:bg-bg-hover"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-display text-base font-bold text-text group-hover:text-accent">
                            {doc.title}
                          </h4>
                          <ArrowRight className="h-4 w-4 shrink-0 text-text-faint transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-text-muted">
                          {doc.description ?? "查看模块用法、作用边界与相关文件。"}
                        </p>
                      </div>
                      <span className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint">
                        /docs/{doc.slug}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <a
          href="https://deepwiki.com/RolinShmily/SrP-CFG_ForCS2"
          target="_blank"
          rel="noopener"
          aria-label="前往 DeepWiki 询问 SrP-CFG 项目问题（在新窗口打开）"
          className="group mt-12 flex min-h-14 items-center justify-center gap-3 rounded-[var(--radius)] border-2 border-accent/70 bg-accent-bg px-5 py-4 text-center font-display text-base font-bold text-accent no-underline shadow-[0_0_0_1px_rgba(242,138,26,0.04),0_14px_40px_rgba(242,138,26,0.08)] transition-[border-color,background-color,color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-[rgba(242,138,26,0.16)] hover:text-accent-light hover:shadow-[0_16px_46px_rgba(242,138,26,0.14)] sm:text-lg"
        >
          <MessageCircleQuestion className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>有疑问？询问 DeepWiki！</span>
          <ArrowRight
            className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </a>
      </section>

      <section className="border-y border-border bg-bg-card">
        <div className="mx-auto grid max-w-[1280px] gap-px bg-border md:grid-cols-2">
          <Link
            to="/download"
            className="group bg-bg-card px-5 py-9 no-underline transition-colors hover:bg-bg-hover sm:px-7"
          >
            <Wrench className="h-5 w-5 text-accent" />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
              Ready to install
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-text group-hover:text-accent">
              获取 Installer 与 Runtime Core
            </h2>
          </Link>
          <Link
            to="/commands"
            className="group bg-bg-card px-5 py-9 no-underline transition-colors hover:bg-bg-hover sm:px-7"
          >
            <Crosshair className="h-5 w-5 text-accent" />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
              Need a value
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-text group-hover:text-accent">
              查询默认值、约束与离散模式
            </h2>
          </Link>
        </div>
      </section>
    </>
  );
}
