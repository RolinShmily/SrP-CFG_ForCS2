import {
  ArrowDownToLine,
  Rocket,
  Upload,
  Layers,
  Link2,
  AlertTriangle,
} from "lucide-react";

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
    title: "自动链接",
    desc: "程序自动创建符号链接，配置文件即刻生效",
    icon: Link2,
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
      </div>

      <div className="mt-6 p-5 bg-bg-card border border-border rounded-[var(--radius)]">
        <h2 className="font-display text-base font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-accent" />
          注意事项
        </h2>
        <ul className="space-y-2 text-sm text-text-secondary font-light">
          <li>配置文件通过符号链接部署到 CS2 游戏目录，修改暂存区文件会直接影响游戏</li>
          <li>覆盖安装会清空暂存区所有内容，追加安装则保留已有文件并合并新文件</li>
          <li>安装前可随时备份当前配置，在「备份与恢复」页面管理备份记录</li>
          <li>文件类型筛选仅支持 .cfg 和 .txt 文件，其他格式将被自动过滤</li>
          <li>创建文件符号链接需要管理员权限或启用 Windows 开发者模式</li>
        </ul>
      </div>
    </div>
  );
}
