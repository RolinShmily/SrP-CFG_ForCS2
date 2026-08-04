/**
 * React Router 7 框架模式路由表。
 *
 * 6 类页面（对应原 src/pages/*.astro），全部包在 layout.tsx（Nav + Footer）下：
 * /             -> home
 * /download     -> download
 * /about        -> about
 * /docs         -> docs（文档中心索引）
 * /docs/:slug   -> docs-detail（文档详情，16 篇，数据来自 Velite .velite）
 * /commands     -> commands
 * /commands/:name -> command-detail（指令详情静态页，2785 条，L3.4 可选增量）
 *
 * 待 Astro 迁移完成后删除 src/pages/* 与 src/layouts/*。
 */
import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
  layout("layout.tsx", [
    route("/", "routes/home.tsx"),
    route("/download", "routes/download.tsx"),
    route("/about", "routes/about.tsx"),
    route("/docs", "routes/docs.tsx"),
    route("/docs/:slug", "routes/docs-detail.tsx"),
    route("/commands", "routes/commands.tsx"),
    route("/commands/:name", "routes/command-detail.tsx"),
  ]),
] satisfies RouteConfig;
