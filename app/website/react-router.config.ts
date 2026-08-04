/**
 * React Router 7 框架模式 SSG 配置。
 *
 * - ssr: true：服务端渲染/预渲染模式（构建期 SSG）
 * - prerender：全部静态页面 + Velite 生成的 16 篇文档详情页（/docs/:slug）
 *   （docs 数据来自 .velite，需先运行 velite 再 build：pnpm build:web）
 *
 * 待 Astro 迁移完成后删除旧结构（astro.config.ts / src/pages/*.astro）。
 */
import type { Config } from "@react-router/dev/config";
import docs from "./.velite/docs.json";
import commandsJson from "./public/data/commands.json";

export default {
  appDirectory: "src/app",
  ssr: true,
  // Lazy route discovery（fog-of-war）会在客户端拉取 /__manifest 路由清单补丁；
  // 静态托管（Cloudflare Workers Static Assets）无服务器端点可服务该请求，
  // 且本应用全部 2806 页已 SSG 预渲染、完整 manifest 已内联在 HTML 中——
  // 用 mode: "initial" 在首屏文档加载时载入全部路由，彻底去掉 /__manifest 依赖。
  // （TASK-prod-routing-fix：/__manifest 500 → 客户端路由断裂）
  routeDiscovery: { mode: "initial" },
  prerender: [
    "/",
    "/download",
    "/about",
    "/docs",
    ...docs.map((doc) => `/docs/${doc.slug}`),
    "/commands",
    // 指令详情静态页：全部 2785 条预渲染（L3.4 可选增量）
    ...commandsJson.map((cmd) => `/commands/${cmd.n}`),
  ],
} satisfies Config;
