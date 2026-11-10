import { Flag } from "lucide-react";
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
    <>
      <header className="console-hero">
        <p className="console-eyebrow">CS2 CONSOLE</p>
        <h1 className="console-title">{copy.flags.title}</h1>
        <p className="console-subtitle">{copy.flags.subtitle}</p>
      </header>
      <div className="console-grid">
        {data.flags.map((flag) => (
          <Link prefetch="intent" key={flag.flag} className="console-card" to={flagPath(flag.flag)}>
            <div className="console-card-title">
              <span className="console-mono">{flag.flag}</span>
              <Flag size={14} />
            </div>
            <div className="console-card-meta">
              <span className="console-card-count">{flag.count}</span>{" "}
              {copy.flags.count}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
