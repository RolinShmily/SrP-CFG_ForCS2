import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, Meta, Links, ScrollRestoration, Scripts } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import "clsx";
import "react";
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
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
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
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
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
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
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
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
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
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
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
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: commands
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BU2IeZlS.js", "imports": ["/assets/chunk-62JRHF6Z-i6FALU8i.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/root-BCaX_Muy.js", "imports": ["/assets/chunk-62JRHF6Z-i6FALU8i.js"], "css": ["/assets/root-DDhbARKU.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": "/", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/home-Du3j7H90.js", "imports": ["/assets/chunk-62JRHF6Z-i6FALU8i.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/download": { "id": "routes/download", "parentId": "root", "path": "/download", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/download-DIye9xfs.js", "imports": ["/assets/chunk-62JRHF6Z-i6FALU8i.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/about": { "id": "routes/about", "parentId": "root", "path": "/about", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/about-DDznsBpJ.js", "imports": ["/assets/chunk-62JRHF6Z-i6FALU8i.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/docs": { "id": "routes/docs", "parentId": "root", "path": "/docs", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/docs-G4Y9xyid.js", "imports": ["/assets/chunk-62JRHF6Z-i6FALU8i.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/commands": { "id": "routes/commands", "parentId": "root", "path": "/commands", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/commands-DRi_0CE9.js", "imports": ["/assets/chunk-62JRHF6Z-i6FALU8i.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-830983f1.js", "version": "830983f1", "sri": void 0 };
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
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: "/",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/download": {
    id: "routes/download",
    parentId: "root",
    path: "/download",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/about": {
    id: "routes/about",
    parentId: "root",
    path: "/about",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/docs": {
    id: "routes/docs",
    parentId: "root",
    path: "/docs",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/commands": {
    id: "routes/commands",
    parentId: "root",
    path: "/commands",
    index: void 0,
    caseSensitive: void 0,
    module: route5
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
