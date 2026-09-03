import React, { useCallback, useEffect, useState } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Layers,
  AlertTriangle,
  HardDrive,
  Check,
  Package,
} from "lucide-react";
import type { FsTreeRoot, FsTreeNode } from "../types";
import { PageHeader, Modal } from "@srp-cfg/ui";
import { CodeEditor } from "../components/CodeEditor";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatTime(ms: number): string {
  if (!ms) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

// 递归文件树节点组件
const TreeNodeItem: React.FC<{
  node: FsTreeNode;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onDelete: (path: string) => void;
}> = ({ node, selectedPath, onSelectFile, onDelete }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (node.isDir) {
    return (
      <div className="text-xs">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 py-1 px-2 hover:bg-neutral-800/60 rounded cursor-pointer text-neutral-300 font-mono select-none"
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          )}
          <span className="font-medium text-neutral-200">{node.name}</span>
          {node.children && (
            <span className="text-[10px] text-neutral-500">({node.children.length})</span>
          )}
        </div>

        {isOpen && node.children && (
          <div className="pl-4 border-l border-neutral-800/80 ml-3.5 mt-0.5 space-y-0.5">
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelectFile={onSelectFile}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selectedPath === node.path;
  const isCfg = node.name.endsWith(".cfg");

  return (
    <div
      className={`group flex items-center justify-between py-1 px-2 rounded cursor-pointer text-xs font-mono transition ${
        isSelected
          ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
          : "hover:bg-neutral-800/50 text-neutral-300"
      }`}
      onClick={() => onSelectFile(node.path)}
    >
      <div className="flex items-center gap-1.5 truncate">
        {isCfg ? (
          <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-neutral-500 shrink-0">
        <span>{formatBytes(node.size)}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.path);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-neutral-500 rounded transition"
          title="删除此文件"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default function AppliedConfigPage() {
  const [roots, setRoots] = useState<FsTreeRoot[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedRoots, setCollapsedRoots] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [readingFile, setReadingFile] = useState(false);
  const [savingFile, setSavingFile] = useState(false);
  const [deleteTargetPath, setDeleteTargetPath] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadRoots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.api.fsScanInstalledRoots();
      setRoots(data);
    } catch (err) {
      console.error("[AppliedConfig] loadRoots failed:", err);
    } finally {
      setTimeout(() => setLoading(false), 250);
    }
  }, []);

  useEffect(() => {
    loadRoots();
  }, [loadRoots]);

  const handleSelectFile = async (path: string) => {
    if (selectedFile === path) return;
    setSelectedFile(path);
    setReadingFile(true);
    try {
      const text = await window.api.fsReadFile(path);
      setFileContent(text);
      setSavedContent(text);
    } catch (err) {
      setFileContent(`// 读取文件失败: ${err}`);
      setSavedContent(`// 读取文件失败: ${err}`);
    } finally {
      setReadingFile(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setSavingFile(true);
    try {
      await window.api.fsWriteFile(selectedFile, fileContent);
      setSavedContent(fileContent);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      loadRoots();
    } catch (err) {
      alert(`保存失败: ${err}`);
    } finally {
      setSavingFile(false);
    }
  };

  const handleDeleteItem = (path: string) => {
    setDeleteTargetPath(path);
  };

  const handleExecuteDelete = async () => {
    if (!deleteTargetPath) return;
    const path = deleteTargetPath;
    setDeleteTargetPath(null);
    try {
      await window.api.fsDeleteItem(path);
      if (selectedFile === path) {
        setSelectedFile(null);
        setFileContent("");
      }
      loadRoots();
    } catch (err) {
      alert(`删除失败: ${err}`);
    }
  };

  const handleOpenFolder = async (path: string) => {
    try {
      await window.api.fsOpenInExplorer(path);
    } catch (err) {
      alert(`无法打开目录: ${err}`);
    }
  };

  const totalFiles = roots.reduce((acc, r) => acc + r.fileCount, 0);
  const totalSize = roots.reduce((acc, r) => acc + r.totalSize, 0);

  const toggleRootCollapse = (componentId: string) => {
    setCollapsedRoots((prev) => ({
      ...prev,
      [componentId]: !prev[componentId],
    }));
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="当前安装 (物理文件浏览)"
          description="实时物理扫描 CS2 与 Steam 配置目录，支持多组件文件树浏览、定位与内嵌在线编辑。"
        />
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-3 px-3 py-1.5 bg-bg-card border border-border rounded-lg text-xs font-mono">
            <span className="text-text-muted">
              总文件: <span className="text-text font-semibold">{totalFiles}</span>
            </span>
            <span className="text-border">|</span>
            <span className="text-text-muted">
              占用: <span className="text-text font-semibold">{formatBytes(totalSize)}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={loadRoots}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card hover:bg-bg-hover text-text border border-border rounded-lg text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>刷新扫描</span>
          </button>
        </div>
      </div>

      {/* 左右分栏布局：左侧文件树，右侧代码查看/编辑器 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[520px]">
        {/* 左侧统一文件树卡片（三个组件根目录共享一个外层卡片与滚动条） */}
        <div className="lg:col-span-5 bg-bg-card border border-border rounded-xl flex flex-col h-[calc(100vh-180px)] min-h-[520px] overflow-hidden">
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {roots.map((root) => {
              const isCollapsed = Boolean(collapsedRoots[root.componentId]);
              return (
                <div key={root.componentId} className="flex flex-col">
                  {/* 根目录头部（吸顶粘性 / 点击折叠展开） */}
                  <div
                    onClick={() => toggleRootCollapse(root.componentId)}
                    className="sticky top-0 z-10 flex items-center justify-between p-3.5 bg-bg-card/95 backdrop-blur-md hover:bg-bg-raised/80 cursor-pointer select-none border-b border-border/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-orange-400 shrink-0" />
                      )}
                      <Package className="w-4 h-4 text-orange-400 shrink-0" />
                      <span className="font-semibold text-xs text-text truncate">{root.label}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-800 text-neutral-400 font-mono">
                        {root.fileCount} 文件
                      </span>
                      <span className="text-[10px] text-text-faint font-mono hidden sm:inline">
                        ({formatBytes(root.totalSize)})
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {root.exists && (
                        <button
                          type="button"
                          onClick={() => handleOpenFolder(root.targetPath)}
                          className="p-1 text-text-muted hover:text-text hover:bg-neutral-800 rounded transition"
                          title="在文件资源管理器中打开此根目录"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 展开内容区 */}
                  {!isCollapsed && (
                    <div className="p-3.5 pt-2 space-y-2 bg-bg-card/30">
                      {/* 物理路径提示 */}
                      <div
                        className="text-[11px] font-mono text-text-faint truncate px-2 py-1 rounded bg-neutral-900/60 border border-neutral-800/60"
                        title={root.targetPath}
                      >
                        {root.targetPath || "未检测到对应路径"}
                      </div>

                      {/* 根目录内部文件树 */}
                      <div className="pt-1">
                        {root.exists && root.tree ? (
                          <div className="space-y-0.5">
                            {root.tree.children?.map((child) => (
                              <TreeNodeItem
                                key={child.path}
                                node={child}
                                selectedPath={selectedFile}
                                onSelectFile={handleSelectFile}
                                onDelete={handleDeleteItem}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-xs text-text-faint">
                            {root.exists ? "目录为空" : "目录不存在或未安装"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧内嵌 CodeMirror 查看与编辑器 */}
        <div className="lg:col-span-7 flex flex-col h-[calc(100vh-180px)] min-h-[520px]">
          {selectedFile ? (
            <CodeEditor
              value={fileContent}
              onChange={setFileContent}
              onSave={handleSaveFile}
              title={selectedFile}
              isSaved={fileContent === savedContent}
              actions={
                <button
                  type="button"
                  onClick={() => handleOpenFolder(selectedFile)}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/70 rounded-md text-xs font-medium transition whitespace-nowrap select-none"
                  title="在资源管理器中定位"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-neutral-400" />
                  <span>定位</span>
                </button>
              }
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-xl p-8 text-center text-neutral-500 bg-neutral-900/30">
              <FileCode className="w-12 h-12 text-neutral-700 mb-3" />
              <div className="text-sm font-medium text-neutral-400">点击左侧文件树中的任意文件</div>
              <p className="text-xs text-neutral-600 mt-1">
                即可在此直接查看语法高亮代码，并支持即时编辑与保存 (Ctrl+S)。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 删除文件确认模态框 */}
      {deleteTargetPath && (
        <Modal
          open={Boolean(deleteTargetPath)}
          onClose={() => setDeleteTargetPath(null)}
          title="删除文件或目录"
          icon={<Trash2 className="w-5 h-5 text-red-400" />}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setDeleteTargetPath(null)}
                className="px-3.5 py-1.5 text-xs text-text-muted hover:text-text rounded border border-border bg-bg-raised transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded transition shadow-md shadow-red-950/40"
              >
                确认删除
              </button>
            </div>
          }
        >
          <div className="space-y-3 p-1">
            <p className="text-xs text-text-secondary leading-relaxed">
              确定要永久删除以下磁盘文件/目录吗？
            </p>
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-300 break-all">
              {deleteTargetPath}
            </div>
            <p className="text-[11px] text-red-400/90">
              * 此操作将直接从物理磁盘中删除目标，无法撤销。
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
