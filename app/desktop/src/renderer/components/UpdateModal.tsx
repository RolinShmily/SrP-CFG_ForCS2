import { useState } from "react";
import {
  X,
  ChevronDown,
  ExternalLink,
  Globe,
  CheckCircle,
  Loader2,
} from "lucide-react";
import type { UpdateCheckResult, GitHubRelease } from "../types";

interface Props {
  result: UpdateCheckResult | null;
  open: boolean;
  checking: boolean;
  onClose: () => void;
}

function ReleaseSection({ release }: { release: GitHubRelease }) {
  const [expanded, setExpanded] = useState(false);

  const date = release.publishedAt
    ? new Date(release.publishedAt).toLocaleDateString("zh-CN")
    : "";

  return (
    <div className="border border-border rounded-[var(--radius)]">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <span className="font-display text-sm font-semibold text-accent">
            v{release.tagName}
          </span>
          {date && (
            <span className="text-xs text-text-faint">{date}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-text-faint transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="text-xs text-text-muted whitespace-pre-wrap bg-bg-raised rounded-[var(--radius-sm)] p-3 max-h-60 overflow-y-auto">
            {release.body || "暂无更新日志"}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UpdateModal({
  result,
  open,
  checking,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-[var(--radius)] w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="font-display text-lg font-bold">检查更新</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors cursor-pointer bg-transparent border-none p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {checking ? (
            <div className="flex items-center justify-center py-8 text-text-muted">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-sm">正在检查更新...</span>
            </div>
          ) : result?.hasUpdate ? (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                发现新版本！当前版本：
                <span className="font-mono text-text-faint">
                  v{result.currentVersion}
                </span>
              </p>
              <div className="space-y-2">
                {result.releases.map((release) => (
                  <ReleaseSection key={release.tagName} release={release} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle size={32} className="text-green-500 mb-3" />
              <p className="text-sm text-text-secondary">当前已是最新版本</p>
              <p className="text-xs text-text-faint mt-1 font-mono">
                v{result?.currentVersion}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!checking && result?.hasUpdate && (
          <div className="flex items-center gap-3 px-5 py-4 border-t border-border shrink-0">
            <button
              onClick={() =>
                window.api.openExternal("https://cfg.srprolin.top/")
              }
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-display font-medium bg-accent text-bg hover:bg-accent/90 rounded-[var(--radius)] transition-colors cursor-pointer border-none"
            >
              <Globe size={14} />
              官网下载
            </button>
            <button
              onClick={() => {
                const url = result.releases[0]?.htmlUrl;
                if (url) window.api.openExternal(url);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-display font-medium bg-transparent text-text-secondary border border-border hover:bg-bg-hover rounded-[var(--radius)] transition-colors cursor-pointer"
            >
              <ExternalLink size={14} />
              GitHub Release
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
