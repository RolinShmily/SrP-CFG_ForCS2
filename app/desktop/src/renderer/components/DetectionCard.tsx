import { RefreshCw, User } from "lucide-react";
import PathRow from "./PathRow";
import type { DetectionResult } from "../types";

interface Props {
  detection: DetectionResult | null;
  refreshing: boolean;
  onRefresh: () => void;
  onUserChange: (accountId: string) => void;
}

export default function DetectionCard({
  detection,
  refreshing,
  onRefresh,
  onUserChange,
}: Props) {
  return (
    <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm font-semibold text-text-secondary">
          路径检测
        </h2>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] bg-transparent border-none cursor-pointer text-text-muted hover:text-accent hover:bg-accent-bg transition-colors disabled:opacity-50"
          title="刷新路径检测"
        >
          <RefreshCw
            size={14}
            className={refreshing ? "animate-spin" : ""}
          />
        </button>
      </div>

      {detection ? (
        <>
          <PathRow label="Steam 根目录" value={detection.steamPath} />
          <PathRow label="全局 CFG 路径" value={detection.cs2CfgPath} />
          <PathRow label="地图指南路径" value={detection.annotationsPath} />
          <PathRow label="用户视频配置" value={detection.videoCfgPath} />

          {/* Steam User Selection — same row */}
          {detection.steamUsers.length > 0 && (
            <div className="flex items-center gap-3 pt-3 mt-2 border-t border-border">
              <div className="flex items-center gap-1.5 shrink-0">
                <User size={14} className="text-text-muted" />
                <span className="text-xs text-text-muted">Steam 用户</span>
              </div>
              <select
                value={detection.currentUser?.accountId ?? ""}
                onChange={(e) => onUserChange(e.target.value)}
                className="flex-1 min-w-0 bg-bg-raised border border-border rounded-[var(--radius-sm)] px-3 py-1.5 text-sm text-text font-mono focus:border-accent focus:outline-none"
              >
                {detection.steamUsers.map((u) => (
                  <option key={u.accountId} value={u.accountId}>
                    {u.personaName
                      ? `${u.personaName} (${u.accountId})`
                      : u.accountId}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-text-muted">正在检测...</p>
      )}
    </div>
  );
}
