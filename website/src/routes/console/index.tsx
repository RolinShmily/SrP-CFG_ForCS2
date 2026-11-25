import { ArrowUpRight, Boxes, Database, Flag, FolderTree, Terminal } from "lucide-react";
import type { MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";

import { ConsoleSearch } from "@/components/console/console-search";
import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import { categoryPath } from "@/lib/console/paths";
import { getCategories, getFlags, getIndex } from "@/lib/console/catalog.server";
import { collectionPageJsonLd, pageMeta } from "@/lib/console/seo";

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

  const stats = [
    {
      to: "/console/convars",
      icon: Boxes,
      value: data.counts.convars.toLocaleString(),
      label: copy.overview.convars,
      accent: "text-cs-orange bg-cs-orange/10 border-cs-orange/25",
    },
    {
      to: "/console/commands",
      icon: Terminal,
      value: data.counts.commands.toLocaleString(),
      label: copy.overview.commands,
      accent: "text-cs-blue bg-cs-blue/10 border-cs-blue/25",
    },
    {
      to: "/console/categories",
      icon: FolderTree,
      value: data.categories.length.toLocaleString(),
      label: copy.overview.categories,
      accent: "text-cs-emerald bg-cs-emerald/10 border-cs-emerald/25",
    },
    {
      to: "/console/flags",
      icon: Flag,
      value: data.flags.length.toLocaleString(),
      label: copy.overview.flags,
      accent: "text-ink bg-white/[0.06] border-line-strong",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero + Pagefind instant search */}
      <section className="rounded-3xl border border-line bg-surface/80 p-6 sm:p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cs-orange/30 bg-cs-orange/10 px-3 py-1 text-xs font-medium text-cs-orange">
          <span className="h-1.5 w-1.5 rounded-full bg-cs-orange" aria-hidden="true" />
          <span>{copy.overview.eyebrow}</span>
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {copy.overview.title}
        </h1>
        <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-dim sm:text-base">
          {copy.overview.subtitle}
        </p>

        <ConsoleSearch />
      </section>

      {/* Stat cards */}
      <section aria-label="Console statistics" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map(({ to, icon: Icon, value, label, accent }) => (
          <Link
            key={to}
            prefetch="intent"
            to={to}
            className="group rounded-2xl border border-line bg-surface p-4 transition hover:border-cs-orange/40 hover:bg-card sm:p-5"
          >
            <div className="flex items-center justify-between">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${accent}`}>
                <Icon size={17} aria-hidden="true" />
              </div>
              <ArrowUpRight
                size={15}
                className="text-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cs-orange"
                aria-hidden="true"
              />
            </div>
            <div className="mt-4 font-mono text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {value}
            </div>
            <div className="mt-1 text-xs text-dim">{label}</div>
          </Link>
        ))}
      </section>

      {/* Categories grid */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink">{copy.overview.categoryTitle}</h2>
            <p className="mt-1 text-sm text-dim">{copy.overview.categoryNote}</p>
          </div>
          <Link
            prefetch="intent"
            to="/console/categories"
            className="inline-flex items-center gap-1 text-xs font-medium text-cs-orange transition hover:underline"
          >
            {copy.common.viewAll}
            <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.categories.map((category) => (
            <Link
              key={category.slug}
              prefetch="intent"
              to={categoryPath(category.slug)}
              className="group flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-4 transition hover:border-cs-orange/40 hover:bg-card"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium text-ink group-hover:text-cs-orange">
                  <FolderTree size={15} className="shrink-0 text-muted group-hover:text-cs-orange" aria-hidden="true" />
                  <span className="truncate">{locale === "zh" ? category.zh : category.en}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-muted">
                  <span className="font-semibold text-dim">{category.count.toLocaleString()}</span>{" "}
                  {copy.common.records}
                </p>
              </div>
              <ArrowUpRight
                size={15}
                className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cs-orange"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Quick jump links */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-ink">{copy.overview.quickTitle}</h2>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            prefetch="intent"
            to="/console/convars"
            className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-dim transition hover:border-line-strong hover:bg-card hover:text-ink"
          >
            <Boxes size={15} className="text-cs-orange" aria-hidden="true" />
            <span>{copy.overview.quickConvars}</span>
          </Link>
          <Link
            prefetch="intent"
            to="/console/commands"
            className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-dim transition hover:border-line-strong hover:bg-card hover:text-ink"
          >
            <Terminal size={15} className="text-cs-blue" aria-hidden="true" />
            <span>{copy.overview.quickCommands}</span>
          </Link>
          <Link
            prefetch="intent"
            to="/console/categories"
            className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-dim transition hover:border-line-strong hover:bg-card hover:text-ink"
          >
            <FolderTree size={15} className="text-cs-emerald" aria-hidden="true" />
            <span>{copy.overview.quickCategories}</span>
          </Link>
          <Link
            prefetch="intent"
            to="/console/flags"
            className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-dim transition hover:border-line-strong hover:bg-card hover:text-ink"
          >
            <Flag size={15} className="text-muted" aria-hidden="true" />
            <span>{copy.overview.quickFlags}</span>
          </Link>
        </div>
      </section>

      {/* Upstream snapshot provenance */}
      <section className="space-y-3">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dim">
              <Database size={14} className="text-cs-orange" aria-hidden="true" />
              {copy.overview.upstream}
            </span>
            <Link
              prefetch="intent"
              to="/console/changes"
              className="inline-flex items-center gap-1 text-xs font-medium text-cs-orange transition hover:underline"
            >
              {copy.common.open}
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
          <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-muted">{copy.common.source}</dt>
              <dd className="mt-1 font-mono text-ink">{data.upstream.repository}</dd>
            </div>
            <div>
              <dt className="text-muted">{copy.common.commit}</dt>
              <dd className="mt-1 font-mono text-ink">{data.upstream.commit.slice(0, 12)}</dd>
            </div>
            <div>
              <dt className="text-muted">{copy.common.fetchedAt}</dt>
              <dd className="mt-1 font-mono text-ink">{formatTimestamp(data.upstream.fetchedAt)}</dd>
            </div>
          </dl>
        </div>
        <p className="text-xs leading-relaxed text-muted">{copy.overview.inferredNote}</p>
      </section>
    </div>
  );
}
