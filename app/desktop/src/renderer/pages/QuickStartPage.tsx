const steps = [
  { num: "01", title: "下载", desc: "从下载页面或 GitHub Releases 获取配置预设包（ZIP 格式）" },
  { num: "02", title: "启动", desc: "运行 SrP-CFG Installer，自动检测 Steam 和 CS2 路径" },
  { num: "03", title: "拖入", desc: "将 ZIP 配置包拖入安装页面的拖放区域" },
  { num: "04", title: "选择目标", desc: "勾选需要安装的目标：全局 CFG / 视频设置 / 地图指南" },
  { num: "05", title: "安装", desc: "点击「开始安装」，自动备份并部署配置文件" },
];

export default function QuickStartPage() {
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">快速开始</h1>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={step.num} className="flex gap-4">
            <div className="w-12 h-12 flex-shrink-0 border border-border rounded-[10px] flex items-center justify-center font-display text-lg font-bold text-text-faint bg-bg-card">
              {step.num}
            </div>
            <div className="pt-1">
              <h3 className="font-display text-base font-semibold mb-1">{step.title}</h3>
              <p className="text-sm text-text-secondary font-light">{step.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="absolute" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-5 bg-bg-card border border-border rounded-[10px]">
        <h2 className="font-display text-base font-semibold mb-3">注意事项</h2>
        <ul className="space-y-2 text-sm text-text-secondary font-light">
          <li>安装前会自动备份现有配置文件，可随时回滚</li>
          <li>视频预设安装需要先选择 Steam 用户</li>
          <li>地图指南路径需游戏至少运行过一次才会存在</li>
          <li>拖入单文件（CFG/TXT）也可直接安装</li>
        </ul>
      </div>
    </div>
  );
}
