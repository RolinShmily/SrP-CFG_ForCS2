import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";

import { ConsoleDetailView } from "@/components/console/console-detail-view";
import { getDetail } from "@/lib/console/catalog.server";
import { definedTermJsonLd, pageMeta } from "@/lib/console/seo";

export async function loader({ params }: LoaderFunctionArgs) {
  const detail = getDetail("command", params.name ?? "");
  if (!detail) throw new Response("Not Found", { status: 404 });
  return { detail };
}

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
  if (!loaderData) {
    return [{ title: "Command | SrP-CFG Console" }];
  }
  const { detail } = loaderData;
  const description = (detail.zh || detail.description || `${detail.name} - CS2 console command`)
    .replace(/\s+/g, " ")
    .slice(0, 170);
  return pageMeta({
    title: `${detail.name} | CS2 Command - SrP-CFG`,
    description,
    path: `/console/commands/${encodeURIComponent(detail.name)}/`,
    robots: detail.indexable ? "index,follow" : "noindex,follow",
    ogType: "article",
    jsonLd: definedTermJsonLd(detail, description),
  });
};

export default function CommandDetailRoute() {
  const { detail } = useLoaderData<typeof loader>();
  return <ConsoleDetailView detail={detail} />;
}
