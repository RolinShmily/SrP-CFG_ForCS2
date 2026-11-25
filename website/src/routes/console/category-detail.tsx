import { ChevronRight } from "lucide-react";
import type { MetaFunction } from "react-router";
import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";

import { RecordTable } from "@/components/console/record-table";
import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import { getCategories, getCategory } from "@/lib/console/catalog.server";
import {
  breadcrumbJsonLd,
  categoryUrl,
  collectionPageJsonLd,
  pageMeta,
  SITE_URL,
} from "@/lib/console/seo";

export async function loader({ params }: LoaderFunctionArgs) {
  const category = getCategory(params.slug ?? "");
  if (!category) throw new Response("Not Found", { status: 404 });
  return {
    category,
    categories: getCategories(),
  };
}

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
  const category = loaderData?.category.category;
  const label = category?.zh ?? "分类";
  const slug = category?.slug ?? "";
  const description = `浏览 ${label} 分类下的 CS2 ConVars 与 Commands。`;
  const path = `/console/categories/${encodeURIComponent(slug)}/`;
  return pageMeta({
    title: `${label} | CS2 Console - SrP-CFG`,
    description,
    path,
    jsonLd: [
      collectionPageJsonLd({ name: label, description, path }),
      breadcrumbJsonLd([
        { name: "Console", url: `${SITE_URL}/console/` },
        { name: "分类", url: `${SITE_URL}/console/categories/` },
        { name: label, url: categoryUrl(slug) },
      ]),
    ],
  });
};

export default function CategoryDetailRoute() {
  const data = useLoaderData<typeof loader>();
  const { locale } = useI18n();
  const copy = consoleCopy[locale];
  const category = data.category.category;
  const label = locale === "zh" ? category.zh : category.en;

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link prefetch="intent" to="/console" className="transition hover:text-ink">
          {copy.detail.breadcrumb}
        </Link>
        <ChevronRight size={13} aria-hidden="true" />
        <Link prefetch="intent" to="/console/categories" className="transition hover:text-ink">
          {copy.categories.title}
        </Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span className="text-ink">{label}</span>
      </nav>

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-cs-orange">
            CATEGORY
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{label}</h1>
          <p className="mt-1.5 text-xs text-muted">{copy.common.hiddenInternal}</p>
        </div>
        <div className="shrink-0 rounded-xl border border-line bg-surface px-3.5 py-2 font-mono text-xs text-dim">
          <span className="font-semibold text-ink">{data.category.records.length.toLocaleString()}</span>{" "}
          {copy.common.records}
        </div>
      </header>

      <RecordTable
        records={data.category.records}
        empty={copy.categories.empty}
        showType
        categories={data.categories}
      />
    </div>
  );
}
