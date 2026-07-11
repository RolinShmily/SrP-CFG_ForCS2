import { useState } from "react";
import {
  ArrowDownToLine,
  ExternalLink,
  Info,
  Package,
  Star,
  Loader2,
} from "lucide-react";
import { REPO_URL, dl } from "../lib/downloads";
import PageHeader from "../components/PageHeader";

const packages = [
  {
    name: "Runtime Core",
    desc: "唯一配置包：功能 Runtime、用户 custom.cfg、Default/Echo/YSZH/VisionL 案例与 Valve 重置基线",
    file: "SrP-CFG_Runtime_Core.zip",
    url: dl("SrP-CFG_Runtime_Core.zip"),
    badge: "RUNTIME + USER",
    featured: true,
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
      <PageHeader
        title="配置包下载"
        description="获取 v3 唯一 Runtime Core；内置 Preset 与用户入口已经包含在同一个包中。"
      />

      <div className="ui-body bg-accent-bg border border-accent/20 rounded-[var(--radius)] px-4 py-3">
        现在只发行 Runtime Core。安装后到「我的配置」选择 Default、Echo、YSZH 或 VisionL 作为 custom.cfg 起点，
        再把个人差异写在下面；也可以不选择 Preset，继续让 VCFG 管理普通游戏设置。
      </div>

      {/* Runtime package */}
      <section>
        <h2 className="ui-section-title mb-4 flex items-center gap-2">
          <Package size={18} className="text-teal" />
          v3 配置包
        </h2>
        <div className="grid grid-cols-1 gap-4">
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
                  <span className={`flex items-center gap-1 rounded px-2 py-1 font-mono text-xs font-semibold ${
                    pkg.featured ? "bg-accent text-bg" : "bg-bg-raised text-text-faint border border-border"
                  }`}>
                    {pkg.featured && <Star size={12} />}
                    {pkg.badge}
                  </span>
                </div>
              </div>
              <h3 className="ui-section-title mb-1 transition-colors group-hover:text-accent">
                {pkg.name}
              </h3>
              <p className="ui-body mb-3">
                {pkg.desc}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="break-all font-mono text-xs text-text-faint">
                  {pkg.file}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadInApp(pkg.url, pkg.file)}
                    disabled={downloading !== null}
                    title="下载到应用内，可在安装页直接使用"
                    className="flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border-none bg-accent px-3 text-xs font-medium text-bg transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {downloading === pkg.file ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ArrowDownToLine size={12} />
                    )}
                    下载到应用
                  </button>
                  <button
                    type="button"
                    aria-label="在浏览器中下载 Runtime Core"
                    onClick={() => window.api.openExternal("https://cfg.srprolin.top/download/")}
                    title="在浏览器中下载"
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-transparent text-text-muted transition-colors hover:bg-accent-bg hover:text-accent"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info box */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-5 flex gap-4">
        <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-accent-bg border border-accent/10 flex items-center justify-center flex-shrink-0">
          <Info size={18} className="text-accent" />
        </div>
        <div>
          <h2 className="ui-panel-title mb-1">使用说明</h2>
          <p className="ui-body">
            「下载到应用」会将配置包保存到应用管理目录，在安装页面的「已下载配置包」中可直接选择安装。
            所有文件也可在{" "}
            <button
              type="button"
              onClick={() =>
                window.api.openExternal(
                  `${REPO_URL}/releases`,
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
