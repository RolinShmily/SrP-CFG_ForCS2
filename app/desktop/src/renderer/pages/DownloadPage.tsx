import { useState } from "react";
import {
  ArrowDownToLine,
  ExternalLink,
  Info,
  Package,
  Star,
  Loader2,
} from "lucide-react";

const packages = [
  {
    name: "Default 默认版",
    desc: "完整的默认配置包，包含准星视角、跑图练习、demo 录制等全部功能",
    file: "Allcfgs.zip",
    url: "https://drive.srprolin.top/SrP-CFG/Allcfgs.zip",
    featured: true,
  },
  {
    name: "Echo 定制版",
    desc: "基于默认配置的 Echo 个人定制版本",
    file: "Allcfgs_echo.zip",
    url: "https://drive.srprolin.top/SrP-CFG/Allcfgs_echo.zip",
    featured: false,
  },
  {
    name: "YSZH 定制版",
    desc: "基于默认配置的 YSZH 个人定制版本",
    file: "Allcfgs_yszh.zip",
    url: "https://drive.srprolin.top/SrP-CFG/Allcfgs_yszh.zip",
    featured: false,
  },
  {
    name: "VisionL 定制版",
    desc: "基于默认配置的 VisionL 个人定制版本",
    file: "Allcfgs_visionl.zip",
    url: "https://drive.srprolin.top/SrP-CFG/Allcfgs_visionl.zip",
    featured: false,
  },
];

export default function DownloadPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadInApp = async (url: string, fileName: string) => {
    if (downloading) return;
    setDownloading(fileName);
    try {
      await window.api.downloadFromUrl(url, fileName);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">预设包下载</h1>

      {/* Preset packages grid */}
      <div>
        <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Package size={18} className="text-teal" />
          配置预设包
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.file}
              className={`group bg-bg-card border rounded-[var(--radius)] p-5 transition-all hover:border-border-highlight hover:bg-bg-hover ${
                pkg.featured ? "border-accent/20" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center ${
                      pkg.featured
                        ? "bg-accent-bg border border-accent/10"
                        : "bg-bg-raised border border-border"
                    }`}
                  >
                    <ArrowDownToLine
                      size={18}
                      className={pkg.featured ? "text-accent" : "text-text-muted"}
                    />
                  </div>
                  {pkg.featured && (
                    <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-accent text-bg flex items-center gap-1">
                      <Star size={10} />
                      DEFAULT
                    </span>
                  )}
                </div>
              </div>
              <h3 className="font-display text-base font-semibold mb-1 group-hover:text-accent transition-colors">
                {pkg.name}
              </h3>
              <p className="text-xs text-text-secondary font-light leading-[1.7] mb-3">
                {pkg.desc}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-text-faint">
                  {pkg.file}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadInApp(pkg.url, pkg.file)}
                    disabled={downloading !== null}
                    title="下载到应用内，可在安装页直接使用"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] font-display text-xs font-medium bg-accent text-bg hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer border-none"
                  >
                    {downloading === pkg.file ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ArrowDownToLine size={12} />
                    )}
                    下载到应用
                  </button>
                  <button
                    onClick={() => window.api.openExternal("https://cfg.srprolin.top/download/")}
                    title="在浏览器中下载"
                    className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] bg-transparent border border-border cursor-pointer text-text-muted hover:text-accent hover:bg-accent-bg transition-colors"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-5 flex gap-4">
        <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-accent-bg border border-accent/10 flex items-center justify-center flex-shrink-0">
          <Info size={18} className="text-accent" />
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold mb-1">使用说明</h4>
          <p className="text-sm text-text-secondary font-light leading-[1.7]">
            「下载到应用」会将预设包保存到应用管理目录，在安装页面的「已下载预设包」中可直接选择安装。
            所有文件也可在{" "}
            <button
              onClick={() =>
                window.api.openExternal(
                  "https://github.com/RolinShmily/SrP-CFG_ForCS2/releases",
                )
              }
              className="text-accent hover:underline cursor-pointer bg-transparent border-none font-body text-sm p-0"
            >
              GitHub Releases
            </button>{" "}
            中找到。
          </p>
        </div>
      </div>
    </div>
  );
}
