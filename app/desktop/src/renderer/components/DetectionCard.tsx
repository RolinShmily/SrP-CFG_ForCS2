import { Cloud, Database, RefreshCw, User } from "lucide-react";
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
        <h2 className="ui-panel-title">路径检测</h2>
        <button
          type="button"
          aria-label="刷新路径检测"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border-none bg-transparent text-text-muted transition-colors hover:bg-accent-bg hover:text-accent disabled:opacity-50"
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
          <PathRow label="游戏 CFG 路径" value={detection.cs2CfgPath} />
          <PathRow label="地图指南路径" value={detection.annotationsPath} />
          <PathRow label="账号本地状态目录" value={detection.userCfgPath} />

          {detection.vcfgState.available && (
            <>
              <div className="flex flex-wrap gap-2 border-t border-border pt-3 mt-2">
                <div className="flex min-w-56 flex-1 items-center gap-2 rounded-[var(--radius-sm)] bg-bg-raised px-3 py-2">
                  <Cloud size={14} className="text-accent" />
                  <div>
                    <div className="text-xs text-text-secondary">账号 VCFG（Cloud）</div>
                    <div className="text-xs text-text-faint">
                      {detection.vcfgState.bindings} 键 + {detection.vcfgState.analogBindings} 轴 · {detection.vcfgState.cloudConvars} ConVar
                    </div>
                  </div>
                </div>
                <div className="flex min-w-56 flex-1 items-center gap-2 rounded-[var(--radius-sm)] bg-bg-raised px-3 py-2">
                  <Database size={14} className="text-text-muted" />
                  <div>
                    <div className="text-xs text-text-secondary">本机 VCFG / Video</div>
                    <div className="text-xs text-text-faint">
                      {detection.vcfgState.machineConvars} 个 ConVar · 视频{detection.vcfgState.hasVideoConfig ? "已检测" : "未检测"}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Steam User Selection — same row */}
          {detection.steamUsers.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 mt-2">
              <label htmlFor="steam-user" className="flex items-center gap-1.5 shrink-0">
                <User size={14} className="text-text-muted" />
                <span className="text-xs text-text-muted">Steam 用户</span>
              </label>
              <select
                id="steam-user"
                value={detection.currentUser?.accountId ?? ""}
                onChange={(e) => onUserChange(e.target.value)}
                className="min-h-8 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-border bg-bg-raised px-3 font-mono text-sm text-text focus:border-accent"
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
        <p className="ui-body text-text-muted">正在检测...</p>
      )}
    </div>
  );
}
