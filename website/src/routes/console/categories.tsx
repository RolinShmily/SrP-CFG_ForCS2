import { FolderTree } from "lucide-react";
import type { MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";

import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import { categoryPath } from "@/lib/console/paths";
import { getCategories, getIndex } from "@/lib/console/catalog.server";
import { collectionPageJsonLd, pageMeta } from "@/lib/console/seo";

export async function loader() {
  return {
    categories: getCategories(),
    upstream: getIndex().upstream,
  };
}

const DESCRIPTION = "按视频、音频、网络、输入、玩法、练习、调试和系统浏览 CS2 指令。";

export const meta: MetaFunction = () =>
  pageMeta({
    title: "分类 | SrP-CFG Console",
    description: DESCRIPTION,
    path: "/console/categories/",
    jsonLd: collectionPageJsonLd({
      name: "CS2 Console 分类",
      description: DESCRIPTION,
      path: "/console/categories/",
    }),
  });

export default function CategoriesRoute() {
  const data = useLoaderData<typeof loader>();
  const { locale } = useI18n();
  const copy = consoleCopy[locale];

  return (
    <>
      <header className="console-hero">
        <p className="console-eyebrow">CS2 CONSOLE</p>
        <h1 className="console-title">{copy.categories.title}</h1>
        <p className="console-subtitle">{copy.categories.subtitle}</p>
      </header>
      <div className="console-grid">
        {data.categories.map((category) => (
          <Link prefetch="intent" key={category.slug} className="console-card" to={categoryPath(category.slug)}>
            <div className="console-card-title">
              <span>{locale === "zh" ? category.zh : category.en}</span>
              <FolderTree size={15} />
            </div>
            <div className="console-card-meta">
              <span className="console-card-count">{category.count}</span>{" "}
              {copy.categories.count}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
