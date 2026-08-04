/**
 * 迁移骨架（WIP）—— React Router 7 框架模式 root route。
 *
 * - Layout：<html> 骨架（head 内通过 import + <Links/> 注入 src/styles/global.css，
 *   该文件保留原有 Astro 版本的 design tokens，供 Tailwind v4 主题消费）
 * - Component（default export）：路由内容出口 <Outlet/>
 *
 * 待 Astro 迁移完成后删除旧结构（src/layouts/*.astro 等）。
 */
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "../styles/global.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Component() {
  return <Outlet />;
}
