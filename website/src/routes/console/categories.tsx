import { ArrowUpRight, FolderTree } from "lucide-react";
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
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-cs-orange">
          CS2 CONSOLE · CATEGORIES
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {copy.categories.title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-dim">{copy.categories.subtitle}</p>
      </header>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {data.categories.map((category) => (
          <Link
            key={category.slug}
            prefetch="intent"
            to={categoryPath(category.slug)}
            className="group flex items-center justify-between rounded-2xl border border-line bg-surface p-5 transition hover:border-cs-orange/40 hover:bg-card"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 text-base font-semibold text-ink group-hover:text-cs-orange">
                <FolderTree size={16} className="shrink-0 text-muted group-hover:text-cs-orange" aria-hidden="true" />
                <span className="truncate">{locale === "zh" ? category.zh : category.en}</span>
              </div>
              <div className="mt-2 font-mono text-xs text-muted">
                <span className="font-semibold text-dim">{category.count.toLocaleString()}</span>{" "}
                {copy.categories.count}
              </div>
            </div>
            <ArrowUpRight
              size={16}
              className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cs-orange"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
