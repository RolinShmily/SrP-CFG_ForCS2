/**
 * Hero —— 首页首屏（对应原 Hero.astro，React 化）。
 * 保留 tech-grid / hero-reveal 动画类（global.css 定义）；
 * LATEST_VERSION 暂为静态 "3"（见 TerminalDemo TODO，等 L3.2 下载页统一处理）。
 */
import { ArrowDownRight, BookOpen, Download } from "lucide-react";
import { Link } from "react-router";
import { ButtonLink } from "./ButtonLink";
import { TerminalDemo } from "./TerminalDemo";

// TODO(L3.2 下载页)：data/version.ts 顶层 await 需改为 SSG loader / 构建期注入
const LATEST_VERSION = "3";

const stats = [
  { label: "Release model", value: "1 Runtime Core" },
  { label: "Source tree", value: "84 CFG" },
  { label: "Preset cases", value: "4 + Valve" },
  { label: "User surface", value: "1 custom.cfg" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border pt-16">
      <div
        className="tech-grid pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
      ></div>
      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1280px] grid-cols-1 items-center gap-12 px-5 py-20 sm:px-7 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
        <div className="hero-reveal max-w-[760px]">
          <div className="mb-6 flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/5 px-3 py-1.5 text-teal">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" aria-hidden="true"></span>
              VCFG AWARE
            </span>
            <span>SrP-CFG v{LATEST_VERSION}</span>
          </div>

          <h1 className="font-display text-[clamp(3rem,7vw,6.5rem)] font-bold leading-[0.94] tracking-[-0.035em] text-text">
            功能留给<br />Runtime，
            <span className="text-accent">偏好留给你。</span>
          </h1>

          <p className="mt-7 max-w-[650px] text-base leading-8 text-text-secondary sm:text-lg">
            SrP-CFG v3 是一套面向 CS2 的模块化配置运行时。一个 Runtime Core 注册
            alias、Feature 与 Mode；一个{" "}
            <code className="font-mono text-[0.9em] text-accent-light">user/custom.cfg</code>{" "}
            决定 Preset 起点和你的最终覆盖。
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink to="/download" size="lg">
              <Download className="h-5 w-5" />
              获取 v3
            </ButtonLink>
            <ButtonLink to="/docs" variant="ghost" size="lg">
              <BookOpen className="h-5 w-5" />
              先理解架构
            </ButtonLink>
          </div>

          <Link
            to="#architecture"
            className="mt-10 inline-flex min-h-11 items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-text-faint no-underline transition-colors hover:text-accent"
          >
            查看执行边界
            <ArrowDownRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="hero-reveal hero-reveal-delayed w-full min-w-0">
          <TerminalDemo />
        </div>
      </div>

      <div className="relative border-t border-border bg-bg-card/55">
        <dl className="mx-auto grid max-w-[1280px] grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-bg-card/90 px-5 py-5 sm:px-6 sm:py-6">
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint">
                {stat.label}
              </dt>
              <dd className="mt-1 font-display text-xl font-bold text-text">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
