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
  const listPath =
    detail.type === "convar" ? "/console/convars" : "/console/commands";
  const listLabel =
    detail.type === "convar" ? copy.nav.convars : copy.nav.commands;
  const categoryLabel = locale === "zh" ? detail.categoryZh : detail.categoryEn;
  const repoUrl = `https://github.com/${detail.source.repository}`;
  const commitUrl = `${repoUrl}/commit/${detail.source.commit}`;
  const defaultValue =
    detail.defaultValue === null || detail.defaultValue === ""
      ? detail.type === "convar"
        ? '""'
        : "—"
      : detail.defaultValue;

  return (
    <article className="console-detail">
      <nav className="console-breadcrumb" aria-label="Breadcrumb">
        <Link prefetch="intent" to="/console">{copy.detail.breadcrumb}</Link>
        <span>/</span>
        <Link prefetch="intent" to={listPath}>{listLabel}</Link>
        <span>/</span>
        <Link prefetch="intent" to={categoryPath(detail.category)}>{categoryLabel}</Link>
        <span>/</span>
        <span className="console-mono">{detail.name}</span>
      </nav>

      <header className="console-detail-head">
        <div>
          <h1 className="console-detail-title">{detail.name}</h1>
          <div className="console-detail-meta">
            <TypeBadge type={detail.type} />
            <StatusBadge status={detail.translationStatus} />
            <Link prefetch="intent" className="console-chip" to={categoryPath(detail.category)}>
              {categoryLabel}
            </Link>
          </div>
        </div>
      </header>

      <div className="console-detail-grid">
        <div>
          {detail.translationStatus === "inferred" && (
            <div className="console-notice console-notice-inferred">
              {copy.detail.inferredNotice}
            </div>
          )}
          {detail.translationStatus === "stale" && (
            <div className="console-notice console-notice-stale">
              {copy.detail.staleNotice}
            </div>
          )}
          {detail.translationStatus === "missing" && (
            <div className="console-notice console-notice-missing">
              {copy.detail.missingNotice}
            </div>
          )}
          {detail.translationStatus === "human-edited" && (
            <div className="console-notice console-notice-human">
              {copy.detail.humanNotice}
            </div>
          )}

          <section className="console-panel">
            <div className="console-panel-title">
              {copy.detail.translationTitle}
              {detail.zh && <StatusBadge status={detail.translationStatus} />}
            </div>
            <p className="console-description">
              {detail.zh || copy.detail.missingTranslation}
            </p>
          </section>

          <section className="console-panel">
            <div className="console-panel-title">{copy.detail.originalTitle}</div>
            <p className="console-original">{detail.description || "—"}</p>
          </section>

          <section className="console-panel">
            <div className="console-panel-title">
              {copy.detail.configTitle}
              <span>{detail.type === "convar" ? "convar" : "command"}</span>
            </div>
            <div className="console-code">
              <pre>
                <code>{detail.configSnippet}</code>
              </pre>
              <CopyButton value={detail.configSnippet} label={copy.detail.copySnippet} />
            </div>
          </section>
        </div>

        <aside>
          <section className="console-panel">
            <div className="console-panel-title">{copy.detail.attributes}</div>
            <div className="console-attrs">
              <div className="console-attr">
                <div className="console-attr-label">{copy.common.type}</div>
                <div className="console-attr-value">{detail.type === "convar" ? "ConVar" : "Command"}</div>
              </div>
              {detail.type === "convar" && (
                <div className="console-attr">
                  <div className="console-attr-label">{copy.detail.default}</div>
                  <div className="console-attr-value mono">{defaultValue}</div>
                </div>
              )}
              {detail.type === "convar" && (
                <div className="console-attr">
                  <div className="console-attr-label">{copy.detail.minMax}</div>
                  <div className="console-attr-value mono">
                    {detail.min ?? "—"} / {detail.max ?? "—"}
                  </div>
                </div>
              )}
              <div className="console-attr">
                <div className="console-attr-label">{copy.detail.category}</div>
                <div className="console-attr-value">
                  <Link prefetch="intent" to={categoryPath(detail.category)}>{categoryLabel}</Link>
                </div>
              </div>
              <div className="console-attr" style={{ gridColumn: "1 / -1" }}>
                <div className="console-attr-label">{copy.detail.flags}</div>
                <div className="console-attr-value">
                  <FlagList flags={detail.flags} />
                </div>
              </div>
              <div className="console-attr">
                <div className="console-attr-label">{copy.common.indexable}</div>
                <div className="console-attr-value">
                  {detail.indexable ? copy.common.yes : copy.common.no}
                </div>
              </div>
              {detail.note && (
                <div className="console-attr" style={{ gridColumn: "1 / -1" }}>
                  <div className="console-attr-label">{copy.detail.note}</div>
                  <div className="console-attr-value">{detail.note}</div>
                </div>
              )}
            </div>
          </section>

          <section className="console-panel">
            <div className="console-panel-title">{copy.detail.sourceTitle}</div>
            <div className="console-source-list">
              <div className="console-source-row">
                <span>{copy.common.source}</span>
                <span>
                  <a href={repoUrl} target="_blank" rel="noreferrer">
                    {detail.source.repository}
                  </a>
                </span>
              </div>
              <div className="console-source-row">
                <span>{copy.common.commit}</span>
                <span>
                  <a className="console-mono" href={commitUrl} target="_blank" rel="noreferrer">
                    {detail.source.commit.slice(0, 12)}
                  </a>
                </span>
              </div>
              <div className="console-source-row">
                <span>{copy.common.fetchedAt}</span>
                <span className="console-mono">{formatTimestamp(detail.source.fetchedAt)}</span>
              </div>
              <div className="console-source-row">
                <span>{copy.common.sourceFile}</span>
                <span className="console-mono">{detail.source.file}</span>
              </div>
              <div className="console-source-row">
                <span>SHA-256</span>
                <span className="console-mono" style={{ fontSize: 10.5 }}>
                  {detail.source.sha256}
                </span>
              </div>
            </div>
            <p className="console-section-note" style={{ marginTop: 12 }}>
              {copy.detail.sourceNote}
            </p>
          </section>

          <section className="console-panel">
            <div className="console-panel-title">{copy.detail.related}</div>
            <div className="console-related">
              <Link prefetch="intent" className="console-chip" to={categoryPath(detail.category)}>
                {categoryLabel}
              </Link>
              {detail.flags.slice(0, 8).map((flag) => (
                <Link prefetch="intent" key={flag} className="console-chip" to={flagPath(flag)}>
                  {flag}
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </article>
  );
}
