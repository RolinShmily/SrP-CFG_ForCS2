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
        className="flex items-stretch justify-between select-none"
      >
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="flex min-w-0 flex-1 items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-display text-sm font-semibold text-accent">
              v{release.tagName}
            </span>
            {release.hasDesktopAssets && (
              <span className="inline-flex items-center gap-1.5 rounded bg-green/10 px-2 py-0.5 text-xs text-green">
                <Monitor size={14} />
                软件
              </span>
            )}
            {release.hasConfigAssets && (
              <span className="inline-flex items-center gap-1.5 rounded bg-accent-bg px-2 py-0.5 text-xs text-accent-light">
                <Package size={14} />
                配置包
              </span>
            )}
            {date && <span className="text-xs text-text-faint">{date}</span>}
          </div>
          <ChevronDown
            size={18}
            className={`ml-3 shrink-0 text-text-faint transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
        <button
          type="button"
          aria-label={`在 GitHub 打开 v${release.tagName}`}
          onClick={() => window.api.openExternal(release.htmlUrl)}
          className="m-2 flex h-8 w-8 shrink-0 items-center justify-center border-none bg-transparent text-text-faint transition-colors hover:bg-accent-bg hover:text-accent"
          title="GitHub Release"
        >
          <ExternalLink size={15} />
        </button>
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

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isLoading = checking || loading;
  const hasNewer = releases.some((r) => compareVersions(r.tagName, currentVersion) > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div aria-hidden="true" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="update-modal-title" className="relative mx-4 flex max-h-[80vh] w-full max-w-lg flex-col rounded-[var(--radius)] border border-border bg-bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 id="update-modal-title" className="ui-section-title">检查更新</h2>
          <button
            type="button"
            autoFocus
            aria-label="关闭更新窗口"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border-none bg-transparent text-text-muted transition-colors hover:bg-bg-hover hover:text-text"
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
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(false);
                  window.api.getUpdateHistory()
                    .then((r) => { if (r) setReleases(r); else setError(true); })
                    .catch(() => setError(true))
                    .finally(() => setLoading(false));
                }}
                className="min-h-9 rounded-[var(--radius)] border border-border bg-bg-raised px-4 text-sm text-text-secondary transition-colors hover:bg-bg-hover"
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
          <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-4 shrink-0">
            <button
              type="button"
              onClick={() =>
                window.api.openExternal("https://cfg.srprolin.top")
              }
              className="flex min-h-9 items-center gap-1.5 rounded-[var(--radius)] border-none bg-accent px-4 text-sm font-medium text-bg transition-colors hover:bg-accent/90"
            >
              <Globe size={14} />
              官网下载
            </button>
            <button
              type="button"
              onClick={() => window.api.openExternal(`${REPO_URL}/releases/latest`)}
              className="flex min-h-9 items-center gap-1.5 rounded-[var(--radius)] border border-border bg-transparent px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover"
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
