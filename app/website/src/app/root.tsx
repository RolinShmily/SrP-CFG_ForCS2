/**
 * React Router 7 框架模式 root route。
 *
 * Layout：<html> 骨架，对齐原 BaseLayout.astro：
 * - head：meta（description/og/theme-color/color-scheme）、Chakra Petch 字体（print 异步加载）、<Meta/>、<Links/>
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&display=swap"
          rel="stylesheet"
          media="print"
          onLoad={(e) => {
            (e.target as HTMLLinkElement).setAttribute("media", "all");
          }}
        />
        <link
          href="https://cdn.jsdelivr.net/npm/@chinese-fonts/maple-mono-cn@2.0.0/dist/MapleMono-CN-Regular/result.css"
          rel="stylesheet"
        />
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&display=swap"
            rel="stylesheet"
          />
        </noscript>
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
