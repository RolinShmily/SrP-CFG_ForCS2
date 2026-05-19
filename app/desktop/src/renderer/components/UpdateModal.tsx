import { useState, useMemo, useEffect } from "react";
import { marked } from "marked";
import {
  X,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  Globe,
  Package,
  Monitor,
  CheckCircle,
  Loader2,
  History,
} from "lucide-react";
import type { UpdateCheckResult, GitHubRelease } from "../types";

interface Props {
  result: UpdateCheckResult | null;
  open: boolean;
  checking: boolean;
  onClose: () => void;
}

function renderMarkdown(body: string): string {
  if (!body) return "";
  return marked.parse(body, { async: false }) as string;
}

function ReleaseSection({
  release,
  showBadge,
}: {
  release: GitHubRelease;
  showBadge?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const date = release.publishedAt
    ? new Date(release.publishedAt).toLocaleDateString("zh-CN")
    : "";

  const html = useMemo(() => renderMarkdown(release.body), [release.body]);

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
          {showBadge &&
            (release.hasDesktopAssets ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-green/10 text-green">
                <Monitor size={10} />
                软件
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent-bg text-accent-light">
                <Package size={10} />
                预设包
              </span>
            ))}
          {date && (
            <span className="text-xs text-text-faint">{date}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {showBadge && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.api.openExternal(release.htmlUrl);
              }}
              className="p-1 text-text-faint hover:text-accent transition-colors cursor-pointer bg-transparent border-none"
              title="GitHub Release"
            >
              <ExternalLink size={13} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`text-text-faint transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          {release.body ? (
            <div
              className="release-notes bg-bg-raised rounded-[var(--radius-sm)] p-3 max-h-60 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <div className="text-xs text-text-muted bg-bg-raised rounded-[var(--radius-sm)] p-3">
              暂无更新日志
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryView() {
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.api
      .getUpdateHistory()
      .then(setReleases)
      .catch(() => setReleases([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-text-muted">
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-sm">正在加载更新历史...</span>
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted text-sm">
        暂无更新记录
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {releases.map((release) => (
        <ReleaseSection
          key={release.tagName}
          release={release}
          showBadge
        />
      ))}
    </div>
  );
}

export default function UpdateModal({
  result,
  open,
  checking,
  onClose,
}: Props) {
  const [showHistory, setShowHistory] = useState(false);

  // Reset history view when modal reopens
  useEffect(() => {
    if (open) setShowHistory(false);
  }, [open]);

  if (!open) return null;

  const hasDesktop = result?.hasDesktopUpdate ?? false;
  const hasPreset = result?.hasPresetUpdate ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-[var(--radius)] w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          {showHistory ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(false)}
                className="text-text-muted hover:text-text transition-colors cursor-pointer bg-transparent border-none p-1"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="font-display text-lg font-bold">更新历史</h2>
              <span className="text-xs text-text-muted">v3.0.0 起</span>
            </div>
          ) : (
            <h2 className="font-display text-lg font-bold">检查更新</h2>
          )}
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors cursor-pointer bg-transparent border-none p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {showHistory ? (
            <HistoryView />
          ) : checking ? (
            <div className="flex items-center justify-center py-8 text-text-muted">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-sm">正在检查更新...</span>
            </div>
          ) : result?.hasUpdate ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-text-secondary">
                  {hasDesktop ? "发现新版本" : "预设包已更新"}
                  {" · 当前版本 "}
                  <span className="font-mono text-text-faint">
                    v{result.currentVersion}
                  </span>
                </p>
                {!hasDesktop && (
                  <p className="text-xs text-text-muted mt-1">
                    以下版本的配置预设包已发布更新，软件本身无变更
                  </p>
                )}
                {hasDesktop && hasPreset && (
                  <p className="text-xs text-text-muted mt-1">
                    包含软件更新和预设包更新
                  </p>
                )}
              </div>
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
        {!checking && !showHistory && (
          <div className="flex items-center gap-3 px-5 py-4 border-t border-border shrink-0">
            {result?.hasUpdate && hasDesktop && (
              <button
                onClick={() =>
                  window.api.openExternal("https://cfg.srprolin.top/")
                }
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-display font-medium bg-accent text-bg hover:bg-accent/90 rounded-[var(--radius)] transition-colors cursor-pointer border-none"
              >
                <Globe size={14} />
                官网下载
              </button>
            )}
            {result?.hasUpdate && hasDesktop && (
              <button
                onClick={() => {
                  const url = result.releases.find(
                    (r) => r.hasDesktopAssets,
                  )?.htmlUrl;
                  if (url) window.api.openExternal(url);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-display font-medium bg-transparent text-text-secondary border border-border hover:bg-bg-hover rounded-[var(--radius)] transition-colors cursor-pointer"
              >
                <ExternalLink size={14} />
                GitHub Release
              </button>
            )}
            {result?.hasUpdate && !hasDesktop && (
              <button
                onClick={() =>
                  window.api.openExternal("https://cfg.srprolin.top/")
                }
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-display font-medium bg-accent text-bg hover:bg-accent/90 rounded-[var(--radius)] transition-colors cursor-pointer border-none"
              >
                <Globe size={14} />
                前往下载
              </button>
            )}
            <button
              onClick={() => setShowHistory(true)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-display font-medium bg-transparent text-text-secondary border border-border hover:bg-bg-hover rounded-[var(--radius)] transition-colors cursor-pointer ${result?.hasUpdate ? "ml-auto" : "mx-auto"}`}
            >
              <History size={14} />
              更新历史
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
