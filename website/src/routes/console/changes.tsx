import { Database, ExternalLink, FileEdit, Layers } from "lucide-react";
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

  const statusCounts = [
    ["translated", data.counts.translated],
    ["human-edited", data.counts.humanEdited],
    ["inferred", data.counts.inferred],
    ["stale", data.counts.stale],
    ["missing", data.counts.missing],
  ] as const;

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-cs-orange">
          CS2 CONSOLE · SNAPSHOT
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {copy.changes.title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-dim">{copy.changes.subtitle}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Upstream snapshot */}
          <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <h2 className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dim">
                <Database size={14} className="text-cs-orange" aria-hidden="true" />
                {copy.changes.upstreamTitle}
              </h2>
              <span className="text-xs text-muted">{copy.changes.upstreamNote}</span>
            </div>

            <dl className="mt-4 divide-y divide-line text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <dt className="text-muted">{copy.changes.commit}</dt>
                <dd>
                  <a
                    href={commitUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-cs-orange hover:underline"
                  >
                    <span className="break-all">{upstream.commit}</span>
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <dt className="text-muted">{copy.changes.fetchedAt}</dt>
                <dd className="font-mono text-ink">{formatTimestamp(upstream.fetchedAt)}</dd>
              </div>
              {files.map(([name, file]) => (
                <div key={name} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <dt className="font-mono text-dim">{file.path}</dt>
                  <dd className="font-mono text-ink">
                    {file.records.toLocaleString()} {copy.changes.records} · {file.bytes.toLocaleString()} bytes
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Manual overrides */}
          <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <FileEdit size={14} className="text-cs-orange" aria-hidden="true" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
                {copy.changes.overridesTitle}
              </h2>
            </div>
            <p className="mt-3 text-xs text-muted">{copy.changes.overridesNote}</p>

            {data.overrides.length === 0 ? (
              <div className="mt-4 rounded-xl border border-line bg-canvas px-4 py-8 text-center text-xs text-dim">
                {copy.changes.noOverrides}
              </div>
            ) : (
              <div className="mt-4 divide-y divide-line">
                {data.overrides.map((entry) => {
                  const [type, ...rest] = entry.key.split(":");
                  const name = rest.join(":");
                  const recordType = type as ConsoleRecordType;
                  return (
                    <div
                      key={entry.key}
                      className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-start sm:gap-6"
                    >
                      <div className="shrink-0">
                        <Link
                          prefetch="intent"
                          to={detailPath(recordType, name)}
                          className="font-mono text-sm font-semibold text-ink transition hover:text-cs-orange"
                        >
                          {name}
                        </Link>
                        <span className="ml-2 font-mono text-[11px] text-muted">{type}</span>
                      </div>
                      <div className="text-xs leading-relaxed text-dim sm:text-right">
                        <p>{entry.zh ?? "—"}</p>
                        {entry.note && <p className="mt-1 text-[11px] text-muted">{entry.note}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar: status counts + source repo */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Layers size={14} className="text-cs-orange" aria-hidden="true" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
                {copy.changes.statusTitle}
              </h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {statusCounts.map(([status, count]) => (
                <div key={status} className="rounded-xl border border-line bg-canvas p-3">
                  <div className="text-[11px] text-muted">{copy.status[status]}</div>
                  <div className="mt-1 font-mono text-lg font-bold text-ink">
                    {count.toLocaleString()}
                  </div>
                </div>
              ))}
              <div className="rounded-xl border border-line bg-canvas p-3">
                <div className="text-[11px] text-muted">{copy.common.indexable}</div>
                <div className="mt-1 font-mono text-lg font-bold text-cs-orange">
                  {data.counts.indexable.toLocaleString()}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="border-b border-line pb-3 text-xs font-semibold uppercase tracking-wider text-dim">
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
                    className="inline-flex items-center gap-1 font-mono text-ink transition hover:text-cs-orange"
                  >
                    <span>{upstream.repository}</span>
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted">{copy.common.commit}</dt>
                <dd className="font-mono text-dim">{upstream.commit.slice(0, 12)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <p className="text-xs leading-relaxed text-muted">{copy.changes.historyNote}</p>
    </div>
  );
}
