import { useState, useMemo, useEffect } from "react";
import { marked } from "marked";
import {
  X,
  ChevronDown,
  ExternalLink,
  Globe,
  Package,
  Monitor,
  Loader2,
} from "lucide-react";
import type { GitHubRelease } from "../types";
import { REPO_URL } from "../lib/downloads";

interface Props {
  open: boolean;
  checking: boolean;
  onClose: () => void;
}

function renderMarkdown(body: string): string {
  if (!body) return "";
  return marked.parse(body, { async: false }) as string;
}

function ReleaseSection({ release }: { release: GitHubRelease }) {
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
          {release.hasDesktopAssets && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded bg-green/10 text-green">
              <Monitor size={14} />
              软件
            </span>
          )}
          {release.hasPresetAssets && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded bg-accent-bg text-accent-light">
              <Package size={14} />
              预设包
            </span>
          )}
          {date && (
            <span className="text-sm text-text-faint">{date}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.api.openExternal(release.htmlUrl);
            }}
            className="p-1 text-text-faint hover:text-accent transition-colors cursor-pointer bg-transparent border-none"
            title="GitHub Release"
          >
            <ExternalLink size={16} />
          </button>
          <ChevronDown
            size={20}
          />
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          {release.body ? (
            <div
              className="release-notes bg-bg-raised rounded-[var(--radius-sm)] p-4 max-h-72 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <div className="text-sm text-text-muted bg-bg-raised rounded-[var(--radius-sm)] p-3">
              暂无更新日志
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

export default function UpdateModal({
  open,
  checking,
  onClose,
}: Props) {
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [currentVersion, setCurrentVersion] = useState("");
  const [latestVersion, setLatestVersion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(false);
    Promise.all([
      window.api.getUpdateHistory(),
      window.api.getVersion(),
      window.api.getLatestVersion(),
    ])
      .then(([r, v, lv]) => {
        if (r === null) {
          setError(true);
          setReleases([]);
        } else {
          setReleases(r);
        }
        setCurrentVersion(v);
        setLatestVersion(lv);
      })
      .catch(() => {
        setError(true);
        setReleases([]);
      })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const isLoading = checking || loading;
  const hasNewer = releases.some((r) => compareVersions(r.tagName, currentVersion) > 0);

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
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-text-muted">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-sm">正在检查更新...</span>
            </div>
          ) : error && releases.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-red text-sm">获取更新信息失败，请检查网络连接</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(false);
                  window.api.getUpdateHistory()
                    .then((r) => { if (r) setReleases(r); else setError(true); })
                    .catch(() => setError(true))
                    .finally(() => setLoading(false));
                }}
                className="px-4 py-1.5 text-sm font-display bg-bg-raised border border-border hover:bg-bg-hover rounded-[var(--radius)] transition-colors cursor-pointer text-text-secondary"
              >
                重试
              </button>
            </div>
          ) : releases.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">
              暂无更新记录
            </div>
          ) : (
            <>
              {!hasNewer && currentVersion && (
                <div className="flex items-center justify-center gap-2 py-3 mb-3 bg-green/10 text-green text-sm rounded-[var(--radius)]">
                  <span className="font-display font-semibold">v{currentVersion}</span>
                  <span>当前已是最新版本</span>
                </div>
              )}
              {hasNewer && currentVersion && latestVersion && (
                <div className="flex items-center justify-center gap-3 py-2.5 mb-3 text-sm text-text-muted bg-bg-raised rounded-[var(--radius)]">
                  <span>当前 <span className="font-mono text-text-secondary">v{currentVersion}</span></span>
                  <span className="text-border">|</span>
                  <span>最新 <span className="font-mono text-accent">v{latestVersion}</span></span>
                </div>
              )}
              <div className="space-y-2">
                {releases.map((release) => (
                  <ReleaseSection key={release.tagName} release={release} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="flex items-center gap-3 px-5 py-4 border-t border-border shrink-0">
            <button
              onClick={() =>
                window.api.openExternal("https://cfg.srprolin.top")
              }
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-display font-medium bg-accent text-bg hover:bg-accent/90 rounded-[var(--radius)] transition-colors cursor-pointer border-none"
            >
              <Globe size={14} />
              官网下载
            </button>
            <button
              onClick={() => window.api.openExternal(`${REPO_URL}/releases/latest`)}
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
