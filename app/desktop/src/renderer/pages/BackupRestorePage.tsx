import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  RotateCcw,
  Trash2,
  FolderOpen,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  HardDrive,
  Calendar,
  Sparkles,
  Package,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import type { BackupMeta } from "../types";
import { PageHeader, Modal } from "@srp-cfg/ui";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function BackupRestorePage() {
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createNote, setCreateNote] = useState("手动完整快照");
  const [createComponents, setCreateComponents] = useState({
    cfg: true,
    annotations: true,
    video: true,
  });

  const [restoreTarget, setRestoreTarget] = useState<BackupMeta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackupMeta | null>(null);

  // 快照保留上限 (默认 10 份)
  const [retentionLimit, setRetentionLimit] = useState<number>(() => {
    const saved = localStorage.getItem("srp_cfg_backup_retention_limit");
    return saved !== null ? parseInt(saved, 10) : 10;
  });
  const [cleaningAuto, setCleaningAuto] = useState(false);

  const loadBackups = useCallback(async () => {
    setLoading(true);
    try {
      const list = await window.api.backupList();
      setBackups(list);
    } catch (err) {
      console.error("[BackupRestore] loadBackups failed:", err);
    } finally {
      setTimeout(() => setLoading(false), 250);
    }
  }, []);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  // 切换快照溢出保留上限
  const handleRetentionChange = async (newLimit: number) => {
    setRetentionLimit(newLimit);
    localStorage.setItem("srp_cfg_backup_retention_limit", newLimit.toString());
    if (newLimit > 0) {
      setCleaningAuto(true);
      try {
        const removed = await window.api.backupCleanAuto(newLimit);
        if (removed > 0) {
          setFeedback({
            type: "success",
            message: `已根据新保留上限 (${newLimit} 份) 自动清理了 ${removed} 份旧自动快照。`,
          });
          loadBackups();
        }
      } catch (err) {
        console.error("[BackupRestore] backupCleanAuto failed:", err);
      } finally {
        setCleaningAuto(false);
      }
    }
  };

  // 手动创建快照
  const handleExecuteCreate = async () => {
    const selected: string[] = [];
    if (createComponents.cfg) selected.push("cfg");
    if (createComponents.annotations) selected.push("annotations");
    if (createComponents.video) selected.push("video");

    if (selected.length === 0) {
      alert("请至少勾选一个快照包含的组件！");
      return;
    }

    setCreateModalOpen(false);
    setActionBusy("create");
    setFeedback(null);
    try {
      const meta = await window.api.backupCreateSnapshot(
        selected,
        createNote.trim() || "手动快照",
        false
      );
      setFeedback({
        type: "success",
        message: `快照创建成功！[${meta.id}] (${formatBytes(meta.totalSize)})`,
      });
      loadBackups();
    } catch (err) {
      setFeedback({ type: "error", message: `创建快照失败: ${err}` });
    } finally {
      setActionBusy(null);
    }
  };

  // 恢复快照
  const handleExecuteRestore = async () => {
    if (!restoreTarget) return;
    const target = restoreTarget;
    setRestoreTarget(null);
    setActionBusy(target.id);
    setFeedback(null);
    try {
      await window.api.backupRestoreSnapshot(target.id);
      setFeedback({
        type: "success",
        message: `快照 [${target.id}] 已成功还原！所有组件已倒流至该版本。`,
      });
      loadBackups();
    } catch (err) {
      setFeedback({ type: "error", message: `还原快照失败: ${err}` });
    } finally {
      setActionBusy(null);
    }
  };

  // 删除快照
  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setActionBusy(target.id);
    try {
      await window.api.backupDelete(target.id);
      loadBackups();
    } catch (err) {
      setFeedback({ type: "error", message: `删除失败: ${err}` });
    } finally {
      setActionBusy(null);
    }
  };

  // 打开备份文件夹
  const handleOpenFolder = async () => {
    try {
      await window.api.backupOpenFolder();
    } catch (err) {
      setFeedback({ type: "error", message: `无法打开备份目录: ${err}` });
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="恢复中心 (快照与安全回滚)"
          description="全量 ZIP 历史快照存档。每次安装前均会自动打上时间戳备份，支持一键无损回滚与安全倒流。"
        />

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadBackups}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-bg-card hover:bg-bg-hover text-text border border-border rounded-lg text-xs font-medium transition"
            title="刷新快照列表"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>刷新</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCreateNote("手动完整快照");
              setCreateModalOpen(true);
            }}
            disabled={actionBusy !== null}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-orange-950/30 disabled:opacity-50"
          >
            {actionBusy === "create" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>新建手动快照</span>
          </button>

          <button
            type="button"
            onClick={handleOpenFolder}
            className="flex items-center gap-1.5 px-3 py-2 bg-bg-card hover:bg-bg-hover text-text border border-border rounded-lg text-xs font-medium transition"
            title="在文件资源管理器中打开备份存档目录"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>打开备份目录</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 备份快照列表 */}
      <div className="bg-bg-card border border-border rounded-lg p-5 flex-1 flex flex-col space-y-4 min-h-[400px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-text">历史快照存档</h2>
            <span className="text-xs text-text-muted font-normal font-mono">
              ({backups.length} 份 · 自动 {backups.filter((b) => b.isAuto).length} / 手动 {backups.filter((b) => !b.isAuto).length})
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>自动快照保留上限:</span>
            </span>
            <select
              value={retentionLimit}
              onChange={(e) => handleRetentionChange(parseInt(e.target.value, 10))}
              disabled={cleaningAuto}
              className="rounded-md border border-border bg-bg-raised px-2.5 py-1 text-xs text-text font-medium focus:border-orange-500 outline-none cursor-pointer"
            >
              <option value={5}>5 份 (节省磁盘)</option>
              <option value={10}>10 份 (默认推荐)</option>
              <option value={15}>15 份</option>
              <option value={20}>20 份</option>
              <option value={30}>30 份</option>
              <option value={50}>50 份 (充足归档)</option>
              <option value={0}>不设上限 (全部保留)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12 text-text-muted text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>正在扫描快照索引...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-text-muted">
            <ShieldCheck className="w-12 h-12 text-neutral-700 mb-3" />
            <div className="text-sm font-medium text-text">暂无历史快照备份</div>
            <p className="text-xs text-text-faint mt-1 max-w-sm">
              在执行组件安装或点击上方“新建手动快照”后，系统将在此建立全量恢复节点。
            </p>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            {backups.map((b) => {
              const isBusy = actionBusy === b.id;
              return (
                <div
                  key={b.id}
                  className="bg-bg-raised/60 hover:bg-bg-raised border border-border hover:border-neutral-700 rounded-lg p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        b.isAuto
                          ? "bg-neutral-800 text-neutral-400"
                          : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      }`}
                    >
                      {b.isAuto ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-text">{b.note}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                            b.isAuto
                              ? "bg-neutral-800 text-neutral-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}
                        >
                          {b.isAuto ? "自动快照" : "手动快照"}
                        </span>
                        <span className="text-[11px] font-mono text-text-faint">
                          {b.dateStr || b.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <HardDrive className="w-3 h-3 text-text-faint" />
                          {formatBytes(b.totalSize)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-text-faint" />
                          {b.components.join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => setRestoreTarget(b)}
                      disabled={actionBusy !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium transition disabled:opacity-40"
                      title="回滚还原至此快照状态"
                    >
                      {isBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                      )}
                      <span>恢复此快照</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(b)}
                      disabled={actionBusy !== null}
                      className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-md transition"
                      title="永久删除此快照"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 新建手动快照模态框 */}
      {createModalOpen && (
        <Modal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="新建配置快照"
          icon={<ShieldCheck className="w-5 h-5 text-orange-400" />}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-text-muted hover:text-text rounded border border-border bg-bg-raised transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteCreate}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded transition shadow-md shadow-orange-950/40"
              >
                创建快照
              </button>
            </div>
          }
        >
          <div className="space-y-4 p-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text">快照备注名称：</label>
              <input
                type="text"
                value={createNote}
                onChange={(e) => setCreateNote(e.target.value)}
                placeholder="例如：排位赛前手感备份"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-text placeholder-neutral-500 focus:border-orange-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text">包含组件：</label>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
                  <input
                    type="checkbox"
                    checked={createComponents.cfg}
                    onChange={(e) =>
                      setCreateComponents({ ...createComponents, cfg: e.target.checked })
                    }
                    className="accent-orange-500"
                  />
                  <span>Runtime Core (CFG 运行时)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
                  <input
                    type="checkbox"
                    checked={createComponents.annotations}
                    onChange={(e) =>
                      setCreateComponents({ ...createComponents, annotations: e.target.checked })
                    }
                    className="accent-orange-500"
                  />
                  <span>地图跑图与投掷物指南 (Annotations)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
                  <input
                    type="checkbox"
                    checked={createComponents.video}
                    onChange={(e) =>
                      setCreateComponents({ ...createComponents, video: e.target.checked })
                    }
                    className="accent-orange-500"
                  />
                  <span>用户与视频配置 (Video Settings)</span>
                </label>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 确认恢复模态框 */}
      {restoreTarget && (
        <Modal
          open={Boolean(restoreTarget)}
          onClose={() => setRestoreTarget(null)}
          title="确认恢复快照"
          icon={<RotateCcw className="w-5 h-5 text-orange-400" />}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setRestoreTarget(null)}
                className="px-3.5 py-1.5 text-xs text-text-muted hover:text-text rounded border border-border bg-bg-raised transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded transition shadow-md shadow-orange-950/40"
              >
                确认开始还原
              </button>
            </div>
          }
        >
          <div className="space-y-3 p-1">
            <p className="text-xs text-text-secondary leading-relaxed">
              确定要将游戏与用户配置倒流恢复至以下快照版本吗？
            </p>

            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs space-y-1.5 font-mono">
              <div><span className="text-neutral-500">备注:</span> {restoreTarget.note}</div>
              <div><span className="text-neutral-500">时间:</span> {restoreTarget.dateStr || restoreTarget.id}</div>
              <div><span className="text-neutral-500">包含组件:</span> {restoreTarget.components.join(", ")}</div>
              <div><span className="text-neutral-500">占用大小:</span> {formatBytes(restoreTarget.totalSize)}</div>
            </div>

            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[11px] text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>安全保障：系统会在还原开始前自动对当前现状再次创建应急备份。</span>
            </div>
          </div>
        </Modal>
      )}

      {/* 确认删除模态框 */}
      {deleteTarget && (
        <Modal
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="删除快照存档"
          icon={<Trash2 className="w-5 h-5 text-red-400" />}
          maxWidth="max-w-sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
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
          <div className="space-y-2 p-1">
            <p className="text-xs text-text-secondary leading-relaxed">
              确定要永久删除快照 <span className="font-mono font-semibold text-text">{deleteTarget.note}</span>（{deleteTarget.id}）吗？
            </p>
            <p className="text-[11px] text-red-400/90">
              * 此操作将从磁盘移除该备份 ZIP 文件，无法撤销。
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
