import {
  Github,
  ExternalLink,
  Boxes,
  Shield,
  User,
  Zap,
  Monitor,
  Atom,
  Paintbrush,
  Code,
  Terminal,
  FileCode,
  BookOpen,
  Globe,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card } from "@srp-cfg/ui";
import blogSvg from "../assets/svg/blog-solid-full.svg?raw";
import bilibiliSvg from "../assets/svg/bilibili.svg?raw";
import githubSvg from "../assets/svg/github-brands-solid-full.svg?raw";

// 实际技术栈矩阵：桌面端 (Tauri v2 + Rust + React 19) + 知识库/官网 (React Router 7 + Velite)
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
    url: "https://github.com/RolinShmily/SrP-CFG_ForCS2",
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
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-6">
      {/* Header with logo */}
      <div className="flex flex-col items-center text-center mb-2">
        <img
          src="./favicon.ico"
          alt="SrP-CFG"
          className="w-20 h-20 rounded-2xl border border-border shadow-[0_0_30px_rgba(232,121,12,0.15)] mb-4"
        />
        <h1 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
          <span>关于 SrP-CFG</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-mono font-medium border border-orange-500/30">
            v3.2.4
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1.5 max-w-xl">
          面向 Counter-Strike 2 的模块化 CFG Runtime、桌面安装器与可检索中文知识库
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left column */}
        <div className="space-y-5">
          {/* Project intro */}
          <Card padding="lg" className="space-y-3.5">
            <h2 className="ui-section-title flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" />
              <span>架构与定位</span>
            </h2>
            <div className="text-xs text-text-secondary leading-relaxed space-y-3">
              <p>
                SrP-CFG v3 彻底将配置解耦为四个清晰边界：
                <strong className="text-text"> Runtime Core 注册核心能力</strong>、
                <strong className="text-text">Preset 提供确定性推荐起点</strong>、
                <strong className="text-text">User 维护个人最终覆盖</strong>，以及
                <strong className="text-text"> VCFG 管理云端持久化状态</strong>。
              </p>
              <p>
                运行时由{" "}
                <code className="font-mono text-[11px] bg-bg-raised px-1.5 py-0.5 rounded text-orange-400 border border-border">
                  autoexec.cfg
                </code>{" "}
                自动加载，并无缝贯通至用户的{" "}
                <code className="font-mono text-[11px] bg-bg-raised px-1.5 py-0.5 rounded text-orange-400 border border-border">
                  srp-cfg/user/custom.cfg
                </code>。支持纯 CLI 命令调用或官方推荐方案，并在更新、备份与卸载时受到严密保护。
              </p>
            </div>
          </Card>

          {/* Tech stack */}
          <Card padding="lg" className="space-y-3.5">
            <h2 className="ui-section-title flex items-center gap-2">
              <Boxes className="w-4 h-4 text-orange-400" />
              <span>技术栈 (Tech Stack)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {techStack.map((tech) => {
                const Icon = tech.icon;
                return (
                  <div
                    key={tech.name}
                    className="p-3 bg-bg-raised border border-border rounded-lg space-y-1 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-orange-400 shrink-0" />
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
        <div className="space-y-5">
          {/* Contributors */}
          <Card padding="lg" className="space-y-3.5">
            <h2 className="ui-section-title flex items-center gap-2">
              <User className="w-4 h-4 text-orange-400" />
              <span>开发者与贡献者</span>
            </h2>
            <div className="space-y-2.5">
              {contributors.map((c) => (
                <div
                  key={c.name}
                  className="flex flex-wrap items-center gap-3.5 rounded-lg border border-border bg-bg-raised p-3.5"
                >
                  <img
                    src="./avatar.jpg"
                    alt={c.name}
                    className="w-10 h-10 rounded-full border border-orange-500/30 object-cover"
                  />
                  <div>
                    <div className="font-semibold text-xs text-text flex items-center gap-1.5">
                      <span>{c.name}</span>
                      <Sparkles className="w-3 h-3 text-orange-400" />
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5">{c.role}</div>
                  </div>
                  <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => window.api.openExternal(c.blog)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card border border-border rounded-full text-text-muted hover:text-text hover:border-orange-500/30 hover:bg-orange-500/10 transition-colors cursor-pointer text-xs"
                    >
                      <span className="w-4 h-4 flex items-center justify-center text-text-muted" dangerouslySetInnerHTML={{ __html: blogSvg }} />
                      <span>博客</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.api.openExternal(c.bilibili)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card border border-border rounded-full text-text-muted hover:text-text hover:border-orange-500/30 hover:bg-orange-500/10 transition-colors cursor-pointer text-xs"
                    >
                      <span className="w-4 h-4 flex items-center justify-center text-text-muted" dangerouslySetInnerHTML={{ __html: bilibiliSvg }} />
                      <span>B站</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.api.openExternal(`https://github.com/${c.github}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card border border-border rounded-full text-text-muted hover:text-text hover:border-orange-500/30 hover:bg-orange-500/10 transition-colors cursor-pointer text-xs"
                    >
                      <span className="w-4 h-4 flex items-center justify-center text-text-muted" dangerouslySetInnerHTML={{ __html: githubSvg }} />
                      <span>GitHub</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick links */}
          <Card padding="lg" className="space-y-3.5">
            <h2 className="ui-section-title flex items-center gap-2">
              <Globe className="w-4 h-4 text-orange-400" />
              <span>快速链接</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    type="button"
                    key={link.label}
                    onClick={() => window.api.openExternal(link.url)}
                    className="group w-full flex items-center gap-2.5 p-2.5 bg-bg-raised border border-border rounded-lg transition-all cursor-pointer hover:border-orange-500/40 hover:bg-bg-hover text-left"
                  >
                    <div className="w-7 h-7 rounded-md bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-orange-400 group-hover:scale-105 transition-transform">
                      <Icon size={14} />
                    </div>
                    <span className="text-xs font-medium text-text-secondary group-hover:text-text transition-colors flex-1 truncate">
                      {link.label}
                    </span>
                    <ExternalLink
                      size={12}
                      className="text-text-faint group-hover:text-orange-400 shrink-0"
                    />
                  </button>
                );
              })}
            </div>
          </Card>

          {/* License */}
          <Card padding="lg" className="space-y-2.5">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="text-xs font-semibold text-text flex items-center justify-between">
                  <span>开源许可协议 (Open Source License)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    MIT License
                  </span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  SrP-CFG 采用宽松自由的 MIT 开源协议（Copyright © 2025-2026 RoL1n_SrP）。允许免费商用、修改与分发，须保留原著作权与许可声明。
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      window.api.openExternal(
                        "https://github.com/RolinShmily/SrP-CFG_ForCS2/blob/main/LICENSE"
                      )
                    }
                    className="text-[11px] text-orange-400 hover:text-orange-300 font-medium inline-flex items-center gap-1 transition"
                  >
                    <span>查看完整 LICENSE 许可证</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
