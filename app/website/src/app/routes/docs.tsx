/**
 * 文档中心入口 /docs。
 * 直接渲染第一篇核心文档（srpcfg-1），去除冗余的开屏过渡页。
 */
import type { LoaderFunctionArgs } from "react-router";
import DocsDetailPage, {
  loader as detailLoader,
  meta as detailMeta,
} from "./docs-detail";
import { orderedDocs } from "../components/docs/docs-data";

export async function loader(args: LoaderFunctionArgs) {
  const firstSlug = orderedDocs[0]?.slug ?? "srpcfg-1";
  return detailLoader({
    ...args,
    params: { ...args.params, slug: firstSlug },
  });
}

export const meta = detailMeta;

export default DocsDetailPage;
