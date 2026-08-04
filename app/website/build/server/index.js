import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, Meta, Links, ScrollRestoration, Scripts, NavLink, Link } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { useState } from "react";
import { Github, X, Menu, BookOpen, Download } from "lucide-react";
import "clsx";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders
    });
  }
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "zh-CN",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx("meta", {
        name: "referrer",
        content: "origin"
      }), /* @__PURE__ */ jsx("meta", {
        name: "theme-color",
        content: "#090b10"
      }), /* @__PURE__ */ jsx("meta", {
        name: "color-scheme",
        content: "dark"
      }), /* @__PURE__ */ jsx("link", {
        rel: "icon",
        type: "image/x-icon",
        href: "/favicon.ico"
      }), /* @__PURE__ */ jsx("link", {
        rel: "preconnect",
        href: "https://fonts.googleapis.com"
      }), /* @__PURE__ */ jsx("link", {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous"
      }), /* @__PURE__ */ jsx("link", {
        href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&display=swap",
        rel: "stylesheet",
        media: "print",
        onLoad: (e) => {
          e.target.setAttribute("media", "all");
        }
      }), /* @__PURE__ */ jsx("noscript", {
        children: /* @__PURE__ */ jsx("link", {
          href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&display=swap",
          rel: "stylesheet"
        })
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [/* @__PURE__ */ jsx("a", {
        className: "skip-link",
        href: "#main-content",
        children: "跳到主要内容"
      }), children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function Component() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout,
  default: root
}, Symbol.toStringTag, { value: "Module" }));
const REPO_URL = "https://github.com/RolinShmily/SrP-CFG_ForCS2";
const navLinks = [
  { href: "/", label: "首页" },
  { href: "/download", label: "下载" },
  { href: "/docs", label: "文档" },
  { href: "/commands", label: "指令" },
  { href: "/about", label: "关于" }
];
function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return /* @__PURE__ */ jsxs("nav", { className: "fixed inset-x-0 top-0 z-[100] border-b border-border bg-bg/95", "aria-label": "主导航", children: [
    /* @__PURE__ */ jsxs("div", { className: "mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-5 sm:px-7", children: [
      /* @__PURE__ */ jsxs(
        NavLink,
        {
          to: "/",
          className: "group flex min-h-11 items-center gap-3 no-underline",
          "aria-label": "SrP-CFG 首页",
          children: [
            /* @__PURE__ */ jsx("img", { src: "/favicon.ico", alt: "", width: "32", height: "32", className: "h-8 w-8 rounded-[7px]" }),
            /* @__PURE__ */ jsxs("span", { className: "leading-none", children: [
              /* @__PURE__ */ jsx("span", { className: "block font-display text-lg font-bold tracking-[0.08em] text-text group-hover:text-accent", children: "SrP-CFG" }),
              /* @__PURE__ */ jsx("span", { className: "mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint", children: "v3 Runtime" })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "hidden items-center gap-1 md:flex", children: [
        navLinks.map((link) => /* @__PURE__ */ jsx(
          NavLink,
          {
            to: link.href,
            end: link.href === "/",
            className: ({ isActive }) => `inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-4 font-display text-sm font-semibold no-underline transition-colors duration-200 ${isActive ? "bg-accent-bg text-accent" : "text-text-muted hover:bg-bg-hover hover:text-text"}`,
            children: link.label
          },
          link.href
        )),
        /* @__PURE__ */ jsx("span", { className: "mx-2 h-5 w-px bg-border", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: REPO_URL,
            target: "_blank",
            rel: "noopener",
            className: "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 font-display text-sm font-semibold text-text-muted no-underline transition-colors duration-200 hover:bg-bg-hover hover:text-text",
            children: [
              /* @__PURE__ */ jsx(Github, { className: "h-4 w-4" }),
              "GitHub"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-bg-card text-text-secondary transition-colors hover:border-border-highlight hover:text-text md:hidden",
          "aria-label": mobileOpen ? "关闭主导航" : "打开主导航",
          "aria-expanded": mobileOpen,
          "aria-controls": "mobile-menu",
          onClick: () => setMobileOpen((v) => !v),
          children: mobileOpen ? /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }) : /* @__PURE__ */ jsx(Menu, { className: "h-5 w-5" })
        }
      )
    ] }),
    mobileOpen && /* @__PURE__ */ jsx("div", { id: "mobile-menu", className: "border-t border-border bg-bg md:hidden", children: /* @__PURE__ */ jsx("div", { className: "mx-auto flex max-w-[1280px] flex-col gap-1 px-5 py-3", children: navLinks.map((link) => /* @__PURE__ */ jsx(
      NavLink,
      {
        to: link.href,
        end: link.href === "/",
        onClick: () => setMobileOpen(false),
        className: ({ isActive }) => `inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-4 font-display text-sm font-semibold no-underline transition-colors duration-200 ${isActive ? "bg-accent-bg text-accent" : "text-text-muted hover:bg-bg-hover hover:text-text"}`,
        children: link.label
      },
      link.href
    )) }) })
  ] });
}
const footerLinks = [
  { to: "/docs", label: "项目文档", icon: BookOpen, external: false },
  { to: "/download", label: "前往下载", icon: Download, external: false },
  { to: REPO_URL, label: "GitHub", icon: Github, external: true }
];
function Footer() {
  return /* @__PURE__ */ jsx("footer", { className: "border-t border-border py-9 sm:py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 px-5 sm:px-7 md:flex-row md:items-center", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("img", { src: "/favicon.ico", alt: "", width: "28", height: "28", className: "h-7 w-7 rounded-md" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "block font-display text-sm font-bold tracking-[0.08em] text-text-secondary", children: "SrP-CFG" }),
        /* @__PURE__ */ jsx("span", { className: "block font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint", children: "CS2 configuration runtime" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-x-2 gap-y-1", children: footerLinks.map((link) => {
      const Icon = link.icon;
      const cls = "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 font-display text-sm font-semibold text-text-muted no-underline transition-colors duration-200 hover:bg-bg-hover hover:text-accent";
      return link.external ? /* @__PURE__ */ jsxs(
        "a",
        {
          href: link.to,
          target: "_blank",
          rel: "noopener",
          className: cls,
          children: [
            /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }),
            link.label
          ]
        },
        link.label
      ) : /* @__PURE__ */ jsxs(Link, { to: link.to, className: cls, children: [
        /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }),
        link.label
      ] }, link.label);
    }) })
  ] }) });
}
const layout = UNSAFE_withComponentProps(function Component2() {
  return /* @__PURE__ */ jsxs(Fragment, {
    children: [/* @__PURE__ */ jsx(Nav, {}), /* @__PURE__ */ jsx("main", {
      id: "main-content",
      tabIndex: -1,
      children: /* @__PURE__ */ jsx(Outlet, {})
    }), /* @__PURE__ */ jsx(Footer, {})]
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: layout
}, Symbol.toStringTag, { value: "Module" }));
function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  actions
}) {
  return /* @__PURE__ */ jsxs("header", { className: "flex items-start justify-between gap-5 border-b border-border pb-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      eyebrow && /* @__PURE__ */ jsxs("div", { className: "mb-1.5 flex items-center gap-2 font-mono text-xs leading-[1.125rem] text-accent", children: [
        icon,
        /* @__PURE__ */ jsx("span", { children: eyebrow })
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-bold leading-8 text-text", children: title }),
      description && /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-[72ch] text-sm leading-[1.375rem] text-text-muted", children: description })
    ] }),
    actions && /* @__PURE__ */ jsx("div", { className: "shrink-0", children: actions })
  ] });
}
const home = UNSAFE_withComponentProps(function HomePage() {
  return /* @__PURE__ */ jsx("main", {
    className: "mx-auto w-full max-w-[var(--site-width)] px-[var(--content-gutter)] py-10",
    children: /* @__PURE__ */ jsx(PageHeader, {
      eyebrow: "SrP-CFG · Home",
      title: "首页（迁移骨架占位）",
      description: "这里是 Astro → Vite + React 迁移的首页占位内容。PageHeader 来自 @srp-cfg/ui 共享组件包，后续将替换为完整首页。"
    })
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home
}, Symbol.toStringTag, { value: "Module" }));
const download = UNSAFE_withComponentProps(function DownloadPage() {
  return /* @__PURE__ */ jsxs("main", {
    className: "mx-auto w-full max-w-[var(--site-width)] px-[var(--content-gutter)] py-10",
    children: [/* @__PURE__ */ jsx("h1", {
      className: "font-display text-2xl font-bold text-text",
      children: "下载页（迁移骨架占位）"
    }), /* @__PURE__ */ jsx("p", {
      className: "mt-2 text-sm text-text-muted",
      children: "占位内容：后续迁移自 src/pages/download.astro（版本获取 + 下载入口）。"
    })]
  });
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: download
}, Symbol.toStringTag, { value: "Module" }));
const about = UNSAFE_withComponentProps(function AboutPage() {
  return /* @__PURE__ */ jsxs("main", {
    className: "mx-auto w-full max-w-[var(--site-width)] px-[var(--content-gutter)] py-10",
    children: [/* @__PURE__ */ jsx("h1", {
      className: "font-display text-2xl font-bold text-text",
      children: "关于页（迁移骨架占位）"
    }), /* @__PURE__ */ jsx("p", {
      className: "mt-2 text-sm text-text-muted",
      children: "占位内容：后续迁移自 src/pages/about.astro。"
    })]
  });
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: about
}, Symbol.toStringTag, { value: "Module" }));
const docs = UNSAFE_withComponentProps(function DocsPage() {
  return /* @__PURE__ */ jsxs("main", {
    className: "mx-auto w-full max-w-[var(--site-width)] px-[var(--content-gutter)] py-10",
    children: [/* @__PURE__ */ jsx("h1", {
      className: "font-display text-2xl font-bold text-text",
      children: "文档中心（迁移骨架占位）"
    }), /* @__PURE__ */ jsx("p", {
      className: "mt-2 text-sm text-text-muted",
      children: "占位内容：后续迁移自 src/pages/docs/* 与 DocLayout / DocsIndexLayout。"
    })]
  });
});
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: docs
}, Symbol.toStringTag, { value: "Module" }));
const commands = UNSAFE_withComponentProps(function CommandsPage() {
  return /* @__PURE__ */ jsxs("main", {
    className: "mx-auto w-full max-w-[var(--site-width)] px-[var(--content-gutter)] py-10",
    children: [/* @__PURE__ */ jsx("h1", {
      className: "font-display text-2xl font-bold text-text",
      children: "指令检索中心（迁移骨架占位）"
    }), /* @__PURE__ */ jsx("p", {
      className: "mt-2 text-sm text-text-muted",
      children: "占位内容：后续迁移自 src/pages/commands.astro（SSG 预渲染 + AI 检索面板）。"
    })]
  });
});
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: commands
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-7vJmYhde.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/root-uWwVxU7U.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js"], "css": ["/assets/root-DDhbARKU.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "layout": { "id": "layout", "parentId": "root", "path": void 0, "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/layout-CjOECzBs.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "layout", "path": "/", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/home-CBQRyXe9.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/download": { "id": "routes/download", "parentId": "layout", "path": "/download", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/download-CR3XnSTX.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/about": { "id": "routes/about", "parentId": "layout", "path": "/about", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/about-C0gVTsU8.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/docs": { "id": "routes/docs", "parentId": "layout", "path": "/docs", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/docs-D_Ps-E2q.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/commands": { "id": "routes/commands", "parentId": "layout", "path": "/commands", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/commands-D67C7O6s.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-4d4f6548.js", "version": "4d4f6548", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "v8_passThroughRequests": false, "v8_trailingSlashAwareDataRequests": false, "unstable_previewServerPrerendering": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = ["/", "/download", "/about", "/docs", "/commands"];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "layout": {
    id: "layout",
    parentId: "root",
    path: void 0,
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/home": {
    id: "routes/home",
    parentId: "layout",
    path: "/",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/download": {
    id: "routes/download",
    parentId: "layout",
    path: "/download",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/about": {
    id: "routes/about",
    parentId: "layout",
    path: "/about",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/docs": {
    id: "routes/docs",
    parentId: "layout",
    path: "/docs",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/commands": {
    id: "routes/commands",
    parentId: "layout",
    path: "/commands",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
