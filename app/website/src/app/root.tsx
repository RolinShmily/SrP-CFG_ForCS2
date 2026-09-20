/**
 * React Router 7 框架模式 root route。
 *
 * Layout：<html> 骨架，对齐原 BaseLayout.astro：
 * - head：meta（description/og/theme-color/color-scheme）、<Meta/>、<Links/>
 * - body：skip-link + 内容 + <ScrollRestoration/> + <Scripts/>
 *
 * 待 Astro 迁移完成后删除旧结构（src/layouts/*.astro 等）。
 *（L3 收尾已完成：Astro 旧结构已删，本注释仅留档）
 */
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "../styles/global.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="referrer" content="origin" />
        <meta name="theme-color" content="#090b10" />
        <meta name="color-scheme" content="dark" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <Meta />
        <Links />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          跳到主要内容
        </a>
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
