/**
 * 关于页 /about（对应原 src/pages/about.astro，React 化）。
 * - 区块标题 / 卡片复用 @srp-cfg/ui（SectionHeader / Card）
 * - 原 ?raw 内联 SVG（博客/B站/GitHub 品牌图标）→ React dangerouslySetInnerHTML
 * - 快速链接/技术栈/贡献者/许可卡：<a> 或 <div> 包装共享 Card（group-hover 等价 hover）
 */
import type { MetaFunction } from "react-router";
import {
  Atom,
  Boxes,
  Cloud,
  Code,
  ExternalLink,
  FileText,
  Github,
  Monitor,
  Paintbrush,
  Server,
  Shield,
  User,
  Zap,
} from "lucide-react";
import { Card, SectionHeader } from "@srp-cfg/ui";
import { REPO_URL, RELEASES_URL } from "../../data/navigation";
import blogSvg from "../../assets/svg/blog-solid-full.svg?raw";
import bilibiliSvg from "../../assets/svg/bilibili.svg?raw";
import githubSvg from "../../assets/svg/github-brands-solid-full.svg?raw";

export const meta: MetaFunction = () => [
  { title: "关于 — SrP-CFG" },
  { name: "description", content: "SrP-CFG 项目介绍与开源信息" },
];

// 与项目重构后（L2/L3）实际技术栈一致：桌面 Tauri v2（Rust 后端）、
// 官网 Vite + React Router 7 SSG + Velite + Tailwind v4，部署 Cloudflare Workers。
const techStack = [
  { name: "Vite", desc: "网站构建工具", icon: Zap },
  { name: "React Router 7", desc: "框架模式 SSG（2800+ 页预渲染）", icon: Server },
  { name: "React 19", desc: "前端 UI 框架", icon: Atom },
  { name: "Tauri v2", desc: "桌面应用框架（Rust 后端）", icon: Monitor },
  { name: "TypeScript", desc: "类型安全的开发语言", icon: Code },
  { name: "TailwindCSS", desc: "原子化 CSS 框架", icon: Paintbrush },
  { name: "Velite", desc: "文档内容管线", icon: FileText },
  { name: "Cloudflare Workers", desc: "网站托管与 AI 服务", icon: Cloud },
];

const links = [
  { label: "GitHub 仓库", url: REPO_URL, icon: Github },
  { label: "GitHub Release", url: RELEASES_URL, icon: Github },
  {
    label: "SrP-CFG 视频系列",
    url: "https://space.bilibili.com/422744280/lists/6770542",
    icon: ExternalLink,
  },
  {
    label: "关于 CFG 你要了解的二三事",
    url: "https://blog.srprolin.top/posts/srp-cfg/",
    icon: ExternalLink,
  },
];

const contributors = [
  {
    name: "RoL1n",
    role: "开发维护",
    github: "RolinShmily",
    blog: "https://blog.srprolin.top",
    bilibili: "https://space.bilibili.com/422744280",
  },
];

const cardHover =
  "transition-colors duration-200 group-hover:border-border-highlight group-hover:bg-bg-hover";

export default function AboutPage() {
  return (
    <section className="pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-7">
        <div className="mb-10 flex justify-center">
          <img
            src="/favicon.ico"
            alt="SrP-CFG Logo"
            width="112"
            height="112"
            className="h-28 w-28 rounded-2xl border border-border shadow-[0_0_40px_rgba(242,138,26,0.14)]"
          />
        </div>

        <SectionHeader
          level="h1"
          label="About"
          title="关于 SrP-CFG"
          description="面向 CS2 的模块化 CFG Runtime、Preset 案例与用户配置系统，由 RoL1n 开发维护"
        />

        <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-16 lg:grid-cols-[1fr_1fr]">
          {/* Left column: 项目简介 + 快速链接 */}
          <div>
            <h2 className="mb-6 font-display text-2xl font-semibold">项目简介</h2>
            <div className="mb-10 space-y-4 leading-8 text-text-secondary">
              <p>
                SrP-CFG v3 是一套把功能模板、Preset 案例和用户配置分离的 CS2 CFG
                系统。Runtime 提供准星视角、跑图练习、Demo 录制等能力，内置案例提供可选推荐值，用户层保存个人差异。
              </p>
              <p>
                根目录只保留{" "}
                <code className="rounded bg-bg-raised px-1.5 py-0.5 font-mono text-sm text-accent-light">
                  autoexec.cfg
                </code>{" "}
                启动引导，所有 Runtime、Preset、Feature 与 Mode 统一位于{" "}
                <code className="rounded bg-bg-raised px-1.5 py-0.5 font-mono text-sm text-accent-light">
                  srp-cfg/
                </code>
                ；用户只需要编辑最后加载的{" "}
                <code className="rounded bg-bg-raised px-1.5 py-0.5 font-mono text-sm text-accent-light">
                  srp-cfg/user/custom.cfg
                </code>
                。
              </p>
            </div>

            <h2 className="mb-6 font-display text-2xl font-semibold">快速链接</h2>
            <div className="space-y-3">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener"
                    className="group block no-underline"
                  >
                    <Card
                      padding="none"
                      className={`flex min-h-14 items-center gap-3 p-4 ${cardHover}`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-[rgba(232,121,12,0.12)] bg-accent-bg text-accent">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-display text-sm font-medium text-text-secondary transition-colors group-hover:text-accent">
                        {link.label}
                      </span>
                    </Card>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Right column: 技术栈 + 贡献者 + 开源许可 */}
          <div>
            <h2 className="mb-6 flex items-center gap-3 font-display text-2xl font-semibold">
              <Boxes className="h-6 w-6 text-teal" />
              技术栈
            </h2>
            <div className="mb-12 grid grid-cols-2 gap-3">
              {techStack.map((tech) => {
                const Icon = tech.icon;
                return (
                  <Card key={tech.name} padding="none" className="p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-text-muted" />
                      <div className="font-display text-base font-semibold text-text">
                        {tech.name}
                      </div>
                    </div>
                    <div className="text-xs text-text-muted">{tech.desc}</div>
                  </Card>
                );
              })}
            </div>

            <h2 className="mb-6 flex items-center gap-3 font-display text-2xl font-semibold">
              <User className="h-6 w-6 text-accent" />
              贡献者
            </h2>
            <div className="space-y-3">
              {contributors.map((c) => (
                <Card
                  key={c.github}
                  padding="none"
                  className="flex flex-wrap items-center gap-4 p-4"
                >
                  <img
                    src="/avatar.jpg"
                    alt={c.name}
                    width="48"
                    height="48"
                    loading="lazy"
                    className="h-12 w-12 rounded-full border border-[rgba(232,121,12,0.12)] object-cover"
                  />
                  <div>
                    <div className="font-display text-base font-semibold">{c.name}</div>
                    <div className="text-xs text-text-muted">{c.role}</div>
                  </div>
                  <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                    <a
                      href={c.blog}
                      target="_blank"
                      rel="noopener"
                      className="flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-bg-raised px-3 text-xs text-text-muted no-underline transition-colors hover:border-accent/30 hover:text-accent"
                    >
                      <span
                        className="h-3.5 w-3.5 text-text-muted"
                        dangerouslySetInnerHTML={{ __html: blogSvg }}
                      />
                      <span>博客</span>
                    </a>
                    <a
                      href={c.bilibili}
                      target="_blank"
                      rel="noopener"
                      className="flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-bg-raised px-3 text-xs text-text-muted no-underline transition-colors hover:border-accent/30 hover:text-accent"
                    >
                      <span
                        className="h-3.5 w-3.5 text-text-muted"
                        dangerouslySetInnerHTML={{ __html: bilibiliSvg }}
                      />
                      <span>B站</span>
                    </a>
                    <a
                      href={`https://github.com/${c.github}`}
                      target="_blank"
                      rel="noopener"
                      className="flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-bg-raised px-3 text-xs text-text-muted no-underline transition-colors hover:border-accent/30 hover:text-accent"
                    >
                      <span
                        className="h-3.5 w-3.5 text-text-muted"
                        dangerouslySetInnerHTML={{ __html: githubSvg }}
                      />
                      <span>GitHub</span>
                    </a>
                  </div>
                </Card>
              ))}
            </div>

            <Card padding="none" className="mt-8 flex items-center gap-4 p-5">
              <Shield className="h-5 w-5 text-text-muted" strokeWidth={1.8} />
              <div>
                <div className="font-display text-sm font-semibold">开源许可</div>
                <div className="text-xs text-text-muted">
                  本仓库代码以自定义许可证发布，详见仓库根目录 LICENSE 文件
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
