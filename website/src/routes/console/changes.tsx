import type { MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";

import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import { getIndex, getMetadata, getOverrideEntries } from "@/lib/console/catalog.server";
import { detailPath } from "@/lib/console/paths";
import { collectionPageJsonLd, pageMeta } from "@/lib/console/seo";
import type { ConsoleRecordType } from "@/lib/console/types";

export async function loader() {
  return {
    metadata: getMetadata(),
    counts: getIndex().counts,
    upstream: getIndex().upstream,
    overrides: getOverrideEntries(),
  };
}

const DESCRIPTION = "CS2 Console 上游快照、记录计数、翻译状态与人工修订。";

export const meta: MetaFunction = () =>
  pageMeta({
    title: "数据更新 | SrP-CFG Console",
    description: DESCRIPTION,
    path: "/console/changes/",
    jsonLd: collectionPageJsonLd({
      name: "Console 数据更新",
      description: DESCRIPTION,
      path: "/console/changes/",
    }),
  });

function formatTimestamp(value: string) {
  return value.replace("T", " ").replace(/Z$/, " UTC");
}

export default function ChangesRoute() {
  const data = useLoaderData<typeof loader>();
  const { locale } = useI18n();
  const copy = consoleCopy[locale];
  const upstream = data.metadata.upstream;
  const repoUrl = `https://github.com/${upstream.repository}`;
  const commitUrl = `${repoUrl}/commit/${upstream.commit}`;
  const files = [
    ["convars", upstream.files.convars] as const,
    ["commands", upstream.files.commands] as const,
  ];

  return (
    <>
      <header className="console-hero">
        <p className="console-eyebrow">CS2 CONSOLE</p>
        <h1 className="console-title">{copy.changes.title}</h1>
        <p className="console-subtitle">{copy.changes.subtitle}</p>
      </header>

      <div className="console-detail-grid" style={{ marginTop: 0 }}>
        <div>
          <section className="console-panel">
            <div className="console-panel-title">
              {copy.changes.upstreamTitle}
              <span>{copy.changes.upstreamNote}</span>
            </div>
            <div className="console-source-list">
              <div className="console-source-row">
                <span>{copy.changes.commit}</span>
                <span>
                  <a className="console-mono" href={commitUrl} target="_blank" rel="noreferrer">
                    {upstream.commit}
                  </a>
                </span>
              </div>
              <div className="console-source-row">
                <span>{copy.changes.fetchedAt}</span>
                <span className="console-mono">{formatTimestamp(upstream.fetchedAt)}</span>
              </div>
              {files.map(([name, file]) => (
                <div key={name} className="console-source-row">
                  <span>{file.path}</span>
                  <span className="console-mono">
                    {file.records} {copy.changes.records} · {file.bytes.toLocaleString()} bytes
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="console-panel">
            <div className="console-panel-title">{copy.changes.overridesTitle}</div>
            <p className="console-section-note" style={{ marginBottom: 12 }}>
              {copy.changes.overridesNote}
            </p>
            {data.overrides.length === 0 ? (
              <div className="console-empty">{copy.changes.noOverrides}</div>
            ) : (
              <div className="console-source-list">
                {data.overrides.map((entry) => {
                  const [type, ...rest] = entry.key.split(":");
                  const name = rest.join(":");
                  const recordType = type as ConsoleRecordType;
                  return (
                    <div key={entry.key} className="console-source-row" style={{ alignItems: "flex-start" }}>
                      <span>
                        <Link prefetch="intent" className="console-name" to={detailPath(recordType, name)}>
                          {name}
                        </Link>
                        <span className="console-muted"> · {type}</span>
                      </span>
                      <span>
                        {entry.zh ?? "—"}
                        {entry.note && (
                          <span className="console-muted" style={{ display: "block", marginTop: 4, fontSize: 11 }}>
                            {entry.note}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside>
          <section className="console-panel">
            <div className="console-panel-title">{copy.changes.statusTitle}</div>
            <div className="console-attrs">
              {([
                ["translated", data.counts.translated],
                ["human-edited", data.counts.humanEdited],
                ["inferred", data.counts.inferred],
                ["stale", data.counts.stale],
                ["missing", data.counts.missing],
              ] as const).map(([status, count]) => (
                <div key={status} className="console-attr">
                  <div className="console-attr-label">{copy.status[status]}</div>
                  <div className="console-attr-value">{count.toLocaleString()}</div>
                </div>
              ))}
              <div className="console-attr">
                <div className="console-attr-label">{copy.common.indexable}</div>
                <div className="console-attr-value">{data.counts.indexable.toLocaleString()}</div>
              </div>
            </div>
          </section>

          <section className="console-panel">
            <div className="console-panel-title">{copy.detail.sourceTitle}</div>
            <div className="console-source-list">
              <div className="console-source-row">
                <span>{copy.common.source}</span>
                <span>
                  <a href={repoUrl} target="_blank" rel="noreferrer">
                    {upstream.repository}
                  </a>
                </span>
              </div>
              <div className="console-source-row">
                <span>{copy.common.commit}</span>
                <span className="console-mono">{upstream.commit.slice(0, 12)}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <p className="console-note">{copy.changes.historyNote}</p>
    </>
  );
}
