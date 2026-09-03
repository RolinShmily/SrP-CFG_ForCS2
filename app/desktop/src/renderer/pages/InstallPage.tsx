import { useState, useRef, useCallback, useEffect } from "react";
import {
  Folder,
  RefreshCw,
  User,
  Package,
  MapPin,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FolderEdit,
  Play,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  ArrowDownToLine,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import SteamStatusBanner from "../components/SteamStatusBanner";
import UploadZone from "../components/UploadZone";
import UploadedList from "../components/UploadedList";
import { PageHeader, Modal } from "@srp-cfg/ui";
import type { DetectionResult, StagingStatus } from "../types";
import { dl } from "../lib/downloads";

interface Props {
  detection: DetectionResult | null;
  refreshing: boolean;
  onRefresh: () => void;
  onUserChange: (accountId: string) => void;
}

interface PathModalState {
  open: boolean;
  componentKey: "cfg" | "annotations" | "video";
  title: string;
  description: string;
  currentValue: string;
  defaultValue: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function InstallPage({
  detection,
  refreshing,
  onRefresh,
  onUserChange,
}: Props) {
  // Component installation toggles
  const [installCfg, setInstallCfg] = useState(true);
  const [installAnnotations, setInstallAnnotations] = useState(true);
  const [installVideo, setInstallVideo] = useState(false);

  // Staging status (local downloaded/ready files)
  const [stagingStatus, setStagingStatus] = useState<StagingStatus | null>(null);
  const [inCardDownloading, setInCardDownloading] = useState<string | null>(null);

  // Collapsible cards state
  const [collapsedComps, setCollapsedComps] = useState<Record<string, boolean>>({});

  const toggleCompCollapse = (key: string) => {
    setCollapsedComps((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Custom path overrides
  const [customCfgPath, setCustomCfgPath] = useState<string>("");
  const [customAnnotationsPath, setCustomAnnotationsPath] = useState<string>("");
  const [customVideoPath, setCustomVideoPath] = useState<string>("");

  // Path Edit Modal state
  const [pathModal, setPathModal] = useState<PathModalState | null>(null);

  // Process status
  const [cs2Running, setCs2Running] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installSuccessMessage, setInstallSuccessMessage] = useState<string | null>(null);

  const [selectedUpload, setSelectedUpload] = useState<string | null>(null);
  const uploadedListRef = useRef<{ reload: () => void } | null>(null);

  // Load staging area status
  const loadStagingStatus = useCallback(async () => {
    try {
      const status = await window.api.getStagingStatus();
      setStagingStatus(status);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadStagingStatus();
  }, [loadStagingStatus]);

  // Check if CS2 is running
  const checkProcess = useCallback(async () => {
    try {
      const running = await window.api.checkCs2Running();
      setCs2Running(running);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    checkProcess();
    const interval = setInterval(checkProcess, 5000);
    return () => clearInterval(interval);
  }, [checkProcess]);

  const effectiveCfgPath = customCfgPath || detection?.cs2CfgPath || "";
  const effectiveAnnotationsPath = customAnnotationsPath || detection?.annotationsPath || "";
  const effectiveVideoPath = customVideoPath || detection?.userCfgPath || "";

  // 卡片内一键极速下载组件包
  const handleInCardDownload = async (componentKey: "cfg" | "annotations" | "video") => {
    const compMeta = {
      cfg: { file: "SrP-CFG_Runtime_Core.zip", url: dl("SrP-CFG_Runtime_Core.zip") },
      annotations: { file: "SrP-CFG_Map_Guides.zip", url: dl("SrP-CFG_Map_Guides.zip") },
      video: { file: "SrP-CFG_Video_Settings.zip", url: dl("SrP-CFG_Video_Settings.zip") },
    }[componentKey];

    setInCardDownloading(componentKey);
    try {
      const isWebPreview =
        typeof window === "undefined" || !(window as any).__TAURI_INTERNALS__;
      if (isWebPreview) {
        await new Promise((r) => setTimeout(r, 600));
      } else {
        await window.api.downloadFromUrl(compMeta.url, compMeta.file);
      }
      await loadStagingStatus();
    } catch (err) {
      alert(`下载失败: ${err}`);
    } finally {
      setInCardDownloading(null);
    }
  };

  const openEditPath = (componentKey: "cfg" | "annotations" | "video") => {
    if (componentKey === "cfg") {
      setPathModal({
        open: true,
        componentKey: "cfg",
        title: "自定义 CS2 CFG 运行时路径",
        description: "通常位于 Counter-Strike 2 安装目录下的 game/csgo/cfg 文件夹。",
        currentValue: effectiveCfgPath,
        defaultValue: detection?.cs2CfgPath || "",
      });
    } else if (componentKey === "annotations") {
      setPathModal({
        open: true,
        componentKey: "annotations",
        title: "自定义地图跑图与指南路径",
        description: "通常位于 Counter-Strike 2 安装目录下的 game/csgo/annotations 文件夹。",
        currentValue: effectiveAnnotationsPath,
        defaultValue: detection?.annotationsPath || "",
      });
    } else {
      setPathModal({
        open: true,
        componentKey: "video",
        title: "自定义视频/用户配置路径",
        description: "位于 Steam 用户数据目录 userdata/<账号ID>/730/local/cfg。",
        currentValue: effectiveVideoPath,
        defaultValue: detection?.userCfgPath || "",
      });
    }
  };

  const handleSavePathModal = () => {
    if (!pathModal) return;
    const trimmed = pathModal.currentValue.trim();
    if (pathModal.componentKey === "cfg") {
      setCustomCfgPath(trimmed);
    } else if (pathModal.componentKey === "annotations") {
      setCustomAnnotationsPath(trimmed);
    } else if (pathModal.componentKey === "video") {
      setCustomVideoPath(trimmed);
    }
    setPathModal(null);
  };

  const handleResetToDefaultPath = () => {
    if (!pathModal) return;
    if (pathModal.componentKey === "cfg") {
      setCustomCfgPath("");
    } else if (pathModal.componentKey === "annotations") {
      setCustomAnnotationsPath("");
    } else if (pathModal.componentKey === "video") {
      setCustomVideoPath("");
    }
    setPathModal(null);
  };

  const handleExecuteInstall = async () => {
    const selectedComponents: string[] = [];
    if (installCfg) selectedComponents.push("cfg");
    if (installAnnotations) selectedComponents.push("annotations");
    if (installVideo) selectedComponents.push("video");

    if (selectedComponents.length === 0) {
      alert("请至少勾选一个需要安装的组件！");
      return;
    }

    // 检查所选组件是否有来源文件
    const missingSources: string[] = [];
    if (installCfg && (!stagingStatus?.cfg.isReady || stagingStatus.cfg.fileCount === 0)) {
      missingSources.push("Runtime Core (CFG 核心运行时)");
    }
    if (installAnnotations && (!stagingStatus?.annotations.isReady || stagingStatus.annotations.fileCount === 0)) {
      missingSources.push("地图跑图与投掷物指南");
    }
    if (installVideo && (!stagingStatus?.video.isReady || stagingStatus.video.fileCount === 0)) {
      missingSources.push("推荐画面与视频设置");
    }

    if (missingSources.length > 0 && selectedComponents.length === missingSources.length) {
      alert(
        `以下勾选的组件在本地暂存区暂无安装包：\n${missingSources.join("\n")}\n\n请先在卡片内点击「一键下载此组件」或在「组件下载」页下载后再部署。`
      );
      return;
    }

    setInstalling(true);
    setInstallSuccessMessage(null);

    const overridePaths: Record<string, string> = {};
    if (customCfgPath) overridePaths.cfg = customCfgPath;
    if (customAnnotationsPath) overridePaths.annotations = customAnnotationsPath;
    if (customVideoPath) overridePaths.video = customVideoPath;

    try {
      const res = await window.api.installComponentsPipeline(
        selectedComponents,
        overridePaths,
        false
      );

      if (res.success) {
        setInstallSuccessMessage(
          `部署成功！已将所选组件（${res.filesInstalled} 个文件，${res.dirsInstalled} 个目录）安装就绪。${
            res.backupId ? `自动创建备份快照 [${res.backupId}]。` : ""
          }`
        );
      } else {
        alert(`安装失败：${res.message}`);
      }
    } catch (err) {
      alert(`安装过程异常: ${err}`);
    } finally {
      setInstalling(false);
      onRefresh();
      loadStagingStatus();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-6">
      <PageHeader
        title="组件安装"
        description="可视化检测本地暂存区与 CS2 目标路径。按需勾选部署，安装前自动生成快照备份。"
      />

      {/* CS2 游戏运行软提示 */}
      {cs2Running && (
        <div className="flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-amber-300">检测到 CS2 正在运行中：</span>{" "}
            安装仍可正常执行，但为保证新配置文件即刻生效并避免 Windows 文件句柄占用，建议在游戏未运行时安装。
          </div>
        </div>
      )}

      {/* 安装成功提示 */}
      {installSuccessMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1 font-medium">{installSuccessMessage}</div>
        </div>
      )}

      {/* Steam / CS2 检测卡片 */}
      {detection && <SteamStatusBanner detection={detection} />}

      {/* Steam 账号切换 */}
      {detection && detection.steamUsers.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2">
            <User size={16} className="text-orange-400" />
            <span className="text-sm font-medium text-text">当前登录 Steam 账号</span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={detection.currentUser?.accountId ?? ""}
              onChange={(e) => onUserChange(e.target.value)}
              className="rounded-md border border-border bg-bg-raised px-3 py-1.5 font-mono text-sm text-text focus:border-accent outline-none"
            >
              {detection.steamUsers.map((u) => (
                <option key={u.accountId} value={u.accountId}>
                  {u.personaName ? `${u.personaName} (${u.accountId})` : u.accountId}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                onRefresh();
                loadStagingStatus();
              }}
              disabled={refreshing}
              className="p-1.5 text-text-muted hover:text-text rounded hover:bg-bg-hover transition"
              title="重新检测"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      )}

      {/* 模块化组件与双轨状态卡片 (来源 ➔ 目标) */}
      <section className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-400" />
            <span>选择要安装的组件与路径检测</span>
          </h2>
          <span className="text-xs text-text-muted">双轨状态检测：安装来源（暂存区） ➔ 目标路径（CS2 目录）</span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {/* 组件 1: Runtime Core */}
          <div
            className={`flex flex-col rounded-xl border transition-all overflow-hidden ${
              installCfg
                ? "bg-bg-raised/60 border-orange-500/40 shadow-sm"
                : "bg-bg-raised/20 border-border opacity-70"
            }`}
          >
            {/* 卡片头部 */}
            <div
              onClick={() => toggleCompCollapse("cfg")}
              className="flex items-center justify-between p-3.5 cursor-pointer select-none hover:bg-bg-raised/80 transition-colors gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <input
                  type="checkbox"
                  id="comp-cfg"
                  checked={installCfg}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setInstallCfg(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer shrink-0"
                />
                <label
                  htmlFor="comp-cfg"
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-sm text-text cursor-pointer flex items-center gap-2 truncate"
                >
                  <span className="truncate">Runtime Core (CFG 核心运行时)</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-orange-500/20 text-orange-400 font-medium shrink-0">
                    核心推荐
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {stagingStatus?.cfg.isReady ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 已就绪 ({stagingStatus.cfg.fileCount} 文件)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-400 font-medium whitespace-nowrap">
                    <AlertTriangle className="w-3.5 h-3.5" /> 暂存区无文件
                  </span>
                )}
                {collapsedComps["cfg"] ? (
                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-orange-400 shrink-0" />
                )}
              </div>
            </div>

            {/* 卡片折叠展开内容 */}
            {!collapsedComps["cfg"] && (
              <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-2.5">
                {/* 来源端 */}
                <div className="p-2.5 bg-bg-card border border-border/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted font-medium shrink-0">安装来源:</span>
                    {stagingStatus?.cfg.isReady ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>已下载就绪（包含 {stagingStatus.cfg.fileCount} 个 CFG 文件 · {formatBytes(stagingStatus.cfg.totalSize)}）</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>本地暂存区暂无此组件包</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInCardDownload("cfg")}
                    disabled={inCardDownloading !== null}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 border border-orange-500/30 text-[11px] font-medium transition self-start sm:self-auto"
                  >
                    {inCardDownloading === "cfg" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ArrowDownToLine className="w-3 h-3" />
                    )}
                    <span>{stagingStatus?.cfg.isReady ? "重新拉取最新包" : "一键下载此组件"}</span>
                  </button>
                </div>

                {/* 目标端 */}
                <div className="p-2.5 bg-bg-card border border-border/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-text-muted font-medium shrink-0">目标路径:</span>
                    <div className="text-text font-mono truncate flex items-center gap-1.5 flex-1" title={effectiveCfgPath}>
                      <Folder className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{effectiveCfgPath || "未检测到 CS2 CFG 路径"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditPath("cfg")}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
                    >
                      <FolderEdit className="w-3 h-3 text-orange-400" />
                      <span>自定义路径</span>
                    </button>
                    {effectiveCfgPath ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3" /> 目标有效
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium whitespace-nowrap">
                        <AlertTriangle className="w-3 h-3" /> 路径缺失
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 组件 2: 地图指南 */}
          <div
            className={`flex flex-col rounded-xl border transition-all overflow-hidden ${
              installAnnotations
                ? "bg-bg-raised/60 border-orange-500/40 shadow-sm"
                : "bg-bg-raised/20 border-border opacity-70"
            }`}
          >
            {/* 卡片头部 */}
            <div
              onClick={() => toggleCompCollapse("annotations")}
              className="flex items-center justify-between p-3.5 cursor-pointer select-none hover:bg-bg-raised/80 transition-colors gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <input
                  type="checkbox"
                  id="comp-ann"
                  checked={installAnnotations}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setInstallAnnotations(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer shrink-0"
                />
                <label
                  htmlFor="comp-ann"
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-sm text-text cursor-pointer flex items-center gap-2 truncate"
                >
                  <span className="truncate">地图跑图与投掷物指南 (Annotations)</span>
                </label>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {stagingStatus?.annotations.isReady ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 已就绪 ({stagingStatus.annotations.fileCount} 文件)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-400 font-medium whitespace-nowrap">
                    <AlertTriangle className="w-3.5 h-3.5" /> 暂存区无文件
                  </span>
                )}
                {collapsedComps["annotations"] ? (
                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-orange-400 shrink-0" />
                )}
              </div>
            </div>

            {/* 卡片折叠展开内容 */}
            {!collapsedComps["annotations"] && (
              <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-2.5">
                {/* 来源端 */}
                <div className="p-2.5 bg-bg-card border border-border/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted font-medium shrink-0">安装来源:</span>
                    {stagingStatus?.annotations.isReady ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>已下载就绪（包含 {stagingStatus.annotations.fileCount} 个指南文件 · {formatBytes(stagingStatus.annotations.totalSize)}）</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>本地暂存区暂无此组件包</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInCardDownload("annotations")}
                    disabled={inCardDownloading !== null}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 border border-orange-500/30 text-[11px] font-medium transition self-start sm:self-auto"
                  >
                    {inCardDownloading === "annotations" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ArrowDownToLine className="w-3 h-3" />
                    )}
                    <span>{stagingStatus?.annotations.isReady ? "重新拉取最新包" : "一键下载此组件"}</span>
                  </button>
                </div>

                {/* 目标端 */}
                <div className="p-2.5 bg-bg-card border border-border/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-text-muted font-medium shrink-0">目标路径:</span>
                    <div className="text-text font-mono truncate flex items-center gap-1.5 flex-1" title={effectiveAnnotationsPath}>
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{effectiveAnnotationsPath || "未检测到 Annotations 路径"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditPath("annotations")}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
                    >
                      <FolderEdit className="w-3 h-3 text-orange-400" />
                      <span>自定义路径</span>
                    </button>
                    {effectiveAnnotationsPath ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3" /> 目标有效
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium whitespace-nowrap">
                        <AlertTriangle className="w-3 h-3" /> 路径缺失
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 组件 3: 视频设置 */}
          <div
            className={`flex flex-col rounded-xl border transition-all overflow-hidden ${
              installVideo
                ? "bg-bg-raised/60 border-orange-500/40 shadow-sm"
                : "bg-bg-raised/20 border-border opacity-70"
            }`}
          >
            {/* 卡片头部 */}
            <div
              onClick={() => toggleCompCollapse("video")}
              className="flex items-center justify-between p-3.5 cursor-pointer select-none hover:bg-bg-raised/80 transition-colors gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <input
                  type="checkbox"
                  id="comp-vid"
                  checked={installVideo}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setInstallVideo(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer shrink-0"
                />
                <label
                  htmlFor="comp-vid"
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-sm text-text cursor-pointer flex items-center gap-2 truncate"
                >
                  <span className="truncate">推荐画面与视频设置 (Video Config)</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-neutral-800 text-neutral-400 shrink-0">
                    可选覆盖
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {stagingStatus?.video.isReady ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 已就绪 ({stagingStatus.video.fileCount} 文件)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-400 font-medium whitespace-nowrap">
                    <AlertTriangle className="w-3.5 h-3.5" /> 暂存区无文件
                  </span>
                )}
                {collapsedComps["video"] ? (
                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-orange-400 shrink-0" />
                )}
              </div>
            </div>

            {/* 卡片折叠展开内容 */}
            {!collapsedComps["video"] && (
              <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-2.5">
                {/* 来源端 */}
                <div className="p-2.5 bg-bg-card border border-border/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted font-medium shrink-0">安装来源:</span>
                    {stagingStatus?.video.isReady ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>已下载就绪（包含 {stagingStatus.video.fileCount} 个视频配置文件 · {formatBytes(stagingStatus.video.totalSize)}）</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>本地暂存区暂无此组件包</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInCardDownload("video")}
                    disabled={inCardDownloading !== null}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 border border-orange-500/30 text-[11px] font-medium transition self-start sm:self-auto"
                  >
                    {inCardDownloading === "video" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ArrowDownToLine className="w-3 h-3" />
                    )}
                    <span>{stagingStatus?.video.isReady ? "重新拉取最新包" : "一键下载此组件"}</span>
                  </button>
                </div>

                {/* 目标端 */}
                <div className="p-2.5 bg-bg-card border border-border/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-text-muted font-medium shrink-0">目标路径:</span>
                    <div className="text-text font-mono truncate flex items-center gap-1.5 flex-1" title={effectiveVideoPath}>
                      <Tv className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{effectiveVideoPath || "未检测到 Steam 账号视频配置路径"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditPath("video")}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
                    >
                      <FolderEdit className="w-3 h-3 text-orange-400" />
                      <span>自定义路径</span>
                    </button>
                    {effectiveVideoPath ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3" /> 目标有效
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium whitespace-nowrap">
                        <AlertTriangle className="w-3 h-3" /> 路径缺失
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 部署操作区 */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>安装前将自动对涉及目标创建全量快照备份（FIFO 溢出保留上限默认为 10 份，可在恢复中心自定义）</span>
          </div>

          <button
            type="button"
            onClick={handleExecuteInstall}
            disabled={installing || (!installCfg && !installAnnotations && !installVideo)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs sm:text-sm transition shadow-lg shadow-orange-950/40 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {installing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在执行部署流水线...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>开始一键部署所选组件</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* 自定义压缩包与文件导入区 */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-semibold text-text">从压缩包更新或自定义导入</h3>
        <UploadZone
          onUploadComplete={() => {
            uploadedListRef.current?.reload();
            loadStagingStatus();
          }}
        />
        <UploadedList
          ref={uploadedListRef}
          selectedFolder={selectedUpload}
          onSelect={(folder) => setSelectedUpload(folder)}
        />
      </div>

      {/* 自定义路径配置模态框 */}
      {pathModal && (
        <Modal
          open={pathModal.open}
          onClose={() => setPathModal(null)}
          title={pathModal.title}
          icon={<FolderEdit className="w-5 h-5 text-orange-400" />}
          maxWidth="max-w-lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleResetToDefaultPath}
                className="text-xs text-orange-400 hover:text-orange-300 font-medium transition"
              >
                恢复默认检测路径
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPathModal(null)}
                  className="px-3.5 py-1.5 text-xs text-text-muted hover:text-text rounded border border-border bg-bg-raised transition"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSavePathModal}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded transition shadow-md shadow-orange-950/40"
                >
                  应用路径
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-3 p-1">
            <p className="text-xs text-text-secondary leading-relaxed">
              {pathModal.description}
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text">目标文件夹路径：</label>
              <input
                type="text"
                value={pathModal.currentValue}
                onChange={(e) =>
                  setPathModal({
                    ...pathModal,
                    currentValue: e.target.value,
                  })
                }
                placeholder="例如：D:\Steam\steamapps\common\Counter-Strike 2\game\csgo\cfg"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs font-mono text-text placeholder-neutral-500 focus:border-orange-500 focus:outline-none"
                autoFocus
              />
            </div>

            {pathModal.defaultValue && (
              <div className="p-2.5 bg-neutral-900/60 border border-neutral-800 rounded text-[11px] text-text-muted space-y-1">
                <span className="text-text-faint font-medium">默认检测路径：</span>
                <div className="font-mono text-text-secondary break-all select-all">
                  {pathModal.defaultValue}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
