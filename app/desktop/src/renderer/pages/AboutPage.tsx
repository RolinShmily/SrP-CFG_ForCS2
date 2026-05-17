import {
  Github,
  ExternalLink,
  Boxes,
  Shield,
  User,
  PenLine,
  Zap,
  Monitor,
  Atom,
  Paintbrush,
  Server,
  Code,
} from "lucide-react";

const techStack = [
  { name: "Electron", desc: "桌面应用框架", icon: Monitor },
  { name: "React", desc: "UI 组件库", icon: Atom },
  { name: "TypeScript", desc: "类型安全语言", icon: Code },
  { name: "TailwindCSS", desc: "原子化 CSS", icon: Paintbrush },
  { name: "Node.js", desc: "运行时环境", icon: Server },
  { name: "Vite", desc: "构建工具", icon: Zap },
];

const links = [
  {
    label: "GitHub 仓库",
    url: "https://github.com/RolinShmily/SrP-CFG_ForCS2",
    icon: Github,
  },
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

export default function AboutPage() {
  return (
    <div className="space-y-6">
      {/* Header with logo */}
      <div className="flex flex-col items-center text-center mb-2">
        <img
          src="/favicon.ico"
          alt="SrP-CFG"
          className="w-20 h-20 rounded-2xl border border-border shadow-[0_0_30px_rgba(232,121,12,0.12)] mb-4"
        />
        <h1 className="font-display text-2xl font-bold">关于 SrP-CFG</h1>
        <p className="text-sm text-text-secondary mt-1">
          适用于 CS2 各场景的 CFG 预设文件，由 RoL1n 开发维护
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* Project intro */}
          <div className="bg-bg-card border border-border rounded-[var(--radius)] p-5 space-y-4">
            <h2 className="font-display text-lg font-semibold">项目简介</h2>
            <div className="space-y-3 text-sm text-text-secondary font-light leading-[1.8]">
              <p>
                SrP-CFG 是一套为 CS2 玩家打造的全套预设 CFG 配置文件。提供准星视角、跑图练习、demo
                录制、饰品预览等功能，旨在提升游戏体验。
              </p>
              <p>
                所有 CFG 通过{" "}
                <code className="font-mono text-xs bg-bg-raised px-1.5 py-0.5 rounded text-accent-light">
                  autoexec.cfg
                </code>{" "}
                自启动加载，通过{" "}
                <code className="font-mono text-xs bg-bg-raised px-1.5 py-0.5 rounded text-accent-light">
                  exec custom
                </code>{" "}
                链式加载用户定制配置。
              </p>
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-bg-card border border-border rounded-[var(--radius)] p-5 space-y-3">
            <h2 className="font-display text-lg font-semibold">快速链接</h2>
            <div className="space-y-2">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.label}
                    onClick={() => window.api.openExternal(link.url)}
                    className="group w-full flex items-center gap-3 p-3 bg-bg-raised border border-border rounded-[var(--radius-sm)] transition-all cursor-pointer hover:border-border-highlight hover:bg-bg-hover"
                  >
                    <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-accent-bg border border-accent/10 flex items-center justify-center flex-shrink-0 text-accent">
                      <Icon size={16} />
                    </div>
                    <span className="font-display text-sm font-medium text-text-secondary group-hover:text-accent transition-colors text-left">
                      {link.label}
                    </span>
                    <ExternalLink
                      size={12}
                      className="ml-auto text-text-faint group-hover:text-text-muted"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Tech stack */}
          <div className="bg-bg-card border border-border rounded-[var(--radius)] p-5 space-y-3">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Boxes size={18} className="text-teal" />
              技术栈
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {techStack.map((tech) => {
                const Icon = tech.icon;
                return (
                  <div
                    key={tech.name}
                    className="p-3 bg-bg-raised border border-border rounded-[var(--radius-sm)]"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <Icon size={14} className="text-text-muted" />
                      <span className="font-display text-sm font-semibold">
                        {tech.name}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted font-light">
                      {tech.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contributors */}
          <div className="bg-bg-card border border-border rounded-[var(--radius)] p-5 space-y-3">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <User size={18} className="text-accent" />
              贡献者
            </h2>
            <div className="space-y-2.5">
              {contributors.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-3 p-3 bg-bg-raised border border-border rounded-[var(--radius-sm)]"
                >
                  <img
                    src="/avatar.jpg"
                    alt={c.name}
                    className="w-10 h-10 rounded-full border border-accent/10 object-cover"
                  />
                  <div>
                    <div className="font-display text-sm font-semibold">
                      {c.name}
                    </div>
                    <div className="text-xs text-text-muted">{c.role}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        window.api.openExternal(c.blog)
                      }
                      className="p-1.5 text-text-faint hover:text-accent transition-colors cursor-pointer bg-transparent border-none"
                      title="Blog"
                    >
                      <PenLine size={16} />
                    </button>
                    <button
                      onClick={() =>
                        window.api.openExternal(c.bilibili)
                      }
                      className="p-1.5 text-text-faint hover:text-accent transition-colors cursor-pointer bg-transparent border-none"
                      title="Bilibili"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      onClick={() =>
                        window.api.openExternal(
                          `https://github.com/${c.github}`,
                        )
                      }
                      className="p-1.5 text-text-faint hover:text-accent transition-colors cursor-pointer bg-transparent border-none"
                      title="GitHub"
                    >
                      <Github size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* License */}
          <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 flex items-center gap-3">
            <Shield size={18} className="text-text-muted flex-shrink-0" />
            <div>
              <div className="font-display text-sm font-semibold">开源许可</div>
              <div className="text-xs text-text-muted">
                自定义许可证，详见仓库根目录 LICENSE 文件
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
