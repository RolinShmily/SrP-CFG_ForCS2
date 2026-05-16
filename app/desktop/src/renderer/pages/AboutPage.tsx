export default function AboutPage() {
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">关于</h1>

      <div className="bg-bg-card border border-border rounded-[10px] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[10px] bg-accent-bg border border-[rgba(232,121,12,0.12)] flex items-center justify-center font-display text-xl font-bold text-accent">
            S
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">SrP-CFG Installer</h2>
            <p className="font-mono text-xs text-text-faint">v0.1.0</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary font-light leading-[1.8]">
          适用于 CS2（Counter-Strike 2）各场景的 CFG 预设文件管理器。
          自动检测路径、智能备份、拖拽安装，将繁琐的手动配置流程简化为一次拖放操作。
        </p>
      </div>

      <div className="bg-bg-card border border-border rounded-[10px] p-5 space-y-3">
        <h3 className="font-display text-base font-semibold">链接</h3>
        <div className="space-y-2">
          <LinkRow label="GitHub" url="https://github.com/RolinShmily/SrP-CFG_ForCS2" />
          <LinkRow label="项目文档" url="https://doc.srprolin.top/SrP-CFG_CS2/srpcfg-1.html" />
          <LinkRow label="下载地址" url="https://doc.srprolin.top/SrP-CFG_CS2/srpcfg-2.html" />
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-text-faint">
          由 RoL1n 开发维护 · 开源项目
        </p>
      </div>
    </div>
  );
}

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <button
      onClick={() => window.api.openExternal(url)}
      className="w-full flex items-center justify-between p-3 bg-bg-raised border border-border rounded-[6px] transition-all cursor-pointer hover:border-border-highlight"
    >
      <span className="font-display text-sm text-text-secondary">{label}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="text-text-muted">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </button>
  );
}
