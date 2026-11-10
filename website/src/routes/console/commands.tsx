import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";

import { RecordListPage } from "@/components/console/record-list-page";
import {
  getCategories,
  getFlags,
  getIndex,
  getPublicCounts,
} from "@/lib/console/catalog.server";
import { collectionPageJsonLd, pageMeta } from "@/lib/console/seo";

export async function loader() {
  const index = getIndex();
  return {
    counts: index.counts,
    publicCounts: getPublicCounts(),
    categories: getCategories(),
    flags: getFlags(),
    upstream: index.upstream,
  };
}

const DESCRIPTION = "浏览 Counter-Strike 2 Console Commands：语法、flags、分类与中文说明。";

export const meta: MetaFunction = () =>
  pageMeta({
    title: "CS2 Console Commands | SrP-CFG Console",
    description: DESCRIPTION,
    path: "/console/commands/",
    jsonLd: collectionPageJsonLd({
      name: "CS2 Console Commands",
      description: DESCRIPTION,
      path: "/console/commands/",
    }),
  });

export default function CommandsRoute() {
  const data = useLoaderData<typeof loader>();
  return <RecordListPage type="command" data={data} />;
}
