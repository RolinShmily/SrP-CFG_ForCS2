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
    <>
      <nav className="console-breadcrumb">
        <Link prefetch="intent" to="/console">{copy.detail.breadcrumb}</Link>
        <span>/</span>
        <Link prefetch="intent" to="/console/flags">{copy.flags.title}</Link>
        <span>/</span>
        <span className="console-mono">{data.flag.flag}</span>
      </nav>
      <header className="console-list-head" style={{ marginTop: 16 }}>
        <div>
          <p className="console-eyebrow">FLAG</p>
          <h1 className="console-list-title console-mono">{data.flag.flag}</h1>
          <p className="console-list-note">
            {data.flag.records.length.toLocaleString()} {copy.common.records}
          </p>
          <p className="console-section-note" style={{ marginTop: 8 }}>
            {copy.common.hiddenInternal}
          </p>
        </div>
      </header>
      <div style={{ marginTop: 18 }}>
        <RecordTable
          records={data.flag.records}
          empty={copy.flags.empty}
          showType
          categories={data.categories}
        />
      </div>
    </>
  );
}
