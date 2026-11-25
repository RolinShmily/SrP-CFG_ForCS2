import { ArrowDownToLine, ArrowUpRight, ChevronRight } from "lucide-react";
import { Link } from "react-router";

import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import { categoryPath, flagPath } from "@/lib/console/paths";
import type { ConsoleDetail } from "@/lib/console/types";
import { CopyButton } from "./copy-button";
import { FlagList } from "./flag-list";
import { StatusBadge, TypeBadge } from "./status-badge";

function formatTimestamp(value: string): string {
  return value.replace("T", " ").replace(/Z$/, " UTC");
}

export function ConsoleDetailView({ detail }: { detail: ConsoleDetail }) {
  const { locale } = useI18n();
  const copy = consoleCopy[locale];
  const listPath = detail.type === "convar" ? "/console/convars" : "/console/commands";
  const listLabel = detail.type === "convar" ? copy.nav.convars : copy.nav.commands;
  const categoryLabel = locale === "zh" ? detail.categoryZh : detail.categoryEn;
  const repoUrl = `https://github.com/${detail.source.repository}`;
  const commitUrl = `${repoUrl}/commit/${detail.source.commit}`;
  const defaultValue =
    detail.defaultValue === null || detail.defaultValue === ""
      ? detail.type === "convar"
        ? '""'
        : "—"
      : detail.defaultValue;

  const notice =
    detail.translationStatus === "inferred"
      ? { text: copy.detail.inferredNotice, tone: "border-cs-orange/30 bg-cs-orange/10 text-amber-200" }
      : detail.translationStatus === "stale"
        ? { text: copy.detail.staleNotice, tone: "border-amber-500/30 bg-amber-500/10 text-amber-200" }
        : detail.translationStatus === "missing"
          ? { text: copy.detail.missingNotice, tone: "border-rose-500/30 bg-rose-500/10 text-rose-200" }
          : detail.translationStatus === "human-edited"
            ? { text: copy.detail.humanNotice, tone: "border-cs-blue/30 bg-cs-blue/10 text-blue-200" }
            : null;

  return (
    <article data-pagefind-body className="space-y-6">
      <span
        aria-hidden="true"
        className="hidden"
        data-pagefind-meta={`type:${detail.type}`}
        data-pagefind-filter={`type:${detail.type}`}
      />
      <span
        aria-hidden="true"
        className="hidden"
        data-pagefind-meta={`category:${detail.category}`}
        data-pagefind-filter={`category:${detail.category}`}
      />
      <span
        aria-hidden="true"
        className="hidden"
        data-pagefind-meta={`status:${detail.translationStatus}`}
      />
      {/* Breadcrumb (excluded from Pagefind index) */}
      <nav
        data-pagefind-ignore="all"
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-xs text-muted"
      >
        <Link prefetch="intent" to="/console" className="transition hover:text-ink">
          {copy.detail.breadcrumb}
        </Link>
        <ChevronRight size={13} />
        <Link prefetch="intent" to={listPath} className="transition hover:text-ink">
          {listLabel}
        </Link>
        <ChevronRight size={13} />
        <Link prefetch="intent" to={categoryPath(detail.category)} className="transition hover:text-ink">
          {categoryLabel}
        </Link>
        <ChevronRight size={13} />
        <span className="font-mono text-dim">{detail.name}</span>
      </nav>

      {/* Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1
            data-pagefind-meta="title"
            className="break-all font-mono text-2xl font-bold tracking-tight text-ink sm:text-3xl"
          >
            {detail.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2" data-pagefind-ignore="all">
            <TypeBadge type={detail.type} />
            <StatusBadge status={detail.translationStatus} />
            <Link
              prefetch="intent"
              to={categoryPath(detail.category)}
              className="rounded-md border border-line bg-surface px-2 py-0.5 text-xs text-dim transition hover:border-line-strong hover:text-ink"
            >
              {categoryLabel}
            </Link>
          </div>
        </div>
        <div data-pagefind-ignore="all">
          <CopyButton value={detail.configSnippet} label={copy.detail.copySnippet} />
        </div>
      </header>

      {/* Two-column content */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-8">
          {notice && (
            <div data-pagefind-ignore="all" className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${notice.tone}`}>
              {notice.text}
            </div>
          )}

          {/* Chinese description */}
          <section className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between gap-2" data-pagefind-ignore="all">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {copy.detail.translationTitle}
              </h2>
              {detail.zh && <StatusBadge status={detail.translationStatus} />}
            </div>
            <p className="mt-3 text-base leading-relaxed text-ink">
              {detail.zh || copy.detail.missingTranslation}
            </p>
          </section>

          {/* Original English description */}
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2
              data-pagefind-ignore="all"
              className="text-xs font-semibold uppercase tracking-wider text-muted"
            >
              {copy.detail.originalTitle}
            </h2>
            <p className="mt-3 font-mono text-sm leading-relaxed text-dim">
              {detail.description || "—"}
            </p>
          </section>

          {/* Copyable config snippet */}
          <section className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between gap-2" data-pagefind-ignore="all">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {copy.detail.configTitle}
              </h2>
              <span className="font-mono text-[11px] text-muted">user/custom.cfg</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
              <pre className="overflow-x-auto font-mono text-sm text-amber-300">
                <code>{detail.configSnippet}</code>
              </pre>
              <div data-pagefind-ignore="all">
                <CopyButton value={detail.configSnippet} label={copy.common.copy} />
              </div>
            </div>
          </section>

          {/* Subtle bridge back to Desktop Workbench */}
          <div
            data-pagefind-ignore="all"
            className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-cs-orange/20 bg-cs-orange/[0.06] px-5 py-4 sm:flex-row sm:items-center"
          >
            <p className="text-xs leading-relaxed text-dim">
              {locale === "zh"
                ? "想把这条参数写进 custom.cfg 又怕覆盖键位？使用 SrP-CFG 桌面端自带语法高亮与自动备份。"
                : "Want to add this to custom.cfg safely? SrP-CFG's desktop editor highlights CS2 syntax and backs up every edit."}
            </p>
            <Link
              to="/download"
              prefetch="intent"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-cs-orange px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-400"
            >
              <ArrowDownToLine size={13} />
              {locale === "zh" ? "下载桌面端" : "Get Desktop App"}
            </Link>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-5 lg:col-span-4">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2
              data-pagefind-ignore="all"
              className="text-xs font-semibold uppercase tracking-wider text-muted"
            >
              {copy.detail.attributes}
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-line bg-canvas/70 p-3">
                <dt className="text-[11px] text-muted">{copy.common.type}</dt>
                <dd className="mt-1 font-mono font-medium text-ink">
                  {detail.type === "convar" ? "ConVar" : "Command"}
                </dd>
              </div>
              {detail.type === "convar" && (
                <div className="rounded-xl border border-line bg-canvas/70 p-3">
                  <dt className="text-[11px] text-muted">{copy.detail.default}</dt>
                  <dd className="mt-1 break-all font-mono font-medium text-amber-300">{defaultValue}</dd>
                </div>
              )}
              {detail.type === "convar" && (
                <div className="rounded-xl border border-line bg-canvas/70 p-3">
                  <dt className="text-[11px] text-muted">{copy.detail.minMax}</dt>
                  <dd className="mt-1 font-mono text-dim">
                    {detail.min ?? "—"} / {detail.max ?? "—"}
                  </dd>
                </div>
              )}
              <div className="rounded-xl border border-line bg-canvas/70 p-3">
                <dt className="text-[11px] text-muted">{copy.detail.category}</dt>
                <dd className="mt-1">
                  <Link
                    prefetch="intent"
                    to={categoryPath(detail.category)}
                    className="font-medium text-ink transition hover:text-cs-orange"
                  >
                    {categoryLabel}
                  </Link>
                </dd>
              </div>
              <div className="col-span-2 rounded-xl border border-line bg-canvas/70 p-3">
                <dt className="mb-2 text-[11px] text-muted">{copy.detail.flags}</dt>
                <dd>
                  <FlagList flags={detail.flags} />
                </dd>
              </div>
              {detail.note && (
                <div className="col-span-2 rounded-xl border border-line bg-canvas/70 p-3">
                  <dt className="text-[11px] text-muted">{copy.detail.note}</dt>
                  <dd className="mt-1 text-dim">{detail.note}</dd>
                </div>
              )}
            </dl>
          </section>

          <section data-pagefind-ignore="all" className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              {copy.detail.sourceTitle}
            </h2>
            <dl className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted">{copy.common.source}</dt>
                <dd>
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-dim transition hover:text-ink"
                  >
                    {detail.source.repository}
                    <ArrowUpRight size={11} />
                  </a>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted">{copy.common.commit}</dt>
                <dd>
                  <a
                    href={commitUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-dim transition hover:text-cs-orange"
                  >
                    {detail.source.commit.slice(0, 12)}
                  </a>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted">{copy.common.fetchedAt}</dt>
                <dd className="font-mono text-dim">{formatTimestamp(detail.source.fetchedAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted">{copy.common.sourceFile}</dt>
                <dd className="font-mono text-dim">{detail.source.file}</dd>
              </div>
            </dl>
          </section>

          {detail.flags.length > 0 && (
            <section data-pagefind-ignore="all" className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {copy.detail.related}
              </h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Link
                  prefetch="intent"
                  to={categoryPath(detail.category)}
                  className="rounded-md border border-line bg-canvas px-2.5 py-1 text-xs text-dim transition hover:border-line-strong hover:text-ink"
                >
                  {categoryLabel}
                </Link>
                {detail.flags.slice(0, 8).map((flag) => (
                  <Link
                    key={flag}
                    prefetch="intent"
                    to={flagPath(flag)}
                    className="rounded-md border border-line bg-canvas px-2.5 py-1 font-mono text-[11px] text-dim transition hover:border-line-strong hover:text-ink"
                  >
                    {flag}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </article>
  );
}
