import { ChevronRight } from "lucide-react";
import type { MetaFunction } from "react-router";
import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";

import { RecordTable } from "@/components/console/record-table";
import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import { getCategories, getFlag } from "@/lib/console/catalog.server";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  flagUrl,
  pageMeta,
  SITE_URL,
} from "@/lib/console/seo";

export async function loader({ params }: LoaderFunctionArgs) {
  const flag = getFlag(params.flag ?? "");
  if (!flag) throw new Response("Not Found", { status: 404 });
  return {
    flag,
    categories: getCategories(),
  };
}

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
  const flag = loaderData?.flag.flag ?? "Flag";
  const description = `带有 ${flag} flag 的 CS2 ConVars 与 Commands。`;
  const path = `/console/flags/${encodeURIComponent(flag)}/`;
  return pageMeta({
    title: `${flag} | CS2 Console - SrP-CFG`,
    description,
    path,
    jsonLd: [
      collectionPageJsonLd({ name: `Flag: ${flag}`, description, path }),
      breadcrumbJsonLd([
        { name: "Console", url: `${SITE_URL}/console/` },
        { name: "Flags", url: `${SITE_URL}/console/flags/` },
        { name: flag, url: flagUrl(flag) },
      ]),
    ],
  });
};

export default function FlagDetailRoute() {
  const data = useLoaderData<typeof loader>();
  const { locale } = useI18n();
  const copy = consoleCopy[locale];

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link prefetch="intent" to="/console" className="transition hover:text-ink">
          {copy.detail.breadcrumb}
        </Link>
        <ChevronRight size={13} aria-hidden="true" />
        <Link prefetch="intent" to="/console/flags" className="transition hover:text-ink">
          {copy.flags.title}
        </Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span className="font-mono text-ink">{data.flag.flag}</span>
      </nav>

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-cs-orange">
            FLAG
          </p>
          <h1 className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {data.flag.flag}
          </h1>
          <p className="mt-1.5 text-xs text-muted">{copy.common.hiddenInternal}</p>
        </div>
        <div className="shrink-0 rounded-xl border border-line bg-surface px-3.5 py-2 font-mono text-xs text-dim">
          <span className="font-semibold text-ink">{data.flag.records.length.toLocaleString()}</span>{" "}
          {copy.common.records}
        </div>
      </header>

      <RecordTable
        records={data.flag.records}
        empty={copy.flags.empty}
        showType
        categories={data.categories}
      />
    </div>
  );
}
