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

const steps = [
  {
    num: "01",
    title: "下载",
    desc: "从下载页面或 GitHub Releases 获取配置预设包（ZIP 格式）",
    icon: ArrowDownToLine,
  },
  {
    num: "02",
    title: "启动检测",
    desc: "运行 SrP-CFG，自动检测 Steam 和 CS2 安装状态及路径",
    icon: Rocket,
  },
  {
    num: "03",
    title: "上传配置",
    desc: "将 ZIP 配置包或 CFG 文件拖入安装页面的上传区域",
    icon: Upload,
  },
  {
    num: "04",
    title: "选择安装模式",
    desc: "覆盖安装（清空重装）或追加安装（合并保留）",
    icon: Layers,
  },
  {
    num: "05",
    title: "自动部署",
    desc: "程序自动复制配置文件到 CS2 游戏目录，即刻生效",
    icon: Copy,
  },
];

export default function QuickStartPage() {
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">快速开始</h1>

      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.num} className="flex gap-4">
            <div className="w-12 h-12 flex-shrink-0 border border-border rounded-[var(--radius)] flex items-center justify-center text-text-faint bg-bg-card">
              <step.icon size={20} />
            </div>
            <div className="pt-1">
              <h3 className="font-display text-base font-semibold mb-1">
                {step.title}
              </h3>
              <p className="text-sm text-text-secondary font-light">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      {/* Website & Docs */}
      <div className="mt-6 p-5 bg-bg-card border border-border rounded-[var(--radius)]">
        <h2 className="font-display text-base font-semibold mb-3 flex items-center gap-2">
          <BookOpen size={16} className="text-accent" />
          项目官网与文档
        </h2>
        <p className="text-sm text-text-secondary font-light mb-3">
          每个 CFG 文件的详细说明、参数释义和使用教程请查阅官网文档。
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.api.openExternal(WEBSITE_URL)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-medium bg-accent text-bg hover:bg-accent-light rounded-[var(--radius-sm)] transition-colors cursor-pointer border-none"
          >
            <BookOpen size={14} />
            官网文档
            <ExternalLink size={12} />
          </button>
          <button
            onClick={() => window.api.openExternal(REPO_URL)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-medium bg-bg-raised border border-border hover:bg-bg-hover text-text-secondary rounded-[var(--radius-sm)] transition-colors cursor-pointer"
          >
            GitHub 仓库
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      </div>

      <div className="mt-6 p-5 bg-bg-card border border-border rounded-[var(--radius)]">
        <h2 className="font-display text-base font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-accent" />
          注意事项
        </h2>
        <ul className="space-y-2 text-sm text-text-secondary font-light">
          <li>配置文件会被直接复制到 CS2 目录，暂存区保留副本以供后续管理</li>
          <li>覆盖安装会清空暂存区所有内容，追加安装则保留已有文件并合并新文件</li>
          <li>
            安装时可选<strong className="text-text font-semibold">游戏 CFG</strong>（
            <code className="font-mono text-xs bg-bg-raised px-1 py-0.5 rounded">csgo/cfg/</code>）或
            <strong className="text-text font-semibold">用户 CFG</strong>（
            <code className="font-mono text-xs bg-bg-raised px-1 py-0.5 rounded">userdata/*/730/local/cfg/</code>）目录：
            前者局内修改会被游戏重置覆盖，后者可持久保留用户调整
          </li>
          <li>安装前可随时备份当前配置，在「备份与恢复」页面管理备份记录</li>
          <li>文件类型筛选仅支持 .cfg 和 .txt 文件，其他格式将被自动过滤</li>
          <li>安装时若游戏目录存在冲突文件，原文件会被移至「冲突恢复」区域</li>
        </ul>
      </div>
    </div>
  );
}
