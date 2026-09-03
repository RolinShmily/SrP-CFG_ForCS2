/**
 * 关于页 /about。
 * 完全复用与对齐 SrP-CFG Desktop 桌面软件的「关于」页面架构与设计。
 */
import type { MetaFunction } from "react-router";
import {
  Boxes,
  ExternalLink,
  Github,
  Globe,
  Layers,
  Monitor,
  Atom,
  Paintbrush,
  Code,
  Terminal,
  FileCode,
  BookOpen,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { Card } from "@srp-cfg/ui";
import { LATEST_VERSION } from "../../data/version";
import { REPO_URL, RELEASES_URL } from "../../data/navigation";
import blogSvg from "../../assets/svg/blog-solid-full.svg?raw";
import bilibiliSvg from "../../assets/svg/bilibili.svg?raw";
import githubSvg from "../../assets/svg/github-brands-solid-full.svg?raw";

export const meta: MetaFunction = () => [
  { title: "关于 — SrP-CFG" },
  {
    name: "description",
    content: "面向 Counter-Strike 2 的模块化 CFG Runtime、桌面安装器与可检索中文知识库",
  },
];

// 技术栈矩阵：桌面端 (Tauri v2 + Rust + React 19) + 知识库/官网 (React Router 7 + Velite)
const techStack = [
  { name: "Tauri v2", desc: "跨平台轻量桌面引擎 (Rust / Webview)", icon: Monitor },
  { name: "Rust Core", desc: "底层高性能文件分析与 VCFG 引擎", icon: Terminal },
  { name: "React 19", desc: "现代化响应式前端 UI", icon: Atom },
  { name: "TypeScript", desc: "全链路强类型约束与安全", icon: Code },
  { name: "CodeMirror 6", desc: "专业代码编辑器与 CS2 语法高亮", icon: FileCode },
  { name: "TailwindCSS", desc: "高质感暗色电竞主题与原子化样式", icon: Paintbrush },
  { name: "React Router 7", desc: "知识库与官网静态生成 (SSG)", icon: Globe },
  { name: "Velite", desc: "结构化 Markdown/MDX 文档驱动", icon: BookOpen },
];

const links = [
  {
    label: "GitHub 开源仓库",
    url: REPO_URL,
    icon: Github,
  },
  {
    label: "SrP-CFG 在线知识库 / 指令中心",
    url: "https://cfg.srprolin.top",
    icon: Globe,
  },
  {
    label: "Bilibili 视频教程系列",
    url: "https://space.bilibili.com/422744280/lists/6770542",
    icon: ExternalLink,
  },
  {
    label: "技术博文：关于 CFG 你要了解的二三事",
    url: "https://blog.srprolin.top/posts/srp-cfg/",
    icon: ExternalLink,
  },
];

const contributors = [
  {
    name: "RoL1n",
    role: "主开发者与维护者",
    github: "RolinShmily",
    blog: "https://blog.srprolin.top",
    bilibili: "https://space.bilibili.com/422744280",
  },
];

export default function AboutPage() {
  const versionDisplay = LATEST_VERSION !== "0.0.0" ? `v${LATEST_VERSION}` : "v3.2.4";

  return (
    <section className="pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-7 space-y-8">
        {/* Header with logo */}
        <div className="flex flex-col items-center text-center mb-4">
          <img
            src="/favicon.ico"
            alt="SrP-CFG"
            width="80"
            height="80"
            className="w-20 h-20 rounded-2xl border border-border shadow-[0_0_30px_rgba(232,121,12,0.15)] mb-4"
          />
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-text tracking-tight flex items-center gap-2.5">
            <span>关于 SrP-CFG</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/20 text-accent font-mono font-medium border border-accent/30">
              {versionDisplay}
            </span>
          </h1>
          <p className="text-sm sm:text-base text-text-muted mt-2 max-w-xl">
            面向 Counter-Strike 2 的模块化 CFG Runtime、桌面安装器与可检索中文知识库
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left column */}
          <div className="space-y-6">
            {/* Project intro */}
            <Card padding="lg" className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-text">
                <Layers className="w-4 h-4 text-accent" />
                <span>架构与定位</span>
              </h2>
              <div className="text-xs sm:text-sm text-text-secondary leading-relaxed space-y-3">
                <p>
                  SrP-CFG 彻底将配置解耦为四个清晰边界：
                  <strong className="text-text"> Runtime Core 注册核心能力</strong>、
                  <strong className="text-text">Preset 提供确定性推荐起点</strong>、
                  <strong className="text-text">User 维护个人最终覆盖</strong>，以及
                  <strong className="text-text"> VCFG 管理云端持久化状态</strong>。
                </p>
                <p>
                  运行时由{" "}
                  <code className="font-mono text-xs bg-bg-raised px-1.5 py-0.5 rounded text-accent border border-border">
                    autoexec.cfg
                  </code>{" "}
                  自动加载，并无缝贯通至用户的{" "}
                  <code className="font-mono text-xs bg-bg-raised px-1.5 py-0.5 rounded text-accent border border-border">
                    srp-cfg/user/custom.cfg
                  </code>。支持纯 CLI 命令调用或官方推荐方案，并在更新、备份与卸载时受到严密保护。
                </p>
                <p>
                  配套的 <strong className="text-accent">SrP-CFG Desktop</strong> 桌面端（Tauri v2 + Rust）提供智能路径检测、解耦组件下载、冲突差异预审、Steam 账号 VCFG 偏好一键提取以及灾备全量快照自动归档回滚功能。
                </p>
              </div>
            </Card>

            {/* Tech stack */}
            <Card padding="lg" className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-text">
                <Boxes className="w-4 h-4 text-accent" />
                <span>技术栈 (Tech Stack)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {techStack.map((tech) => {
                  const Icon = tech.icon;
                  return (
                    <div
                      key={tech.name}
                      className="p-3 bg-bg-raised border border-border rounded-lg space-y-1 hover:border-neutral-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="font-semibold text-xs text-text">{tech.name}</span>
                      </div>
                      <p className="text-[11px] text-text-faint leading-tight">{tech.desc}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Contributors */}
            <Card padding="lg" className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-text">
                <User className="w-4 h-4 text-accent" />
                <span>开发者与贡献者</span>
              </h2>
              <div className="space-y-3">
                {contributors.map((c) => (
                  <div
                    key={c.name}
                    className="flex flex-wrap items-center gap-3.5 rounded-lg border border-border bg-bg-raised p-3.5"
                  >
                    <img
                      src="/avatar.jpg"
                      alt={c.name}
                      className="w-10 h-10 rounded-full border border-accent/30 object-cover"
                    />
                    <div>
                      <div className="font-semibold text-xs text-text flex items-center gap-1.5">
                        <span>{c.name}</span>
                        <Sparkles className="w-3 h-3 text-accent" />
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5">{c.role}</div>
                    </div>
                    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                      <a
                        href={c.blog}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card border border-border rounded-full text-text-muted hover:text-text hover:border-accent/30 hover:bg-accent/10 transition-colors text-xs no-underline"
                      >
                        <span className="w-4 h-4 flex items-center justify-center text-text-muted" dangerouslySetInnerHTML={{ __html: blogSvg }} />
                        <span>博客</span>
                      </a>
                      <a
                        href={c.bilibili}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card border border-border rounded-full text-text-muted hover:text-text hover:border-accent/30 hover:bg-accent/10 transition-colors text-xs no-underline"
                      >
                        <span className="w-4 h-4 flex items-center justify-center text-text-muted" dangerouslySetInnerHTML={{ __html: bilibiliSvg }} />
                        <span>B站</span>
                      </a>
                      <a
                        href={`https://github.com/${c.github}`}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card border border-border rounded-full text-text-muted hover:text-text hover:border-accent/30 hover:bg-accent/10 transition-colors text-xs no-underline"
                      >
                        <span className="w-4 h-4 flex items-center justify-center text-text-muted" dangerouslySetInnerHTML={{ __html: githubSvg }} />
                        <span>GitHub</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick links */}
            <Card padding="lg" className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-text">
                <Globe className="w-4 h-4 text-accent" />
                <span>快速链接</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener"
                      className="group w-full flex items-center gap-2.5 p-3 bg-bg-raised border border-border rounded-lg transition-all hover:border-accent/40 hover:bg-bg-hover text-left no-underline"
                    >
                      <div className="w-7 h-7 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 text-accent group-hover:scale-105 transition-transform">
                        <Icon size={14} />
                      </div>
                      <span className="text-xs font-medium text-text-secondary group-hover:text-text transition-colors flex-1 truncate">
                        {link.label}
                      </span>
                      <ExternalLink
                        size={12}
                        className="text-text-faint group-hover:text-accent shrink-0"
                      />
                    </a>
                  );
                })}
              </div>
            </Card>

            {/* Acknowledgements */}
            <Card padding="lg" className="space-y-3.5">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-text">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>鸣谢 (Acknowledgements)</span>
              </h2>
              <p className="text-xs text-text-muted leading-relaxed">
                感谢 <strong className="text-text">Maple Mono</strong> 开源等宽字体项目（by subframe7536，基于 <strong className="text-text">SIL Open Font License 1.1</strong> 开源）。本项目桌面套件代码编辑器与官方文档站均采用其作为代码排版字体。
              </p>
              <div className="pt-0.5 flex items-center justify-between">
                <span className="font-mono text-[11px] text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-md">
                  SIL Open Font License 1.1
                </span>
                <a
                  href="https://github.com/subframe7536/maple-font"
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-text-muted hover:text-accent flex items-center gap-1 transition-colors no-underline"
                >
                  <span>访问 Maple Mono 仓库</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </Card>

            {/* License */}
            <Card padding="lg" className="space-y-3.5">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-text">
                <Shield className="w-4 h-4 text-accent" />
                <span>开源许可证 (Open Source License)</span>
              </h2>
              <p className="text-xs text-text-muted leading-relaxed">
                SrP-CFG 采用 <strong className="text-text">MIT 许可证</strong> 开源。你可以自由使用、修改、分发与商业化，请保留原版权声明与许可文件。
              </p>
              <div className="pt-1 flex items-center justify-between">
                <span className="font-mono text-[11px] text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-md">
                  MIT License © 2024-2026 RoL1n
                </span>
                <a
                  href={`${REPO_URL}/blob/main/LICENSE`}
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-text-muted hover:text-accent flex items-center gap-1 transition-colors no-underline"
                >
                  <span>查看完整协议</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
