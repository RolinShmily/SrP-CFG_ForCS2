export default function DownloadPage() {
  const items = [
    { name: "Default 默认版", file: "Allcfgs.zip", url: "https://drive.srprolin.top/SrP-CFG/Allcfgs.zip" },
    { name: "Echo 定制版", file: "Allcfgs_echo.zip", url: "https://drive.srprolin.top/SrP-CFG/Allcfgs_echo.zip" },
    { name: "YSZH 定制版", file: "Allcfgs_yszh.zip", url: "https://drive.srprolin.top/SrP-CFG/Allcfgs_yszh.zip" },
    { name: "VisionL 定制版", file: "Allcfgs_visionl.zip", url: "https://drive.srprolin.top/SrP-CFG/Allcfgs_visionl.zip" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">预设包下载</h1>

      <div className="bg-bg-card border border-border rounded-[10px] p-4">
        <p className="text-sm text-text-secondary mb-4">
          点击下方链接在浏览器中下载配置预设包，然后拖入安装页面进行安装。
        </p>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.file}
              className="flex items-center justify-between p-3 bg-bg-raised border border-border rounded-[6px]"
            >
              <div className="text-left">
                <div className="font-display text-sm font-semibold">{item.name}</div>
                <div className="font-mono text-[11px] text-text-faint">{item.file}</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => window.api.openExternal(item.url)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-display text-xs font-medium bg-accent text-bg hover:bg-accent-light transition-colors cursor-pointer border-none"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  下载
                </button>
                <button
                  onClick={() => window.api.openExternal(item.url)}
                  className="flex items-center justify-center w-8 h-8 rounded-[6px] bg-transparent border-none cursor-pointer text-text-muted hover:text-accent hover:bg-accent-bg transition-colors"
                  title="在浏览器中打开"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-bg-card border border-border rounded-[10px] flex gap-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p className="text-sm text-text-secondary">
          所有文件也可在
          <button onClick={() => window.api.openExternal("https://github.com/RolinShmily/SrP-CFG_ForCS2/releases")} className="text-accent hover:underline cursor-pointer bg-transparent border-none font-body text-sm p-0 mx-1">
            GitHub Releases
          </button>
          中找到。
        </p>
      </div>
    </div>
  );
}
