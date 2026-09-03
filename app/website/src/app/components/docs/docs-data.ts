/**
 * 文档中心共享数据与导航结构。
 * 按照「架构与入门 → 核心特性 → 会话模式 → 扩展与参考」清晰分类。
 */
import docsJson from "../../../../.velite/docs.json";

export interface TocEntry {
  title: string;
  url: string;
  items: TocEntry[];
}

export interface Doc {
  title: string;
  description?: string;
  slug: string;
  content: string;
  toc: TocEntry[];
}

export const docs = docsJson as Doc[];

const take = (ids: string[]) =>
  ids.map((id) => docs.find((doc) => doc.slug === id)).filter((d): d is Doc => Boolean(d));

// ---- 侧边栏导航分组 ----
const guideOrder = ["srpcfg-1", "srpcfg-3", "autoexec", "vcfg"];
const featureOrder = ["crosshair_view", "autoview", "knife", "zeus"];
const modeOrder = ["practice", "previewmode", "guidemake", "demo_hlae", "pwa_prac"];
const referenceOrder = ["annotations", "cs2_video", "helps"];

export interface NavGroup {
  label: string;
  docs: Doc[];
}

export const navGroups: NavGroup[] = [
  { label: "架构与入门", docs: take(guideOrder) },
  { label: "核心特性", docs: take(featureOrder) },
  { label: "会话模式", docs: take(modeOrder) },
  { label: "扩展与参考", docs: take(referenceOrder) },
].filter((group) => group.docs.length > 0);

/** 前后篇导航顺序 = 侧边栏顺序 */
export const orderedDocs = navGroups.flatMap((group) => group.docs);

export const docsById = new Map(docs.map((doc) => [doc.slug, doc]));
