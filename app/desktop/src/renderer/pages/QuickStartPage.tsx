import {
  ArrowDownToLine,
  Rocket,
  Upload,
  Layers,
  Copy,
  AlertTriangle,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { WEBSITE_URL, REPO_URL } from "../lib/downloads";
import PageHeader from "../components/PageHeader";

const steps = [
  {
    num: "01",
    title: "下载",
    desc: "下载唯一的 Runtime Core 配置包；它同时包含功能、用户窗口与内置 Preset 案例",
    icon: ArrowDownToLine,
  },
  {
    num: "02",
    title: "检测账号状态",
    desc: "检测 Steam、CS2 路径以及当前账号的 VCFG 绑定与 ConVar 概况",
    icon: Rocket,
  },
  {
    num: "03",
    title: "选择安装源",
    desc: "选择应用内下载的 Runtime Core，或将自己的 ZIP/CFG 拖入上传区域",
    icon: Upload,
  },
  {
    num: "04",
    title: "选择目标与模式",
    desc: "CFG 默认安装到游戏目录，再选择覆盖安装或追加安装",
    icon: Layers,
  },
  {
    num: "05",
    title: "建立 custom.cfg",
    desc: "到「我的配置」选择一个 srp_apply_* 起点，再把灵敏度、准星、声音或按键写在下面",
    icon: Copy,
  },
];

export default function QuickStartPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="快速开始"
        description="从下载 Runtime Core 到建立个人 custom.cfg，按顺序完成首次部署。"
      />

      <section className="space-y-3">
        {steps.map((step) => (
          <div key={step.num} className="flex items-start gap-4 border-b border-border/70 py-3 first:pt-0 last:border-b-0 last:pb-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius)] border border-border bg-bg-card text-text-muted">
              <step.icon size={18} />
            </div>
            <div className="min-w-0 pt-0.5">
              <div className="mb-0.5 flex items-baseline gap-2">
                <span className="font-mono text-xs text-accent">{step.num}</span>
                <h3 className="ui-section-title">{step.title}</h3>
              </div>
              <p className="ui-body">{step.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="p-5 bg-bg-card border border-border rounded-[var(--radius)]">
        <h2 className="ui-section-title mb-2 flex items-center gap-2">
          <BookOpen size={16} className="text-accent" />
          项目官网与文档
        </h2>
        <p className="ui-body mb-3">
          每个 CFG 文件的详细说明、参数释义和使用教程请查阅官网文档。
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.api.openExternal(WEBSITE_URL)}
            className="flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border-none bg-accent px-3 text-xs font-medium text-bg transition-colors hover:bg-accent-light"
          >
            <BookOpen size={14} />
            官网文档
            <ExternalLink size={12} />
          </button>
          <button
            type="button"
            onClick={() => window.api.openExternal(REPO_URL)}
            className="flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-bg-raised px-3 text-xs font-medium text-text-secondary transition-colors hover:border-border-highlight hover:bg-bg-hover"
          >
            GitHub 仓库
            <ExternalLink size={12} />
          </button>
        </div>
      </section>

      <section className="p-5 bg-bg-card border border-border rounded-[var(--radius)]">
        <h2 className="ui-section-title mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-accent" />
          注意事项
        </h2>
        <ul className="ui-body list-disc space-y-2 pl-5 marker:text-text-faint">
          <li>配置文件会被直接复制到 CS2 目录，暂存区保留副本以供后续管理</li>
          <li>覆盖安装会清空暂存区所有内容，追加安装则保留已有文件并合并新文件</li>
          <li>
            推荐<strong className="text-text font-semibold">游戏目录</strong>（
            <code className="font-mono text-xs bg-bg-raised px-1 py-0.5 rounded">game/csgo/cfg/</code>）；
            账号 CFG 目录仅作为实验性目标，不代表隔离 VCFG 或 Steam Cloud
          </li>
          <li>CFG 执行后的绑定与可归档 ConVar 可能进入当前账号 VCFG；删除脚本文件不会自动恢复</li>
          <li>Runtime 本身不应用偏好；custom.cfg 中启用的 srp_apply_* 才决定每次启动的 Preset 起点</li>
          <li>不启用 srp_apply_* 时，普通游戏修改可继续由 VCFG / Steam Cloud 持久化</li>
          <li>执行 <code className="font-mono text-xs bg-bg-raised px-1 py-0.5 rounded">srp_reset_valve</code> 可恢复 SrP 涉及的 Valve 偏好基线与游戏默认键位</li>
          <li>「恢复中心」管理安装器移动过的 CFG/TXT；VCFG 快照只读保存，不会直接回写游戏文件</li>
          <li>仅部署 .cfg 与支持的 .txt；.vcfg、.vcfg_lastclouded 和其他格式会被阻止或过滤</li>
          <li>安装时若游戏目录存在冲突文件，原文件会显示在恢复中心的「安装前原文件」区域</li>
        </ul>
      </section>
    </div>
  );
}
