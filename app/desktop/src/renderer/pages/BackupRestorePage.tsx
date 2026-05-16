import { useState, useEffect, useRef } from "react";
import type { LogEntry, DetectedPaths } from "../types";

interface Props {
  logs: LogEntry[];
  addLog: (msg: string) => void;
}

export default function BackupRestorePage({ logs, addLog }: Props) {
  const [paths, setPaths] = useState<DetectedPaths | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const removeListener = window.api.onLog(addLog);
    window.api.detectPaths().then((p: DetectedPaths) => setPaths(p));
    return removeListener;
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [logs]);

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      await window.api.backupConfig();
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await window.api.restoreFromBackup();
    } finally {
      setRestoring(false);
    }
  };

  const parseLog = (text: string) => {
    if (text.startsWith("[OK]")) return "text-green";
    if (text.startsWith("[!]")) return "text-red";
    if (text.startsWith("[~]")) return "text-text-muted";
    return "text-text-secondary";
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">备份与恢复</h1>

      {/* Detected Paths */}
      <div className="bg-bg-card border border-border rounded-[10px] p-4 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-semibold text-text-secondary">路径检测</h2>
          <button
            onClick={async () => {
              setRefresh(true);
              const p = await window.api.detectPaths();
              setPaths(p);
              setRefresh(false);
            }}
            className="flex items-center justify-center w-7 h-7 rounded-[6px] bg-transparent border-none cursor-pointer text-text-muted hover:text-accent hover:bg-accent-bg transition-colors"
            title="刷新路径检测"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              className={refresh ? "animate-spin" : ""}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
        {paths ? (
          <>
            <PathRow label="Steam 根目录" value={paths.steamPath} />
            <PathRow label="全局 CFG 路径" value={paths.cs2CfgPath} />
            <PathRow label="地图指南路径" value={paths.annotationsPath} />
            <PathRow label="用户视频配置" value={paths.videoCfgPath} />
          </>
        ) : (
          <p className="text-sm text-text-muted">正在检测...</p>
        )}
      </div>

      {/* Backup Section */}
      <div className="bg-bg-card border border-border rounded-[10px] p-4 space-y-3">
        <h2 className="font-display text-sm font-semibold text-text-secondary">创建备份</h2>
        <p className="text-sm text-text-muted">
          将当前的全局 CFG、视频预设和地图指南文件打包备份为 ZIP 存档。
        </p>
        <button
          onClick={handleBackup}
          disabled={backingUp || !paths?.cs2CfgPath}
          className="px-5 py-2.5 rounded-[6px] font-display font-semibold text-sm transition-all cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed bg-accent text-bg hover:bg-accent-light"
        >
          {backingUp ? "备份中..." : "开始备份"}
        </button>
      </div>

      {/* Restore Section */}
      <div className="bg-bg-card border border-border rounded-[10px] p-4 space-y-3">
        <h2 className="font-display text-sm font-semibold text-text-secondary">恢复备份</h2>
        <p className="text-sm text-text-muted">
          选择之前创建的备份 ZIP 文件，将配置恢复到备份时的状态。
        </p>
        <button
          onClick={handleRestore}
          disabled={restoring}
          className="px-5 py-2.5 rounded-[6px] font-display font-semibold text-sm transition-all cursor-pointer border border-border bg-transparent text-text-secondary hover:border-border-highlight hover:text-text disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {restoring ? "恢复中..." : "选择备份文件并恢复"}
        </button>
      </div>

      {/* Open Backup Folder */}
      <div className="bg-bg-card border border-border rounded-[10px] p-4 space-y-3">
        <h2 className="font-display text-sm font-semibold text-text-secondary">备份文件位置</h2>
        <p className="text-sm text-text-muted">
          打开备份文件所在目录，查看和管理所有备份存档。
        </p>
        <button
          onClick={() => window.api.openBackupFolder()}
          className="px-5 py-2.5 rounded-[6px] font-display font-semibold text-sm transition-all cursor-pointer border border-border bg-transparent text-text-secondary hover:border-border-highlight hover:text-text"
        >
          打开备份文件夹
        </button>
      </div>

      {/* Log Terminal */}
      <div className="bg-bg-card border border-border rounded-[10px] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-raised border-b border-border">
          <span className="w-[9px] h-[9px] rounded-full bg-red"></span>
          <span className="w-[9px] h-[9px] rounded-full bg-accent-light"></span>
          <span className="w-[9px] h-[9px] rounded-full bg-green"></span>
          <span className="font-mono text-[11px] text-text-faint ml-2">日志输出</span>
        </div>
        <div ref={logRef} className="p-4 h-48 overflow-y-auto font-mono text-[12px] leading-[1.8] space-y-0.5">
          {logs.length === 0 ? (
            <p className="text-text-faint">等待操作...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={parseLog(log.text)}>{log.text}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PathRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-text-muted w-28 flex-shrink-0">{label}</span>
      <span className={`font-mono text-xs break-all ${value ? "text-text-secondary" : "text-text-faint"}`}>
        {value ?? "未检测到"}
      </span>
    </div>
  );
}
