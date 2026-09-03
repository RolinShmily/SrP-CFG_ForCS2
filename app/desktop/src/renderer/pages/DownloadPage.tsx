import { useState, useEffect, useCallback } from "react";
import {
  ArrowDownToLine,
  ExternalLink,
  Package,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Map,
  Tv,
  Sparkles,
  Plus,
  Trash2,
  FolderOpen,
  Check,
  Layers,
  FileArchive,
  Upload,
  RotateCcw,
  X,
  FileCode,
} from "lucide-react";
import { dl, dlGithub } from "../lib/downloads";
import { PageHeader } from "@srp-cfg/ui";
import UploadZone from "../components/UploadZone";
import type { Page } from "../App";
import type { PreInstallItem, DownloadEntry, UploadedEntry } from "../types";

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
  preInstallList: PreInstallItem[];
  onTogglePreInstall: (item: PreInstallItem) => void;
  onAddPreInstall: (item: PreInstallItem) => void;
  onRemovePreInstall: (id: string) => void;
  onClearPreInstall: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function inferComponentType(name: string): "cfg" | "annotations" | "video" | "mixed" {
  const lower = name.toLowerCase();
  if (lower.includes("video") || lower.includes("cs2_video")) return "video";
  if (lower.includes("guide") || lower.includes("annotation") || lower.includes("map")) return "annotations";
  if (lower.includes("runtime") || lower.includes("core") || lower.endsWith(".cfg") || lower.includes("srp-cfg")) return "cfg";
  return "mixed";
}

export default function DownloadPage({
  onNavigate,
  preInstallList,
  onTogglePreInstall,
  onAddPreInstall,
  onRemovePreInstall,
  onClearPreInstall,
}: Props) {
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [batchDownloading, setBatchDownloading] = useState(false);

  // 本地库数据
  const [downloadEntries, setDownloadEntries] = useState<DownloadEntry[]>([]);
  const [uploadedEntries, setUploadedEntries] = useState<UploadedEntry[]>([]);
  const [loadingPool, setLoadingPool] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFilePool = useCallback(async () => {
    setLoadingPool(true);
    try {
      const [dlList, upList] = await Promise.all([
        window.api.getDownloadEntries().catch(() => []),
        window.api.getUploadedEntries().catch(() => []),
      ]);
      setDownloadEntries(dlList || []);
      setUploadedEntries(upList || []);
    } finally {
      setLoadingPool(false);
    }
  }, []);

  useEffect(() => {
    void loadFilePool();
  }, [loadFilePool]);

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
        await new Promise((resolve) => setTimeout(resolve, 600));
        setDownloadSuccess(fileName);
        const folderName = fileName.replace(/\.zip$/i, "");
        onAddPreInstall({
          id: `download:${folderName}`,
          name: fileName,
          sourceType: "download",
          size: 1024 * 150,
          timestamp: Date.now(),
          folderName,
          componentType: inferComponentType(fileName),
        });
        await loadFilePool();
        return;
      }

      const result = await window.api.downloadFromUrl(url, fileName);
      if (result) {
        setDownloadSuccess(fileName);
        onAddPreInstall({
          id: `download:${result.folderName}`,
          name: result.fileName,
          sourceType: "download",
          size: result.size,
          timestamp: result.timestamp,
          folderName: result.folderName,
          componentType: inferComponentType(result.fileName),
        });
        await loadFilePool();
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
          await new Promise((resolve) => setTimeout(resolve, 300));
        } else {
          const res = await window.api.downloadFromUrl(comp.mirrorUrl, comp.file);
          if (res) {
            onAddPreInstall({
              id: `download:${res.folderName}`,
              name: res.fileName,
              sourceType: "download",
              size: res.size,
              timestamp: res.timestamp,
              folderName: res.folderName,
              componentType: inferComponentType(res.fileName),
            });
          }
        }
        if (isWebPreview) {
          const folderName = comp.file.replace(/\.zip$/i, "");
          onAddPreInstall({
            id: `download:${folderName}`,
            name: comp.file,
            sourceType: "download",
            size: 1024 * 150,
            timestamp: Date.now(),
            folderName,
            componentType: inferComponentType(comp.file),
          });
        }
      }
      setDownloadSuccess("已成功下载全部官方组件并加入预安装清单！");
      await loadFilePool();
    } catch (err) {
      setDownloadError(`批量下载失败: ${err}`);
    } finally {
      setBatchDownloading(false);
    }
  };

  // 删除已下载项目
  const handleDeleteDownload = async (folderName: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(id);
    try {
      await window.api.deleteDownload(folderName);
      onRemovePreInstall(id);
      await loadFilePool();
    } finally {
      setDeletingId(null);
    }
  };

  // 删除自定义上传项目
  const handleDeleteUpload = async (folderName: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(id);
    try {
      await window.api.deleteUploadEntry(folderName);
      onRemovePreInstall(id);
      await loadFilePool();
    } finally {
      setDeletingId(null);
    }
  };

  // 合并候选池条目
  const candidateItems: PreInstallItem[] = [
    ...downloadEntries.map((dl) => ({
      id: `download:${dl.folderName}`,
      name: dl.fileName,
      sourceType: "download" as const,
      size: dl.size,
      timestamp: dl.timestamp,
      folderName: dl.folderName,
      componentType: inferComponentType(dl.fileName),
    })),
    ...uploadedEntries.map((up) => ({
      id: `upload:${up.folderName}`,
      name: up.displayName,
      sourceType: "upload" as const,
      size: up.size,
      timestamp: up.timestamp,
      fileCount: up.fileCount,
      folderName: up.folderName,
      componentType: inferComponentType(up.displayName),
    })),
  ];

  const totalPreInstallBytes = preInstallList.reduce((acc, curr) => acc + curr.size, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* 顶部标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="组件下载 (Component Downloads)"
          description="获取官方解耦组件或上传第三方自定义扩展包；在下方两列视图中组织预安装队列。"
        />

        <button
          type="button"
          onClick={handleDownloadAll}
          disabled={batchDownloading || downloadingUrl !== null}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-orange-950/40 shrink-0 disabled:opacity-50 cursor-pointer"
        >
          {batchDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>一键下载全部官方组件</span>
        </button>
      </div>

      {downloadSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess} 已就绪，可在下方将其添加至预安装清单。</span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate("install")}
              className="flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
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

      {/* 1. 官方 3 大解耦组件卡片 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-orange-400" />
            <span>官方组件模版 (Official Components)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {OFFICIAL_COMPONENTS.map((pkg) => {
            const IconComp = pkg.icon;
            const isDownloadingMirror = downloadingUrl === pkg.mirrorUrl;
            const isDownloadingGithub = downloadingUrl === pkg.githubUrl;
            const isAlreadyDownloaded = downloadEntries.some((d) => d.fileName === pkg.file);

            return (
              <div
                key={pkg.file}
                className={`bg-bg-card border rounded-lg p-4 flex flex-col justify-between transition-all hover:border-neutral-700 ${
                  pkg.featured ? "border-orange-500/40 shadow-sm bg-gradient-to-b from-orange-500/5 to-transparent" : "border-border"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        pkg.featured
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                          : "bg-bg-raised text-text-muted border border-border"
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
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

                  <div>
                    <h3 className="text-xs font-semibold text-text">{pkg.name}</h3>
                    <p className="text-[11px] text-text-muted leading-relaxed mt-1 line-clamp-3">
                      {pkg.desc}
                    </p>
                  </div>
                </div>

                {/* 下载按钮 */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-2">
                  <div className="text-[10px] text-text-faint font-mono">
                    {isAlreadyDownloaded ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> 已在文件库
                      </span>
                    ) : (
                      <span>{pkg.file}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadInApp(pkg.mirrorUrl, pkg.file)}
                      disabled={downloadingUrl !== null || batchDownloading}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium transition shadow-sm disabled:opacity-40 cursor-pointer"
                      title="国内镜像极速下载"
                    >
                      {isDownloadingMirror ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ArrowDownToLine className="w-3 h-3" />
                      )}
                      <span>下载</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadInApp(pkg.githubUrl, pkg.file)}
                      disabled={downloadingUrl !== null || batchDownloading}
                      className="p-1 rounded bg-bg-raised hover:bg-neutral-700 text-text-muted border border-border text-xs transition disabled:opacity-40 cursor-pointer"
                      title="GitHub 直连源"
                    >
                      {isDownloadingGithub ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ExternalLink className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 自定义上传 UI */}
      <div className="bg-bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-text flex items-center gap-2">
            <Upload className="w-3.5 h-3.5 text-orange-400" />
            <span>自定义上传 / 第三方扩展包 (Custom Upload)</span>
          </h2>
          <span className="text-[11px] text-text-muted">
            支持拖拽第三方 .zip 整合包或散装 .cfg / .txt 文件
          </span>
        </div>
        <UploadZone
          onUploadComplete={async () => {
            const upList = await window.api.getUploadedEntries().catch(() => []);
            if (upList && upList.length > 0) {
              const latest = upList[0];
              onAddPreInstall({
                id: `upload:${latest.folderName}`,
                name: latest.displayName,
                sourceType: "upload",
                size: latest.size,
                timestamp: latest.timestamp,
                fileCount: latest.fileCount,
                folderName: latest.folderName,
                componentType: inferComponentType(latest.displayName),
              });
            }
            await loadFilePool();
          }}
        />
      </div>

      {/* 3. 双列式 UI：左侧已就绪文件库 vs 右侧预安装清单 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-text flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span>配置包管理与预安装清单 (Staging Queue & Pool)</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadFilePool()}
              className="flex items-center gap-1 px-2 py-1 rounded bg-bg-raised border border-border text-[11px] text-text-muted hover:text-text hover:border-neutral-600 transition cursor-pointer"
            >
              <RotateCcw className={`w-3 h-3 ${loadingPool ? "animate-spin" : ""}`} />
              <span>刷新文件池</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 左列：已下载与已上传文件池 (候选库) */}
          <div className="bg-bg-card border border-border rounded-lg p-4 flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text">已就绪文件库</span>
                <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 text-[10px] font-mono">
                  {candidateItems.length} 项
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => window.api.openDownloadsFolder()}
                  className="text-text-muted hover:text-orange-400 transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <FolderOpen className="w-3 h-3" />
                  下载目录
                </button>
                <span className="text-border">|</span>
                <button
                  type="button"
                  onClick={() => window.api.openUploadsFolder()}
                  className="text-text-muted hover:text-orange-400 transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <FolderOpen className="w-3 h-3" />
                  上传目录
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 max-h-[340px]">
              {candidateItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center text-text-faint">
                  <FileArchive className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs">文件库暂无配置包</p>
                  <p className="text-[11px] mt-1 text-text-muted">
                    请在上方下载官方组件，或拖拽上传第三方 zip / cfg 文件
                  </p>
                </div>
              ) : (
                candidateItems.map((item) => {
                  const isQueued = preInstallList.some((p) => p.id === item.id);
                  const isDeleting = deletingId === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isQueued && onTogglePreInstall(item)}
                      className={`group p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                        isQueued
                          ? "bg-bg-raised/40 border-border/70 opacity-80"
                          : "bg-bg-raised/70 border-border hover:border-orange-500/50 hover:bg-bg-raised cursor-pointer shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {item.sourceType === "download" ? (
                          <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                            <Upload className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-text truncate" title={item.name}>
                              {item.name}
                            </span>
                            {item.sourceType === "download" ? (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[10px] font-sans">
                                官方下载
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[10px] font-sans">
                                自定义上传
                              </span>
                            )}
                            {item.componentType === "cfg" && (
                              <span className="px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px]">
                                CFG 核心
                              </span>
                            )}
                            {item.componentType === "annotations" && (
                              <span className="px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px]">
                                地图标注
                              </span>
                            )}
                            {item.componentType === "video" && (
                              <span className="px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px]">
                                视频设置
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-text-faint font-mono">
                            <span>{formatBytes(item.size)}</span>
                            {item.fileCount ? <span>{item.fileCount} 个内部文件</span> : null}
                          </div>
                        </div>
                      </div>

                      {/* 加入操作 & 删除 */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isQueued ? (
                          <span className="px-2 py-1 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 text-[11px] flex items-center gap-1 select-none">
                            <Check className="w-3 h-3 text-emerald-400" />
                            已在清单
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePreInstall(item);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-orange-600/90 hover:bg-orange-500 text-white text-[11px] font-medium transition cursor-pointer shadow-sm"
                          >
                            <Plus className="w-3 h-3" />
                            <span>加入预安装</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) =>
                            item.sourceType === "download"
                              ? handleDeleteDownload(item.folderName || "", item.id, e)
                              : handleDeleteUpload(item.folderName || "", item.id, e)
                          }
                          disabled={isDeleting}
                          className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                          title="从本地磁盘彻底删除此包"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 右列：预安装清单 (Pre-install Queue) */}
          <div className="bg-bg-card border border-border rounded-lg p-4 flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text">预安装清单 (待部署队列)</span>
                <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 text-[10px] font-mono font-medium">
                  {preInstallList.length} 项 ({formatBytes(totalPreInstallBytes)})
                </span>
              </div>
              {preInstallList.length > 0 && (
                <button
                  type="button"
                  onClick={onClearPreInstall}
                  className="text-[11px] text-text-muted hover:text-red-400 transition cursor-pointer"
                >
                  清空清单
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 max-h-[340px]">
              {preInstallList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center text-text-faint border-2 border-dashed border-border/60 rounded-lg p-6">
                  <Plus className="w-8 h-8 mb-2 text-neutral-600" />
                  <p className="text-xs font-medium text-text-muted">预安装清单暂为空</p>
                  <p className="text-[11px] mt-1 text-text-faint max-w-xs leading-relaxed">
                    点击左侧文件库的「➕ 加入预安装」，选定要部署到 CS2 游戏的配置包
                  </p>
                </div>
              ) : (
                preInstallList.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg border border-orange-500/30 bg-orange-500/5 flex items-center justify-between gap-2.5 shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-6 h-6 rounded bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                        <FileCode className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium text-text truncate" title={item.name}>
                            {item.name}
                          </span>
                          {item.sourceType === "download" ? (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                              官方下载
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                              自定义上传
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-text-faint font-mono">
                          {formatBytes(item.size)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemovePreInstall(item.id)}
                      className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                      title="从预安装清单移出"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. 底部引导区：前往组件安装 */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-border rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="space-y-0.5 text-center sm:text-left">
          <div className="text-xs font-semibold text-text flex items-center gap-2 justify-center sm:justify-start">
            <span>预安装准备就绪</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-mono font-semibold">
              {preInstallList.length > 0 ? `${preInstallList.length} 个待安装包` : "默认全量暂存"}
            </span>
          </div>
          <p className="text-[11px] text-text-muted">
            切换页面不会丢失预安装队列状态。点击下一步前往「组件安装」核对目标物理路径并执行一键部署。
          </p>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("install")}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-orange-950/50 shrink-0 cursor-pointer"
          >
            <span>前往组件安装 (Step 2)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
