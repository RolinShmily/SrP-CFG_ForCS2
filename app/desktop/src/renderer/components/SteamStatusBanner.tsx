import { AlertTriangle, XCircle, ExternalLink } from "lucide-react";
import type { DetectionResult } from "../types";

interface Props {
  detection: DetectionResult;
}

export default function SteamStatusBanner({ detection }: Props) {
  const issues: { type: "error" | "warning"; message: string; action?: { label: string; url: string } }[] = [];

  if (!detection.steamPath) {
    issues.push({
      type: "error",
      message: "未检测到 Steam 安装",
      action: {
        label: "下载 Steam",
        url: "https://store.steampowered.com/",
      },
    });
  }

  if (detection.steamPath && detection.cs2InstallState === "not-installed") {
    issues.push({
      type: "error",
      message: "未检测到 CS2 安装",
      action: {
        label: "安装 CS2",
        url: "https://store.steampowered.com/app/730/CounterStrike_2/",
      },
    });
  }

  if (detection.cs2InstallState === "needs-update") {
    issues.push({
      type: "warning",
      message: "CS2 有可用更新，建议更新后再安装配置",
    });
  }

  if (detection.steamPath && !detection.hasAutoLoginUser) {
    issues.push({
      type: "warning",
      message: "未检测到自动登录的 Steam 用户，请先登录 Steam",
    });
  }

  if (issues.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {issues.map((issue, i) => (
        <div
          key={i}
          className={`flex items-center justify-between px-4 py-3 rounded-[var(--radius)] border ${
            issue.type === "error"
              ? "bg-red/5 border-red/20 text-red"
              : "bg-accent-light/5 border-accent-light/20 text-accent-light"
          }`}
        >
          <div className="flex items-center gap-2">
            {issue.type === "error" ? (
              <XCircle size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            <span className="text-sm">{issue.message}</span>
          </div>
          {issue.action && (
            <button
              onClick={() => window.api.openExternal(issue.action!.url)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-[var(--radius-sm)] bg-transparent border border-current/30 hover:bg-current/10 transition-colors cursor-pointer"
            >
              {issue.action.label}
              <ExternalLink size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
