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
    <>
      <nav className="console-breadcrumb">
        <Link prefetch="intent" to="/console">{copy.detail.breadcrumb}</Link>
        <span>/</span>
        <Link prefetch="intent" to="/console/categories">{copy.categories.title}</Link>
        <span>/</span>
        <span>{label}</span>
      </nav>
      <header className="console-list-head" style={{ marginTop: 16 }}>
        <div>
          <p className="console-eyebrow">CATEGORY</p>
          <h1 className="console-list-title">{label}</h1>
          <p className="console-list-note">
            {data.category.records.length.toLocaleString()} {copy.common.records}
          </p>
          <p className="console-section-note" style={{ marginTop: 8 }}>
            {copy.common.hiddenInternal}
          </p>
        </div>
      </header>
      <div style={{ marginTop: 18 }}>
        <RecordTable
          records={data.category.records}
          empty={copy.categories.empty}
          showType
          categories={data.categories}
        />
      </div>
    </>
  );
}
