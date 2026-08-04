import { useState } from "react";
import {
  ArrowDownToLine,
  ExternalLink,
  Info,
  Package,
  Star,
  Loader2,
} from "lucide-react";
import { REPO_URL, dl, dlGithub } from "../lib/downloads";
import { Card, PageHeader } from "@srp-cfg/ui";

const packages = [
  {
    name: "Runtime Core",
    desc: "唯一配置包：功能 Runtime、用户 custom.cfg、Default/Echo/YSZH/VisionL 案例与 Valve 重置基线",
    file: "SrP-CFG_Runtime_Core.zip",
    // 国内加速（镜像前缀，推荐） / GitHub 源（直连）——均下载到应用内（staging 目录，安装页可直接用）
    mirrorUrl: dl("SrP-CFG_Runtime_Core.zip"),
    githubUrl: dlGithub("SrP-CFG_Runtime_Core.zip"),
    badge: "RUNTIME + USER",
    featured: true,
  },
];

export default function DownloadPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // 下载到应用内：保存到软件管理目录（staging），安装页「已下载配置包」可直接选择安装
  const handleDownloadInApp = async (url: string, fileName: string) => {
    if (downloading) return;
    setDownloading(fileName);
    setDownloadError(null);
    try {
      await window.api.downloadFromUrl(url, fileName);
    } catch (e) {
      // 静默失败会让用户误以为已下载（安装页看不到）；显式提示可切换来源重试
      const message = e instanceof Error ? e.message : String(e);
      setDownloadError(`下载失败：${message}。可点击另一个按钮切换下载来源重试。`);
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
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadInApp(pkg.mirrorUrl, pkg.file)}
                    disabled={downloading !== null}
                    title="国内加速镜像下载（推荐）"
                    className="flex min-h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border-none bg-accent px-4 text-xs font-semibold text-bg transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {downloading === pkg.file ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <ArrowDownToLine size={13} />
                    )}
                    国内加速下载
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadInApp(pkg.githubUrl, pkg.file)}
                    disabled={downloading !== null}
                    title="GitHub Releases 源下载"
                    className="flex min-h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-transparent px-4 text-xs font-medium text-text-secondary transition-colors hover:border-text-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {downloading === pkg.file ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <ExternalLink size={13} />
                    )}
                    GitHub 源下载
                  </button>
                </div>
                {downloadError && (
                  <p className="mt-3 w-full text-xs leading-5 text-red">
                    {downloadError}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info box */}
      <Card padding="lg" className="flex gap-4">
        <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-accent-bg border border-accent/10 flex items-center justify-center flex-shrink-0">
          <Info size={18} className="text-accent" />
        </div>
        <div>
          <h2 className="ui-panel-title mb-1">使用说明</h2>
          <p className="ui-body">
            两个下载按钮都会把配置包保存到应用内（国内加速走镜像，GitHub 源直连，均指向官方 Release
            资产）；下载完成后在安装页面的「已下载配置包」中可直接选择安装。所有文件也可在{" "}
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
      </Card>
    </div>
  );
}
