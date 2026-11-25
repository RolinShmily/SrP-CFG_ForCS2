import { ArrowUpRight, Flag } from "lucide-react";
import type { MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";

import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import { flagPath } from "@/lib/console/paths";
import { getFlags, getIndex } from "@/lib/console/catalog.server";
import { collectionPageJsonLd, pageMeta } from "@/lib/console/seo";

export async function loader() {
  return {
    flags: getFlags(),
    upstream: getIndex().upstream,
  };
}

const DESCRIPTION = "CS2 Console flags 索引：权限、范围与行为标记。";

export const meta: MetaFunction = () =>
  pageMeta({
    title: "Flags | SrP-CFG Console",
    description: DESCRIPTION,
    path: "/console/flags/",
    jsonLd: collectionPageJsonLd({
      name: "CS2 Console Flags",
      description: DESCRIPTION,
      path: "/console/flags/",
    }),
  });

export default function FlagsRoute() {
  const data = useLoaderData<typeof loader>();
  const { locale } = useI18n();
  const copy = consoleCopy[locale];

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-cs-orange">
          CS2 CONSOLE · FLAGS
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {copy.flags.title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-dim">{copy.flags.subtitle}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.flags.map((flag) => (
          <Link
            key={flag.flag}
            prefetch="intent"
            to={flagPath(flag.flag)}
            className="group flex items-center justify-between rounded-2xl border border-line bg-surface p-4 transition hover:border-cs-orange/40 hover:bg-card"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-mono text-sm font-semibold text-ink group-hover:text-cs-orange">
                <Flag size={14} className="shrink-0 text-muted group-hover:text-cs-orange" aria-hidden="true" />
                <span className="truncate">{flag.flag}</span>
              </div>
              <div className="mt-1.5 font-mono text-xs text-muted">
                <span className="font-semibold text-dim">{flag.count.toLocaleString()}</span>{" "}
                {copy.flags.count}
              </div>
            </div>
            <ArrowUpRight
              size={15}
              className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cs-orange"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
