import { Boxes, Database, Flag, FolderTree, Terminal } from "lucide-react";
import type { MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";

import { ConsoleSearch } from "@/components/console/console-search";
import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import { categoryPath, flagPath } from "@/lib/console/paths";
import { getCategories, getFlags, getIndex } from "@/lib/console/catalog.server";
import { collectionPageJsonLd, pageMeta } from "@/lib/console/seo";
import { useConsoleIndex } from "@/lib/console/use-console-index";

export async function loader() {
  const index = getIndex();
  return {
    counts: index.counts,
    categories: getCategories(),
    flags: getFlags(),
    upstream: index.upstream,
  };
}

const DESCRIPTION =
  "检索 Counter-Strike 2 ConVars 与 Console Commands，查看默认值、flags、中文说明与上游数据来源。";

export const meta: MetaFunction = () =>
  pageMeta({
    title: "CS2 指令中心 | SrP-CFG Console",
    description: DESCRIPTION,
    path: "/console/",
    jsonLd: collectionPageJsonLd({
      name: "CS2 指令中心",
      description: DESCRIPTION,
      path: "/console/",
    }),
  });

function formatTimestamp(value: string) {
  return value.replace("T", " ").replace(/Z$/, " UTC");
}

export default function ConsoleIndexRoute() {
  const data = useLoaderData<typeof loader>();
  const { locale } = useI18n();
  const copy = consoleCopy[locale];
  const { index, loading, error, reload } = useConsoleIndex();

  return (
    <>
      <section className="console-hero">
        <p className="console-eyebrow">
          <span className="status-dot" />
          {copy.overview.eyebrow}
        </p>
        <h1 className="console-title">{copy.overview.title}</h1>
        <p className="console-subtitle">{copy.overview.subtitle}</p>
        <ConsoleSearch
          records={index?.records ?? null}
          loading={loading}
          error={error}
          onRetry={reload}
        />
      </section>

      <section className="console-stats" aria-label="Console statistics">
        <Link prefetch="intent" className="console-stat" to="/console/convars">
          <div className="console-stat-icon"><Boxes size={18} /></div>
          <div className="console-stat-value">{data.counts.convars.toLocaleString()}</div>
          <div className="console-stat-label">{copy.overview.convars}</div>
        </Link>
        <Link prefetch="intent" className="console-stat" to="/console/commands">
          <div className="console-stat-icon"><Terminal size={18} /></div>
          <div className="console-stat-value">{data.counts.commands.toLocaleString()}</div>
          <div className="console-stat-label">{copy.overview.commands}</div>
        </Link>
        <Link prefetch="intent" className="console-stat" to="/console/categories">
          <div className="console-stat-icon"><FolderTree size={18} /></div>
          <div className="console-stat-value">{data.categories.length}</div>
          <div className="console-stat-label">{copy.overview.categories}</div>
        </Link>
        <Link prefetch="intent" className="console-stat" to="/console/flags">
          <div className="console-stat-icon"><Flag size={18} /></div>
          <div className="console-stat-value">{data.flags.length}</div>
          <div className="console-stat-label">{copy.overview.flags}</div>
        </Link>
      </section>

      <section className="console-section">
        <div className="console-section-head">
          <div>
            <h2 className="console-section-title">{copy.overview.categoryTitle}</h2>
            <p className="console-section-note">{copy.overview.categoryNote}</p>
          </div>
          <Link prefetch="intent" className="console-muted" to="/console/categories">
            {copy.common.viewAll}
          </Link>
        </div>
        <div className="console-grid">
          {data.categories.map((category) => (
            <Link prefetch="intent" key={category.slug} className="console-card" to={categoryPath(category.slug)}>
              <div className="console-card-title">
                <span>{locale === "zh" ? category.zh : category.en}</span>
                <FolderTree size={15} aria-hidden="true" />
              </div>
              <div className="console-card-meta">
                <span className="console-card-count">{category.count}</span>{" "}
                {copy.common.records}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="console-section">
        <div className="console-section-head">
          <h2 className="console-section-title">{copy.overview.quickTitle}</h2>
        </div>
        <div className="console-quick">
          <Link prefetch="intent" to="/console/convars"><Boxes size={15} />{copy.overview.quickConvars}</Link>
          <Link prefetch="intent" to="/console/commands"><Terminal size={15} />{copy.overview.quickCommands}</Link>
          <Link prefetch="intent" to="/console/categories"><FolderTree size={15} />{copy.overview.quickCategories}</Link>
          <Link prefetch="intent" to="/console/flags"><Flag size={15} />{copy.overview.quickFlags}</Link>
        </div>
      </section>

      <section className="console-section">
        <div className="console-panel">
          <div className="console-panel-title">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <Database size={14} /> {copy.overview.upstream}
            </span>
            <Link prefetch="intent" to="/console/changes">{copy.common.open}</Link>
          </div>
          <div className="console-source-list">
            <div className="console-source-row">
              <span>{copy.common.source}</span>
              <span className="console-mono">{data.upstream.repository}</span>
            </div>
            <div className="console-source-row">
              <span>{copy.common.commit}</span>
              <span className="console-mono">{data.upstream.commit.slice(0, 12)}</span>
            </div>
            <div className="console-source-row">
              <span>{copy.common.fetchedAt}</span>
              <span className="console-mono">{formatTimestamp(data.upstream.fetchedAt)}</span>
            </div>
          </div>
        </div>
        <p className="console-note">{copy.overview.inferredNote}</p>
      </section>
    </>
  );
}
