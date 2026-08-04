/**
 * 迁移骨架（WIP）—— React Router 7 框架模式路由表。
 *
 * 5 个静态页面路由（对应原 src/pages/*.astro），全部包在 layout.tsx（Nav + Footer）下：
 * /         -> home
 * /download -> download
 * /about    -> about
 * /docs     -> docs
 * /commands -> commands
 *
 * 后续按 TASK.md 3.2/3.4 逐步替换占位组件为迁移后的真实页面，
 * 待 Astro 迁移完成后删除 src/pages/* 与 src/layouts/*。
 */
import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
  layout("layout.tsx", [
    route("/", "routes/home.tsx"),
    route("/download", "routes/download.tsx"),
    route("/about", "routes/about.tsx"),
    route("/docs", "routes/docs.tsx"),
    route("/commands", "routes/commands.tsx"),
  ]),
] satisfies RouteConfig;
