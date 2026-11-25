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

const DEFAULT_TITLE = "SrP-CFG — CS2 模块化配置套件与控制台指令中心";
const DEFAULT_DESCRIPTION =
  "Windows CS2 模块化配置工作台与 5,500+ 条 CS2 控制台指令参考中心。安全装配预设、特性、视频模板与地图标注，随时检索 ConVars 与 Commands。";

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
        <meta name="theme-color" content="#090b10" />
        <Meta />
        <Links />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
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
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs font-semibold tracking-widest text-cs-orange">ERROR {status}</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 text-sm text-dim">{detail}</p>
      <a
        href="/"
        className="mt-6 inline-flex items-center rounded-xl bg-cs-orange px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400"
      >
        返回首页
      </a>
    </main>
  );
}
