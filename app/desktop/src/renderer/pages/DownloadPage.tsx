import {
  ArrowDownToLine,
  ExternalLink,
  Info,
  Package,
  Star,
} from "lucide-react";
import { REPO_URL, dl, dlGithub } from "../lib/downloads";
import { Card, PageHeader } from "@srp-cfg/ui";

const packages = [
  {
    name: "Runtime Core",
    desc: "唯一配置包：功能 Runtime、用户 custom.cfg、Default/Echo/YSZH/VisionL 案例与 Valve 重置基线",
    file: "SrP-CFG_Runtime_Core.zip",
    // 国内加速（镜像前缀，推荐） / GitHub 源（直连）
    mirrorUrl: dl("SrP-CFG_Runtime_Core.zip"),
    githubUrl: dlGithub("SrP-CFG_Runtime_Core.zip"),
    badge: "RUNTIME + USER",
    featured: true,
  },
];

export default function DownloadPage() {
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
                    onClick={() => window.api.openExternal(pkg.mirrorUrl)}
                    title="国内加速镜像下载（推荐）"
                    className="flex min-h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border-none bg-accent px-4 text-xs font-semibold text-bg transition-colors hover:bg-accent-light"
                  >
                    <ArrowDownToLine size={13} />
                    国内加速下载
                    <span className="rounded bg-bg/20 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide">
                      推荐
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.api.openExternal(pkg.githubUrl)}
                    title="GitHub Releases 源下载"
                    className="flex min-h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-transparent px-4 text-xs font-medium text-text-secondary transition-colors hover:border-text-muted hover:text-text"
                  >
                    <ExternalLink size={13} />
                    GitHub 源下载
                  </button>
                </div>
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
            推荐使用「国内加速下载」；两个入口都指向官方 GitHub Release 资产（国内加速走镜像，
            GitHub 源直连）。下载配置包后，拖入安装窗口或在安装页点击选择文件即可导入。所有文件也可在{" "}
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
