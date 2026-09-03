import { useState, useCallback, useEffect } from "react";
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
  Shield,
  FileText,
  ArrowRight,
  Layers,
  RotateCcw,
} from "lucide-react";
import DetectionCard from "../components/DetectionCard";
import { PageHeader, Modal } from "@srp-cfg/ui";
import type { DetectionResult, StagingStatus, FsTreeNode, FsTreeRoot, PreInstallItem } from "../types";
import type { Page } from "../App";

interface Props {
  detection: DetectionResult | null;
  refreshing: boolean;
  onRefresh: () => void;
  onUserChange: (accountId: string) => void;
  preInstallList: PreInstallItem[];
  onClearPreInstall: () => void;
  onNavigate?: (page: Page) => void;
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

// 待安装文件紧凑列表子组件（带色彩状态胶囊）
const PreInstallFileList: React.FC<{
  files: Array<{ relativePath: string; size: number }>;
  compKey: "cfg" | "annotations" | "video";
  getFileStatus: (relPath: string, compKey: "cfg" | "annotations" | "video") => "new" | "overwrite" | "protected";
}> = ({ files, compKey, getFileStatus }) => {
  const overwriteCount = files.filter((f) => getFileStatus(f.relativePath, compKey) === "overwrite").length;
  const newCount = files.filter((f) => getFileStatus(f.relativePath, compKey) === "new").length;
  const protectedCount = files.filter((f) => getFileStatus(f.relativePath, compKey) === "protected").length;

  return (
    <div className="mt-2.5 rounded-lg border border-border/80 bg-neutral-950/70 overflow-hidden text-xs">
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-neutral-900/90 border-b border-border/60 gap-2">
        <span className="text-[11px] font-mono text-text-muted">
          待安装文件明细 ({files.length} 项)
        </span>
        <div className="flex items-center gap-2 text-[10px] font-sans">
          {newCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              {newCount} 新增
            </span>
          )}
          {overwriteCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 font-medium">
              {overwriteCount} 覆盖
            </span>
          )}
          {protectedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25 font-medium">
              {protectedCount} 保持保护
            </span>
          )}
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto divide-y divide-border/30 font-mono p-1">
        {files.map((file) => {
          const status = getFileStatus(file.relativePath, compKey);
          return (
            <div
              key={file.relativePath}
              className="flex items-center justify-between px-2.5 py-1.5 hover:bg-neutral-800/40 rounded transition gap-2"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate text-neutral-300 text-[11px]" title={file.relativePath}>
                  {file.relativePath}
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 text-[11px]">
                <span className="text-neutral-500 text-[10px]">{formatBytes(file.size)}</span>
                {status === "new" && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-sans font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>新增</span>
                  </span>
                )}
                {status === "overwrite" && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-sans font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>覆盖</span>
                  </span>
                )}
                {status === "protected" && (
                  <span className="px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-sans font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>保持保护</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function InstallPage({
  detection,
  refreshing,
  onRefresh,
  onUserChange,
  preInstallList,
  onClearPreInstall,
  onNavigate,
}: Props) {
  // 组件选择勾选状态
  const [selectedComponents, setSelectedComponents] = useState({
    cfg: true,
    annotations: true,
    video: false,
  });

  // 路径自定义覆盖
  const [customPaths, setCustomPaths] = useState({
    cfg: "",
    annotations: "",
    video: "",
  });

  // 路径编辑 Modal 状态
  const [pathModal, setPathModal] = useState<PathModalState>({
    open: false,
    componentKey: "cfg",
    title: "",
    description: "",
    currentValue: "",
    defaultValue: "",
  });
  const [pathInputVal, setPathInputVal] = useState("");

  // 暂存区扫描状态
  const [stagingStatus, setStagingStatus] = useState<StagingStatus | null>(null);
  const [loadingStaging, setLoadingStaging] = useState(false);

  // 待安装文件清单折叠状态
  const [fileListExpanded, setFileListExpanded] = useState({
    cfg: false,
    annotations: false,
    video: false,
  });

  // 保护现有 custom.cfg 勾选状态（默认开启）
  const [protectCustomCfg, setProtectCustomCfg] = useState(true);

  // 已安装的现有物理文件路径缓存
  const [installedPathSets, setInstalledPathSets] = useState<{
    cfg: Set<string>;
    annotations: Set<string>;
    video: Set<string>;
  }>({
    cfg: new Set(),
    annotations: new Set(),
    video: new Set(),
  });

  // 安装过程状态
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<{
    success: boolean;
    message: string;
    filesInstalled: number;
    backupId?: string;
  } | null>(null);

  // 扫描暂存区
  const loadStagingStatus = useCallback(async () => {
    setLoadingStaging(true);
    try {
      const status = await window.api.getStagingStatus();
      setStagingStatus(status);
    } catch (e) {
      console.error("加载暂存区状态失败:", e);
    } finally {
      setLoadingStaging(false);
    }
  }, []);

  // 递归收集目录树中的所有相对路径
  const collectTreeRelPaths = (node?: FsTreeNode, prefix = ""): string[] => {
    if (!node) return [];
    let result: string[] = [];
    const currentRel = prefix ? `${prefix}/${node.name}` : node.name;
    if (node.isDir) {
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          result = result.concat(collectTreeRelPaths(child, currentRel));
        }
      }
    } else {
      result.push(currentRel.toLowerCase());
    }
    return result;
  };

  // 扫描物理已安装目录
  const loadInstalledFiles = useCallback(async () => {
    if (!detection) return;
    try {
      const roots: FsTreeRoot[] = await window.api.fsScanInstalledRoots();
      const newSets = {
        cfg: new Set<string>(),
        annotations: new Set<string>(),
        video: new Set<string>(),
      };

      for (const r of roots) {
        if (r.componentId === "game-cfg") {
          for (const p of collectTreeRelPaths(r.tree)) newSets.cfg.add(p);
        } else if (r.componentId === "annotations") {
          for (const p of collectTreeRelPaths(r.tree)) newSets.annotations.add(p);
        } else if (r.componentId === "video") {
          for (const p of collectTreeRelPaths(r.tree)) newSets.video.add(p);
        }
      }
      setInstalledPathSets(newSets);
    } catch (e) {
      console.error("扫描物理已安装目录失败:", e);
    }
  }, [detection]);

  useEffect(() => {
    void loadStagingStatus();
    void loadInstalledFiles();
  }, [loadStagingStatus, loadInstalledFiles]);

  // 严格队列驱动与物理就绪判定：
  // 1. 若队列为空（未选定任何包） -> 全面禁用
  // 2. 若队列非空 -> 根据暂存区实际解压归类的就绪文件数动态激活对应卡片
  const isQueueActive = preInstallList.length > 0;

  const hasCfgInQueue = isQueueActive && (stagingStatus?.cfg.fileCount ?? 0) > 0;
  const hasAnnotationsInQueue = isQueueActive && (stagingStatus?.annotations.fileCount ?? 0) > 0;
  const hasVideoInQueue = isQueueActive && (stagingStatus?.video.fileCount ?? 0) > 0;

  // 当预安装清单变化时，智能同步勾选状态
  useEffect(() => {
    setSelectedComponents({
      cfg: !!hasCfgInQueue,
      annotations: !!hasAnnotationsInQueue,
      video: !!hasVideoInQueue,
    });
  }, [hasCfgInQueue, hasAnnotationsInQueue, hasVideoInQueue]);

  // 预检文件状态判断
  const getFileStatus = useCallback(
    (relPath: string, compKey: "cfg" | "annotations" | "video"): "new" | "overwrite" | "protected" => {
      const normalized = relPath.replace(/\\/g, "/").toLowerCase();
      if (
        compKey === "cfg" &&
        protectCustomCfg &&
        (normalized === "srp-cfg/user/custom.cfg" || normalized.endsWith("/custom.cfg")) &&
        installedPathSets.cfg.has(normalized)
      ) {
        return "protected";
      }
      const set = installedPathSets[compKey];
      if (set && set.has(normalized)) {
        return "overwrite";
      }
      return "new";
    },
    [installedPathSets, protectCustomCfg]
  );

  // 物理默认路径
  const defaultCfgPath = detection?.cs2CfgPath || "";
  const defaultAnnotationsPath = detection?.annotationsPath || "";
  const defaultVideoPath = detection?.userCfgPath
    ? detection.userCfgPath.replace(/cs2_user_keys.*\.vcfg$/i, "cs2_video.txt")
    : "";

  // 目标生效路径
  const effectiveCfgPath = customPaths.cfg || defaultCfgPath;
  const effectiveAnnotationsPath = customPaths.annotations || defaultAnnotationsPath;
  const effectiveVideoPath = customPaths.video || defaultVideoPath;

  const handleOpenPathModal = (key: "cfg" | "annotations" | "video") => {
    let title = "";
    let description = "";
    let defaultValue = "";
    let currentValue = "";

    if (key === "cfg") {
      title = "配置 Runtime Core 目标路径";
      description = "指定 CS2 的 CFG 运行目录（通常位于 game/csgo/cfg/）";
      defaultValue = defaultCfgPath;
      currentValue = effectiveCfgPath;
    } else if (key === "annotations") {
      title = "配置地图指南 (Annotations) 目标路径";
      description = "指定 CS2 跑图与投掷物标注文件的部署目录（通常位于 game/csgo/annotations/）";
      defaultValue = defaultAnnotationsPath;
      currentValue = effectiveAnnotationsPath;
    } else {
      title = "配置视频设置 (Video Config) 目标路径";
      description = "指定 CS2 本地视频预设配置文件的写入路径（通常位于 Steam userdata 730/local/cfg/cs2_video.txt）";
      defaultValue = defaultVideoPath;
      currentValue = effectiveVideoPath;
    }

    setPathModal({
      open: true,
      componentKey: key,
      title,
      description,
      currentValue,
      defaultValue,
    });
    setPathInputVal(currentValue);
  };

  const handleSaveCustomPath = () => {
    const val = pathInputVal.trim();
    setCustomPaths((prev) => ({
      ...prev,
      [pathModal.componentKey]: val === pathModal.defaultValue ? "" : val,
    }));
    setPathModal((prev) => ({ ...prev, open: false }));
  };

  const handleResetCustomPath = (key: "cfg" | "annotations" | "video") => {
    setCustomPaths((prev) => ({ ...prev, [key]: "" }));
  };

  // 执行一键部署流水线
  const handleDeploy = async () => {
    if (installing) return;
    setInstalling(true);
    setInstallResult(null);

    const components: string[] = [];
    if (selectedComponents.cfg && hasCfgInQueue) components.push("game-cfg");
    if (selectedComponents.annotations && hasAnnotationsInQueue) components.push("annotations");
    if (selectedComponents.video && hasVideoInQueue) components.push("video");

    const overridePaths: Record<string, string> = {};
    if (customPaths.cfg) overridePaths["game-cfg"] = customPaths.cfg;
    if (customPaths.annotations) overridePaths["annotations"] = customPaths.annotations;
    if (customPaths.video) overridePaths["video"] = customPaths.video;

    try {
      const res = await window.api.installComponentsPipeline(
        components,
        overridePaths,
        protectCustomCfg
      );

      if (res.success) {
        setInstallResult({
          success: true,
          message: res.message || `部署成功！已安装 ${res.filesInstalled} 个文件到 CS2 对应目录。`,
          filesInstalled: res.filesInstalled,
          backupId: res.backupId,
        });
        // 安装完成后自动清空预安装队列，释放回候选库
        onClearPreInstall();
        await loadStagingStatus();
        await loadInstalledFiles();
      } else {
        setInstallResult({
          success: false,
          message: res.message || "安装未完全成功，请检查权限与目录。",
          filesInstalled: res.filesInstalled,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setInstallResult({
        success: false,
        message: `安装异常失败: ${msg}`,
        filesInstalled: 0,
      });
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* 顶部标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="组件安装 (Component Installation)"
          description="检测 CS2 环境并组织部署流水线；组件卡片与目标物理地址已深度整合，确认后一键安全注入。"
        />
        <button
          type="button"
          onClick={() => {
            onRefresh();
            void loadStagingStatus();
            void loadInstalledFiles();
          }}
          disabled={refreshing || loadingStaging}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card border border-border text-xs text-text-muted hover:text-text hover:border-neutral-600 transition shadow-sm cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loadingStaging ? "animate-spin text-orange-400" : ""}`} />
          <span>重新检测</span>
        </button>
      </div>

      {/* 1. 环境检测卡片 */}
      <DetectionCard
        detection={detection}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onUserChange={onUserChange}
      />

      {/* 2. 预安装队列摘要横幅 */}
      <div
        className={`border rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
          preInstallList.length === 0
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-bg-card border-border"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              preInstallList.length === 0
                ? "bg-amber-500/20 border border-amber-500/30 text-amber-400"
                : "bg-orange-500/10 border border-orange-500/20 text-orange-400"
            }`}
          >
            <Layers className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-text">当前预安装队列</span>
              <span
                className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-medium ${
                  preInstallList.length === 0
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-orange-500/20 text-orange-400"
                }`}
              >
                {preInstallList.length > 0 ? `${preInstallList.length} 个选定配置包` : "队列为空 (未选定任何包)"}
              </span>
            </div>
            <div className="text-[11px] text-text-muted flex items-center gap-1.5 flex-wrap">
              {preInstallList.length > 0 ? (
                preInstallList.map((item) => (
                  <span key={item.id} className="text-text font-mono bg-bg-raised px-1.5 py-0.2 rounded border border-border text-[10px]">
                    {item.name}
                  </span>
                ))
              ) : (
                <span className="text-amber-300">
                  当前预安装清单为空。请先前往「组件下载」添加需要部署到游戏的配置包。
                </span>
              )}
            </div>
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("download")}
            className="text-xs text-orange-400 hover:text-orange-300 font-medium inline-flex items-center gap-1 transition cursor-pointer self-end sm:self-auto shrink-0"
          >
            <span>{preInstallList.length > 0 ? "调整预安装清单" : "前往下载与挑选配置包"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 安装结果提示 */}
      {installResult && (
        <div
          className={`p-4 rounded-lg border text-xs flex items-start gap-3 ${
            installResult.success
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {installResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1.5 flex-1">
            <div className="font-semibold text-sm">{installResult.message}</div>
            {installResult.backupId && (
              <div className="text-[11px] text-emerald-400/80">
                已自动创建灾备快照: <code className="font-mono">{installResult.backupId}</code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. 整合型组件卡片列表（组件与目标物理地址融为一体） */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-orange-400" />
          <span>待部署组件与目标地址配置 (Target Components & Paths)</span>
        </h2>

        {/* ── 组件 1: Runtime Core ── */}
        <div
          className={`bg-bg-card border rounded-lg p-5 transition-all space-y-3.5 ${
            selectedComponents.cfg && hasCfgInQueue
              ? "border-orange-500/40 shadow-sm bg-gradient-to-b from-orange-500/5 to-transparent"
              : "border-border opacity-85"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <label className="flex items-center gap-3 cursor-pointer select-none mt-1">
                <input
                  type="checkbox"
                  disabled={!hasCfgInQueue}
                  checked={selectedComponents.cfg && hasCfgInQueue}
                  onChange={(e) =>
                    setSelectedComponents((prev) => ({ ...prev, cfg: e.target.checked }))
                  }
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer disabled:opacity-40"
                />
              </label>

              <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-text">Runtime Core (CFG 核心运行时)</h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-orange-500/20 text-orange-400">
                    CORE RUNTIME
                  </span>
                  {hasCfgInQueue ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      已入队 ({stagingStatus?.cfg.fileCount || 0} 个文件)
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-800 text-neutral-400 border border-neutral-700">
                      {isQueueActive ? "包内未包含此类文件 (0 个文件)" : "未加入队列 (0 个文件)"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  包含 <code className="font-mono text-orange-400">autoexec.cfg</code>、<code className="font-mono text-orange-400">srp-cfg/</code> 模块库与个人覆盖模板。
                </p>
              </div>
            </div>

            {/* 文件明细折叠开关 */}
            {hasCfgInQueue && stagingStatus?.cfg.files && stagingStatus.cfg.files.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setFileListExpanded((prev) => ({ ...prev, cfg: !prev.cfg }))
                }
                className="self-end md:self-auto flex items-center gap-1 text-[11px] text-text-muted hover:text-text px-2.5 py-1 rounded bg-bg-raised border border-border transition cursor-pointer"
              >
                <span>{fileListExpanded.cfg ? "收起待安装文件" : `查看待安装文件 (${stagingStatus.cfg.files.length})`}</span>
                {fileListExpanded.cfg ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* 目标物理路径 */}
          <div className="bg-bg-raised/70 border border-border/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>目标部署物理路径:</span>
                {customPaths.cfg && (
                  <span className="text-amber-400 font-medium">(自定义覆盖中)</span>
                )}
              </div>
              <div className="font-mono text-[11px] text-text truncate" title={effectiveCfgPath}>
                {effectiveCfgPath || "未检测到 CS2 路径，请手动指定"}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {customPaths.cfg && (
                <button
                  type="button"
                  onClick={() => handleResetCustomPath("cfg")}
                  className="px-2 py-1 rounded bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-[11px] transition cursor-pointer"
                >
                  还原默认
                </button>
              )}
              <button
                type="button"
                onClick={() => handleOpenPathModal("cfg")}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[11px] font-medium transition cursor-pointer"
              >
                <FolderEdit className="w-3 h-3 text-neutral-400" />
                <span>自定义路径</span>
              </button>
            </div>
          </div>

          {/* 展开的待安装文件清单 */}
          {fileListExpanded.cfg && stagingStatus?.cfg.files && (
            <PreInstallFileList
              files={stagingStatus.cfg.files}
              compKey="cfg"
              getFileStatus={getFileStatus}
            />
          )}
        </div>

        {/* ── 组件 2: 地图跑图与投掷物指南 ── */}
        <div
          className={`bg-bg-card border rounded-lg p-5 transition-all space-y-3.5 ${
            selectedComponents.annotations && hasAnnotationsInQueue
              ? "border-sky-500/40 shadow-sm bg-gradient-to-b from-sky-500/5 to-transparent"
              : "border-border opacity-85"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <label className="flex items-center gap-3 cursor-pointer select-none mt-1">
                <input
                  type="checkbox"
                  disabled={!hasAnnotationsInQueue}
                  checked={selectedComponents.annotations && hasAnnotationsInQueue}
                  onChange={(e) =>
                    setSelectedComponents((prev) => ({ ...prev, annotations: e.target.checked }))
                  }
                  className="w-4 h-4 accent-sky-500 rounded cursor-pointer disabled:opacity-40"
                />
              </label>

              <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-text">地图跑图与投掷物指南 (Annotations)</h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-sky-500/20 text-sky-400">
                    ANNOTATIONS
                  </span>
                  {hasAnnotationsInQueue ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      已入队 ({stagingStatus?.annotations.fileCount || 0} 个文件)
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-800 text-neutral-400 border border-neutral-700">
                      {isQueueActive ? "包内未包含此类文件 (0 个文件)" : "未加入队列 (0 个文件)"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  提供 Dust2, Mirage, Inferno, Ancient 等官方竞技地图跑图道具落点标注。
                </p>
              </div>
            </div>

            {/* 文件明细折叠开关 */}
            {hasAnnotationsInQueue && stagingStatus?.annotations.files && stagingStatus.annotations.files.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setFileListExpanded((prev) => ({ ...prev, annotations: !prev.annotations }))
                }
                className="self-end md:self-auto flex items-center gap-1 text-[11px] text-text-muted hover:text-text px-2.5 py-1 rounded bg-bg-raised border border-border transition cursor-pointer"
              >
                <span>{fileListExpanded.annotations ? "收起待安装文件" : `查看待安装文件 (${stagingStatus.annotations.files.length})`}</span>
                {fileListExpanded.annotations ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* 目标物理路径 */}
          <div className="bg-bg-raised/70 border border-border/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>目标部署物理路径:</span>
                {customPaths.annotations && (
                  <span className="text-amber-400 font-medium">(自定义覆盖中)</span>
                )}
              </div>
              <div className="font-mono text-[11px] text-text truncate" title={effectiveAnnotationsPath}>
                {effectiveAnnotationsPath || "未检测到 Annotations 路径，请手动指定"}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {customPaths.annotations && (
                <button
                  type="button"
                  onClick={() => handleResetCustomPath("annotations")}
                  className="px-2 py-1 rounded bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-[11px] transition cursor-pointer"
                >
                  还原默认
                </button>
              )}
              <button
                type="button"
                onClick={() => handleOpenPathModal("annotations")}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[11px] font-medium transition cursor-pointer"
              >
                <FolderEdit className="w-3 h-3 text-neutral-400" />
                <span>自定义路径</span>
              </button>
            </div>
          </div>

          {/* 展开的待安装文件清单 */}
          {fileListExpanded.annotations && stagingStatus?.annotations.files && (
            <PreInstallFileList
              files={stagingStatus.annotations.files}
              compKey="annotations"
              getFileStatus={getFileStatus}
            />
          )}
        </div>

        {/* ── 组件 3: 推荐画面与视频设置 ── */}
        <div
          className={`bg-bg-card border rounded-lg p-5 transition-all space-y-3.5 ${
            selectedComponents.video && hasVideoInQueue
              ? "border-teal-500/40 shadow-sm bg-gradient-to-b from-teal-500/5 to-transparent"
              : "border-border opacity-85"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <label className="flex items-center gap-3 cursor-pointer select-none mt-1">
                <input
                  type="checkbox"
                  disabled={!hasVideoInQueue}
                  checked={selectedComponents.video && hasVideoInQueue}
                  onChange={(e) =>
                    setSelectedComponents((prev) => ({ ...prev, video: e.target.checked }))
                  }
                  className="w-4 h-4 accent-teal-500 rounded cursor-pointer disabled:opacity-40"
                />
              </label>

              <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Tv className="w-4 h-4" />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-text">推荐画面与视频设置 (Video Config)</h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-teal-500/20 text-teal-400">
                    VIDEO SETTINGS
                  </span>
                  {hasVideoInQueue ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      已入队 ({stagingStatus?.video.fileCount || 0} 个文件)
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-800 text-neutral-400 border border-neutral-700">
                      {isQueueActive ? "包内未包含此类文件 (0 个文件)" : "未加入队列 (0 个文件)"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  提供兼顾极低输入延迟与清晰度的 <code className="font-mono text-teal-400">cs2_video.txt</code> 画面预设。
                </p>
              </div>
            </div>

            {/* 文件明细折叠开关 */}
            {hasVideoInQueue && stagingStatus?.video.files && stagingStatus.video.files.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setFileListExpanded((prev) => ({ ...prev, video: !prev.video }))
                }
                className="self-end md:self-auto flex items-center gap-1 text-[11px] text-text-muted hover:text-text px-2.5 py-1 rounded bg-bg-raised border border-border transition cursor-pointer"
              >
                <span>{fileListExpanded.video ? "收起待安装文件" : `查看待安装文件 (${stagingStatus.video.files.length})`}</span>
                {fileListExpanded.video ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* 目标物理路径 */}
          <div className="bg-bg-raised/70 border border-border/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>目标部署物理路径:</span>
                {customPaths.video && (
                  <span className="text-amber-400 font-medium">(自定义覆盖中)</span>
                )}
              </div>
              <div className="font-mono text-[11px] text-text truncate" title={effectiveVideoPath}>
                {effectiveVideoPath || "未检测到 Steam 视频设置路径，请手动指定"}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {customPaths.video && (
                <button
                  type="button"
                  onClick={() => handleResetCustomPath("video")}
                  className="px-2 py-1 rounded bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-[11px] transition cursor-pointer"
                >
                  还原默认
                </button>
              )}
              <button
                type="button"
                onClick={() => handleOpenPathModal("video")}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[11px] font-medium transition cursor-pointer"
              >
                <FolderEdit className="w-3 h-3 text-neutral-400" />
                <span>自定义路径</span>
              </button>
            </div>
          </div>

          {/* 展开的待安装文件清单 */}
          {fileListExpanded.video && stagingStatus?.video.files && (
            <PreInstallFileList
              files={stagingStatus.video.files}
              compKey="video"
              getFileStatus={getFileStatus}
            />
          )}
        </div>
      </div>

      {/* 4. 底部部署操作控制台 */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-border rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-text">安全部署流水线保障</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={protectCustomCfg}
                onChange={(e) => setProtectCustomCfg(e.target.checked)}
                className="w-3.5 h-3.5 accent-orange-500 rounded cursor-pointer"
              />
              <span className="text-text font-medium">保护现有 custom.cfg 用户文件</span>
            </label>
            <span className="text-text-faint">•</span>
            <span>部署前将自动创建灾备快照</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDeploy}
          disabled={installing || preInstallList.length === 0 || (!selectedComponents.cfg && !selectedComponents.annotations && !selectedComponents.video)}
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-orange-950/60 shrink-0 disabled:opacity-40 cursor-pointer"
          title={preInstallList.length === 0 ? "请先在组件下载页添加待安装配置包" : undefined}
        >
          {installing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          <span>{installing ? "正在安全部署..." : "开始一键部署到 CS2 目录"}</span>
        </button>
      </div>

      {/* 路径自定义 Modal */}
      <Modal
        open={pathModal.open}
        onClose={() => setPathModal((prev) => ({ ...prev, open: false }))}
        title={pathModal.title}
      >
        <div className="space-y-4 text-xs">
          <p className="text-text-muted leading-relaxed">
            {pathModal.description}
          </p>

          <div className="space-y-1.5">
            <label className="text-text-secondary font-medium block">
              物理安装目录绝对路径:
            </label>
            <input
              type="text"
              value={pathInputVal}
              onChange={(e) => setPathInputVal(e.target.value)}
              placeholder={pathModal.defaultValue || "例如: D:/Steam/steamapps/common/..."}
              className="w-full px-3 py-2 bg-neutral-900 border border-border rounded-lg text-xs font-mono text-text focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setPathInputVal(pathModal.defaultValue)}
              className="text-text-muted hover:text-text transition text-xs cursor-pointer"
            >
              填入默认路径
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPathModal((prev) => ({ ...prev, open: false }))}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveCustomPath}
                className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition text-xs cursor-pointer"
              >
                确定保存
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
