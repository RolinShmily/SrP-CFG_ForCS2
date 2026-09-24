/**
 * React Router 7 框架模式路由表。
 *
 * 6 类页面（对应原 src/pages/*.astro），全部包在 layout.tsx（Nav + Footer）下：
 * /             -> home
 * /download     -> download
 * /features     -> features（功能页，可交互键盘可视化；当前为占位）
 * /about        -> about
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
    route("/features", "routes/features.tsx"),
    route("/about", "routes/about.tsx"),
    route("/commands", "routes/commands.tsx"),
    route("/commands/:name", "routes/command-detail.tsx"),
  ]),
] satisfies RouteConfig;
