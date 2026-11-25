import {
  Archive,
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  Copy,
  FileCode2,
  LoaderCircle,
  Map,
  Monitor,
  Package,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { MetaFunction } from "react-router";
import { Link } from "react-router";

import { useI18n } from "@/context/i18n-context";
import { pageMeta } from "@/lib/console/seo";
import {
  assetPath,
  configPackageIds,
  fetchJson,
  formatSize,
  parseAppRelease,
  parsePackageManifest,
  RELEASE_API,
  RELEASES,
  softwareUrl,
  type AppRelease,
  type DownloadAsset,
  type DownloadSource,
  type PackageManifest,
} from "@/lib/downloads";

export const meta: MetaFunction = () =>
  pageMeta({
    title: "下载中心 | SrP-CFG",
    description: "下载 SrP-CFG Windows 桌面工作台（Setup 安装版 / ZIP 便携版）与四套独立 CS2/CS:GO 内容包。",
    path: "/download/",
  });

function ChecksumRow({ hash }: { hash?: string }) {
  const { t } = useI18n();
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 2600);
    return () => clearTimeout(timer);
  }, [status]);

  if (!hash) return null;

  async function copy() {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <details className="mt-3 rounded-lg border border-line bg-canvas/70 px-3 py-2 text-xs">
      <summary className="cursor-pointer select-none font-mono text-[11px] text-dim transition hover:text-ink">
        SHA-256
      </summary>
      <div className="mt-2 space-y-2">
        <code className="block break-all font-mono text-[11px] text-dim">{hash}</code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink transition hover:border-line-strong"
        >
          {status === "copied" ? <Check size={12} className="text-cs-emerald" /> : <Copy size={12} />}
          <span>
            {status === "copied"
              ? t.download.hashCopied
              : status === "failed"
                ? t.download.hashFailed
                : t.download.hashCopy}
          </span>
        </button>
      </div>
    </details>
  );
}

function ActionDownloadButton({
  asset,
  source,
  label,
  primary = true,
}: {
  asset?: DownloadAsset;
  source?: DownloadSource;
  label: string;
  primary?: boolean;
}) {
  if (!asset) {
    return (
      <span className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-line bg-canvas/50 px-4 text-xs font-medium text-muted">
        <ArrowDownToLine size={15} aria-hidden="true" />
        {label}
      </span>
    );
  }
  return (
    <a
      href={source ? softwareUrl(asset.url, source) : asset.url}
      rel="noreferrer"
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
        primary
          ? "bg-cs-orange text-black hover:bg-amber-400"
          : "border border-line-strong bg-canvas text-ink hover:border-cs-orange/50 hover:text-cs-orange"
      }`}
    >
      <ArrowDownToLine size={15} aria-hidden="true" />
      {label}
    </a>
  );
}

export default function DownloadRoute() {
  const { t } = useI18n();
  const [source, setSource] = useState<DownloadSource>("mirror");
  const [release, setRelease] = useState<AppRelease>();
  const [packages, setPackages] = useState<PackageManifest>({});
  const [appState, setAppState] = useState<"loading" | "error" | "empty" | "ready">("loading");
  const [packageState, setPackageState] = useState<"loading" | "error" | "ready">("loading");
  const [attempt, setAttempt] = useState(0);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("srp_download_source");
      if (saved === "github" || saved === "mirror") setSource(saved);
    } catch {
      // Ignore storage access restrictions.
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    const controller = new AbortController();
    setAppState("loading");
    setRelease(undefined);
    (async () => {
      let found: AppRelease | undefined;
      if (source === "mirror") {
        try {
          found = parseAppRelease(await fetchJson(assetPath("/releases/latest.json"), controller.signal));
        } catch {
          if (controller.signal.aborted) return;
        }
      }
      if (found) {
        setRelease(found);
        setAppState("ready");
        return;
      }
      try {
        found = parseAppRelease(await fetchJson(RELEASE_API, controller.signal));
        if (controller.signal.aborted) return;
        setRelease(found);
        setAppState(found ? "ready" : "empty");
      } catch {
        if (!controller.signal.aborted) setAppState("error");
      }
    })();
    return () => controller.abort();
  }, [source, attempt, restored]);

  useEffect(() => {
    const controller = new AbortController();
    setPackageState("loading");
    setPackages({});
    fetchJson(assetPath("/packages/manifest.json"), controller.signal)
      .then((value) => {
        if (controller.signal.aborted) return;
        const entries = parsePackageManifest(value);
        setPackages(entries);
        setPackageState(configPackageIds.every((id) => Boolean(entries[id])) ? "ready" : "error");
      })
      .catch(() => {
        if (!controller.signal.aborted) setPackageState("error");
      });
    return () => controller.abort();
  }, [attempt]);

  function chooseSource(next: DownloadSource) {
    setSource(next);
    try {
      localStorage.setItem("srp_download_source", next);
    } catch {
      // Ignore storage errors.
    }
  }

  const packageIcons = {
    "srp-cfg": FileCode2,
    video: Settings2,
    annotations: Map,
    "srp-cfg-csgo": Package,
  } as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Page header */}
      <header className="max-w-2xl">
        <p className="font-mono text-xs font-semibold tracking-wider text-cs-orange">
          {t.download.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {t.download.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-dim sm:text-base">
          {t.download.subtitle}
        </p>
      </header>

      {/* Section 1: Windows Desktop Suite */}
      <section className="mt-10 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-bold text-ink">{t.download.appTitle}</h2>
            <p className="mt-1 text-xs text-dim">{t.download.appDesc}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">{t.download.sourceLabel}</span>
            <div className="inline-flex rounded-xl border border-line bg-canvas p-1">
              <button
                type="button"
                aria-pressed={source === "mirror"}
                onClick={() => chooseSource("mirror")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  source === "mirror"
                    ? "bg-cs-orange/15 text-cs-orange"
                    : "text-dim hover:text-ink"
                }`}
              >
                {t.download.sourceMirror}
              </button>
              <button
                type="button"
                aria-pressed={source === "github"}
                onClick={() => chooseSource("github")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  source === "github"
                    ? "bg-white/10 text-ink"
                    : "text-dim hover:text-ink"
                }`}
              >
                {t.download.sourceGithub}
              </button>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2" role="status">
            {appState === "loading" ? (
              <>
                <LoaderCircle size={14} className="animate-spin text-cs-orange" />
                <span className="text-dim">{t.download.loading}</span>
              </>
            ) : appState === "ready" && release ? (
              <>
                <span className="h-2 w-2 rounded-full bg-cs-emerald" />
                <span className="font-medium text-ink">
                  {t.download.latest} · <span className="font-mono text-cs-emerald">v{release.version}</span>
                </span>
              </>
            ) : (
              <>
                <span className="text-amber-300">
                  {appState === "empty" ? t.download.noRelease : t.download.unavailable}
                </span>
                <button
                  type="button"
                  onClick={() => setAttempt((v) => v + 1)}
                  className="inline-flex items-center gap-1 rounded-md border border-line bg-card px-2 py-1 text-ink transition hover:border-line-strong"
                >
                  <RefreshCw size={12} />
                  {t.download.retry}
                </button>
              </>
            )}
          </div>

          <a
            href={RELEASES}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-dim transition hover:text-ink"
          >
            {t.download.releases}
            <ArrowUpRight size={13} />
          </a>
        </div>

        <p className="mt-2 text-xs text-muted">{t.download.sourceNote}</p>

        {/* Two download cards: Setup EXE + Portable ZIP */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="flex flex-col justify-between rounded-xl border border-line bg-card p-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-canvas text-cs-orange">
                  <Monitor size={19} aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-muted">
                  <span>{release ? `v${release.version}` : "Windows x64"}</span>
                  {release?.setup?.size && <span>· {formatSize(release.setup.size)}</span>}
                </div>
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink">{t.download.setupTitle}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-dim">{t.download.setupDesc}</p>
            </div>

            <div className="mt-5">
              <div className="flex flex-col">
                <ActionDownloadButton
                  asset={release?.setup}
                  source={source}
                  label={`${t.download.downloadBtn} (.exe)`}
                  primary
                />
              </div>
              <ChecksumRow hash={release?.setup?.sha256} />
            </div>
          </article>

          <article className="flex flex-col justify-between rounded-xl border border-line bg-card p-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-canvas text-cs-blue">
                  <Archive size={19} aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-muted">
                  <span>{release ? `v${release.version}` : "Windows x64"}</span>
                  {release?.portable?.size && <span>· {formatSize(release.portable.size)}</span>}
                </div>
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink">{t.download.portableTitle}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-dim">{t.download.portableDesc}</p>
            </div>

            <div className="mt-5">
              <div className="flex flex-col">
                <ActionDownloadButton
                  asset={release?.portable}
                  source={source}
                  label={`${t.download.downloadBtn} (.zip)`}
                  primary={false}
                />
              </div>
              <ChecksumRow hash={release?.portable?.sha256} />
            </div>
          </article>
        </div>

        {/* 3-step quick usage */}
        <div className="mt-6 rounded-xl border border-line bg-canvas/60 p-4 sm:p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t.download.usageTitle}
          </h3>
          <ol className="mt-3 grid gap-3 text-xs leading-relaxed text-dim md:grid-cols-3">
            {t.download.usageSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cs-orange/15 font-mono text-[11px] font-semibold text-cs-orange">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Section 2: Standalone Content Packages */}
      <section id="packages" className="mt-12">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink">{t.download.packagesTitle}</h2>
            <p className="mt-1.5 text-sm text-dim">{t.download.packagesDesc}</p>
          </div>
          {packageState === "error" && (
            <button
              type="button"
              onClick={() => setAttempt((v) => v + 1)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs text-ink transition hover:border-line-strong"
            >
              <RefreshCw size={13} />
              {t.download.retry}
            </button>
          )}
        </div>

        <p className="mt-2 font-mono text-[11px] text-muted">{t.download.packagesNote}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {configPackageIds.map((id) => {
            const entry = packages[id];
            const meta = t.download.packages[id];
            const Icon = packageIcons[id];
            return (
              <article
                key={id}
                data-package={id}
                className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 transition hover:border-line-strong"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-canvas text-cs-orange">
                        <Icon size={17} aria-hidden="true" />
                      </div>
                      <h3 className="font-mono text-base font-semibold text-ink">{meta.title}</h3>
                    </div>
                    <span
                      title={entry?.updatedAt ? `${t.download.updatedAt}: ${entry.updatedAt}` : undefined}
                      className="rounded-md border border-line bg-card px-2 py-0.5 font-mono text-xs text-dim"
                    >
                      {entry?.updatedAt ?? "—"}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-dim">{meta.desc}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>{t.download.targetPath}:</span>
                    <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-dim">
                      {meta.target}
                    </code>
                    {entry?.size && <span className="font-mono">· {formatSize(entry.size)}</span>}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex flex-col">
                    <ActionDownloadButton
                      asset={entry}
                      label={`${t.download.downloadBtn} ZIP`}
                      primary={false}
                    />
                  </div>
                  <ChecksumRow hash={entry?.sha256} />
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between rounded-xl border border-line bg-surface/60 px-5 py-4 text-xs text-dim">
          <span>
            {t.home.consoleSubtitle}
          </span>
          <Link
            to="/console"
            prefetch="intent"
            className="ml-4 shrink-0 font-medium text-cs-orange transition hover:text-amber-300"
          >
            {t.nav.console} →
          </Link>
        </div>
      </section>
    </div>
  );
}
