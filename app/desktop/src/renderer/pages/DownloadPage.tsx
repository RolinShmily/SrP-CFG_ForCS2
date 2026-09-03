import { useState } from "react";
import {
  ArrowDownToLine,
  ExternalLink,
  Package,
  Star,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Map,
  Tv,
  Sparkles,
} from "lucide-react";
import { REPO_URL, dl, dlGithub } from "../lib/downloads";
import { PageHeader } from "@srp-cfg/ui";
import type { Page } from "../App";

const OFFICIAL_COMPONENTS = [
  {
    id: "runtime-core",
    name: "Runtime Core (CFG 核心运行时)",
    desc: "核心架构：模块化 alias、跳投/大跳/准星切换等全套脚本功能、预设起点库与 custom.cfg 注入入口。",
    file: "SrP-CFG_Runtime_Core.zip",
    mirrorUrl: dl("SrP-CFG_Runtime_Core.zip"),
    githubUrl: dlGithub("SrP-CFG_Runtime_Core.zip"),
    badge: "CORE RUNTIME",
    icon: Package,
    featured: true,
  },
  {
    id: "map-guides",
    name: "地图跑图与投掷物指南 (Annotations)",
    desc: "包含 Dust2, Mirage, Inferno, Ancient 等官方竞技地图的实用跑图、烟闪道具落点及标注指南。",
    file: "SrP-CFG_Map_Guides.zip",
    mirrorUrl: dl("SrP-CFG_Map_Guides.zip"),
    githubUrl: dlGithub("SrP-CFG_Map_Guides.zip"),
    badge: "ANNOTATIONS",
    icon: Map,
    featured: false,
  },
  {
    id: "video-config",
    name: "推荐画面与视频设置 (Video Config)",
    desc: "经过高刷优化与职业选手参数调校的 cs2_video.txt 画面预设，兼顾极低延迟与画面清晰度。",
    file: "SrP-CFG_Video_Settings.zip",
    mirrorUrl: dl("SrP-CFG_Video_Settings.zip"),
    githubUrl: dlGithub("SrP-CFG_Video_Settings.zip"),
    badge: "VIDEO SETTINGS",
    icon: Tv,
    featured: false,
  },
];

interface Props {
  onNavigate?: (page: Page) => void;
}

export default function DownloadPage({ onNavigate }: Props) {
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [batchDownloading, setBatchDownloading] = useState(false);

  // 单包下载到应用内
  const handleDownloadInApp = async (url: string, fileName: string) => {
    if (downloadingUrl) return;
    setDownloadingUrl(url);
    setDownloadError(null);
    setDownloadSuccess(null);
    try {
      const isWebPreview =
        typeof window === "undefined" || !(window as any).__TAURI_INTERNALS__;

      if (isWebPreview) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setDownloadSuccess(fileName);
        return;
      }

      const result = await window.api.downloadFromUrl(url, fileName);
      if (result) {
        setDownloadSuccess(fileName);
      } else {
        setDownloadError("下载未完成，可尝试切换下载源重试。");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setDownloadError(`下载失败：${message}。可尝试切换下载源重试。`);
    } finally {
      setDownloadingUrl(null);
    }
  };

  // 一键下载全部推荐组件
  const handleDownloadAll = async () => {
    if (batchDownloading || downloadingUrl) return;
    setBatchDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(null);
    try {
      for (const comp of OFFICIAL_COMPONENTS) {
        const isWebPreview =
          typeof window === "undefined" || !(window as any).__TAURI_INTERNALS__;
        if (isWebPreview) {
          await new Promise((resolve) => setTimeout(resolve, 400));
        } else {
          await window.api.downloadFromUrl(comp.mirrorUrl, comp.file);
        }
      }
      setDownloadSuccess("已成功下载全部官方组件！");
    } catch (err) {
      setDownloadError(`批量下载失败: ${err}`);
    } finally {
      setBatchDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="组件下载"
          description="解耦的三大官方组件。Runtime Core 保持极致纯粹，视频设置与地图指南按需分发。"
        />

        <button
          type="button"
          onClick={handleDownloadAll}
          disabled={batchDownloading || downloadingUrl !== null}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-orange-950/40 shrink-0 disabled:opacity-50"
        >
          {batchDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>一键下载全部推荐组件</span>
        </button>
      </div>

      {downloadSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess} 已就绪于本地暂存区。</span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate("install")}
              className="flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              <span>前往安装</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {downloadError && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* 3 大组件独立卡片 */}
      <div className="grid grid-cols-1 gap-4">
        {OFFICIAL_COMPONENTS.map((pkg) => {
          const IconComp = pkg.icon;
          const isDownloadingMirror = downloadingUrl === pkg.mirrorUrl;
          const isDownloadingGithub = downloadingUrl === pkg.githubUrl;

          return (
            <div
              key={pkg.file}
              className={`bg-bg-card border rounded-lg p-5 transition-all hover:border-neutral-700 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                pkg.featured ? "border-orange-500/30 shadow-sm" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    pkg.featured
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      : "bg-bg-raised text-text-muted border border-border"
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-text">{pkg.name}</h3>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        pkg.featured
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {pkg.badge}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed max-w-2xl">
                    {pkg.desc}
                  </p>
                </div>
              </div>

              {/* 下载操作按钮组 */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                <button
                  type="button"
                  onClick={() => handleDownloadInApp(pkg.mirrorUrl, pkg.file)}
                  disabled={downloadingUrl !== null || batchDownloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium transition shadow-sm disabled:opacity-40"
                  title="使用国内高速镜像源下载至应用内"
                >
                  {isDownloadingMirror ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                  )}
                  <span>加速下载</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadInApp(pkg.githubUrl, pkg.file)}
                  disabled={downloadingUrl !== null || batchDownloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-xs font-medium transition disabled:opacity-40"
                  title="使用 GitHub Releases 直连下载"
                >
                  {isDownloadingGithub ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="w-3 h-3" />
                  )}
                  <span>GitHub 源</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
