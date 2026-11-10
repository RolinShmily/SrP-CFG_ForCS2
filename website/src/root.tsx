import { useEffect } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useRouteError,
  type MetaFunction,
} from "react-router";

import { MotionProvider } from "@/components/motion-provider";
import { I18nProvider } from "@/context/i18n-context";
import "./globals.css";

const DEFAULT_TITLE = "SrP-CFG — 你的 CS2 配置工作台";
const DEFAULT_DESCRIPTION =
  "管理 CS2 预设、自由装配功能、定制视频设置与地图指南。下载 Windows 桌面软件及独立 srp-cfg、video、annotations 配置包。";

export const meta: MetaFunction = () => [
  { title: DEFAULT_TITLE },
  { name: "description", content: DEFAULT_DESCRIPTION },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#131923" />
        <Meta />
        <Links />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important;filter:none!important}`}</style>
        </noscript>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function ScrollToHash() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    const target = document.getElementById(id);
    if (!target) return;
    requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [location.pathname, location.hash]);
  return null;
}

export default function Root() {
  return (
    <I18nProvider>
      <MotionProvider>
        <ScrollToHash />
        <Outlet />
      </MotionProvider>
    </I18nProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const title = status === 404 ? "页面不存在" : "页面加载失败";
  const detail =
    isRouteErrorResponse(error) && error.status === 404
      ? "这个地址没有对应的页面，可能是链接过期或输入有误。"
      : "请求未能完成。可以返回首页，或稍后重试。";

  return (
    <main className="error-page">
      <p className="eyebrow">ERROR {status}</p>
      <h1>{title}</h1>
      <p>{detail}</p>
      <a className="button button-primary" href="/">返回首页</a>
    </main>
  );
}
