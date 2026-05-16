import { useState, useEffect, useRef } from "react";
import type { LogEntry, DetectedPaths, SteamUser } from "../types";

interface Props {
  logs: LogEntry[];
  addLog: (msg: string) => void;
}

export default function InstallPage({ logs, addLog }: Props) {
  const [paths, setPaths] = useState<DetectedPaths | null>(null);
  const [users, setUsers] = useState<SteamUser[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [installCfg, setInstallCfg] = useState(true);
  const [installVideo, setInstallVideo] = useState(false);
  const [installAnnotations, setInstallAnnotations] = useState(false);
  const [dropPath, setDropPath] = useState("");
  const [installing, setInstalling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const detect = async () => {
    setRefreshing(true);
    const p: DetectedPaths = await window.api.detectPaths();
    setPaths(p);
    if (p.steamPath) {
      const ids: string[] = await window.api.getSteamUsers(p.steamPath);
      const steamUsers: SteamUser[] = ids.map((id) => ({ id }));
      setUsers(steamUsers);
      if (steamUsers.length > 0) setSelectedUser(steamUsers[0].id);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    const removeListener = window.api.onLog(addLog);
    detect();
    return removeListener;
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [logs]);

  const handleInstall = async () => {
    if (!dropPath) return;
    setInstalling(true);
    try {
      await window.api.install({
        sourcePath: dropPath,
        isZip: dropPath.toLowerCase().endsWith(".zip"),
        installCfg,
        installVideo,
        installAnnotations,
      });
    } finally {
      setInstalling(false);
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
      <h1 className="font-display text-2xl font-bold">安装配置</h1>

      {/* Detected Paths */}
      <div className="bg-bg-card border border-border rounded-[10px] p-4 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-semibold text-text-secondary">路径检测</h2>
          <button
            onClick={detect}
            disabled={refreshing}
            className="flex items-center justify-center w-7 h-7 rounded-[6px] bg-transparent border-none cursor-pointer text-text-muted hover:text-accent hover:bg-accent-bg transition-colors disabled:opacity-50"
            title="刷新路径检测"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              className={refreshing ? "animate-spin" : ""}
              style={refreshing ? {} : {}}
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

      {/* User Selection */}
      {users.length > 0 && (
        <div className="bg-bg-card border border-border rounded-[10px] p-4">
          <h2 className="font-display text-sm font-semibold text-text-secondary mb-3">Steam 用户</h2>
          <select
            value={selectedUser}
            onChange={async (e) => {
              setSelectedUser(e.target.value);
              await window.api.setSteamUser(e.target.value);
            }}
            className="w-full bg-bg-raised border border-border rounded-[6px] px-3 py-2 text-sm text-text font-mono focus:border-accent focus:outline-none"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.id}</option>
            ))}
          </select>
        </div>
      )}

      {/* Install Targets */}
      <div className="bg-bg-card border border-border rounded-[10px] p-4 space-y-3">
        <h2 className="font-display text-sm font-semibold text-text-secondary mb-3">安装目标</h2>
        <CheckItem checked={installCfg} onChange={setInstallCfg} label="安装全局 CFG 文件" />
        <CheckItem checked={installVideo} onChange={setInstallVideo} label="安装视频预设文件（cs2_video.txt）" />
        <CheckItem checked={installAnnotations} onChange={setInstallAnnotations} label="安装地图指南预设文件" />
      </div>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-[10px] p-8 text-center transition-colors ${
          dropPath ? "border-accent bg-accent-bg" : "border-border hover:border-border-highlight"
        }`}
      >
        {dropPath ? (
          <div className="space-y-2">
            <p className="font-mono text-sm text-accent break-all">{dropPath}</p>
            <button onClick={() => setDropPath("")} className="text-xs text-text-muted hover:text-red cursor-pointer bg-transparent border-none">
              清除
            </button>
          </div>
        ) : (
          <p className="text-sm text-text-muted">拖入 ZIP / CFG 文件或文件夹</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleInstall}
          disabled={!dropPath || installing}
          className="flex-1 py-3 rounded-[6px] font-display font-semibold text-sm transition-all cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed bg-accent text-bg hover:bg-accent-light"
        >
          {installing ? "安装中..." : "开始安装"}
        </button>
        <button
          onClick={() => window.api.restoreFromBackup()}
          className="px-5 py-3 rounded-[6px] font-display font-semibold text-sm transition-all cursor-pointer border border-border bg-transparent text-text-secondary hover:border-border-highlight hover:text-text"
        >
          一键恢复
        </button>
        <button
          onClick={() => window.api.backupConfig()}
          className="px-5 py-3 rounded-[6px] font-display font-semibold text-sm transition-all cursor-pointer border border-border bg-transparent text-text-secondary hover:border-border-highlight hover:text-text"
        >
          备份配置
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

function CheckItem({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-accent cursor-pointer"
      />
      <span className="text-sm text-text-secondary">{label}</span>
    </label>
  );
}
