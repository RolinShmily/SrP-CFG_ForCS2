/**
 * 迁移骨架（WIP）—— React Router 7 框架模式 SSG 配置。
 *
 * - ssr: true：服务端渲染/预渲染模式（Cloudflare Worker 上为构建期 SSG）
 * - prerender：构建时预渲染的路由清单（首版 5 个静态页面，
 *   后续按 tasks/layer-3-website-react/TASK.md 3.1 节扩展 /docs/* 等动态路由）
 *
 * 注意：@react-router/dev v7.18+ 用默认导出配置对象（config 模块仅有类型导出）。
 *
 * 待 Astro 迁移完成后删除旧结构（astro.config.ts / src/pages/*.astro）。
 */
import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src/app",
  ssr: true,
  prerender: ["/", "/download", "/about", "/docs", "/commands"],
} satisfies Config;
