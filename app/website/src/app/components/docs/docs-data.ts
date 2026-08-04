/**
 * 文档中心共享数据（L3.3）。
 * 分组/顺序逻辑与旧 DocLayout.astro + docs/index.astro 一致；
 * 数据直接来自 Velite 生成的 .velite/docs.json（构建期由 vite import，
 * 绕过含 `with { type: 'json' }` 的生成 index.js——Vite 6 对该语法解析不稳定）。
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

// ---- 侧边栏导航分组（对应 DocLayout.astro）----
const guideOrder = ["srpcfg-1", "srpcfg-3", "autoexec", "vcfg"];
const featureOrder = ["crosshair_view", "autoview", "knife", "zeus"];
const modeOrder = ["practice", "previewmode", "guidemake", "demo_hlae"];
const referenceOrder = ["helps", "cs2_video"];

const known = new Set([...guideOrder, ...featureOrder, ...modeOrder, ...referenceOrder]);
const remaining = docs.filter((doc) => !known.has(doc.slug) && doc.slug !== "srpcfg-2");

export interface NavGroup {
  label: string;
  docs: Doc[];
}

export const navGroups: NavGroup[] = [
  { label: "开始与原理", docs: take(guideOrder) },
  { label: "功能", docs: take(featureOrder) },
  { label: "模式", docs: take(modeOrder) },
  { label: "参考", docs: [...take(referenceOrder), ...remaining] },
].filter((group) => group.docs.length > 0);

/** 前后篇导航顺序 = 侧边栏顺序（对应 DocLayout.astro） */
export const orderedDocs = navGroups.flatMap((group) => group.docs);

// ---- 首页四分组（对应 docs/index.astro）----
export interface IndexGroup {
  label: string;
  description: string;
  docs: Doc[];
}

export const indexGroups: IndexGroup[] = [
  {
    label: "开始与原理",
    description: "安装之前先理解启动顺序、用户层和 CS2 持久状态。",
    docs: take(["srpcfg-1", "srpcfg-3", "autoexec", "vcfg"]),
  },
  {
    label: "常驻功能",
    description: "按需启用准星、视角、刀具与 Zeus 能力。",
    docs: take(["crosshair_view", "autoview", "knife", "zeus"]),
  },
  {
    label: "会话模式",
    description: "进入跑图、预览、地图指南或 Demo/HLAE 工作区。",
    docs: take(["practice", "previewmode", "guidemake", "demo_hlae"]),
  },
  {
    label: "资源与参考",
    description: "查询控制台帮助、视频预设和地图 Annotation 资源。",
    docs: take(["helps", "cs2_video", "annotations", "pwa_prac"]),
  },
];

export const docsById = new Map(docs.map((doc) => [doc.slug, doc]));
