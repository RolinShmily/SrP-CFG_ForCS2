import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, Meta, Links, ScrollRestoration, Scripts, NavLink, Link, useLoaderData } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { useState, useMemo, useEffect } from "react";
import { Github, X, Menu, BookOpen, Download, Cloud, FileCode2, UserRoundCog, Check, ArrowDownRight, Blocks, SlidersHorizontal, CloudCog, ArrowUpRight, PackageCheck, Gamepad2, Package, Info, ExternalLink, Boxes, Zap, Monitor, Atom, Paintbrush, Server, Code, User, Shield, Search, ArrowRight, Gauge, Terminal, Crosshair, MessageCircleQuestion, Wrench, TableOfContents, ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
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
const RELEASES_URL = `${REPO_URL}/releases`;
const DL_MIRROR_PREFIX = "https://gh.269601.xyz/";
const RELEASE_DOWNLOAD_BASE = `${REPO_URL}/releases/latest/download`;
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
const paddings = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5"
};
function Card({
  children,
  hoverable = false,
  padding = "md",
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: clsx(
        "rounded-[var(--radius)] border border-border bg-bg-card",
        paddings[padding],
        hoverable && "transition-all duration-200 hover:border-border-highlight hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
        className
      ),
      ...props,
      children
    }
  );
}
function SectionHeader({
  label,
  title,
  description,
  align = "center",
  level = "h2",
  index
}) {
  const Tag = level;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: clsx(
        "flex flex-col gap-2.5",
        align === "center" ? "items-center text-center" : "items-start text-left"
      ),
      children: [
        (label || index) && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-mono text-xs tracking-wide text-accent uppercase", children: [
          index && /* @__PURE__ */ jsx("span", { className: "text-text-faint", children: index }),
          label && /* @__PURE__ */ jsx("span", { children: label })
        ] }),
        /* @__PURE__ */ jsx(Tag, { className: "font-display text-2xl font-bold leading-8 text-text sm:text-3xl sm:leading-9", children: title }),
        description && /* @__PURE__ */ jsx("p", { className: "max-w-[72ch] text-sm leading-6 text-text-muted sm:text-base", children: description })
      ]
    }
  );
}
const variantClasses = {
  default: { text: "text-text-faint", border: "border-border", bg: "bg-bg-raised" },
  accent: { text: "text-accent", border: "border-accent/20", bg: "bg-accent-bg" },
  green: { text: "text-green", border: "border-green/20", bg: "bg-green/10" },
  red: { text: "text-red", border: "border-red/20", bg: "bg-red/10" },
  teal: { text: "text-teal", border: "border-teal/20", bg: "bg-teal/10" }
};
function Badge({
  children,
  variant = "default",
  outline = false,
  className,
  ...props
}) {
  const v = variantClasses[variant];
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: clsx(
        "inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold",
        outline ? `${v.text} border ${v.border}` : `${v.text} ${v.bg}`,
        className
      ),
      ...props,
      children
    }
  );
}
const variants = {
  accent: "bg-accent text-bg hover:bg-accent-light hover:-translate-y-0.5 hover:shadow-accent-glow",
  ghost: "bg-transparent text-text-secondary border border-border-highlight hover:border-text-muted hover:text-text"
};
const sizes = {
  sm: "text-sm px-3.5 py-2",
  md: "text-base px-5 py-3",
  lg: "text-lg px-8 py-4"
};
function ButtonLink({
  to,
  variant = "accent",
  size = "md",
  className,
  children
}) {
  return /* @__PURE__ */ jsx(
    Link,
    {
      to,
      className: clsx(
        "inline-flex items-center justify-center gap-2.5 font-display font-semibold tracking-wide rounded-[6px] transition-all duration-200 cursor-pointer no-underline",
        variants[variant],
        sizes[size],
        className
      ),
      children
    }
  );
}
const LATEST_VERSION = "3.1.9";
const trace = [
  {
    step: "01",
    label: "GAME STATE",
    title: "CS2 载入 VCFG",
    detail: "bindings + archived ConVars",
    owner: "VALVE OWNED",
    icon: Cloud,
    tone: "teal"
  },
  {
    step: "02",
    label: "RUNTIME",
    title: "runtime/init.cfg",
    detail: "aliases · features · modes · helps",
    owner: "PROJECT",
    icon: FileCode2,
    tone: "accent"
  },
  {
    step: "03",
    label: "USER",
    title: "user/custom.cfg",
    detail: "Preset 起点 → 个人最终覆盖",
    owner: "YOU",
    icon: UserRoundCog,
    tone: "accent"
  }
];
function TerminalDemo() {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "overflow-hidden rounded-[18px] border border-border bg-[#0b0e14] shadow-[0_28px_90px_rgba(0,0,0,0.42)]",
      "aria-label": "SrP-CFG v3 启动执行轨迹",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border bg-bg-raised/70 px-4 py-3 sm:px-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsx("span", { className: "h-2 w-2 rounded-full bg-red/70" }),
            /* @__PURE__ */ jsx("span", { className: "h-2 w-2 rounded-full bg-accent-light/70" }),
            /* @__PURE__ */ jsx("span", { className: "h-2 w-2 rounded-full bg-green/70" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint", children: [
            "runtime_boot_trace / v",
            LATEST_VERSION
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between border-b border-dashed border-border pb-3 font-mono text-[11px] uppercase tracking-[0.13em] text-text-faint", children: [
            /* @__PURE__ */ jsx("span", { children: "Execution order" }),
            /* @__PURE__ */ jsx("span", { className: "text-green", children: "deterministic" })
          ] }),
          /* @__PURE__ */ jsx("ol", { className: "space-y-2.5", children: trace.map((item) => /* @__PURE__ */ jsxs(
            "li",
            {
              className: "grid grid-cols-[2rem_1fr] gap-3 rounded-[var(--radius)] border border-border bg-bg-card p-3.5 sm:grid-cols-[2rem_2.5rem_1fr_auto] sm:items-center sm:p-4",
              children: [
                /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-text-faint", children: item.step }),
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: [
                      "hidden h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border sm:flex",
                      item.tone === "teal" ? "border-teal/20 bg-teal/5 text-teal" : "border-accent/20 bg-accent-bg text-accent"
                    ].join(" "),
                    children: /* @__PURE__ */ jsx(item.icon, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsx("span", { className: "block font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint", children: item.label }),
                  /* @__PURE__ */ jsx("strong", { className: "mt-0.5 block font-display text-base font-semibold text-text", children: item.title }),
                  /* @__PURE__ */ jsx("span", { className: "mt-0.5 block break-words font-mono text-[11px] text-text-muted", children: item.detail })
                ] }),
                /* @__PURE__ */ jsx(
                  Badge,
                  {
                    variant: item.tone === "teal" ? "teal" : "default",
                    outline: true,
                    className: "col-start-2 mt-2 w-fit rounded-full px-2 py-1 uppercase tracking-[0.12em] sm:col-auto sm:mt-0",
                    children: item.owner
                  }
                )
              ]
            },
            item.step
          )) }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-[var(--radius)] border border-green/20 bg-green/5 px-4 py-3 font-mono text-xs text-green", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
            "Runtime → Preset? → User → VCFG may save result"
          ] }) })
        ] })
      ]
    }
  );
}
const stats = [
  { label: "Release model", value: "1 Runtime Core" },
  { label: "Source tree", value: "84 CFG" },
  { label: "Preset cases", value: "4 + Valve" },
  { label: "User surface", value: "1 custom.cfg" }
];
function Hero() {
  return /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden border-b border-border pt-16", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "tech-grid pointer-events-none absolute inset-0 opacity-70",
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1280px] grid-cols-1 items-center gap-12 px-5 py-20 sm:px-7 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20", children: [
      /* @__PURE__ */ jsxs("div", { className: "hero-reveal max-w-[760px]", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] text-text-muted", children: [
          /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/5 px-3 py-1.5 text-teal", children: [
            /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-teal", "aria-hidden": "true" }),
            "VCFG AWARE"
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            "SrP-CFG v",
            LATEST_VERSION
          ] })
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "font-display text-[clamp(3rem,7vw,6.5rem)] font-bold leading-[0.94] tracking-[-0.035em] text-text", children: [
          "功能留给",
          /* @__PURE__ */ jsx("br", {}),
          "Runtime，",
          /* @__PURE__ */ jsx("span", { className: "text-accent", children: "偏好留给你。" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-7 max-w-[650px] text-base leading-8 text-text-secondary sm:text-lg", children: [
          "SrP-CFG v3 是一套面向 CS2 的模块化配置运行时。一个 Runtime Core 注册 alias、Feature 与 Mode；一个",
          " ",
          /* @__PURE__ */ jsx("code", { className: "font-mono text-[0.9em] text-accent-light", children: "user/custom.cfg" }),
          " ",
          "决定 Preset 起点和你的最终覆盖。"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-9 flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxs(ButtonLink, { to: "/download", size: "lg", children: [
            /* @__PURE__ */ jsx(Download, { className: "h-5 w-5" }),
            "获取 v3"
          ] }),
          /* @__PURE__ */ jsxs(ButtonLink, { to: "/docs", variant: "ghost", size: "lg", children: [
            /* @__PURE__ */ jsx(BookOpen, { className: "h-5 w-5" }),
            "先理解架构"
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "#architecture",
            className: "mt-10 inline-flex min-h-11 items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-text-faint no-underline transition-colors hover:text-accent",
            children: [
              "查看执行边界",
              /* @__PURE__ */ jsx(ArrowDownRight, { className: "h-4 w-4" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "hero-reveal hero-reveal-delayed w-full min-w-0", children: /* @__PURE__ */ jsx(TerminalDemo, {}) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "relative border-t border-border bg-bg-card/55", children: /* @__PURE__ */ jsx("dl", { className: "mx-auto grid max-w-[1280px] grid-cols-2 gap-px bg-border sm:grid-cols-4", children: stats.map((stat) => /* @__PURE__ */ jsxs("div", { className: "bg-bg-card/90 px-5 py-5 sm:px-6 sm:py-6", children: [
      /* @__PURE__ */ jsx("dt", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint", children: stat.label }),
      /* @__PURE__ */ jsx("dd", { className: "mt-1 font-display text-xl font-bold text-text", children: stat.value })
    ] }, stat.label)) }) })
  ] });
}
const layers = [
  {
    index: "A",
    icon: Blocks,
    title: "Runtime Core",
    owner: "项目维护",
    desc: "永久注册 alias、Feature、Mode 与帮助入口，不在启动时偷改你的普通偏好。"
  },
  {
    index: "B",
    icon: SlidersHorizontal,
    title: "Preset 案例",
    owner: "按需调用",
    desc: "Default、Echo、YSZH、VisionL 是可审查的起点，不是四套独立发行包。"
  },
  {
    index: "C",
    icon: UserRoundCog,
    title: "User",
    owner: "当前用户",
    desc: "custom.cfg 是唯一个人窗口；Preset 之后的命令拥有最终覆盖权，并在更新时受保护。"
  },
  {
    index: "D",
    icon: CloudCog,
    title: "VCFG / Cloud",
    owner: "CS2 管理",
    desc: "游戏继续序列化最终绑定与 ConVar；安装器只读解析，不在背后覆盖 Valve 文件。"
  }
];
const features = ["crosshair-view", "autoview", "knife", "zeus"];
const modes = ["practice", "preview", "guidemake", "demo-hlae"];
function ModulePanel({
  eyebrow,
  title,
  countLabel,
  countTone,
  items
}) {
  return /* @__PURE__ */ jsxs(Card, { padding: "none", className: "p-6 sm:p-7", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-5 flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint", children: eyebrow }),
        /* @__PURE__ */ jsx("h3", { className: "mt-1 font-display text-xl font-bold", children: title })
      ] }),
      /* @__PURE__ */ jsx(
        "span",
        {
          className: countTone === "teal" ? "font-mono text-xs text-teal" : "font-mono text-xs text-accent",
          children: countLabel
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: items.map((item) => /* @__PURE__ */ jsx(
      "code",
      {
        className: "rounded-md border border-border bg-bg-raised px-3 py-2 font-mono text-xs text-text-secondary",
        children: item
      },
      item
    )) })
  ] });
}
function Features() {
  return /* @__PURE__ */ jsx("section", { id: "architecture", className: "home-section scroll-mt-24 border-b border-border py-20 sm:py-28 lg:py-32", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-[1280px] px-5 sm:px-7", children: [
    /* @__PURE__ */ jsx(
      SectionHeader,
      {
        index: "01",
        label: "Architecture",
        title: "不是一包偏好，而是一套边界明确的运行时",
        description: "v3 把“功能实现”“可选案例”“个人差异”和“游戏持久状态”拆开。每一层只有一个主人，也只有一种职责。",
        align: "left"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 xl:grid-cols-4", children: layers.map((layer) => /* @__PURE__ */ jsxs(
      "article",
      {
        className: "group relative min-h-[270px] border-b border-r border-border bg-bg-card/55 p-6 transition-colors duration-200 hover:bg-bg-hover sm:p-7",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-accent/20 bg-accent-bg text-accent", children: /* @__PURE__ */ jsx(layer.icon, { className: "h-5 w-5", strokeWidth: 1.8 }) }),
            /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-text-faint", children: layer.index })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "mt-8 font-display text-xl font-bold text-text", children: layer.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 font-mono text-[11px] uppercase tracking-[0.13em] text-accent", children: layer.owner }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm leading-7 text-text-secondary", children: layer.desc })
        ]
      },
      layer.index
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsx(
        ModulePanel,
        {
          eyebrow: "Always available",
          title: "Features",
          countLabel: "04 MODULES",
          countTone: "teal",
          items: features
        }
      ),
      /* @__PURE__ */ jsx(
        ModulePanel,
        {
          eyebrow: "Explicit workspace",
          title: "Modes",
          countLabel: "04 MODULES",
          countTone: "accent",
          items: modes
        }
      )
    ] })
  ] }) });
}
const quickStartImg = "/assets/desktop-quick-start-hpzHX44k.png";
const downloadImg = "/assets/desktop-download-Cf08xCwg.png";
const installImg = "/assets/desktop-install-BUHy8nrE.png";
const userConfigImg = "/assets/desktop-user-config-CFJms_Xe.png";
const recoveryCenterImg = "/assets/desktop-recovery-center-CCdP6YTZ.png";
const currentInstallationImg = "/assets/desktop-current-installation-C32H1cdF.png";
const aboutImg = "/assets/desktop-about-D3_01Nn0.png";
const toUrl = (m) => m;
const quickStartUrl = toUrl(quickStartImg);
const downloadUrl = toUrl(downloadImg);
const installUrl = toUrl(installImg);
const userConfigUrl = toUrl(userConfigImg);
const recoveryCenterUrl = toUrl(recoveryCenterImg);
const currentInstallationUrl = toUrl(currentInstallationImg);
const aboutUrl = toUrl(aboutImg);
const screenshots = [
  {
    src: quickStartUrl,
    index: "02",
    eyebrow: "Quick start",
    title: "先看懂流程，再开始部署",
    desc: "下载、检测、选择来源、确认目标与建立 custom.cfg，被拆成五个可以逐项核对的步骤。"
  },
  {
    src: downloadUrl,
    index: "03",
    eyebrow: "Download",
    title: "只需要一个 Runtime Core",
    desc: "功能、用户入口、Preset 案例与 Valve 重置基线进入同一个 v3 配置包。"
  },
  {
    src: installUrl,
    index: "04",
    eyebrow: "Install",
    title: "路径、账号与 VCFG 状态同屏确认",
    desc: "安装前先明确游戏 CFG、Annotations、Video 与账号本地配置的真实位置。"
  },
  {
    src: recoveryCenterUrl,
    index: "05",
    eyebrow: "Recovery",
    title: "恢复对象各归其位",
    desc: "上一个 Runtime、安装前原文件与只读 VCFG 快照分开呈现，用户配置始终受保护。"
  },
  {
    src: currentInstallationUrl,
    index: "06",
    eyebrow: "Managed files",
    title: "安装器只管理自己部署的文件",
    desc: "当前安装清单可审计、可分类移除，不把 custom.cfg 或游戏持有的 VCFG 混入其中。"
  },
  {
    src: aboutUrl,
    index: "07",
    eyebrow: "About",
    title: "项目边界与来源保持可追溯",
    desc: "官网、仓库、技术栈、维护者与许可证都能从应用内直接找到。"
  }
];
function Showcase() {
  return /* @__PURE__ */ jsx("section", { className: "home-section border-b border-border py-20 sm:py-28 lg:py-32", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-[1280px] px-5 sm:px-7", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-between gap-6 lg:flex-row lg:items-end", children: [
      /* @__PURE__ */ jsx(
        SectionHeader,
        {
          index: "02",
          label: "Desktop",
          title: "把复杂的配置边界，做成看得懂的界面",
          description: "Desktop 覆盖从下载、安装到个性化与恢复的完整路径。最重要的 Runtime、User 与 VCFG 三层关系，不再藏在目录和术语里。",
          align: "left"
        }
      ),
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/download",
          className: "mb-10 inline-flex min-h-11 shrink-0 items-center gap-2 font-display text-sm font-semibold text-text-muted no-underline transition-colors hover:text-accent sm:mb-14",
          children: [
            "获取 Desktop",
            /* @__PURE__ */ jsx(ArrowUpRight, { className: "h-4 w-4" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(
      Card,
      {
        padding: "none",
        className: "overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_21rem]",
        children: [
          /* @__PURE__ */ jsx("div", { className: "overflow-hidden border-b border-border bg-bg-raised lg:border-b-0 lg:border-r", children: /* @__PURE__ */ jsx(
            "img",
            {
              src: userConfigUrl,
              alt: "SrP-CFG Desktop 我的配置页面，展示 Runtime、custom.cfg 与 CS2 VCFG 的分层关系",
              loading: "lazy",
              decoding: "async",
              className: "block aspect-[16/9] h-full w-full object-cover object-top"
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-between p-6 sm:p-8 lg:p-9", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.14em]", children: [
                /* @__PURE__ */ jsx("span", { className: "text-accent", children: "01 / User configuration" }),
                /* @__PURE__ */ jsx("span", { className: "text-text-faint", children: "Core view" })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "mt-8 font-display text-2xl font-bold leading-tight text-text sm:text-3xl", children: "偏好只有一个入口" }),
              /* @__PURE__ */ jsxs("p", { className: "mt-4 text-sm leading-7 text-text-secondary", children: [
                "在“我的配置”里选择 Preset 起点，随后直接维护唯一的",
                " ",
                /* @__PURE__ */ jsx("code", { className: "font-mono text-[0.9em] text-accent-light", children: "user/custom.cfg" }),
                "。Runtime 注册功能，用户写最终覆盖，CS2 继续持有自己的状态。"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("dl", { className: "mt-8 grid grid-cols-3 gap-px border border-border bg-border font-mono text-[10px] uppercase tracking-[0.1em]", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-bg-raised px-3 py-3", children: [
                /* @__PURE__ */ jsx("dt", { className: "text-teal", children: "Runtime" }),
                /* @__PURE__ */ jsx("dd", { className: "mt-1 text-text-faint", children: "功能" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-bg-raised px-3 py-3", children: [
                /* @__PURE__ */ jsx("dt", { className: "text-accent", children: "User" }),
                /* @__PURE__ */ jsx("dd", { className: "mt-1 text-text-faint", children: "偏好" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-bg-raised px-3 py-3", children: [
                /* @__PURE__ */ jsx("dt", { className: "text-blue-400", children: "VCFG" }),
                /* @__PURE__ */ jsx("dd", { className: "mt-1 text-text-faint", children: "状态" })
              ] })
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", children: screenshots.map((item) => /* @__PURE__ */ jsxs(Card, { padding: "none", className: "overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "overflow-hidden border-b border-border bg-bg-raised", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: item.src,
          alt: `SrP-CFG Desktop ${item.title}`,
          loading: "lazy",
          decoding: "async",
          className: "block aspect-[16/9] w-full object-cover object-top"
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "p-5 sm:p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em]", children: [
          /* @__PURE__ */ jsx("span", { className: "text-accent", children: item.index }),
          /* @__PURE__ */ jsx("span", { className: "text-text-faint", children: item.eyebrow })
        ] }),
        /* @__PURE__ */ jsx("strong", { className: "mt-5 block font-display text-lg font-bold leading-snug text-text", children: item.title }),
        /* @__PURE__ */ jsx("span", { className: "mt-3 block text-sm leading-7 text-text-secondary", children: item.desc })
      ] })
    ] }, item.index)) })
  ] }) });
}
const steps = [
  {
    num: "01",
    icon: Download,
    title: "获取",
    command: "SrP-CFG_Runtime_Core.zip",
    desc: "下载唯一 Runtime Core，或通过 Desktop 在应用内获取。没有用户专属发行包需要选择。"
  },
  {
    num: "02",
    icon: PackageCheck,
    title: "部署",
    command: "game/csgo/cfg/",
    desc: "确认 Steam 账号和路径，默认把 Runtime 部署到游戏 CFG 目录；冲突原文件进入恢复中心。"
  },
  {
    num: "03",
    icon: UserRoundCog,
    title: "选择",
    command: "user/custom.cfg",
    desc: "保持 VCFG 托管，或选择一个 srp_apply_* 起点，再把自己的灵敏度、按键与偏好写在下面。"
  },
  {
    num: "04",
    icon: Gamepad2,
    title: "迭代",
    command: "srp_reload",
    desc: "游戏内继续调试；需要确定性持久化的差异写回 custom.cfg，需要纯基线时执行 srp_reset_valve。"
  }
];
function Steps() {
  return /* @__PURE__ */ jsx("section", { className: "home-section border-b border-border py-20 sm:py-28 lg:py-32", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-[1280px] px-5 sm:px-7", children: [
    /* @__PURE__ */ jsx(
      SectionHeader,
      {
        index: "03",
        label: "Workflow",
        title: "四步开始，每一步都能解释",
        description: "自动化不等于隐藏行为。v3 让安装、选择、覆盖和重置都有可检查的文件与命令。",
        align: "left"
      }
    ),
    /* @__PURE__ */ jsx("ol", { className: "grid grid-cols-1 border-l border-t border-border md:grid-cols-2 xl:grid-cols-4", children: steps.map((step) => /* @__PURE__ */ jsxs(
      "li",
      {
        className: "relative border-b border-r border-border bg-bg-card/45 p-6 sm:p-7",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-bg-raised text-text-muted", children: /* @__PURE__ */ jsx(step.icon, { className: "h-5 w-5", strokeWidth: 1.8 }) }),
            /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs text-text-faint", children: [
              step.num,
              " / 04"
            ] })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "mt-8 font-display text-2xl font-bold text-text", children: step.title }),
          /* @__PURE__ */ jsx("code", { className: "mt-3 block break-all font-mono text-xs text-accent-light", children: step.command }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm leading-7 text-text-secondary", children: step.desc })
        ]
      },
      step.num
    )) })
  ] }) });
}
function CTA() {
  return /* @__PURE__ */ jsx("section", { className: "home-section py-20 sm:py-28 lg:py-32", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-[1280px] px-5 sm:px-7", children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-[18px] border border-accent/25 bg-bg-card px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "tech-grid pointer-events-none absolute inset-0 opacity-40",
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 right-0 w-1 bg-accent", "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs("div", { className: "relative grid grid-cols-1 gap-10 lg:grid-cols-[1fr_auto] lg:items-end", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-mono text-xs uppercase tracking-[0.16em] text-accent", children: "Ready when you are" }),
        /* @__PURE__ */ jsxs("h2", { className: "mt-4 max-w-[780px] font-display text-[clamp(2.2rem,5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.025em]", children: [
          "先拥有能力，",
          /* @__PURE__ */ jsx("br", {}),
          "再决定偏好。"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-5 max-w-[650px] text-base leading-8 text-text-secondary", children: "下载一个 Runtime Core。只使用功能，或在同一个 custom.cfg 中建立属于你的确定性配置。" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 lg:max-w-[220px] lg:flex-col", children: [
        /* @__PURE__ */ jsxs(ButtonLink, { to: "/download", size: "lg", children: [
          /* @__PURE__ */ jsx(Download, { className: "h-5 w-5" }),
          "前往下载"
        ] }),
        /* @__PURE__ */ jsxs(ButtonLink, { to: "/docs/srpcfg-3", variant: "ghost", size: "lg", children: [
          /* @__PURE__ */ jsx(BookOpen, { className: "h-5 w-5" }),
          "使用指南"
        ] })
      ] })
    ] })
  ] }) }) });
}
const meta$4 = () => [{
  title: "SrP-CFG v3 — CS2 模块化 CFG Runtime"
}, {
  name: "description",
  content: "SrP-CFG v3：把 Runtime 功能、Preset 案例、用户配置与 CS2 VCFG 状态分层管理。"
}];
const home = UNSAFE_withComponentProps(function HomePage() {
  return /* @__PURE__ */ jsxs(Fragment, {
    children: [/* @__PURE__ */ jsx(Hero, {}), /* @__PURE__ */ jsx(Features, {}), /* @__PURE__ */ jsx(Showcase, {}), /* @__PURE__ */ jsx(Steps, {}), /* @__PURE__ */ jsx(CTA, {})]
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home,
  meta: meta$4
}, Symbol.toStringTag, { value: "Module" }));
const dl = (file) => `${DL_MIRROR_PREFIX}${RELEASE_DOWNLOAD_BASE}/${file}`;
const installers = [
  {
    name: "MSI 安装包",
    desc: "推荐方式。通过 Windows 安装向导安装到 Program Files，支持开始菜单和桌面快捷方式",
    file: "SrP-CFG_Installer.msi",
    url: dl("SrP-CFG_Installer.msi"),
    badge: "推荐"
  },
  {
    name: "便携版 (Portable)",
    desc: "解压即用，无需安装，适合 U 盘携带或多实例隔离场景",
    file: "SrP-CFG_Portable.zip",
    url: dl("SrP-CFG_Portable.zip"),
    badge: "Portable"
  }
];
const packages = [
  {
    name: "Runtime Core",
    file: "SrP-CFG_Runtime_Core.zip",
    url: dl("SrP-CFG_Runtime_Core.zip"),
    desc: "唯一配置包：Runtime + User + 内置 Preset 案例；在 custom.cfg 中选择起点并写入个人差异",
    badge: "推荐",
    featured: true
  }
];
const meta$3 = () => [{
  title: "下载 — SrP-CFG"
}, {
  name: "description",
  content: "下载 SrP-CFG 安装器和 v3 配置包"
}];
const cardLinkHover = "transition-[background-color,border-color,box-shadow,transform] duration-200 group-hover:-translate-y-0.5 group-hover:border-border-highlight group-hover:bg-bg-hover group-hover:shadow-[0_10px_32px_rgba(0,0,0,0.28)]";
const featuredCard = "rounded-[var(--radius)] border border-accent/20 bg-bg-card p-6 " + cardLinkHover;
const plainCard = "p-6 " + cardLinkHover;
const download = UNSAFE_withComponentProps(function DownloadPage() {
  return /* @__PURE__ */ jsx("section", {
    className: "pb-16 pt-28 sm:pb-20 sm:pt-32",
    children: /* @__PURE__ */ jsxs("div", {
      className: "mx-auto max-w-[1200px] px-5 sm:px-7",
      children: [/* @__PURE__ */ jsx(SectionHeader, {
        level: "h1",
        label: "Download",
        title: "下载中心",
        description: "获取 Desktop 安装器与唯一 Runtime Core。所有 v3 功能、Preset 案例和用户入口都在同一个配置包中。"
      }), /* @__PURE__ */ jsxs("div", {
        className: "mb-20",
        children: [/* @__PURE__ */ jsxs("h2", {
          className: "mb-8 flex items-center gap-3 font-display text-2xl font-semibold",
          children: [/* @__PURE__ */ jsx(Download, {
            className: "h-6 w-6 text-accent"
          }), "安装器"]
        }), /* @__PURE__ */ jsx("div", {
          className: "grid grid-cols-1 gap-6 md:grid-cols-2",
          children: installers.map((item) => /* @__PURE__ */ jsx("a", {
            href: item.url,
            target: "_blank",
            rel: "noopener",
            className: "group block no-underline",
            children: /* @__PURE__ */ jsxs(Card, {
              padding: "none",
              className: `p-8 ${cardLinkHover}`,
              children: [/* @__PURE__ */ jsxs("div", {
                className: "mb-4 flex items-start justify-between",
                children: [/* @__PURE__ */ jsxs("div", {
                  children: [/* @__PURE__ */ jsx("h3", {
                    className: "mb-1 font-display text-xl font-semibold transition-colors group-hover:text-accent",
                    children: item.name
                  }), /* @__PURE__ */ jsx("span", {
                    className: "font-mono text-sm text-text-faint",
                    children: item.file
                  })]
                }), /* @__PURE__ */ jsx(Badge, {
                  variant: "accent",
                  className: "rounded-[4px] border border-[rgba(232,121,12,0.12)] px-3 py-1 text-xs tracking-wider",
                  children: item.badge
                })]
              }), /* @__PURE__ */ jsx("p", {
                className: "mb-6 text-sm leading-7 text-text-secondary",
                children: item.desc
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-2 font-display text-sm font-semibold text-accent",
                children: [/* @__PURE__ */ jsx(Download, {
                  className: "h-4 w-4"
                }), "点击下载"]
              })]
            })
          }, item.file))
        })]
      }), /* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsxs("h2", {
          className: "mb-8 flex items-center gap-3 font-display text-2xl font-semibold",
          children: [/* @__PURE__ */ jsx(Package, {
            className: "h-6 w-6 text-teal"
          }), "v3 配置包"]
        }), /* @__PURE__ */ jsxs("div", {
          className: "mb-6 rounded-[8px] border border-[rgba(232,121,12,0.18)] bg-accent-bg p-4 text-sm leading-[1.75] text-text-secondary",
          children: ["现在只发行 Runtime Core。安装后在", " ", /* @__PURE__ */ jsx("code", {
            className: "font-mono text-[0.9em] text-accent-light",
            children: "user/custom.cfg"
          }), " ", "中启用一个", /* @__PURE__ */ jsx("code", {
            className: "font-mono text-[0.9em] text-accent-light",
            children: "srp_apply_*"
          }), " ", "作为起点，再把个人差异写在下面；也可以完全交给 VCFG。"]
        }), /* @__PURE__ */ jsx("div", {
          className: "grid grid-cols-1 gap-5",
          children: packages.map((pkg) => /* @__PURE__ */ jsx("a", {
            href: pkg.url,
            target: "_blank",
            rel: "noopener",
            className: "group block no-underline",
            children: /* @__PURE__ */ jsx("div", {
              className: pkg.featured ? featuredCard : void 0,
              children: /* @__PURE__ */ jsxs(Card, {
                padding: "none",
                className: pkg.featured ? void 0 : plainCard,
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "mb-3 flex items-center gap-3",
                  children: [/* @__PURE__ */ jsx("div", {
                    className: pkg.featured ? "flex h-10 w-10 items-center justify-center rounded-[6px] border border-[rgba(232,121,12,0.12)] bg-accent-bg" : "flex h-10 w-10 items-center justify-center rounded-[6px] border border-border bg-bg-raised",
                    children: /* @__PURE__ */ jsx(Download, {
                      className: pkg.featured ? "h-[18px] w-[18px] text-accent" : "h-[18px] w-[18px] text-text-muted",
                      strokeWidth: 1.8
                    })
                  }), pkg.featured ? /* @__PURE__ */ jsx("span", {
                    className: "rounded bg-accent px-2 py-1 font-mono text-xs font-bold tracking-wide text-bg",
                    children: pkg.badge
                  }) : /* @__PURE__ */ jsx(Badge, {
                    variant: "default",
                    outline: true,
                    className: "bg-bg-raised px-2 py-1 text-xs font-bold tracking-wide",
                    children: pkg.badge
                  })]
                }), /* @__PURE__ */ jsx("h3", {
                  className: "mb-1.5 font-display text-lg font-semibold transition-colors group-hover:text-accent",
                  children: pkg.name
                }), /* @__PURE__ */ jsx("p", {
                  className: "mb-4 text-sm leading-7 text-text-secondary",
                  children: pkg.desc
                }), /* @__PURE__ */ jsx("span", {
                  className: "font-mono text-xs text-text-faint",
                  children: pkg.file
                })]
              })
            })
          }, pkg.file))
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        padding: "none",
        className: "mt-12 flex gap-4 p-6",
        children: [/* @__PURE__ */ jsx("div", {
          className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-[rgba(232,121,12,0.12)] bg-accent-bg",
          children: /* @__PURE__ */ jsx(Info, {
            className: "h-[18px] w-[18px] text-accent",
            strokeWidth: 1.8
          })
        }), /* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("h2", {
            className: "mb-1 font-display text-base font-semibold",
            children: "使用说明"
          }), /* @__PURE__ */ jsxs("p", {
            className: "text-sm leading-7 text-text-secondary",
            children: ["下载安装器后双击运行，将配置包（ZIP）直接拖入窗口即可自动完成安装。所有文件也可在", " ", /* @__PURE__ */ jsx("a", {
              href: RELEASES_URL,
              target: "_blank",
              rel: "noopener",
              className: "text-accent hover:underline",
              children: "GitHub Releases"
            }), " ", "找到。"]
          })]
        })]
      })]
    })
  });
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: download,
  meta: meta$3
}, Symbol.toStringTag, { value: "Module" }));
const blogSvg = '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 640 640"><path d="M288 88C288 74.7 298.7 64 312 64C457.8 64 576 182.2 576 328C576 341.3 565.3 352 552 352C538.7 352 528 341.3 528 328C528 208.7 431.3 112 312 112C298.7 112 288 101.3 288 88zM144 160C170.5 160 192 181.5 192 208L192 432C192 458.5 213.5 480 240 480C266.5 480 288 458.5 288 432C288 405.5 266.5 384 240 384C231.2 384 224 376.8 224 368L224 304C224 295.2 231.2 288 240 288C319.5 288 384 352.5 384 432C384 511.5 319.5 576 240 576C160.5 576 96 511.5 96 432L96 208C96 181.5 117.5 160 144 160zM312 160C404.8 160 480 235.2 480 328C480 341.3 469.3 352 456 352C442.7 352 432 341.3 432 328C432 261.7 378.3 208 312 208C298.7 208 288 197.3 288 184C288 170.7 298.7 160 312 160z"/></svg>';
const bilibiliSvg = '<svg fill="currentColor" fill-rule="evenodd" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>bilibili</title><path clip-rule="evenodd" d="M4.977 3.561a1.31 1.31 0 111.818-1.884l2.828 2.728c.08.078.149.163.205.254h4.277a1.32 1.32 0 01.205-.254l2.828-2.728a1.31 1.31 0 011.818 1.884L17.82 4.66h.848A5.333 5.333 0 0124 9.992v7.34a5.333 5.333 0 01-5.333 5.334H5.333A5.333 5.333 0 010 17.333V9.992a5.333 5.333 0 015.333-5.333h.781L4.977 3.56zm.356 3.67a2.667 2.667 0 00-2.666 2.667v7.529a2.667 2.667 0 002.666 2.666h13.334a2.667 2.667 0 002.666-2.666v-7.53a2.667 2.667 0 00-2.666-2.666H5.333zm1.334 5.192a1.333 1.333 0 112.666 0v1.192a1.333 1.333 0 11-2.666 0v-1.192zM16 11.09c-.736 0-1.333.597-1.333 1.333v1.192a1.333 1.333 0 102.666 0v-1.192c0-.736-.597-1.333-1.333-1.333z"></path></svg>';
const githubSvg = '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 640 640"><path d="M237.9 461.4C237.9 463.4 235.6 465 232.7 465C229.4 465.3 227.1 463.7 227.1 461.4C227.1 459.4 229.4 457.8 232.3 457.8C235.3 457.5 237.9 459.1 237.9 461.4zM206.8 456.9C206.1 458.9 208.1 461.2 211.1 461.8C213.7 462.8 216.7 461.8 217.3 459.8C217.9 457.8 216 455.5 213 454.6C210.4 453.9 207.5 454.9 206.8 456.9zM251 455.2C248.1 455.9 246.1 457.8 246.4 460.1C246.7 462.1 249.3 463.4 252.3 462.7C255.2 462 257.2 460.1 256.9 458.1C256.6 456.2 253.9 454.9 251 455.2zM316.8 72C178.1 72 72 177.3 72 316C72 426.9 141.8 521.8 241.5 555.2C254.3 557.5 258.8 549.6 258.8 543.1C258.8 536.9 258.5 502.7 258.5 481.7C258.5 481.7 188.5 496.7 173.8 451.9C173.8 451.9 162.4 422.8 146 415.3C146 415.3 123.1 399.6 147.6 399.9C147.6 399.9 172.5 401.9 186.2 425.7C208.1 464.3 244.8 453.2 259.1 446.6C261.4 430.6 267.9 419.5 275.1 412.9C219.2 406.7 162.8 398.6 162.8 302.4C162.8 274.9 170.4 261.1 186.4 243.5C183.8 237 175.3 210.2 189 175.6C209.9 169.1 258 202.6 258 202.6C278 197 299.5 194.1 320.8 194.1C342.1 194.1 363.6 197 383.6 202.6C383.6 202.6 431.7 169 452.6 175.6C466.3 210.3 457.8 237 455.2 243.5C471.2 261.2 481 275 481 302.4C481 398.9 422.1 406.6 366.2 412.9C375.4 420.8 383.2 435.8 383.2 459.3C383.2 493 382.9 534.7 382.9 542.9C382.9 549.4 387.5 557.3 400.2 555C500.2 521.8 568 426.9 568 316C568 177.3 455.5 72 316.8 72zM169.2 416.9C167.9 417.9 168.2 420.2 169.9 422.1C171.5 423.7 173.8 424.4 175.1 423.1C176.4 422.1 176.1 419.8 174.4 417.9C172.8 416.3 170.5 415.6 169.2 416.9zM158.4 408.8C157.7 410.1 158.7 411.7 160.7 412.7C162.3 413.7 164.3 413.4 165 412C165.7 410.7 164.7 409.1 162.7 408.1C160.7 407.5 159.1 407.8 158.4 408.8zM190.8 444.4C189.2 445.7 189.8 448.7 192.1 450.6C194.4 452.9 197.3 453.2 198.6 451.6C199.9 450.3 199.3 447.3 197.3 445.4C195.1 443.1 192.1 442.8 190.8 444.4zM179.4 429.7C177.8 430.7 177.8 433.3 179.4 435.6C181 437.9 183.7 438.9 185 437.9C186.6 436.6 186.6 434 185 431.7C183.6 429.4 181 428.4 179.4 429.7z"/></svg>';
const meta$2 = () => [{
  title: "关于 — SrP-CFG"
}, {
  name: "description",
  content: "SrP-CFG 项目介绍与开源信息"
}];
const techStack = [{
  name: "Astro",
  desc: "静态站点生成框架",
  icon: Zap
}, {
  name: "Electron",
  desc: "桌面应用框架",
  icon: Monitor
}, {
  name: "React",
  desc: "共享 UI 组件库",
  icon: Atom
}, {
  name: "TailwindCSS",
  desc: "原子化 CSS 框架",
  icon: Paintbrush
}, {
  name: "Node.js",
  desc: "运行时环境",
  icon: Server
}, {
  name: "TypeScript",
  desc: "类型安全的开发语言",
  icon: Code
}];
const links = [{
  label: "GitHub 仓库",
  url: REPO_URL,
  icon: Github
}, {
  label: "GitHub Release",
  url: RELEASES_URL,
  icon: Github
}, {
  label: "SrP-CFG 视频系列",
  url: "https://space.bilibili.com/422744280/lists/6770542",
  icon: ExternalLink
}, {
  label: "关于 CFG 你要了解的二三事",
  url: "https://blog.srprolin.top/posts/srp-cfg/",
  icon: ExternalLink
}];
const contributors = [{
  name: "RoL1n",
  role: "开发维护",
  github: "RolinShmily",
  blog: "https://blog.srprolin.top",
  bilibili: "https://space.bilibili.com/422744280"
}];
const cardHover = "transition-colors duration-200 group-hover:border-border-highlight group-hover:bg-bg-hover";
const about = UNSAFE_withComponentProps(function AboutPage() {
  return /* @__PURE__ */ jsx("section", {
    className: "pb-16 pt-28 sm:pb-20 sm:pt-32",
    children: /* @__PURE__ */ jsxs("div", {
      className: "mx-auto max-w-[1200px] px-5 sm:px-7",
      children: [/* @__PURE__ */ jsx("div", {
        className: "mb-10 flex justify-center",
        children: /* @__PURE__ */ jsx("img", {
          src: "/favicon.ico",
          alt: "SrP-CFG Logo",
          width: "112",
          height: "112",
          className: "h-28 w-28 rounded-2xl border border-border shadow-[0_0_40px_rgba(242,138,26,0.14)]"
        })
      }), /* @__PURE__ */ jsx(SectionHeader, {
        level: "h1",
        label: "About",
        title: "关于 SrP-CFG",
        description: "面向 CS2 的模块化 CFG Runtime、Preset 案例与用户配置系统，由 RoL1n 开发维护"
      }), /* @__PURE__ */ jsxs("div", {
        className: "mx-auto grid max-w-[1000px] grid-cols-1 gap-16 lg:grid-cols-[1fr_1fr]",
        children: [/* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("h2", {
            className: "mb-6 font-display text-2xl font-semibold",
            children: "项目简介"
          }), /* @__PURE__ */ jsxs("div", {
            className: "mb-10 space-y-4 leading-8 text-text-secondary",
            children: [/* @__PURE__ */ jsx("p", {
              children: "SrP-CFG v3 是一套把功能模板、Preset 案例和用户配置分离的 CS2 CFG 系统。Runtime 提供准星视角、跑图练习、Demo 录制等能力，内置案例提供可选推荐值，用户层保存个人差异。"
            }), /* @__PURE__ */ jsxs("p", {
              children: ["根目录只保留", " ", /* @__PURE__ */ jsx("code", {
                className: "rounded bg-bg-raised px-1.5 py-0.5 font-mono text-sm text-accent-light",
                children: "autoexec.cfg"
              }), " ", "启动引导，所有 Runtime、Preset、Feature 与 Mode 统一位于", " ", /* @__PURE__ */ jsx("code", {
                className: "rounded bg-bg-raised px-1.5 py-0.5 font-mono text-sm text-accent-light",
                children: "srp-cfg/"
              }), "；用户只需要编辑最后加载的", " ", /* @__PURE__ */ jsx("code", {
                className: "rounded bg-bg-raised px-1.5 py-0.5 font-mono text-sm text-accent-light",
                children: "srp-cfg/user/custom.cfg"
              }), "。"]
            })]
          }), /* @__PURE__ */ jsx("h2", {
            className: "mb-6 font-display text-2xl font-semibold",
            children: "快速链接"
          }), /* @__PURE__ */ jsx("div", {
            className: "space-y-3",
            children: links.map((link) => {
              const Icon = link.icon;
              return /* @__PURE__ */ jsx("a", {
                href: link.url,
                target: "_blank",
                rel: "noopener",
                className: "group block no-underline",
                children: /* @__PURE__ */ jsxs(Card, {
                  padding: "none",
                  className: `flex min-h-14 items-center gap-3 p-4 ${cardHover}`,
                  children: [/* @__PURE__ */ jsx("div", {
                    className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-[rgba(232,121,12,0.12)] bg-accent-bg text-accent",
                    children: /* @__PURE__ */ jsx(Icon, {
                      className: "h-4 w-4"
                    })
                  }), /* @__PURE__ */ jsx("span", {
                    className: "font-display text-sm font-medium text-text-secondary transition-colors group-hover:text-accent",
                    children: link.label
                  })]
                })
              }, link.label);
            })
          })]
        }), /* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsxs("h2", {
            className: "mb-6 flex items-center gap-3 font-display text-2xl font-semibold",
            children: [/* @__PURE__ */ jsx(Boxes, {
              className: "h-6 w-6 text-teal"
            }), "技术栈"]
          }), /* @__PURE__ */ jsx("div", {
            className: "mb-12 grid grid-cols-2 gap-3",
            children: techStack.map((tech) => {
              const Icon = tech.icon;
              return /* @__PURE__ */ jsxs(Card, {
                padding: "none",
                className: "p-4",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "mb-1 flex items-center gap-2",
                  children: [/* @__PURE__ */ jsx(Icon, {
                    className: "h-4 w-4 text-text-muted"
                  }), /* @__PURE__ */ jsx("div", {
                    className: "font-display text-base font-semibold text-text",
                    children: tech.name
                  })]
                }), /* @__PURE__ */ jsx("div", {
                  className: "text-xs text-text-muted",
                  children: tech.desc
                })]
              }, tech.name);
            })
          }), /* @__PURE__ */ jsxs("h2", {
            className: "mb-6 flex items-center gap-3 font-display text-2xl font-semibold",
            children: [/* @__PURE__ */ jsx(User, {
              className: "h-6 w-6 text-accent"
            }), "贡献者"]
          }), /* @__PURE__ */ jsx("div", {
            className: "space-y-3",
            children: contributors.map((c) => /* @__PURE__ */ jsxs(Card, {
              padding: "none",
              className: "flex flex-wrap items-center gap-4 p-4",
              children: [/* @__PURE__ */ jsx("img", {
                src: "/avatar.jpg",
                alt: c.name,
                width: "48",
                height: "48",
                loading: "lazy",
                className: "h-12 w-12 rounded-full border border-[rgba(232,121,12,0.12)] object-cover"
              }), /* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("div", {
                  className: "font-display text-base font-semibold",
                  children: c.name
                }), /* @__PURE__ */ jsx("div", {
                  className: "text-xs text-text-muted",
                  children: c.role
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "ml-auto flex flex-wrap items-center justify-end gap-2",
                children: [/* @__PURE__ */ jsxs("a", {
                  href: c.blog,
                  target: "_blank",
                  rel: "noopener",
                  className: "flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-bg-raised px-3 text-xs text-text-muted no-underline transition-colors hover:border-accent/30 hover:text-accent",
                  children: [/* @__PURE__ */ jsx("span", {
                    className: "h-3.5 w-3.5 text-text-muted",
                    dangerouslySetInnerHTML: {
                      __html: blogSvg
                    }
                  }), /* @__PURE__ */ jsx("span", {
                    children: "博客"
                  })]
                }), /* @__PURE__ */ jsxs("a", {
                  href: c.bilibili,
                  target: "_blank",
                  rel: "noopener",
                  className: "flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-bg-raised px-3 text-xs text-text-muted no-underline transition-colors hover:border-accent/30 hover:text-accent",
                  children: [/* @__PURE__ */ jsx("span", {
                    className: "h-3.5 w-3.5 text-text-muted",
                    dangerouslySetInnerHTML: {
                      __html: bilibiliSvg
                    }
                  }), /* @__PURE__ */ jsx("span", {
                    children: "B站"
                  })]
                }), /* @__PURE__ */ jsxs("a", {
                  href: `https://github.com/${c.github}`,
                  target: "_blank",
                  rel: "noopener",
                  className: "flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-bg-raised px-3 text-xs text-text-muted no-underline transition-colors hover:border-accent/30 hover:text-accent",
                  children: [/* @__PURE__ */ jsx("span", {
                    className: "h-3.5 w-3.5 text-text-muted",
                    dangerouslySetInnerHTML: {
                      __html: githubSvg
                    }
                  }), /* @__PURE__ */ jsx("span", {
                    children: "GitHub"
                  })]
                })]
              })]
            }, c.github))
          }), /* @__PURE__ */ jsxs(Card, {
            padding: "none",
            className: "mt-8 flex items-center gap-4 p-5",
            children: [/* @__PURE__ */ jsx(Shield, {
              className: "h-5 w-5 text-text-muted",
              strokeWidth: 1.8
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("div", {
                className: "font-display text-sm font-semibold",
                children: "开源许可"
              }), /* @__PURE__ */ jsx("div", {
                className: "text-xs text-text-muted",
                children: "本仓库代码以自定义许可证发布，详见仓库根目录 LICENSE 文件"
              })]
            })]
          })]
        })]
      })]
    })
  });
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: about,
  meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
const docsJson = /* @__PURE__ */ JSON.parse(`[{"title":"annotations 地图道具指南","description":"在 CS2 小地图上显示投掷物站位与瞄准标记，覆盖 4 张竞技地图","slug":"annotations","content":"<blockquote>\\n<p>模块目录：<code>config/annotations/</code></p>\\n</blockquote>\\n<h2 id=\\"简介\\">简介</h2>\\n<p>annotations 利用 CS2 的 kv3 地图标注系统，在游戏内小地图（雷达 / Tab 地图）上叠加显示投掷物道具指南。每个标注点包含站位、瞄准方向、投掷方式（左键/跳投/双键）、投掷物类型（烟/闪/火/雷）等信息。</p>\\n<p>内置 4 张竞技地图的完整道具指南：</p>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">地图</th><th align=\\"left\\">指南文件</th><th align=\\"left\\">标注节点数</th></tr></thead><tbody><tr><td align=\\"left\\">Dust II</td><td align=\\"left\\"><code>SrP-Dust2-Guide.txt</code></td><td align=\\"left\\">~30+</td></tr><tr><td align=\\"left\\">Inferno</td><td align=\\"left\\"><code>SrP-Inferno-Guide.txt</code></td><td align=\\"left\\">~40+</td></tr><tr><td align=\\"left\\">Mirage</td><td align=\\"left\\"><code>SrP-Mirage-Guide.txt</code></td><td align=\\"left\\">~50+</td></tr><tr><td align=\\"left\\">Ancient</td><td align=\\"left\\"><code>SrP-Ancient-Guide.txt</code></td><td align=\\"left\\">~30+</td></tr></tbody></table>\\n<h2 id=\\"安装位置\\">安装位置</h2>\\n<p>安装器会将注解文件部署到 CS2 的 <code>annotations/local/</code> 目录下：</p>\\n<pre><code>csgo/\\n└── annotations/\\n    └── local/\\n        ├── SrP-Dust2-Guide.txt\\n        ├── SrP-Inferno-Guide.txt\\n        ├── SrP-Mirage-Guide.txt\\n        └── SrP-Ancient-Guide.txt\\n</code></pre>\\n<h2 id=\\"使用方法\\">使用方法</h2>\\n<ol>\\n<li>在桌面端安装器中勾选 annotations 类别，或手动将指南 <code>.txt</code> 文件复制到 <code>csgo/annotations/local/</code></li>\\n<li>启动 CS2 并进入对应地图</li>\\n<li>打开游戏内小地图（默认 <code>Tab</code> 键或雷达）</li>\\n<li>地图上将显示编号的投掷物标注点，每个节点包含：\\n<ul>\\n<li><strong>主节点</strong>（空心圆）：投掷站位，显示编号</li>\\n<li><strong>瞄准目标点</strong>（准星标记）：瞄准位置与投掷说明</li>\\n<li><strong>落地标记</strong>（方形）：投掷物落点（部分道具）</li>\\n</ul>\\n</li>\\n</ol>\\n<h2 id=\\"标注点示例\\">标注点示例</h2>\\n<p>以 Dust II 为例，标注覆盖 A 大、中门、B 区等关键区域：</p>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">编号</th><th align=\\"left\\">位置</th><th align=\\"left\\">道具</th><th align=\\"left\\">投掷方式</th></tr></thead><tbody><tr><td align=\\"left\\">1</td><td align=\\"left\\">A大</td><td align=\\"left\\">闪光弹</td><td align=\\"left\\">左键跳投</td></tr><tr><td align=\\"left\\">2</td><td align=\\"left\\">中门</td><td align=\\"left\\">满封烟</td><td align=\\"left\\">左键投掷</td></tr><tr><td align=\\"left\\">3</td><td align=\\"left\\">A大</td><td align=\\"left\\">辅助闪光</td><td align=\\"left\\">左键跳投</td></tr><tr><td align=\\"left\\">4</td><td align=\\"left\\">中门</td><td align=\\"left\\">满封烟</td><td align=\\"left\\">左键投掷</td></tr><tr><td align=\\"left\\">5</td><td align=\\"left\\">B1层</td><td align=\\"left\\">烟</td><td align=\\"left\\">左键跳投</td></tr><tr><td align=\\"left\\">6</td><td align=\\"left\\">中门近点</td><td align=\\"left\\">烟</td><td align=\\"left\\">双键跳投</td></tr><tr><td align=\\"left\\">7</td><td align=\\"left\\">中门</td><td align=\\"left\\">过点烟</td><td align=\\"left\\">左键跳投</td></tr></tbody></table>\\n<p>所有投掷方式统一为中文标注：<strong>左键投掷</strong>、<strong>左键跳投</strong>、<strong>双键跳投</strong>、<strong>蹲下投掷</strong>。</p>\\n<h2 id=\\"相关文件\\">相关文件</h2>\\n<ul>\\n<li><a href=\\"/docs/autoexec\\">autoexec.cfg</a> — v3 启动引导</li>\\n<li><a href=\\"/docs/guidemake\\">guidemake 功能</a> — 在地图中自定义定位标注点</li>\\n</ul>\\n<h2 id=\\"注意事项\\">注意事项</h2>\\n<ul>\\n<li>annotations 文件格式为 CS2 kv3，必须放置在 <code>csgo/annotations/local/</code> 目录下才能被游戏读取</li>\\n<li>每个 <code>.txt</code> 文件对应一张地图，文件名前缀需与 <code>MapName</code> 字段关联</li>\\n<li>标注点仅在自建房或离线模式中可用，不影响官匹与完美平台</li>\\n<li>如需创建自己的地图指南，可使用 <code>guidemake</code> 功能配合游戏内控制台定位坐标，再写入 kv3 文件</li>\\n</ul>","toc":[{"title":"简介","url":"#简介","items":[]},{"title":"安装位置","url":"#安装位置","items":[]},{"title":"使用方法","url":"#使用方法","items":[]},{"title":"标注点示例","url":"#标注点示例","items":[]},{"title":"相关文件","url":"#相关文件","items":[]},{"title":"注意事项","url":"#注意事项","items":[]}]},{"title":"autoexec.cfg","description":"v3 的 Runtime、User、内置 Preset 与重载顺序","slug":"autoexec","content":"<p>v3 的 <code>autoexec.cfg</code> 只建立稳定的两步顺序：</p>\\n<pre><code class=\\"language-text\\">exec srp-cfg/runtime/init.cfg\\nexecifexists srp-cfg/user/custom.cfg\\n</code></pre>\\n<h2 id=\\"第一步runtime\\">第一步：Runtime</h2>\\n<p><code>runtime/init.cfg</code> 注册公共命令、公共 alias 与每个模块的 <code>runtime.cfg</code>。这些文件只建立能力，不主动应用个人偏好或普通实体键位。</p>\\n<p>因此，即使 VCFG 把 <code>P → srp_practice_keys</code>、<code>7 → keyc</code> 或其他 alias 命令同步到新机器，只要 Runtime 已安装，对应实现就会在启动时重新注册。</p>\\n<h2 id=\\"第二步user\\">第二步：User</h2>\\n<p><code>user/custom.cfg</code> 是普通用户唯一需要编辑的启动配置。它可以只写个人差异，也可以先调用一个内置 Preset：</p>\\n<pre><code class=\\"language-text\\">srp_apply_yszh\\n\\n// 位于 Preset 后面的命令拥有最终覆盖权\\nsensitivity 0.95\\nc06\\ncyan\\nbind \\"mouse5\\" \\"+voicerecord\\"\\n</code></pre>\\n<p>四个起点命令是：</p>\\n<pre><code class=\\"language-text\\">srp_apply_default\\nsrp_apply_echo\\nsrp_apply_yszh\\nsrp_apply_visionl\\n</code></pre>\\n<p>它们由 Runtime 预先注册，分别单向执行 <code>presets/&#x3C;name>/apply.cfg</code>。Preset 不会再次执行 <code>custom.cfg</code>，否则把命令写入 User 会形成递归。</p>\\n<h2 id=\\"两种用户模式\\">两种用户模式</h2>\\n<h3 id=\\"不启用-preset\\">不启用 Preset</h3>\\n<p>Runtime 只注册功能。灵敏度、准星、HUD、声音和普通键位可继续在游戏内修改，由 CS2 的 VCFG / Steam Cloud 管理。</p>\\n<h3 id=\\"启用一个-preset\\">启用一个 Preset</h3>\\n<p>每次启动先应用确定的案例起点，再继续执行同一个 <code>custom.cfg</code> 中的个人差异。若在游戏菜单里修改了 Preset 涉及的字段，下次启动会被起点重放；想长期保留，应把最终值写在 Preset 命令之后，或停用该 Preset。</p>\\n<p>这两种模式都来自同一个 <code>SrP-CFG_Runtime_Core.zip</code>。v3 没有独立 Presets 包，也没有 <code>startup.cfg</code>。</p>\\n<h2 id=\\"为什么控制台执行-srp_apply_-不会自动补上-user\\">为什么控制台执行 srp_apply_* 不会自动补上 User</h2>\\n<p>在 <code>custom.cfg</code> 中执行时，文件后续行本来就会继续运行，个人覆盖自然生效。在控制台单独执行时，<code>srp_apply_*</code> 只立即应用对应案例，不会自动重放 User。</p>\\n<p>需要重新应用完整正常配置时，执行：</p>\\n<pre><code class=\\"language-text\\">srp_reload\\n</code></pre>\\n<p>它等价于重新执行 <code>autoexec.cfg</code>，顺序仍是 Runtime → User，并由 User 内部决定是否应用 Preset。</p>\\n<h2 id=\\"valve-重置命令\\">Valve 重置命令</h2>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">命令</th><th align=\\"left\\">行为</th></tr></thead><tbody><tr><td align=\\"left\\"><code>srp_reset_valve</code></td><td align=\\"left\\">Valve 偏好基线 + 游戏默认键位，不重放 User</td></tr><tr><td align=\\"left\\"><code>srp_reset_valve_settings</code></td><td align=\\"left\\">只恢复 SrP 涉及的偏好与会话字段</td></tr><tr><td align=\\"left\\"><code>srp_reset_valve_keys</code></td><td align=\\"left\\">只调用游戏自带的 <code>binddefaults</code></td></tr><tr><td align=\\"left\\"><code>srp_reset_valve_user</code></td><td align=\\"left\\">Valve 基线后立即执行 User</td></tr></tbody></table>\\n<p>纯基线测试结束后执行 <code>srp_reload</code>，即可返回 Runtime → User 的正常链。若 User 中启用了 Preset，它也会随之重新应用。</p>\\n<h2 id=\\"功能与按键入口\\">功能与按键入口</h2>\\n<p>普通命令只应用模块设置；带 <code>_keys</code> 的命令才安装实体键位：</p>\\n<pre><code class=\\"language-text\\">srp_crosshair_view / srp_crosshair_view_keys\\nsrp_autoview       / srp_autoview_keys\\nsrp_zeus           / srp_zeus_keys\\nsrp_practice       / srp_practice_keys\\nsrp_preview        / srp_preview_keys\\nsrp_guidemake      / srp_guidemake_keys\\nsrp_demo           / srp_demo_keys\\n</code></pre>\\n<p><code>srp_knife</code> 没有默认实体键位，只注册并刷新数字模型命令。输入 <code>srp_help</code> 可查看全部帮助主题。</p>\\n<h2 id=\\"与-vcfg-的先后关系\\">与 VCFG 的先后关系</h2>\\n<p>一次常见启动可概括为：</p>\\n<pre><code class=\\"language-text\\">CS2 载入账号 VCFG\\n→ Runtime 注册功能\\n→ User 可选地应用 Preset\\n→ User 后续行覆盖\\n→ CS2 之后可能保存最终状态\\n</code></pre>\\n<p>所以把 CFG 放进游戏目录并不会隔离 VCFG。是否每次重放偏好，不由发行包决定，而由当前用户是否在 <code>custom.cfg</code> 中启用 <code>srp_apply_*</code> 决定。</p>\\n<h2 id=\\"已删除的选择层\\">已删除的选择层</h2>\\n<p>v2 的 <code>selectors/</code> 和 <code>generated/active-profile.cfg</code> 用于构建不同用户包；v3 早期草案中的 <code>startup.cfg</code> 用于区分 Core 与自动 Default 包。最终架构只保留一个包，并把选择权放回 User，因此这些路径都不再存在。</p>","toc":[{"title":"第一步：Runtime","url":"#第一步runtime","items":[]},{"title":"第二步：User","url":"#第二步user","items":[]},{"title":"两种用户模式","url":"#两种用户模式","items":[{"title":"不启用 Preset","url":"#不启用-preset","items":[]},{"title":"启用一个 Preset","url":"#启用一个-preset","items":[]}]},{"title":"为什么控制台执行 srp_apply_* 不会自动补上 User","url":"#为什么控制台执行-srp_apply_-不会自动补上-user","items":[]},{"title":"Valve 重置命令","url":"#valve-重置命令","items":[]},{"title":"功能与按键入口","url":"#功能与按键入口","items":[]},{"title":"与 VCFG 的先后关系","url":"#与-vcfg-的先后关系","items":[]},{"title":"已删除的选择层","url":"#已删除的选择层","items":[]}]},{"title":"autoview 功能","description":"武器自适应视角切换，主武器使用独立视角预设","slug":"autoview","content":"<blockquote>\\n<p>模块目录：<code>srp-cfg/features/autoview/</code></p>\\n</blockquote>\\n<h2 id=\\"简介\\">简介</h2>\\n<p>autoview 模块会在武器切换时自动切换持枪视角。主武器使用独立的自定义视角预设（默认 v06），切换至副武器、匕首、电击枪、投掷物等其他装备时自动切换为默认 M7 视角（v00）。</p>\\n<p>此功能适合希望主武器有更开阔的视野、同时其他装备保持标准视角的玩家。</p>\\n<h2 id=\\"激活方式\\">激活方式</h2>\\n<p>输入 <code>srp_autoview</code> 只重置 <code>view_0/view_1</code> 功能映射，不修改实体键。输入 <code>srp_autoview_keys</code> 才会安装武器槽位键表；Default 案例中的 <code>[</code> 键调用后者。</p>\\n<p>因此用户可以先查看 <code>keymap.cfg</code>，再决定是否让模块接管武器键。</p>\\n<h2 id=\\"工作原理\\">工作原理</h2>\\n<p>加载后，按键 1-6 和 z/x/c/v 会被重绑，在切换武器的同时自动调用视角切换 alias：</p>\\n<ul>\\n<li>主武器（按键 1）调用 <code>view_0</code>，默认为 v06</li>\\n<li>其他装备（按键 2-6, z, x, c, v）调用 <code>view_1</code>，默认为 v00</li>\\n</ul>\\n<h2 id=\\"受影响的按键\\">受影响的按键</h2>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">按键</th><th align=\\"left\\">武器槽位</th><th align=\\"left\\">视角预设</th></tr></thead><tbody><tr><td align=\\"left\\">1</td><td align=\\"left\\">主武器</td><td align=\\"left\\">view_0 (v06)</td></tr><tr><td align=\\"left\\">2</td><td align=\\"left\\">副武器</td><td align=\\"left\\">view_1 (v00)</td></tr><tr><td align=\\"left\\">3</td><td align=\\"left\\">匕首</td><td align=\\"left\\">view_1 (v00)</td></tr><tr><td align=\\"left\\">4</td><td align=\\"left\\">电击枪</td><td align=\\"left\\">view_1 (v00)</td></tr><tr><td align=\\"left\\">5</td><td align=\\"left\\">C4</td><td align=\\"left\\">view_1 (v00)</td></tr><tr><td align=\\"left\\">6</td><td align=\\"left\\">诱饵弹</td><td align=\\"left\\">view_1 (v00)</td></tr><tr><td align=\\"left\\">z</td><td align=\\"left\\">高爆手雷</td><td align=\\"left\\">view_1 (v00)</td></tr><tr><td align=\\"left\\">x</td><td align=\\"left\\">闪光弹</td><td align=\\"left\\">view_1 (v00)</td></tr><tr><td align=\\"left\\">c</td><td align=\\"left\\">烟雾弹</td><td align=\\"left\\">view_1 (v00)</td></tr><tr><td align=\\"left\\">v</td><td align=\\"left\\">燃烧弹</td><td align=\\"left\\">view_1 (v00)</td></tr></tbody></table>\\n<h2 id=\\"自定义\\">自定义</h2>\\n<p>如需更改主武器视角预设，查看 <code>srp-cfg/features/autoview/runtime.cfg</code> 中的 <code>view_0</code> alias，将 <code>v06</code> 替换为 v00-v07 中的任意预设。同理可修改 <code>view_1</code>。</p>\\n<h2 id=\\"相关文件\\">相关文件</h2>\\n<ul>\\n<li><a href=\\"/docs/crosshair_view\\">crosshair-view 功能</a> — 视角预设定义（v00-v07）</li>\\n<li><a href=\\"/docs/autoexec\\">autoexec.cfg</a> — v3 Runtime、内置 Preset 与用户层入口</li>\\n</ul>\\n<h2 id=\\"注意事项\\">注意事项</h2>\\n<ul>\\n<li>Runtime 会自动注册 crosshair-view 的 v00-v07，无需先应用准星/视角设置</li>\\n<li>无法实现 Q 键切换装备时的视角更换（CS2 引擎限制）</li>\\n<li>加载后按键 1-6/Z/X/C/V 的绑定会被写入 user keys VCFG</li>\\n<li><code>srp_reload</code> 不会猜测原按键；可用 <code>srp_reset_valve_keys</code>、自己的 Preset/User，或游戏设置恢复</li>\\n</ul>","toc":[{"title":"简介","url":"#简介","items":[]},{"title":"激活方式","url":"#激活方式","items":[]},{"title":"工作原理","url":"#工作原理","items":[]},{"title":"受影响的按键","url":"#受影响的按键","items":[]},{"title":"自定义","url":"#自定义","items":[]},{"title":"相关文件","url":"#相关文件","items":[]},{"title":"注意事项","url":"#注意事项","items":[]}]},{"title":"crosshair-view 功能","description":"准星与持枪视角预设配置，含 8 组准星和 8 组视角预设","slug":"crosshair_view","content":"<blockquote>\\n<p>v3 中可通过 <code>srp_crosshair_view</code> 显式加载。它会修改准星与持枪视角 ConVar，这些值可能由 CS2 持久化；Runtime Core 不会在启动时自动应用。</p>\\n</blockquote>\\n<blockquote>\\n<p>模块目录：<code>srp-cfg/features/crosshair-view/</code></p>\\n</blockquote>\\n<h2 id=\\"简介\\">简介</h2>\\n<p>crosshair-view 模块提供准星预设切换、持枪视角切换、准星颜色切换、投掷物准星开关等功能。Runtime 会永久注册其 alias；<code>srp_crosshair_view</code> 只应用 c00/v00，<code>srp_crosshair_view_keys</code> 才绑定 7/8 与方向键。</p>\\n<p>由于 Valve 的脚本指令单条长度限制，准星参数需通过 CFG 文件加载。更换准星依赖 <code>srp-cfg/features/crosshair-view/library/</code> 中的准星代码库。</p>\\n<h2 id=\\"功能表\\">功能表</h2>\\n<h3 id=\\"准星预设切换\\">准星预设切换</h3>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">功能</th><th align=\\"left\\">快捷键</th><th align=\\"left\\">控制台别名</th></tr></thead><tbody><tr><td align=\\"left\\">一键轮换准星预设</td><td align=\\"left\\"><code>7</code></td><td align=\\"left\\">-</td></tr><tr><td align=\\"left\\">查询当前准星预设</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>whoamic</code></td></tr><tr><td align=\\"left\\">切换到指定准星</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>c00</code> ~ <code>c07</code></td></tr><tr><td align=\\"left\\">开关准星中心点</td><td align=\\"left\\"><code>←</code></td><td align=\\"left\\"><code>srp_crosshair_dot</code></td></tr><tr><td align=\\"left\\">是否开启投掷物准星</td><td align=\\"left\\"><code>↓</code></td><td align=\\"left\\"><code>switchthrow</code></td></tr></tbody></table>\\n<h3 id=\\"视角预设切换\\">视角预设切换</h3>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">功能</th><th align=\\"center\\">快捷键</th><th align=\\"center\\">控制台别名</th></tr></thead><tbody><tr><td align=\\"left\\">一键轮换视角预设</td><td align=\\"center\\"><code>8</code></td><td align=\\"center\\">-</td></tr><tr><td align=\\"left\\">查询当前视角预设</td><td align=\\"center\\">-</td><td align=\\"center\\"><code>whoamiv</code></td></tr><tr><td align=\\"left\\">切换到指定视角</td><td align=\\"center\\">-</td><td align=\\"center\\"><code>v00</code> ~ <code>v07</code></td></tr></tbody></table>\\n<h3 id=\\"准星颜色\\">准星颜色</h3>\\n<p>控制台输入对应别名即可切换准星颜色：</p>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">别名</th><th align=\\"left\\">颜色</th><th align=\\"left\\">RGB</th></tr></thead><tbody><tr><td align=\\"left\\"><code>red</code></td><td align=\\"left\\">红色</td><td align=\\"left\\">255/0/0</td></tr><tr><td align=\\"left\\"><code>orange</code></td><td align=\\"left\\">橙色</td><td align=\\"left\\">255/165/0</td></tr><tr><td align=\\"left\\"><code>yellow</code></td><td align=\\"left\\">黄色</td><td align=\\"left\\">255/255/0</td></tr><tr><td align=\\"left\\"><code>green</code></td><td align=\\"left\\">绿色</td><td align=\\"left\\">0/255/0</td></tr><tr><td align=\\"left\\"><code>cyan</code></td><td align=\\"left\\">青色</td><td align=\\"left\\">0/255/255</td></tr><tr><td align=\\"left\\"><code>blue</code></td><td align=\\"left\\">蓝色</td><td align=\\"left\\">0/0/255</td></tr><tr><td align=\\"left\\"><code>purple</code></td><td align=\\"left\\">紫色</td><td align=\\"left\\">128/0/128</td></tr><tr><td align=\\"left\\"><code>black</code></td><td align=\\"left\\">黑色</td><td align=\\"left\\">0/0/0</td></tr><tr><td align=\\"left\\"><code>white</code></td><td align=\\"left\\">白色</td><td align=\\"left\\">255/255/255</td></tr><tr><td align=\\"left\\"><code>pink</code></td><td align=\\"left\\">粉色</td><td align=\\"left\\">255/192/203</td></tr><tr><td align=\\"left\\"><code>brown</code></td><td align=\\"left\\">棕色</td><td align=\\"left\\">165/42/42</td></tr><tr><td align=\\"left\\"><code>gray</code></td><td align=\\"left\\">灰色</td><td align=\\"left\\">128/128/128</td></tr></tbody></table>\\n<h3 id=\\"其他功能\\">其他功能</h3>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">功能</th><th align=\\"left\\">控制台别名</th></tr></thead><tbody><tr><td align=\\"left\\">投掷时保持玩家自定义准星</td><td align=\\"left\\"><code>keep</code></td></tr></tbody></table>\\n<h2 id=\\"crosshair_library-准星预设\\">crosshair_library 准星预设</h2>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">预设</th><th align=\\"left\\">文件</th><th align=\\"left\\">准星代码</th><th align=\\"left\\">描述</th></tr></thead><tbody><tr><td align=\\"left\\">c00</td><td align=\\"left\\">00.cfg</td><td align=\\"left\\"><code>CSGO-hkk78-Mz6UK-XJ9t2-Dv3E3-qbOUD</code></td><td align=\\"left\\">默认准星（白色经典静态小十字）</td></tr><tr><td align=\\"left\\">c01</td><td align=\\"left\\">01.cfg</td><td align=\\"left\\"><code>CSGO-H9mcs-8GDFZ-MfxkQ-2Kx7O-pTLoD</code></td><td align=\\"left\\">细线静态标准小准星</td></tr><tr><td align=\\"left\\">c02</td><td align=\\"left\\">02.cfg</td><td align=\\"left\\"><code>CSGO-oK2db-LY2wT-seq73-YTnJB-3bOUD</code></td><td align=\\"left\\">跟枪抖动动态准星</td></tr><tr><td align=\\"left\\">c03</td><td align=\\"left\\">03.cfg</td><td align=\\"left\\"><code>CSGO-9StUb-FrcBs-HhYjr-mzVip-YScNE</code></td><td align=\\"left\\">移动聚焦动态准星</td></tr><tr><td align=\\"left\\">c04</td><td align=\\"left\\">04.cfg</td><td align=\\"left\\"><code>CSGO-pqEaF-5AKXB-DCdnh-vpxAJ-94GSQ</code></td><td align=\\"left\\">小圆点静态准星</td></tr><tr><td align=\\"left\\">c05</td><td align=\\"left\\">05.cfg</td><td align=\\"left\\"><code>CSGO-Q4APO-buiyc-i9V7H-7sxJN-Zy8rN</code></td><td align=\\"left\\">导播专用大号准星</td></tr><tr><td align=\\"left\\">c06</td><td align=\\"left\\">06.cfg</td><td align=\\"left\\"><code>CSGO-LpB26-mhWAt-srQVK-fEE34-BWxTC</code></td><td align=\\"left\\">Anyingi_Csgo 准星</td></tr><tr><td align=\\"left\\">c07</td><td align=\\"left\\">07.cfg</td><td align=\\"left\\"><code>CSGO-zpRPM-DC5Pd-fmPMp-iReK7-LPZfE</code></td><td align=\\"left\\">犬升 dog41 准星</td></tr></tbody></table>\\n<blockquote>\\n<p><strong>提示：</strong> 准星代码可在游戏内设置界面的\\"准星\\"选项中导入。</p>\\n</blockquote>\\n<h2 id=\\"视角预设\\">视角预设</h2>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">预设</th><th align=\\"left\\">参数 (FOV / X / Y / Z / preset)</th><th align=\\"left\\">描述</th></tr></thead><tbody><tr><td align=\\"left\\">v00</td><td align=\\"left\\">68 / 2 / 2 / -1 / 0</td><td align=\\"left\\">默认视角 M7</td></tr><tr><td align=\\"left\\">v01</td><td align=\\"left\\">60 / 0 / 1 / -2 / 0</td><td align=\\"left\\">Niko 中心视角</td></tr><tr><td align=\\"left\\">v02</td><td align=\\"left\\">68 / 2.5 / -1 / -2 / 0</td><td align=\\"left\\">大幅偏右开阔视角</td></tr><tr><td align=\\"left\\">v03</td><td align=\\"left\\">68 / 1.5 / -2 / -2 / 0</td><td align=\\"left\\">偏右偏中开阔视角</td></tr><tr><td align=\\"left\\">v04</td><td align=\\"left\\">65 / 2.5 / -2 / -2 / 0</td><td align=\\"left\\">不挡视野视角</td></tr><tr><td align=\\"left\\">v05</td><td align=\\"left\\">62 / 2.5 / 2 / -2 / 0</td><td align=\\"left\\">导播 demo 视角</td></tr><tr><td align=\\"left\\">v06</td><td align=\\"left\\">68 / 2.5 / 0 / -1.5 / 3</td><td align=\\"left\\">Anyingi_Csgo 视角</td></tr><tr><td align=\\"left\\">v07</td><td align=\\"left\\">68 / 2.5 / 2 / -2 / 0</td><td align=\\"left\\">犬升 dog41 视角</td></tr></tbody></table>\\n<h2 id=\\"使用方法\\">使用方法</h2>\\n<ol>\\n<li>输入 <code>srp_crosshair_view</code> 应用推荐状态；需要模块按键时输入 <code>srp_crosshair_view_keys</code></li>\\n<li>按 <code>7</code> 键轮换准星预设，按 <code>8</code> 键轮换视角预设</li>\\n<li>控制台输入 <code>c00</code><del><code>c07</code> 切换指定准星，<code>v00</code></del><code>v07</code> 切换指定视角</li>\\n<li>控制台输入颜色别名（red、blue 等）切换准星颜色</li>\\n<li>输入 <code>whoamic</code> 或 <code>whoamiv</code> 查询当前预设</li>\\n</ol>\\n<h2 id=\\"相关文件\\">相关文件</h2>\\n<ul>\\n<li><a href=\\"/docs/autoexec\\">autoexec.cfg</a> — v3 启动引导与三层说明</li>\\n<li><code>srp-cfg/features/crosshair-view/library/</code> — 准星预设 cfg 文件夹（00.cfg ~ 07.cfg）</li>\\n</ul>\\n<h2 id=\\"注意事项\\">注意事项</h2>\\n<ul>\\n<li>切换准星后，按 <code>7</code>/<code>8</code> 键的轮换链会从当前位置继续</li>\\n<li>由于 Valve 脚本长度限制，准星参数无法直接写在 autoexec 中，必须通过 cfg 文件加载</li>\\n</ul>","toc":[{"title":"简介","url":"#简介","items":[]},{"title":"功能表","url":"#功能表","items":[{"title":"准星预设切换","url":"#准星预设切换","items":[]},{"title":"视角预设切换","url":"#视角预设切换","items":[]},{"title":"准星颜色","url":"#准星颜色","items":[]},{"title":"其他功能","url":"#其他功能","items":[]}]},{"title":"crosshair_library 准星预设","url":"#crosshair_library-准星预设","items":[]},{"title":"视角预设","url":"#视角预设","items":[]},{"title":"使用方法","url":"#使用方法","items":[]},{"title":"相关文件","url":"#相关文件","items":[]},{"title":"注意事项","url":"#注意事项","items":[]}]},{"title":"cs2_video.txt","description":"CS2 视频设置预设（RTX 4060，1440x1080，4:3）","slug":"cs2_video","content":"<blockquote>\\n<p>CS2 视频设置配置文件（KV3 格式）</p>\\n</blockquote>\\n<h2 id=\\"简介\\">简介</h2>\\n<p>cs2_video.txt 是 CS2 的视频设置文件，采用 KV3 格式。此预设针对 RTX 4060 显卡优化，分辨率 1440x1080（4:3），偏向竞技低画质高帧率设置。</p>\\n<h2 id=\\"安装方式\\">安装方式</h2>\\n<blockquote>\\n<p><strong>注意：</strong> 此文件需要安装到 Steam 用户配置目录，不是 <code>csgo/cfg/</code>。请使用安装器自动安装，或参考 <a href=\\"/docs/srpcfg-3\\">使用指南</a> 中的手动安装步骤。文件中的注释在使用时需删除。</p>\\n</blockquote>\\n<p>安装路径：<code>Steam/userdata/{好友代码}/730/local/cfg/cs2_video.txt</code></p>\\n<h2 id=\\"设置一览\\">设置一览</h2>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">设置项</th><th align=\\"left\\">值</th><th align=\\"left\\">说明</th></tr></thead><tbody><tr><td align=\\"left\\">分辨率</td><td align=\\"left\\">1440x1080</td><td align=\\"left\\">4:3 拉伸</td></tr><tr><td align=\\"left\\">全屏模式</td><td align=\\"left\\">开启</td><td align=\\"left\\">无边框窗口</td></tr><tr><td align=\\"left\\">V-sync</td><td align=\\"left\\">关闭</td><td align=\\"left\\">减少输入延迟</td></tr><tr><td align=\\"left\\">低延迟模式</td><td align=\\"left\\">开启</td><td align=\\"left\\">NVIDIA Reflex</td></tr><tr><td align=\\"left\\">MSAA</td><td align=\\"left\\">4x</td><td align=\\"left\\">多重采样抗锯齿</td></tr><tr><td align=\\"left\\">CMAA</td><td align=\\"left\\">关闭</td><td align=\\"left\\"></td></tr><tr><td align=\\"left\\">阴影质量</td><td align=\\"left\\">低</td><td align=\\"left\\">竞技需要看到敌人影子</td></tr><tr><td align=\\"left\\">动态阴影</td><td align=\\"left\\">开启</td><td align=\\"left\\"></td></tr><tr><td align=\\"left\\">贴图细节</td><td align=\\"left\\">低</td><td align=\\"left\\"></td></tr><tr><td align=\\"left\\">贴图过滤</td><td align=\\"left\\">异向 8X</td><td align=\\"left\\"></td></tr><tr><td align=\\"left\\">光影细节</td><td align=\\"left\\">低</td><td align=\\"left\\"></td></tr><tr><td align=\\"left\\">粒子细节</td><td align=\\"left\\">低</td><td align=\\"left\\"></td></tr><tr><td align=\\"left\\">环境光遮蔽</td><td align=\\"left\\">禁用</td><td align=\\"left\\"></td></tr><tr><td align=\\"left\\">HDR</td><td align=\\"left\\">性能</td><td align=\\"left\\"></td></tr><tr><td align=\\"left\\">FSR</td><td align=\\"left\\">禁用</td><td align=\\"left\\"></td></tr></tbody></table>\\n<h2 id=\\"完整文件内容\\">完整文件内容</h2>\\n<pre><code class=\\"language-txt\\">\\"video.cfg\\"\\n{\\n\\t\\"Version\\"\\t\\t\\"16\\"\\n\\t\\"VendorID\\"\\t\\t\\"4318\\"\\n\\t\\"DeviceID\\"\\t\\t\\"10464\\"\\n\\t\\"setting.cpu_level\\"\\t\\t\\"3\\"\\n\\t\\"setting.gpu_mem_level\\"\\t\\t\\"3\\"\\n\\t\\"setting.gpu_level\\"\\t\\t\\"3\\"\\n\\t\\"setting.knowndevice\\"\\t\\t\\"0\\"\\n\\t\\"setting.monitor_index\\"\\t\\t\\"0\\"\\n\\t\\"setting.defaultres\\"\\t\\t\\"1440\\"\\n\\t\\"setting.defaultresheight\\"\\t\\t\\"1080\\"\\n\\t\\"setting.aspectratiomode\\"\\t\\t\\"0\\"\\n\\t\\"setting.refreshrate_numerator\\"\\t\\t\\"0\\"\\n\\t\\"setting.refreshrate_denominator\\"\\t\\t\\"0\\"\\n\\t\\"setting.fullscreen\\"\\t\\t\\"0\\"\\n\\t\\"setting.coop_fullscreen\\"\\t\\t\\"1\\"\\n\\t\\"setting.nowindowborder\\"\\t\\t\\"1\\"\\n\\t\\"setting.fullscreen_min_on_focus_loss\\"\\t\\t\\"0\\"\\n\\t\\"setting.high_dpi\\"\\t\\t\\"0\\"\\n\\t\\"setting.mat_vsync\\"\\t\\t\\"0\\"\\n\\t\\"setting.r_low_latency\\"\\t\\t\\"1\\"\\n\\t\\"AutoConfig\\"\\t\\t\\"2\\"\\n\\t\\"setting.msaa_samples\\"\\t\\t\\"4\\"\\n\\t\\"setting.r_csgo_cmaa_enable\\"\\t\\t\\"0\\"\\n\\t\\"setting.videocfg_shadow_quality\\"\\t\\t\\"0\\"\\n\\t\\"setting.videocfg_dynamic_shadows\\"\\t\\t\\"1\\"\\n\\t\\"setting.videocfg_texture_detail\\"\\t\\t\\"0\\"\\n\\t\\"setting.r_texturefilteringquality\\"\\t\\t\\"3\\"\\n\\t\\"setting.shaderquality\\"\\t\\t\\"0\\"\\n\\t\\"setting.videocfg_particle_detail\\"\\t\\t\\"0\\"\\n\\t\\"setting.videocfg_ao_detail\\"\\t\\t\\"0\\"\\n\\t\\"setting.videocfg_hdr_detail\\"\\t\\t\\"3\\"\\n\\t\\"setting.videocfg_fsr_detail\\"\\t\\t\\"0\\"\\n}\\n</code></pre>\\n<h2 id=\\"各参数说明\\">各参数说明</h2>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">参数</th><th align=\\"left\\">值</th><th align=\\"left\\">说明</th></tr></thead><tbody><tr><td align=\\"left\\">VendorID</td><td align=\\"left\\">4318</td><td align=\\"left\\">显卡厂商识别码（NVIDIA）</td></tr><tr><td align=\\"left\\">DeviceID</td><td align=\\"left\\">10464</td><td align=\\"left\\">显卡设备识别码（RTX 4060）</td></tr><tr><td align=\\"left\\">cpu_level / gpu_mem_level / gpu_level</td><td align=\\"left\\">3</td><td align=\\"left\\">CPU/GPU 性能等级（高）</td></tr><tr><td align=\\"left\\">aspectratiomode</td><td align=\\"left\\">0</td><td align=\\"left\\">宽高比（0=自动，1=4:3，2=16:9）</td></tr><tr><td align=\\"left\\">fullscreen</td><td align=\\"left\\">1</td><td align=\\"left\\">全屏模式</td></tr><tr><td align=\\"left\\">nowindowborder</td><td align=\\"left\\">1</td><td align=\\"left\\">无边框窗口</td></tr><tr><td align=\\"left\\">msaa_samples</td><td align=\\"left\\">4</td><td align=\\"left\\">MSAA 采样数（0/2/4/8）</td></tr><tr><td align=\\"left\\">videocfg_shadow_quality</td><td align=\\"left\\">0</td><td align=\\"left\\">阴影质量（0=低，1=中，2=高，3=非常高）</td></tr><tr><td align=\\"left\\">videocfg_texture_detail</td><td align=\\"left\\">0</td><td align=\\"left\\">贴图细节（0=低，1=中，2=高）</td></tr><tr><td align=\\"left\\">r_texturefilteringquality</td><td align=\\"left\\">3</td><td align=\\"left\\">贴图过滤（0-5：双线性到异向 16X）</td></tr><tr><td align=\\"left\\">shaderquality</td><td align=\\"left\\">0</td><td align=\\"left\\">光影细节（0=低，1=高）</td></tr><tr><td align=\\"left\\">videocfg_particle_detail</td><td align=\\"left\\">0</td><td align=\\"left\\">粒子细节（0=低 ~ 3=非常高）</td></tr><tr><td align=\\"left\\">videocfg_ao_detail</td><td align=\\"left\\">0</td><td align=\\"left\\">环境光遮蔽（0=禁用，2=中，3=高）</td></tr><tr><td align=\\"left\\">videocfg_hdr_detail</td><td align=\\"left\\">3</td><td align=\\"left\\">HDR（-1=品质，3=性能）</td></tr><tr><td align=\\"left\\">videocfg_fsr_detail</td><td align=\\"left\\">0</td><td align=\\"left\\">FSR（0=禁用，1-4=超高品质到性能）</td></tr></tbody></table>\\n<h2 id=\\"相关文件\\">相关文件</h2>\\n<ul>\\n<li><a href=\\"/docs/srpcfg-3\\">使用指南</a> — 安装指南（含视频预设安装步骤）</li>\\n</ul>\\n<h2 id=\\"注意事项\\">注意事项</h2>\\n<ul>\\n<li>此设置针对 RTX 4060 优化，其他显卡可能需要调整 GPU/CPU 等级</li>\\n<li>修改后如游戏异常，删除此文件即可恢复游戏默认视频设置</li>\\n<li>使用前需删除文件中的所有注释（<code>//</code> 开头的内容）</li>\\n</ul>","toc":[{"title":"简介","url":"#简介","items":[]},{"title":"安装方式","url":"#安装方式","items":[]},{"title":"设置一览","url":"#设置一览","items":[]},{"title":"完整文件内容","url":"#完整文件内容","items":[]},{"title":"各参数说明","url":"#各参数说明","items":[]},{"title":"相关文件","url":"#相关文件","items":[]},{"title":"注意事项","url":"#注意事项","items":[]}]},{"title":"demo-hlae 模式","description":"HLAE Demo 观看预设，含镜头运镜、动态模糊录制、速度控制","slug":"demo_hlae","content":"<blockquote>\\n<p>模块目录：<code>srp-cfg/modes/demo-hlae/</code></p>\\n</blockquote>\\n<h2 id=\\"简介\\">简介</h2>\\n<p>demo-hlae 模式为 HLAE（Half-Life Advanced Effects）demo 回放提供完整的按键预设和录制工具。参考自 <a href=\\"https://github.com/Purple-CSGO/CSGO-Config-Presets\\">Purp1e</a>，整合了动态模糊录制功能。</p>\\n<h2 id=\\"前置条件\\">前置条件</h2>\\n<ul>\\n<li>安装 <a href=\\"https://github.com/advancedfx/advancedfx\\">HLAE</a> — CS2 demo 回放增强工具</li>\\n<li>配置 <a href=\\"https://ffmpeg.org/\\">FFmpeg</a> — 用于动态模糊录制（可选）</li>\\n</ul>\\n<h2 id=\\"激活方式\\">激活方式</h2>\\n<p>输入 <code>srp_demo</code> 只应用 HLAE/录制设置。输入 <code>srp_demo_keys</code> 才会先执行 Valve <code>binddefaults</code>，再安装完整创作键表；Default 案例中的 <code>]</code> 键调用带按键入口。</p>\\n<p>HLAE 模式会重绑大量普通键、鼠标键和小键盘键，属于明确的侵入式会话模式。</p>\\n<h2 id=\\"功能表\\">功能表</h2>\\n<h3 id=\\"demo-控制\\">Demo 控制</h3>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">功能</th><th align=\\"left\\">快捷键</th><th align=\\"left\\">控制台别名</th></tr></thead><tbody><tr><td align=\\"left\\">demoUI 开关</td><td align=\\"left\\"><code>Q</code> / <code>Shift+F2</code></td><td align=\\"left\\"><code>srp_demo_ui</code></td></tr><tr><td align=\\"left\\">demo 暂停</td><td align=\\"left\\"><code>P</code> / <code>鼠标中键</code></td><td align=\\"left\\"><code>srp_demo_togglepause</code></td></tr><tr><td align=\\"left\\">快退 5 秒</td><td align=\\"left\\"><code>,</code></td><td align=\\"left\\"><code>srp_demo_seek_back</code></td></tr><tr><td align=\\"left\\">快进 5 秒</td><td align=\\"left\\"><code>.</code></td><td align=\\"left\\"><code>srp_demo_seek_forward</code></td></tr><tr><td align=\\"left\\">增加播放速度</td><td align=\\"left\\"><code>MOUSE5</code> 前侧键</td><td align=\\"left\\"><code>srp_demo_gear_up</code></td></tr><tr><td align=\\"left\\">减少播放速度</td><td align=\\"left\\"><code>MOUSE4</code> 后侧键</td><td align=\\"left\\"><code>srp_demo_gear_down</code></td></tr><tr><td align=\\"left\\">标记当前 tick</td><td align=\\"left\\"><code>U</code></td><td align=\\"left\\"><code>srp_demo_marktick</code></td></tr><tr><td align=\\"left\\">跳转标记 tick</td><td align=\\"left\\"><code>I</code></td><td align=\\"left\\"><code>srp_demo_gotomark</code></td></tr></tbody></table>\\n<h3 id=\\"镜头运镜\\">镜头运镜</h3>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">功能</th><th align=\\"left\\">快捷键</th><th align=\\"left\\">控制台别名</th></tr></thead><tbody><tr><td align=\\"left\\">镜头摆放模式（ESC 退出）</td><td align=\\"left\\"><code>R</code></td><td align=\\"left\\"><code>srp_demo_camera_mode</code></td></tr><tr><td align=\\"left\\">添加镜头</td><td align=\\"left\\"><code>Capslock</code></td><td align=\\"left\\"><code>srp_demo_campath_add</code></td></tr><tr><td align=\\"left\\">清空镜头</td><td align=\\"left\\"><code>Delete</code></td><td align=\\"left\\"><code>srp_demo_campath_clear</code></td></tr><tr><td align=\\"left\\">镜头激活</td><td align=\\"left\\"><code>T</code></td><td align=\\"left\\"><code>srp_demo_campath</code></td></tr><tr><td align=\\"left\\">镜头轨迹显示</td><td align=\\"left\\"><code>Y</code></td><td align=\\"left\\"><code>srp_demo_campath_draw</code></td></tr><tr><td align=\\"left\\">运镜回退 0.25s</td><td align=\\"left\\"><code>[</code></td><td align=\\"left\\"><code>srp_demo_campath_start_forward</code></td></tr><tr><td align=\\"left\\">运镜快进 0.25s</td><td align=\\"left\\"><code>]</code></td><td align=\\"left\\"><code>srp_demo_campath_start_back</code></td></tr><tr><td align=\\"left\\">运镜 FOV 修改</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>f10</code>~<code>f100</code></td></tr><tr><td align=\\"left\\">运镜开始为当前视角</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>pos</code></td></tr><tr><td align=\\"left\\">运镜开始为当前 tick</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>time</code></td></tr><tr><td align=\\"left\\">解绑运镜模式按键</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>t</code></td></tr></tbody></table>\\n<h3 id=\\"显示控制\\">显示控制</h3>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">功能</th><th align=\\"left\\">快捷键</th><th align=\\"left\\">控制台别名</th></tr></thead><tbody><tr><td align=\\"left\\">只保留准星和击杀</td><td align=\\"left\\"><code>H</code></td><td align=\\"left\\"><code>srp_demo_hud_deathnotices</code></td></tr><tr><td align=\\"left\\">只显示当前玩家击杀</td><td align=\\"left\\"><code>J</code></td><td align=\\"left\\"><code>srp_demo_dmsg</code></td></tr><tr><td align=\\"left\\">准星开关</td><td align=\\"left\\"><code>V</code></td><td align=\\"left\\"><code>srp_demo_crosshair</code></td></tr><tr><td align=\\"left\\">HUD 开关</td><td align=\\"left\\"><code>B</code></td><td align=\\"left\\"><code>srp_demo_hud_full</code></td></tr><tr><td align=\\"left\\">X 光透视</td><td align=\\"left\\"><code>X</code></td><td align=\\"left\\"><code>srp_demo_xray</code></td></tr><tr><td align=\\"left\\">雷达开关</td><td align=\\"left\\"><code>N</code></td><td align=\\"left\\"><code>srp_demo_radar</code></td></tr><tr><td align=\\"left\\">静音</td><td align=\\"left\\"><code>M</code></td><td align=\\"left\\"><code>srp_demo_mute</code></td></tr><tr><td align=\\"left\\">开关 CSGO 语音</td><td align=\\"left\\"><code>K</code></td><td align=\\"left\\"><code>srp_demo_voice</code></td></tr><tr><td align=\\"left\\">开关 CS2 语音</td><td align=\\"left\\"><code>'</code></td><td align=\\"left\\"><code>srp_demo_player_voice</code></td></tr><tr><td align=\\"left\\">队友头顶标识</td><td align=\\"left\\"><code>ralt</code></td><td align=\\"left\\"><code>srp_demo_teamid</code></td></tr><tr><td align=\\"left\\">广角 POV</td><td align=\\"left\\"><code>=</code></td><td align=\\"left\\"><code>srp_demo_widefov</code></td></tr><tr><td align=\\"left\\">显示对局头像</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>avatars</code></td></tr><tr><td align=\\"left\\">显示对局人数</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>numbers</code></td></tr><tr><td align=\\"left\\">显示 demo 下方小字</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>demoshow</code></td></tr><tr><td align=\\"left\\">屏蔽 demo 下方小字</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>demonoshow</code></td></tr></tbody></table>\\n<h3 id=\\"录制功能\\">录制功能</h3>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">功能</th><th align=\\"left\\">快捷键</th><th align=\\"left\\">控制台别名</th></tr></thead><tbody><tr><td align=\\"left\\">开启 HLAE 录制</td><td align=\\"left\\"><code>↑</code></td><td align=\\"left\\"><code>srp_demo_record_start</code></td></tr><tr><td align=\\"left\\">关闭 HLAE 录制</td><td align=\\"left\\"><code>↓</code></td><td align=\\"left\\"><code>srp_demo_record_end</code></td></tr><tr><td align=\\"left\\">设置录制开始 tick</td><td align=\\"left\\"><code>F5</code></td><td align=\\"left\\"><code>srp_demo_tick_rec</code></td></tr><tr><td align=\\"left\\">设置录制结束 tick</td><td align=\\"left\\"><code>F6</code></td><td align=\\"left\\"><code>srp_demo_tick_rec_end</code></td></tr><tr><td align=\\"left\\">打印 mirv_cmd 信息</td><td align=\\"left\\"><code>F7</code></td><td align=\\"left\\"><code>srp_demo_cmd_print</code></td></tr><tr><td align=\\"left\\">清除 mirv_cmd 指令</td><td align=\\"left\\"><code>F8</code></td><td align=\\"left\\"><code>srp_demo_cmd_clear</code></td></tr><tr><td align=\\"left\\">开启动态模糊录制</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>bluron</code></td></tr><tr><td align=\\"left\\">关闭动态模糊录制</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>bluroff</code></td></tr></tbody></table>\\n<h3 id=\\"其他\\">其他</h3>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">功能</th><th align=\\"left\\">快捷键</th><th align=\\"left\\">控制台别名</th></tr></thead><tbody><tr><td align=\\"left\\">屏蔽/恢复击杀信息</td><td align=\\"left\\"><code>\\\\</code></td><td align=\\"left\\"><code>block</code></td></tr><tr><td align=\\"left\\">切换助攻显示</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>ass</code></td></tr><tr><td align=\\"left\\">关闭 BGM、MVP、无线电</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>mute</code></td></tr><tr><td align=\\"left\\">回合开始无灰色</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>post</code></td></tr><tr><td align=\\"left\\">开启投掷物落点预测</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>grenadeon</code></td></tr><tr><td align=\\"left\\">关闭投掷物落点预测</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>grenadeoff</code></td></tr></tbody></table>\\n<h2 id=\\"使用流程\\">使用流程</h2>\\n<ol>\\n<li>启动 CS2，播放 demo</li>\\n<li>输入 <code>srp_demo_keys</code>；只想应用录制设置时使用 <code>srp_demo</code></li>\\n<li>使用快捷键控制回放、运镜和录制</li>\\n</ol>\\n<h2 id=\\"动态模糊录制\\">动态模糊录制</h2>\\n<p>使用 <code>bluron</code> 和 <code>bluroff</code> 控制动态模糊录制模式：</p>\\n<ul>\\n<li><strong>bluron</strong>：开启动态模糊，使用矩形方法，强度 1，曝光 0.7，输出 60fps</li>\\n<li><strong>bluroff</strong>：关闭动态模糊，恢复正常录制</li>\\n</ul>\\n<p>当前案例使用 FFmpeg 以 600fps 源采样，配合 HLAE 的 <code>mirv_streams record</code> 功能。</p>\\n<h2 id=\\"相关文件\\">相关文件</h2>\\n<ul>\\n<li><a href=\\"/docs/autoexec\\">autoexec.cfg</a> — v3 Runtime、内置 Preset 与用户层入口</li>\\n</ul>\\n<h2 id=\\"注意事项\\">注意事项</h2>\\n<ul>\\n<li>HLAE 录制功能需要 HLAE 正确安装并注入 CS2</li>\\n<li>动态模糊录制需要 FFmpeg 配置正确</li>\\n<li>镜头摆放模式需按 ESC 退出</li>\\n<li>播放速度循环：0.1x → 0.2x → 0.25x → 1x → 4x → 8x</li>\\n<li>这些实体绑定会进入 user keys VCFG；录制结束后应显式恢复正常对局键位</li>\\n<li>v3 已修正旧文件中“先绑定部分 HLAE 键、随后 binddefaults 将其清除”的顺序问题</li>\\n</ul>","toc":[{"title":"简介","url":"#简介","items":[]},{"title":"前置条件","url":"#前置条件","items":[]},{"title":"激活方式","url":"#激活方式","items":[]},{"title":"功能表","url":"#功能表","items":[{"title":"Demo 控制","url":"#demo-控制","items":[]},{"title":"镜头运镜","url":"#镜头运镜","items":[]},{"title":"显示控制","url":"#显示控制","items":[]},{"title":"录制功能","url":"#录制功能","items":[]},{"title":"其他","url":"#其他","items":[]}]},{"title":"使用流程","url":"#使用流程","items":[]},{"title":"动态模糊录制","url":"#动态模糊录制","items":[]},{"title":"相关文件","url":"#相关文件","items":[]},{"title":"注意事项","url":"#注意事项","items":[]}]},{"title":"guidemake 模式","description":"地图指南制作工具，在练习模式下创建投掷物标识","slug":"guidemake","content":"<blockquote>\\n<p>设置文件：<code>srp-cfg/modes/guidemake/settings.cfg</code></p>\\n</blockquote>\\n<h2 id=\\"简介\\">简介</h2>\\n<p>guidemake 模式用于在 CS2 练习环境中创建投掷物标识地图指南。创建的标识可在游戏内查看，也可上传至创意工坊分享给其他玩家。</p>\\n<h2 id=\\"激活方式\\">激活方式</h2>\\n<p>推荐输入 <code>srp_guidemake</code>，只加载制作设置。需要整套快捷键时输入 <code>srp_guidemake_keys</code>，它会额外绑定 <code>Z/X/C/V/6/Del/Enter</code>。需要在练习模式下使用。</p>\\n<h2 id=\\"可选按键表\\">可选按键表</h2>\\n<p>下表按键只在执行 <code>srp_guidemake_keys</code> 后自动绑定；使用 <code>srp_guidemake</code> 时不会覆盖投掷物键。</p>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">功能</th><th align=\\"left\\">快捷键</th><th align=\\"left\\">说明</th></tr></thead><tbody><tr><td align=\\"left\\">创建手雷标识</td><td align=\\"left\\"><code>Z</code></td><td align=\\"left\\">创建 HE 手雷投掷物标识</td></tr><tr><td align=\\"left\\">创建闪光弹标识</td><td align=\\"left\\"><code>X</code></td><td align=\\"left\\">创建 Flash 闪光弹投掷物标识</td></tr><tr><td align=\\"left\\">创建烟雾弹标识</td><td align=\\"left\\"><code>C</code></td><td align=\\"left\\">创建 Smoke 烟雾弹投掷物标识</td></tr><tr><td align=\\"left\\">创建燃烧弹标识</td><td align=\\"left\\"><code>V</code></td><td align=\\"left\\">创建 Molotov/Incendiary 燃烧弹投掷物标识</td></tr><tr><td align=\\"left\\">创建诱饵弹标识</td><td align=\\"left\\"><code>6</code></td><td align=\\"left\\">创建 Decoy 诱饵弹投掷物标识</td></tr><tr><td align=\\"left\\">删除上一个标识</td><td align=\\"left\\"><code>Del</code></td><td align=\\"left\\">删除最近创建的标识</td></tr><tr><td align=\\"left\\">保存地图指南</td><td align=\\"left\\"><code>Enter</code></td><td align=\\"left\\">保存为 \\"mapguide\\"</td></tr><tr><td align=\\"left\\">上传至创意工坊</td><td align=\\"left\\"><code>srp_guide_upload</code></td><td align=\\"left\\">控制台输入，原始指令: <code>workshop_annotation_submit</code></td></tr></tbody></table>\\n<h2 id=\\"使用流程\\">使用流程</h2>\\n<ol>\\n<li>进入 CS2 练习模式</li>\\n<li>加载设置：<code>srp_guidemake</code>；若需要快捷键表，改用 <code>srp_guidemake_keys</code></li>\\n<li>投掷出投掷物后保持视角不动</li>\\n<li>按下对应快捷键创建投掷物标识</li>\\n<li>按下 <code>Enter</code> 保存地图指南</li>\\n</ol>\\n<h2 id=\\"控制台指令\\">控制台指令</h2>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">指令</th><th align=\\"left\\">说明</th></tr></thead><tbody><tr><td align=\\"left\\"><code>sv_allow_annotations_access_level 2</code></td><td align=\\"left\\">允许查看和编辑地图指南</td></tr><tr><td align=\\"left\\"><code>annotation_create grenade [type] \\"label\\"</code></td><td align=\\"left\\">创建投掷物描点（type: smoke/flash/he/molotov/incendiary/decoy）</td></tr><tr><td align=\\"left\\"><code>annotation_delete_previous_node_set</code></td><td align=\\"left\\">删除上一个标识</td></tr><tr><td align=\\"left\\"><code>annotation_clear</code></td><td align=\\"left\\">清除全部标识</td></tr><tr><td align=\\"left\\"><code>annotation_save \\"filename\\"</code></td><td align=\\"left\\">保存地图指南</td></tr></tbody></table>\\n<h2 id=\\"文件保存位置\\">文件保存位置</h2>\\n<p>保存路径：<code>...\\\\SteamLibrary\\\\steamapps\\\\common\\\\Counter-Strike Global Offensive\\\\game\\\\csgo\\\\annotations\\\\local\\\\mapguide</code></p>\\n<h2 id=\\"相关文件\\">相关文件</h2>\\n<ul>\\n<li><a href=\\"/docs/practice\\">practice 模式</a> — 跑图配置（配合使用）</li>\\n<li><code>annotations/</code> — 已制作的地图指南数据（Dust2、Inferno、Mirage、Ancient）</li>\\n</ul>\\n<h2 id=\\"注意事项\\">注意事项</h2>\\n<blockquote>\\n<p><strong>提示：</strong> 按下快捷键后，标识会以 \\"label\\" 命名。保存后打开对应的 TXT 文件，对每一组标识进行文本编辑。建议在地图上创建一个标识后就进行保存，并重新启动进入游戏，方便后续查找和修改。</p>\\n</blockquote>\\n<blockquote>\\n<p><strong>注意：</strong> 制作好后请务必将该指南的文件夹名、文件名进行修改，以避免与其他指南冲突。首次使用建议只创建一个标识后保存，并重新启动进入游戏确认效果。</p>\\n</blockquote>\\n<blockquote>\\n<p><strong>VCFG：</strong> <code>_keys</code> 入口的投掷物键与保存键会被 CS2 持久化。退出制作模式不会自动还原，恢复时应执行自己的 Preset/User、<code>srp_reset_valve_keys</code>，或在游戏内重新绑定。</p>\\n</blockquote>","toc":[{"title":"简介","url":"#简介","items":[]},{"title":"激活方式","url":"#激活方式","items":[]},{"title":"可选按键表","url":"#可选按键表","items":[]},{"title":"使用流程","url":"#使用流程","items":[]},{"title":"控制台指令","url":"#控制台指令","items":[]},{"title":"文件保存位置","url":"#文件保存位置","items":[]},{"title":"相关文件","url":"#相关文件","items":[]},{"title":"注意事项","url":"#注意事项","items":[]}]},{"title":"控制台帮助系统","description":"srp_help 主题索引与模块黑话命令说明","slug":"helps","content":"<p>v3 为每个 feature 与 mode 增加 <code>help.cfg</code>。帮助文件只输出说明，不修改偏好、服务器状态或按键。</p>\\n<h2 id=\\"总入口\\">总入口</h2>\\n<pre><code class=\\"language-text\\">srp_help\\n</code></pre>\\n<p>它会列出所有主题命令：</p>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">命令</th><th align=\\"left\\">内容</th></tr></thead><tbody><tr><td align=\\"left\\"><code>srp_help_presets</code></td><td align=\\"left\\">Default、Echo、YSZH、VisionL 案例</td></tr><tr><td align=\\"left\\"><code>srp_help_reset</code></td><td align=\\"left\\">Valve 基线重置与能力边界</td></tr><tr><td align=\\"left\\"><code>srp_help_crosshair</code></td><td align=\\"left\\">c00-c07、v00-v07、颜色与投掷物准星</td></tr><tr><td align=\\"left\\"><code>srp_help_autoview</code></td><td align=\\"left\\">view_0、view_1 与武器视角键表</td></tr><tr><td align=\\"left\\"><code>srp_help_knife</code></td><td align=\\"left\\">匕首模型数字编号</td></tr><tr><td align=\\"left\\"><code>srp_help_zeus</code></td><td align=\\"left\\">att0、att1、+firr 攻击包装</td></tr><tr><td align=\\"left\\"><code>srp_help_practice</code></td><td align=\\"left\\">spawn、gkd、gg、plant、xray 等跑图黑话</td></tr><tr><td align=\\"left\\"><code>srp_help_pwa_prac</code></td><td align=\\"left\\">完美世界跑图专属键位映射说明</td></tr><tr><td align=\\"left\\"><code>srp_help_preview</code></td><td align=\\"left\\">depre、changeblur、changefov、changeang</td></tr><tr><td align=\\"left\\"><code>srp_help_guidemake</code></td><td align=\\"left\\">srp_guide_* 地图指南命令</td></tr><tr><td align=\\"left\\"><code>srp_help_demo</code></td><td align=\\"left\\">HLAE 录制、镜头、速度与显示命令</td></tr></tbody></table>\\n<h2 id=\\"为什么帮助放在模块目录\\">为什么帮助放在模块目录</h2>\\n<p>例如 practice：</p>\\n<pre><code class=\\"language-text\\">modes/practice/\\n├── runtime.cfg\\n├── settings.cfg\\n├── keymap.cfg\\n├── with-keymap.cfg\\n└── help.cfg\\n</code></pre>\\n<p>命令实现、设置、键位和术语说明位于同一模块目录。维护某个功能时不需要在全局帮助文件中反向查找。</p>\\n<h2 id=\\"帮助不会自动执行模块\\">帮助不会自动执行模块</h2>\\n<p><code>srp_help_demo</code> 只展示 Demo/HLAE 术语，不会启用 HLAE 设置，也不会执行 <code>binddefaults</code>。真正应用功能仍需使用 <code>srp_demo</code> 或 <code>srp_demo_keys</code>。</p>\\n<p>同理，查看 <code>srp_help_reset</code> 不会执行重置。</p>","toc":[{"title":"总入口","url":"#总入口","items":[]},{"title":"为什么帮助放在模块目录","url":"#为什么帮助放在模块目录","items":[]},{"title":"帮助不会自动执行模块","url":"#帮助不会自动执行模块","items":[]}]},{"title":"knife 功能","description":"匕首模型切换，支持 21 种刀具模型预览","slug":"knife","content":"<blockquote>\\n<p>模块目录：<code>srp-cfg/features/knife/</code></p>\\n</blockquote>\\n<h2 id=\\"简介\\">简介</h2>\\n<p>knife 模块允许在练习模式下通过控制台切换 21 种匕首模型，用于预览不同刀具的外观和检视动画。它使用 <code>subclass_create</code> 命令在准星位置生成对应模型。</p>\\n<h2 id=\\"激活方式\\">激活方式</h2>\\n<p>推荐输入 <code>srp_knife</code>。Default 案例中可按 <code>J</code> 键加载。加载后你可以随时按住 <code>J</code> 键一键轮换这 20 把刀，或者在控制台输入对应编号的指令（如 <code>+srp_knife_507</code>）指定切换。</p>\\n<h2 id=\\"使用方法\\">使用方法</h2>\\n<ol>\\n<li>进入自建房或跑图服务器</li>\\n<li>输入 <code>srp_knife</code>（应用 Default 案例时也可直接按 <code>J</code> 触发）</li>\\n<li>随后按一次 <code>J</code> 键就会自动循环到下一把刀，也可在控制台通过 <code>+srp_knife_507</code> 直接调用。</li>\\n<li>按 <code>F</code> 检视刀具外观</li>\\n</ol>\\n<h2 id=\\"刀具模型列表\\">刀具模型列表</h2>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">编号</th><th align=\\"left\\">刀具模型</th><th align=\\"left\\">英文名</th></tr></thead><tbody><tr><td align=\\"left\\">500</td><td align=\\"left\\">刺刀</td><td align=\\"left\\">Bayonet</td></tr><tr><td align=\\"left\\">503</td><td align=\\"left\\">海豹短刀</td><td align=\\"left\\">Seal Knife</td></tr><tr><td align=\\"left\\">505</td><td align=\\"left\\">折叠刀</td><td align=\\"left\\">Flip Knife</td></tr><tr><td align=\\"left\\">506</td><td align=\\"left\\">穿肠刀</td><td align=\\"left\\">Gut Knife</td></tr><tr><td align=\\"left\\">507</td><td align=\\"left\\">爪子刀</td><td align=\\"left\\">Karambit</td></tr><tr><td align=\\"left\\">508</td><td align=\\"left\\">M9 刺刀</td><td align=\\"left\\">M9 Bayonet</td></tr><tr><td align=\\"left\\">509</td><td align=\\"left\\">猎杀者匕首</td><td align=\\"left\\">Huntsman</td></tr><tr><td align=\\"left\\">512</td><td align=\\"left\\">弯刀</td><td align=\\"left\\">Bowie</td></tr><tr><td align=\\"left\\">514</td><td align=\\"left\\">鲍伊猎刀</td><td align=\\"left\\">Bear Knife</td></tr><tr><td align=\\"left\\">515</td><td align=\\"left\\">蝴蝶刀</td><td align=\\"left\\">Butterfly</td></tr><tr><td align=\\"left\\">516</td><td align=\\"left\\">暗影双匕</td><td align=\\"left\\">Shadow Daggers</td></tr><tr><td align=\\"left\\">517</td><td align=\\"left\\">系绳匕首</td><td align=\\"left\\">Paracord</td></tr><tr><td align=\\"left\\">518</td><td align=\\"left\\">求生匕首</td><td align=\\"left\\">Survival</td></tr><tr><td align=\\"left\\">519</td><td align=\\"left\\">熊刀</td><td align=\\"left\\">Ursus</td></tr><tr><td align=\\"left\\">520</td><td align=\\"left\\">折刀</td><td align=\\"left\\">Falchion</td></tr><tr><td align=\\"left\\">521</td><td align=\\"left\\">流浪者匕首</td><td align=\\"left\\">Nomad</td></tr><tr><td align=\\"left\\">522</td><td align=\\"left\\">短剑</td><td align=\\"left\\">Stiletto</td></tr><tr><td align=\\"left\\">523</td><td align=\\"left\\">锯齿爪刀</td><td align=\\"left\\">Classic</td></tr><tr><td align=\\"left\\">524</td><td align=\\"left\\">默认匕首</td><td align=\\"left\\">Default</td></tr><tr><td align=\\"left\\">525</td><td align=\\"left\\">骷髅匕首</td><td align=\\"left\\">Skeleton</td></tr><tr><td align=\\"left\\">526</td><td align=\\"left\\">尼泊尔</td><td align=\\"left\\">Kukri</td></tr></tbody></table>\\n<h2 id=\\"相关文件\\">相关文件</h2>\\n<ul>\\n<li><a href=\\"/docs/autoexec\\">autoexec.cfg</a> — v3 Runtime、内置 Preset 与用户层入口</li>\\n</ul>\\n<h2 id=\\"注意事项\\">注意事项</h2>\\n<ul>\\n<li>2025 年 8 月 15 日更新后，原来的 knife 命令不再适用，新版使用 <code>subclass_create</code> 命令实现</li>\\n<li>此功能仅在作弊模式下有效（需要 sv_cheats 1）</li>\\n<li>生成的刀具在准星位置出现，可按 <code>F</code> 检视</li>\\n</ul>","toc":[{"title":"简介","url":"#简介","items":[]},{"title":"激活方式","url":"#激活方式","items":[]},{"title":"使用方法","url":"#使用方法","items":[]},{"title":"刀具模型列表","url":"#刀具模型列表","items":[]},{"title":"相关文件","url":"#相关文件","items":[]},{"title":"注意事项","url":"#注意事项","items":[]}]},{"title":"practice 模式","description":"自建房跑图配置，含出生点传送、Bot 控制、道具练习等工具","slug":"practice","content":"<blockquote>\\n<p>设置文件：<code>srp-cfg/modes/practice/settings.cfg</code></p>\\n</blockquote>\\n<h2 id=\\"简介\\">简介</h2>\\n<p>practice 模式提供完整的跑图练习环境，包括作弊模式开启、出生点传送、Bot 控制、道具轨迹预测、竞技模拟等功能。需要在自建房（开启作弊）中使用。</p>\\n<p>出生点预设参考于 <a href=\\"https://github.com/Bad0RANG3/CS2PraticeCFG\\">Bad0RANG3</a>。</p>\\n<h2 id=\\"激活方式\\">激活方式</h2>\\n<p>推荐在控制台输入 <code>srp_practice</code>。该入口只加载练习设置，不改写 F 键、方向键、鼠标侧键等实体绑定。</p>\\n<p>需要整套练习快捷键时输入 <code>srp_practice_keys</code>。它先加载设置，再执行 <code>keymap.cfg</code>。Default 案例把 <code>P</code> 绑定到这个 Runtime 命令。</p>\\n<h2 id=\\"两层结构\\">两层结构</h2>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">文件</th><th align=\\"left\\">内容</th><th align=\\"left\\">VCFG 影响</th></tr></thead><tbody><tr><td align=\\"left\\"><code>srp-cfg/modes/practice/runtime.cfg</code></td><td align=\\"left\\"><code>spawn</code>、<code>gkd</code>、<code>gg</code> 等持久 alias</td><td align=\\"left\\">只注册命令，不改变状态</td></tr><tr><td align=\\"left\\"><code>srp-cfg/modes/practice/settings.cfg</code></td><td align=\\"left\\">服务器、Bot、轨迹等设置</td><td align=\\"left\\">主要是当前会话/服务器状态</td></tr><tr><td align=\\"left\\"><code>srp-cfg/modes/practice/keymap.cfg</code></td><td align=\\"left\\">F1-F12、方向键、N、K、L、鼠标侧键等绑定</td><td align=\\"left\\">会写入 user keys VCFG</td></tr><tr><td align=\\"left\\"><code>srp-cfg/modes/practice/with-keymap.cfg</code></td><td align=\\"left\\">按顺序组合 settings 与 keymap</td><td align=\\"left\\">会应用上述两类结果</td></tr><tr><td align=\\"left\\"><code>srp-cfg/modes/practice/help.cfg</code></td><td align=\\"left\\">控制台黑话与入口说明</td><td align=\\"left\\">仅输出帮助</td></tr></tbody></table>\\n<h2 id=\\"可选按键表\\">可选按键表</h2>\\n<p>下表只有在执行 <code>srp_practice_keys</code> 后才生效；<code>srp_practice</code> 不会占用这些键。</p>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">功能</th><th align=\\"left\\">快捷键</th><th align=\\"left\\">控制台别名</th></tr></thead><tbody><tr><td align=\\"left\\">切换队友头顶显示</td><td align=\\"left\\"><code>ralt</code></td><td align=\\"left\\"><code>srp_prac_teamid</code></td></tr><tr><td align=\\"left\\">弹着点与道具轨迹预测</td><td align=\\"left\\"><code>↑</code></td><td align=\\"left\\"><code>switch-impactsNpreview</code></td></tr><tr><td align=\\"left\\">杀死 Bot</td><td align=\\"left\\"><code>↓</code></td><td align=\\"left\\"><code>srp_prac_bot_kill</code></td></tr><tr><td align=\\"left\\">重新开始</td><td align=\\"left\\"><code>→</code></td><td align=\\"left\\"><code>srp_prac_restart</code></td></tr><tr><td align=\\"left\\">补全护甲</td><td align=\\"left\\"><code>F1</code></td><td align=\\"left\\"><code>srp_prac_armor</code></td></tr><tr><td align=\\"left\\">自动回血</td><td align=\\"left\\"><code>F2</code></td><td align=\\"left\\"><code>srp_prac_regen</code></td></tr><tr><td align=\\"left\\">切换人称视角</td><td align=\\"left\\"><code>F3</code></td><td align=\\"left\\"><code>switchperson</code></td></tr><tr><td align=\\"left\\">添加 Bot</td><td align=\\"left\\"><code>F4</code></td><td align=\\"left\\"><code>srp_prac_bot_add</code></td></tr><tr><td align=\\"left\\">使 Bot 蹲下</td><td align=\\"left\\"><code>F5</code></td><td align=\\"left\\"><code>srp_prac_bot_crouch</code></td></tr><tr><td align=\\"left\\">使 Bot 模仿操作</td><td align=\\"left\\"><code>F6</code></td><td align=\\"left\\"><code>srp_prac_bot_mimic</code></td></tr><tr><td align=\\"left\\">视角放大镜</td><td align=\\"left\\"><code>F7</code></td><td align=\\"left\\"><code>srp_prac_fov</code></td></tr><tr><td align=\\"left\\">删除 Bot</td><td align=\\"left\\"><code>F8</code></td><td align=\\"left\\"><code>srp_prac_bot_kick</code></td></tr><tr><td align=\\"left\\">友伤状态</td><td align=\\"left\\"><code>F9</code></td><td align=\\"left\\"><code>srp_prac_teammates_enemies</code></td></tr><tr><td align=\\"left\\">Bhop 连跳</td><td align=\\"left\\"><code>F12</code></td><td align=\\"left\\"><code>srp_prac_bhop</code></td></tr><tr><td align=\\"left\\">重现最近一次道具</td><td align=\\"left\\"><code>L</code></td><td align=\\"left\\"><code>srp_prac_rethrow</code></td></tr><tr><td align=\\"left\\">加速时间流逝</td><td align=\\"left\\"><code>0</code></td><td align=\\"left\\"><code>+Pucci</code></td></tr><tr><td align=\\"left\\">放置 Bot</td><td align=\\"left\\"><code>MOUSE5</code></td><td align=\\"left\\"><code>srp_prac_bot_place</code></td></tr><tr><td align=\\"left\\">飞行模式</td><td align=\\"left\\"><code>N</code></td><td align=\\"left\\"><code>srp_prac_noclip</code></td></tr><tr><td align=\\"left\\">显示速度信息</td><td align=\\"left\\"><code>K</code></td><td align=\\"left\\"><code>srp_prac_showpos</code></td></tr><tr><td align=\\"left\\">实体显示</td><td align=\\"left\\"><code>.</code></td><td align=\\"left\\"><code>srp_prac_aoproxy</code></td></tr><tr><td align=\\"left\\">弹夹容量状态（无限弹药切换）</td><td align=\\"left\\"><code>/</code></td><td align=\\"left\\"><code>srp_prac_infammo</code></td></tr><tr><td align=\\"left\\">清除场上投掷物</td><td align=\\"left\\"><code>,</code></td><td align=\\"left\\"><code>srp_prac_clear_grenades</code></td></tr><tr><td align=\\"left\\">清除地图指南标识</td><td align=\\"left\\"><code>rshift</code></td><td align=\\"left\\">-</td></tr><tr><td align=\\"left\\">标准实战模拟</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>gkd</code></td></tr><tr><td align=\\"left\\">恢复跑图模式</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>gg</code></td></tr><tr><td align=\\"left\\">加载出生点预设</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>spawn</code></td></tr><tr><td align=\\"left\\">任意处安包</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>plant</code></td></tr><tr><td align=\\"left\\">投掷物轨迹/X光开关</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>xray</code></td></tr></tbody></table>\\n<h2 id=\\"竞技模拟\\">竞技模拟</h2>\\n<p>使用 <code>gkd</code> 命令可以快速切换到类竞技环境（关闭作弊、关闭无限弹药、关闭自动复活、冻结时间 4 秒、重新开始），用于测试道具在实战条件下的效果。</p>\\n<p>使用 <code>gg</code> 命令可恢复跑图模式（开启作弊、自动复活、无限弹药、全队语音、任意地点购买）。</p>\\n<h2 id=\\"出生点预设系统\\">出生点预设系统</h2>\\n<h3 id=\\"使用方法\\">使用方法</h3>\\n<ol>\\n<li>在跑图模式下（推荐输入 <code>srp_practice</code>），控制台输入 <code>spawn</code></li>\\n<li>输入地图别名（如 <code>inferno</code>、<code>dust2</code>）加载对应地图的出生点</li>\\n<li>输入出生位别名（如 <code>CT1</code>、<code>T3</code>）传送到指定出生点</li>\\n</ol>\\n<h3 id=\\"支持地图\\">支持地图</h3>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">地图</th><th align=\\"left\\">控制台别名</th></tr></thead><tbody><tr><td align=\\"left\\">炼狱小镇</td><td align=\\"left\\"><code>inferno</code></td></tr><tr><td align=\\"left\\">沙漠 2</td><td align=\\"left\\"><code>dust2</code></td></tr><tr><td align=\\"left\\">荒漠迷城</td><td align=\\"left\\"><code>mirage</code></td></tr><tr><td align=\\"left\\">远古遗迹</td><td align=\\"left\\"><code>ancient</code></td></tr><tr><td align=\\"left\\">核子危机</td><td align=\\"left\\"><code>nuke</code></td></tr><tr><td align=\\"left\\">殒命大厦</td><td align=\\"left\\"><code>vertigo</code></td></tr><tr><td align=\\"left\\">阿努比斯</td><td align=\\"left\\"><code>anubis</code></td></tr><tr><td align=\\"left\\">办公室</td><td align=\\"left\\"><code>office</code></td></tr><tr><td align=\\"left\\">意大利</td><td align=\\"left\\"><code>italy</code></td></tr><tr><td align=\\"left\\">列车停放站</td><td align=\\"left\\"><code>train</code></td></tr><tr><td align=\\"left\\">死亡游乐园</td><td align=\\"left\\"><code>overpass</code></td></tr></tbody></table>\\n<h3 id=\\"出生位说明\\">出生位说明</h3>\\n<p>每张地图有 CT（警察）和 T（匪徒）两组出生点，分别用 CT1<del>CT15 和 T1</del>T15 命名。不同地图的出生点数量不同，输入不存在的编号会提示错误。</p>\\n<h3 id=\\"预设文件\\">预设文件</h3>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">文件</th><th align=\\"left\\">说明</th></tr></thead><tbody><tr><td align=\\"left\\"><code>srp-cfg/modes/practice/spawn/spawn.cfg</code></td><td align=\\"left\\">路由文件，定义地图别名</td></tr><tr><td align=\\"left\\"><code>srp-cfg/modes/practice/spawn/init_spawns.cfg</code></td><td align=\\"left\\">初始化文件，重置所有出生位</td></tr><tr><td align=\\"left\\"><code>srp-cfg/modes/practice/spawn/*.cfg</code></td><td align=\\"left\\">11 张地图的出生点坐标</td></tr></tbody></table>\\n<h2 id=\\"相关文件\\">相关文件</h2>\\n<ul>\\n<li><a href=\\"/docs/autoexec\\">autoexec.cfg</a> — v3 Runtime、内置 Preset 与用户层入口</li>\\n<li><a href=\\"/docs/pwa_prac\\">pwa-prac 完美跑图模式</a> — 专为完美平台跑图服设计的按键映射</li>\\n<li><a href=\\"/docs/guidemake\\">guidemake 模式</a> — 地图指南制作（配合跑图使用）</li>\\n</ul>\\n<h2 id=\\"注意事项\\">注意事项</h2>\\n<ul>\\n<li><code>srp_practice</code> 不会加载实体按键；<code>srp_practice_keys</code> 的按键会被 CS2 保存到 VCFG，离开地图不会自动恢复</li>\\n<li>练习按键表与正常对局键位冲突时，后执行的绑定优先</li>\\n<li>出生点传送仅在已配置的 11 张地图上有效</li>\\n<li><code>gkd</code> 命令会关闭作弊模式，恢复竞技条件</li>\\n</ul>","toc":[{"title":"简介","url":"#简介","items":[]},{"title":"激活方式","url":"#激活方式","items":[]},{"title":"两层结构","url":"#两层结构","items":[]},{"title":"可选按键表","url":"#可选按键表","items":[]},{"title":"竞技模拟","url":"#竞技模拟","items":[]},{"title":"出生点预设系统","url":"#出生点预设系统","items":[{"title":"使用方法","url":"#使用方法","items":[]},{"title":"支持地图","url":"#支持地图","items":[]},{"title":"出生位说明","url":"#出生位说明","items":[]},{"title":"预设文件","url":"#预设文件","items":[]}]},{"title":"相关文件","url":"#相关文件","items":[]},{"title":"注意事项","url":"#注意事项","items":[]}]},{"title":"preview 模式","description":"饰品截图模式，含景深、FOV 调节、摄像机锁定","slug":"previewmode","content":"<blockquote>\\n<p>设置文件：<code>srp-cfg/modes/preview/settings.cfg</code></p>\\n</blockquote>\\n<h2 id=\\"简介\\">简介</h2>\\n<p>preview 模式提供饰品截图专用的预设环境。加载后自动关闭 HUD、开启景深效果、拉长 FOV、固定摄像机视角，方便拍摄饰品检视截图。</p>\\n<p>需要在自建房或作弊服务器中使用（需要 sv_cheats 权限）。</p>\\n<h2 id=\\"激活方式\\">激活方式</h2>\\n<p>推荐输入 <code>srp_preview</code>，只应用预览模式设置。需要快捷键表时输入 <code>srp_preview_keys</code>，它会额外重绑方向键、<code>-</code>、<code>=</code>、<code>Z/X/C/V</code>；Default 案例中的 <code>9</code> 键调用该命令。</p>\\n<h2 id=\\"首次加载预设\\">首次加载预设</h2>\\n<p>加载时自动应用以下设置：</p>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">预设项</th><th align=\\"left\\">初始状态</th><th align=\\"left\\">说明</th></tr></thead><tbody><tr><td align=\\"left\\">HUD</td><td align=\\"left\\">关闭</td><td align=\\"left\\">消除界面干扰，画面更干净</td></tr><tr><td align=\\"left\\">景深 (DOF)</td><td align=\\"left\\">开启</td><td align=\\"left\\">模拟相机虚化效果，突出饰品主体</td></tr><tr><td align=\\"left\\">FOV</td><td align=\\"left\\">110</td><td align=\\"left\\">拉长视角，显示更多画面</td></tr><tr><td align=\\"left\\">摄像机</td><td align=\\"left\\">固定</td><td align=\\"left\\">视角不会随鼠标移动，便于构图</td></tr></tbody></table>\\n<h2 id=\\"可选按键表\\">可选按键表</h2>\\n<p>下表快捷键仅在执行 <code>srp_preview_keys</code> 后生效。使用 <code>srp_preview</code> 时，可通过 settings 文件定义的 alias 或控制台命令操作，不会自动占用这些实体键。</p>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">功能</th><th align=\\"left\\">快捷键</th><th align=\\"left\\">控制台别名</th></tr></thead><tbody><tr><td align=\\"left\\">FOV 视角调节</td><td align=\\"left\\"><code>↓</code></td><td align=\\"left\\"><code>changefov</code></td></tr><tr><td align=\\"left\\">向左旋转视角</td><td align=\\"left\\"><code>-</code></td><td align=\\"left\\"><code>changeang--</code></td></tr><tr><td align=\\"left\\">向右旋转视角</td><td align=\\"left\\"><code>=</code></td><td align=\\"left\\"><code>changeang++</code></td></tr><tr><td align=\\"left\\">开关 HUD</td><td align=\\"left\\"><code>z</code></td><td align=\\"left\\"><code>srp_preview_hud</code></td></tr><tr><td align=\\"left\\">是否固定摄像机视角</td><td align=\\"left\\"><code>x</code></td><td align=\\"left\\"><code>srp_preview_lock</code></td></tr><tr><td align=\\"left\\">是否开启景深</td><td align=\\"left\\"><code>c</code></td><td align=\\"left\\"><code>srp_preview_dof</code></td></tr><tr><td align=\\"left\\">调节景深深度</td><td align=\\"left\\"><code>v</code></td><td align=\\"left\\"><code>changeblur</code></td></tr><tr><td align=\\"left\\">恢复默认设置</td><td align=\\"left\\">-</td><td align=\\"left\\"><code>depre</code></td></tr></tbody></table>\\n<h2 id=\\"景深参数说明\\">景深参数说明</h2>\\n<p>按 <code>v</code> 键循环切换以下景深深度：</p>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">深度值</th><th align=\\"left\\">效果</th></tr></thead><tbody><tr><td align=\\"left\\">50</td><td align=\\"left\\">极浅景深，背景严重虚化</td></tr><tr><td align=\\"left\\">100</td><td align=\\"left\\">浅景深</td></tr><tr><td align=\\"left\\">500</td><td align=\\"left\\">中等景深</td></tr><tr><td align=\\"left\\">1000</td><td align=\\"left\\">默认景深，推荐使用</td></tr><tr><td align=\\"left\\">3000</td><td align=\\"left\\">极深景深，画面几乎全清晰</td></tr></tbody></table>\\n<h2 id=\\"恢复正常\\">恢复正常</h2>\\n<p>控制台输入 <code>depre</code> 可一键恢复所有设置为默认状态（HUD 开启、景深关闭、FOV 重置、摄像机解锁）。</p>\\n<h2 id=\\"相关文件\\">相关文件</h2>\\n<ul>\\n<li><a href=\\"/docs/autoexec\\">autoexec.cfg</a> — v3 Runtime、内置 Preset 与用户层入口</li>\\n</ul>\\n<h2 id=\\"注意事项\\">注意事项</h2>\\n<ul>\\n<li>仅在自建房/作弊服务器中有效（需要 sv_cheats 1）</li>\\n<li>恢复默认请使用 <code>depre</code> 命令，而非手动逐项调整</li>\\n<li><code>_keys</code> 入口产生的实体绑定会进入 user keys VCFG；<code>depre</code> 恢复画面设置，不负责恢复全部按键</li>\\n</ul>","toc":[{"title":"简介","url":"#简介","items":[]},{"title":"激活方式","url":"#激活方式","items":[]},{"title":"首次加载预设","url":"#首次加载预设","items":[]},{"title":"可选按键表","url":"#可选按键表","items":[]},{"title":"景深参数说明","url":"#景深参数说明","items":[]},{"title":"恢复正常","url":"#恢复正常","items":[]},{"title":"相关文件","url":"#相关文件","items":[]},{"title":"注意事项","url":"#注意事项","items":[]}]},{"title":"pwa-prac 完美世界跑图模式","description":"专为完美世界对战平台跑图服务器设计的键位映射","slug":"pwa_prac","content":"<blockquote>\\n<p>设置文件：<code>srp-cfg/modes/pwa-prac/settings.cfg</code></p>\\n</blockquote>\\n<h2 id=\\"简介\\">简介</h2>\\n<p>完美世界对战平台的跑图服务器禁用了大部分客户端指令（如 <code>sv_cheats</code> 及其衍生命令），转而通过聊天栏指令（如 <code>.bot</code>、<code>.qy</code>、<code>.tz</code> 等）来控制跑图环境。</p>\\n<p><code>pwa-prac</code>（Perfect World Practice）模式通过配置 <code>say</code> 别名并绑定按键，完美适配了完美平台的跑图服务器功能。本模式在 <code>srp_pwa_prac_keys</code> 时接管你的工作区键位，让你可以像在本地 <code>practice</code> 模式一样，一键管理 Bot 和投掷物，无需手动输入聊天命令。</p>\\n<h2 id=\\"激活方式\\">激活方式</h2>\\n<p>推荐在进入完美跑图服务器后，按下 <code>End</code> 键，或者在控制台输入 <code>srp_pwa_prac_keys</code>。该命令会应用完美跑图的专用快捷键。</p>\\n<h2 id=\\"可选按键表\\">可选按键表</h2>\\n<p>下表只有在执行 <code>srp_pwa_prac_keys</code> 后才生效。</p>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">功能</th><th align=\\"left\\">快捷键</th><th align=\\"left\\">完美世界指令</th></tr></thead><tbody><tr><td align=\\"left\\">道具训练</td><td align=\\"left\\"><code>F1</code></td><td align=\\"left\\"><code>.u</code></td></tr><tr><td align=\\"left\\">上帝模式</td><td align=\\"left\\"><code>F2</code></td><td align=\\"left\\"><code>.god</code></td></tr><tr><td align=\\"left\\">追踪道具</td><td align=\\"left\\"><code>F3</code></td><td align=\\"left\\"><code>.cam</code></td></tr><tr><td align=\\"left\\">指令墙</td><td align=\\"left\\"><code>F4</code></td><td align=\\"left\\"><code>.menu</code></td></tr><tr><td align=\\"left\\">倒数第2颗道具复现</td><td align=\\"left\\"><code>F5</code></td><td align=\\"left\\"><code>.ct2</code></td></tr><tr><td align=\\"left\\">倒数第3颗道具复现</td><td align=\\"left\\"><code>F6</code></td><td align=\\"left\\"><code>.ct3</code></td></tr><tr><td align=\\"left\\">倒数第4颗道具复现</td><td align=\\"left\\"><code>F7</code></td><td align=\\"left\\"><code>.ct4</code></td></tr><tr><td align=\\"left\\">倒数第5颗道具复现</td><td align=\\"left\\"><code>F8</code></td><td align=\\"left\\"><code>.ct5</code></td></tr><tr><td align=\\"left\\">清除所有 Bot</td><td align=\\"left\\"><code>K</code></td><td align=\\"left\\"><code>.kickall</code></td></tr><tr><td align=\\"left\\">友伤状态开关</td><td align=\\"left\\"><code>F9</code></td><td align=\\"left\\"><code>.ys</code></td></tr><tr><td align=\\"left\\">破坏物品</td><td align=\\"left\\"><code>F10</code></td><td align=\\"left\\"><code>.break</code></td></tr><tr><td align=\\"left\\">恢复物品</td><td align=\\"left\\"><code>F11</code></td><td align=\\"left\\"><code>.recover</code></td></tr><tr><td align=\\"left\\">飞行模式</td><td align=\\"left\\"><code>N</code></td><td align=\\"left\\"><code>noclip</code></td></tr><tr><td align=\\"left\\">回到上一次投掷位置</td><td align=\\"left\\"><code>J</code></td><td align=\\"left\\"><code>.tz</code></td></tr><tr><td align=\\"left\\">最近1颗道具复现</td><td align=\\"left\\"><code>L</code></td><td align=\\"left\\"><code>.ct</code></td></tr><tr><td align=\\"left\\">清除烟雾弹</td><td align=\\"left\\"><code>,</code></td><td align=\\"left\\"><code>.qy</code></td></tr><tr><td align=\\"left\\">开关闪光弹效果</td><td align=\\"left\\"><code>.</code></td><td align=\\"left\\"><code>.sg</code></td></tr><tr><td align=\\"left\\">添加 Bot</td><td align=\\"left\\"><code>MOUSE5</code></td><td align=\\"left\\"><code>.bot</code></td></tr><tr><td align=\\"left\\">添加蹲姿 Bot</td><td align=\\"left\\"><code>RSHIFT</code></td><td align=\\"left\\"><code>pwa_bot_add_crouch</code></td></tr><tr><td align=\\"left\\">清除指向的 Bot</td><td align=\\"left\\"><code>↓</code></td><td align=\\"left\\"><code>.kick</code></td></tr><tr><td align=\\"left\\">预览窗+子弹落点</td><td align=\\"left\\"><code>↑</code></td><td align=\\"left\\"><code>.up</code> + <code>.bi</code></td></tr><tr><td align=\\"left\\">重置游戏</td><td align=\\"left\\"><code>→</code></td><td align=\\"left\\"><code>.cz</code></td></tr><tr><td align=\\"left\\">切换队友头顶标识</td><td align=\\"left\\"><code>RALT</code></td><td align=\\"left\\"><code>toggle cl_teamid_overhead_mode 1 3</code></td></tr></tbody></table>\\n<h2 id=\\"相关文件\\">相关文件</h2>\\n<ul>\\n<li><a href=\\"/docs/practice\\">practice 模式</a> — 本地自建房的完整跑图模式</li>\\n<li><code>srp-cfg/modes/pwa-prac/keymap.cfg</code> — 键位映射源文件</li>\\n</ul>","toc":[{"title":"简介","url":"#简介","items":[]},{"title":"激活方式","url":"#激活方式","items":[]},{"title":"可选按键表","url":"#可选按键表","items":[]},{"title":"相关文件","url":"#相关文件","items":[]}]},{"title":"SrP-CFG v3","description":"功能 Runtime、内置 Preset、用户配置和 VCFG 概览","slug":"srpcfg-1","content":"<h2 id=\\"v3-解决什么问题\\">v3 解决什么问题</h2>\\n<p>CS2 的 VCFG 可以保存当前键位与可归档 ConVar，却不能保存 alias 实现、多文件模块、注释和项目结构。SrP-CFG 因此引入了分层架构，将职责边界清晰划分。</p>\\n<hr>\\n<h2 id=\\"分层架构与模型\\">分层架构与模型</h2>\\n<h3 id=\\"启动调用流程\\">启动调用流程</h3>\\n<pre><code class=\\"language-text\\">CS2 载入 VCFG\\n    ↓\\nRuntime 注册能力\\n    ↓\\nUser：可选 Preset 起点 → 个人覆盖\\n    ↓\\nCS2 可保存最终状态到 VCFG / Steam Cloud\\n</code></pre>\\n<h3 id=\\"职责边界\\">职责边界</h3>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">层</th><th align=\\"left\\">负责什么</th><th align=\\"left\\">启动行为</th><th align=\\"left\\">所有者</th></tr></thead><tbody><tr><td align=\\"left\\">Runtime</td><td align=\\"left\\">公共入口、alias、功能实现</td><td align=\\"left\\">每次启动只注册能力</td><td align=\\"left\\">项目维护者</td></tr><tr><td align=\\"left\\">Preset</td><td align=\\"left\\">偏好与实体按键案例</td><td align=\\"left\\">由 User 中的 <code>srp_apply_*</code> 选择</td><td align=\\"left\\">案例作者</td></tr><tr><td align=\\"left\\">User</td><td align=\\"left\\">Preset 选择与用户最终差异</td><td align=\\"left\\">Runtime 之后执行</td><td align=\\"left\\">当前用户</td></tr><tr><td align=\\"left\\">VCFG</td><td align=\\"left\\">当前绑定与可归档 ConVar 的序列化状态</td><td align=\\"left\\">CS2 载入并可能重写</td><td align=\\"left\\">CS2 / Steam Cloud</td></tr></tbody></table>\\n<p>Preset 不是独立启动层，它是 User 层可以调用的一组 Runtime 内置资源。</p>\\n<hr>\\n<h2 id=\\"只有一个配置包\\">只有一个配置包</h2>\\n<pre><code class=\\"language-text\\">SrP-CFG_Runtime_Core.zip\\n</code></pre>\\n<p>它包含全部 Runtime、Default / Echo / YSZH / VisionL、Valve 基线、<code>user/custom.cfg</code>、Feature、Mode 和帮助文件。内置 Preset 不再对应独立 ZIP。</p>\\n<h3 id=\\"autoexec-启动只有两步\\">autoexec 启动只有两步</h3>\\n<p><code>autoexec.cfg</code> 的逻辑非常简单：</p>\\n<pre><code class=\\"language-text\\">exec srp-cfg/runtime/init.cfg\\nexecifexists srp-cfg/user/custom.cfg\\n</code></pre>\\n<ol>\\n<li><strong>Runtime 初始化</strong>：注册功能和 alias，但不主动应用普通偏好或实体键位。</li>\\n<li><strong>加载 User 配置</strong>：<code>user/custom.cfg</code> 决定是否调用一个内置 Preset，再执行用户自己的最终覆盖。</li>\\n</ol>\\n<hr>\\n<h2 id=\\"双功能使用模式\\">双功能使用模式</h2>\\n<p>用户可以根据需求选择以下两种使用模式之一：</p>\\n<h3 id=\\"1-模板只使用功能模式-runtime--vcfg\\">1. 模板/只使用功能模式 (Runtime + VCFG)</h3>\\n<p><code>custom.cfg</code> 不启用任何 <code>srp_apply_*</code>。Runtime 只提供跑图、准星查看、预览、Demo/HLAE 等功能与 alias。普通设置（如灵敏度、准星、画面等）完全交由游戏菜单、VCFG 和 Steam Cloud 自动保存与管理。</p>\\n<h3 id=\\"2-preset--用户模式-runtime--preset--user\\">2. Preset + 用户模式 (Runtime + Preset + User)</h3>\\n<p>在 <code>custom.cfg</code> 顶部选择一个 Preset 作为起点，并在下方写入个人差异：</p>\\n<pre><code class=\\"language-text\\">srp_apply_default\\n\\nsensitivity 0.95\\nbind \\"mouse5\\" \\"+voicerecord\\"\\n</code></pre>\\n<p>每次启动和执行 <code>srp_reload</code> 时，都会按相同顺序（Runtime → Preset → 个人覆盖）重放。后面的同名命令会覆盖 Preset，因此结果明确、可审查，且不需要复制或修改仓库内的案例文件。</p>\\n<hr>\\n<h2 id=\\"内置-preset\\">内置 Preset</h2>\\n<p>Default、Echo、YSZH、VisionL 位于：</p>\\n<pre><code class=\\"language-text\\">presets/&#x3C;name>/\\n├── settings.cfg   # 偏好，保留解释性注释\\n├── keymap.cfg     # 实体键位，保留布局说明\\n└── apply.cfg      # 继承与执行顺序\\n</code></pre>\\n<p>Runtime 注册了四个入口：</p>\\n<pre><code class=\\"language-text\\">srp_apply_default\\nsrp_apply_echo\\nsrp_apply_yszh\\nsrp_apply_visionl\\n</code></pre>\\n<p>每个入口只执行对应 Preset 的 <code>apply.cfg</code>，不会再次执行 User。这一单向关系既能避免 <code>custom.cfg → srp_apply_* → custom.cfg</code> 的无限递归，也能保证位于 Preset 命令之后的个人设置自然覆盖案例值。</p>\\n<hr>\\n<h2 id=\\"user-层\\">User 层</h2>\\n<p><code>srp-cfg/user/custom.cfg</code> 是当前用户唯一需要维护的文件。桌面安装器的\\"我的配置\\"页面可以直接编辑它，并在安装、更新、回滚和卸载 Runtime 时保护其内容。</p>\\n<p>文件内部采用三层分区结构：</p>\\n<pre><code class=\\"language-text\\">// ─── SrP-CFG Preset Layer ───\\n// srp_apply_default / echo / yszh / visionl\\n// ─── Preset Layer End ───\\n\\n// ─── VCFG Import Layer (timestamp) ───\\n// 从 VCFG 自动写入的按键与偏好（可一键撤销）\\n// ─── VCFG Import Layer End ───\\n\\n// ─── SrP-CFG User Layer ───\\n// 用户手动编写的个人差异\\n// ─── User Layer End ───\\n</code></pre>\\n<p>桌面安装器支持\\"写入 VCFG 当前配置\\"：读取当前 VCFG 中的按键绑定与偏好设置，对比 <code>presets/valve/settings.cfg</code> 中的 Valve 默认值后，只写入用户实际改过的项。导入结果自动插入到 Preset Layer 和 User Layer 之间，重复写入会替换上一次的内容，可随时一键撤销。</p>\\n<p>保存后在控制台执行 <code>srp_reload</code>，会重新注册 Runtime，并按 <code>custom.cfg</code> 的实际顺序重放 Preset 起点与个人覆盖。</p>\\n<hr>\\n<h2 id=\\"valve-测试基线\\">Valve 测试基线</h2>\\n<p>执行 <code>srp_reset_valve</code> 可以帮助排查问题。它会：</p>\\n<ul>\\n<li>调用当前 CS2 自带的 <code>binddefaults</code>；</li>\\n<li>恢复所有当前被 SrP-CFG 修改的可归档偏好字段；</li>\\n<li>恢复少量预览 / Demo 模式改变的会话画面字段；</li>\\n<li>保持 VCFG、Steam Cloud 元数据和 <code>cs2_video.txt</code> 不被第三方直接写入。</li>\\n</ul>\\n<p><code>presets/valve/</code> 包含了可审计的测试基线：</p>\\n<ul>\\n<li><code>keymap.cfg</code> 调用游戏自带的 <code>binddefaults</code>。</li>\\n<li><code>settings.cfg</code> 恢复所有当前被 SrP-CFG 修改的可归档偏好，并恢复少量模式会改变的会话画面字段。</li>\\n<li>不删除 VCFG、不修改 <code>_lastclouded</code>、不修改 <code>remotecache.vdf</code>、不处理 <code>cs2_video.txt</code>。</li>\\n</ul>\\n<p>它故意不执行 User，非常适合排查问题究竟来自 Valve 默认、某个 Preset、个人覆盖还是 VCFG 当前状态。测试结束后执行 <code>srp_reload</code> 即可返回正常的 Runtime → User 链。</p>\\n<hr>\\n<h2 id=\\"统一-feature--mode-结构\\">统一 Feature / Mode 结构</h2>\\n<p>项目中的功能和模式模块遵循统一的文件结构：</p>\\n<pre><code class=\\"language-text\\">&#x3C;module>/\\n├── runtime.cfg       # 只定义持久 alias，保证 VCFG 同步来的 alias 绑定在换机后仍有实现\\n├── settings.cfg      # 应用功能或模式状态，不包含顶层实体键位操作\\n├── keymap.cfg        # 只保存实体键位，便于用户审查模块会接管哪些键\\n├── with-keymap.cfg   # 严格先执行设置，再执行键位\\n└── help.cfg          # 保存控制台黑话、内部命令和使用说明\\n</code></pre>\\n<h3 id=\\"实体按键解耦\\">实体按键解耦</h3>\\n<p>模块的普通入口只应用设置，带 <code>_keys</code> 的入口才应用工作区按键。例如：</p>\\n<pre><code class=\\"language-text\\">srp_practice       // 仅开启跑图设置\\nsrp_practice_keys  // 开启设置并接管按键\\n</code></pre>\\n<p>这样用户可以灵活取用跑图、预览、指南或 HLAE 功能，而不必无条件交出实体键位控制。</p>\\n<hr>\\n<h2 id=\\"帮助系统\\">帮助系统</h2>\\n<p>每个模块都配备了 <code>help.cfg</code>。在游戏控制台输入 <code>srp_help</code> 查看索引，再使用 <code>srp_help_practice</code>、<code>srp_help_demo</code>、<code>srp_help_reset</code> 等命令可直接在控制台查看使用说明。</p>\\n<hr>\\n<h2 id=\\"目录结构\\">目录结构</h2>\\n<p>完整配置包部署到 CS2 后的目录树结构如下：</p>\\n<pre><code class=\\"language-text\\">config/\\n├── autoexec.cfg\\n├── annotations/\\n├── video/\\n└── srp-cfg/\\n    ├── runtime/      # 核心运行库\\n    ├── helps/        # 帮助系统\\n    ├── features/     # 独立功能（如准星、视频偏好）\\n    ├── modes/        # 独立模式（如跑图、预览、Demo/HLAE）\\n    ├── presets/      # 内置 Preset（如 Default, YSZH）与 Valve 基线\\n    └── user/         # 用户配置目录（包含 custom.cfg）\\n</code></pre>\\n<hr>\\n<h2 id=\\"继续阅读\\">继续阅读</h2>\\n<ul>\\n<li><a href=\\"/docs/srpcfg-3\\">使用指南</a></li>\\n<li><a href=\\"/docs/autoexec\\">autoexec.cfg</a></li>\\n<li><a href=\\"/docs/vcfg\\">VCFG 与 Steam Cloud</a></li>\\n</ul>","toc":[{"title":"v3 解决什么问题","url":"#v3-解决什么问题","items":[]},{"title":"分层架构与模型","url":"#分层架构与模型","items":[{"title":"启动调用流程","url":"#启动调用流程","items":[]},{"title":"职责边界","url":"#职责边界","items":[]}]},{"title":"只有一个配置包","url":"#只有一个配置包","items":[{"title":"autoexec 启动只有两步","url":"#autoexec-启动只有两步","items":[]}]},{"title":"双功能使用模式","url":"#双功能使用模式","items":[{"title":"1. 模板/只使用功能模式 (Runtime + VCFG)","url":"#1-模板只使用功能模式-runtime--vcfg","items":[]},{"title":"2. Preset + 用户模式 (Runtime + Preset + User)","url":"#2-preset--用户模式-runtime--preset--user","items":[]}]},{"title":"内置 Preset","url":"#内置-preset","items":[]},{"title":"User 层","url":"#user-层","items":[]},{"title":"Valve 测试基线","url":"#valve-测试基线","items":[]},{"title":"统一 Feature / Mode 结构","url":"#统一-feature--mode-结构","items":[{"title":"实体按键解耦","url":"#实体按键解耦","items":[]}]},{"title":"帮助系统","url":"#帮助系统","items":[]},{"title":"目录结构","url":"#目录结构","items":[]},{"title":"继续阅读","url":"#继续阅读","items":[]}]},{"title":"使用指南","description":"从安装 Runtime Core 到选择 Preset、维护个人配置与 Valve 重置","slug":"srpcfg-3","content":"<h2 id=\\"第一步安装唯一配置包\\">第一步：安装唯一配置包</h2>\\n<p>下载：</p>\\n<pre><code class=\\"language-text\\">SrP-CFG_Runtime_Core.zip\\n</code></pre>\\n<p>它已经包含完整 Runtime、Default / Echo / YSZH / VisionL、Valve 基线与用户配置入口，不需要再选择用户专属包或 Presets 包。</p>\\n<ol>\\n<li>启动 SrP-CFG Installer。</li>\\n<li>在“下载”页面获取 Runtime Core。</li>\\n<li>确认 Steam、CS2 与当前 Steam 账号检测正确。</li>\\n<li>CFG 目标使用推荐的 <code>game/csgo/cfg/</code>。</li>\\n<li>首次安装通常使用“覆盖安装”。</li>\\n<li>打开“我的配置”，决定下面两种模式中的一种。</li>\\n</ol>\\n<h2 id=\\"模式-a只使用-runtime-功能\\">模式 A：只使用 Runtime 功能</h2>\\n<p>在 <code>user/custom.cfg</code> 中保持所有 <code>srp_apply_*</code> 都被注释：</p>\\n<pre><code class=\\"language-text\\">// srp_apply_default\\n// srp_apply_echo\\n// srp_apply_yszh\\n// srp_apply_visionl\\n</code></pre>\\n<p>启动时 Runtime 只注册功能和 alias，不主动重放普通偏好与实体键位。你可以继续在 CS2 菜单中修改灵敏度、准星、HUD 和按键，由游戏决定如何写入 VCFG / Steam Cloud。</p>\\n<h2 id=\\"模式-bpreset-起点--个人配置\\">模式 B：Preset 起点 + 个人配置</h2>\\n<p>只启用一个起点，并把所有个人差异写在它下面：</p>\\n<pre><code class=\\"language-text\\">// ─── SrP-CFG Preset Layer ───\\nsrp_apply_yszh\\n// ─── Preset Layer End ───\\n\\n// ─── SrP-CFG User Layer ───\\n// 我的最终语音键\\nunbind \\"v\\"\\nbind \\"mouse5\\" \\"+voicerecord\\"\\n\\n// 我的灵敏度与准星\\nsensitivity 0.95\\nc06\\ncyan\\n// ─── User Layer End ───\\n</code></pre>\\n<p>每次启动都会依次执行\\"Runtime → YSZH → 个人差异\\"。后面的同名命令会覆盖 Preset，所以不需要复制或修改仓库内的 YSZH 文件。</p>\\n<h2 id=\\"以-yszh-用户为例\\">以 YSZH 用户为例</h2>\\n<p>假设你希望取得 YSZH 的灵敏度、画面、准星和偏好设置，同时保留自己的部分按键：</p>\\n<ol>\\n<li>在安装器“我的配置”页面点击 <code>srp_apply_yszh</code>。</li>\\n<li>在编辑器中检查该命令只有一行处于启用状态。</li>\\n<li>把自己的按键、灵敏度或其他差异写在它下面。</li>\\n<li>保存；若 CS2 已运行，在控制台执行 <code>srp_reload</code>。</li>\\n<li>以后需要持久保留的改动继续写在同一文件中。</li>\\n</ol>\\n<p>如果只在游戏里修改了一个被 YSZH 定义的字段，当前会话会变化，但下一次启动或 <code>srp_reload</code> 会再次应用 YSZH。此时把最终值写进 <code>custom.cfg</code>，或者注释掉 Preset 命令、改由 VCFG 管理即可。</p>\\n<h2 id=\\"default-与其他案例\\">Default 与其他案例</h2>\\n<p>可选起点为：</p>\\n<pre><code class=\\"language-text\\">srp_apply_default\\nsrp_apply_echo\\nsrp_apply_yszh\\nsrp_apply_visionl\\n</code></pre>\\n<p>点击安装器按钮只会修改尚未保存的编辑器草稿；保存后才写入磁盘。四个命令都不会再次调用 <code>custom.cfg</code>，因此可以安全地位于该文件顶部。</p>\\n<p>若在游戏控制台手动执行 <code>srp_apply_yszh</code>，只会立即应用 YSZH，不会自动补上个人覆盖。要按完整配置重新执行，请使用：</p>\\n<pre><code class=\\"language-text\\">srp_reload\\n</code></pre>\\n<h2 id=\\"从-vcfg-写入当前配置\\">从 VCFG 写入当前配置</h2>\\n<p>桌面安装器的\\"我的配置\\"页面支持\\"写入 VCFG 当前配置\\"功能：</p>\\n<ol>\\n<li>点击\\"读取 VCFG\\"，安装器只读解析当前账号的三个 VCFG 文件。</li>\\n<li>勾选要写入的类别（按键绑定、模拟轴绑定、个人偏好、机器设置）。</li>\\n<li>点击\\"写入 custom.cfg\\"，安装器对比 <code>presets/valve/settings.cfg</code> 中的 Valve 默认值，只写入你实际改过的 ConVar；按键绑定全量导出。</li>\\n<li>生成结果自动插入到 Preset Layer 和 User Layer 之间的独立分区，重复写入会替换上一次的内容。</li>\\n<li>可随时点击\\"撤销 VCFG 写入\\"一键移除导入块；撤销操作跨会话有效（标记保存在文件中）。</li>\\n</ol>\\n<p>写入后的 <code>custom.cfg</code> 布局：</p>\\n<pre><code class=\\"language-text\\">// ─── SrP-CFG Preset Layer ───\\nsrp_apply_default\\n// ─── Preset Layer End ───\\n\\n// ─── VCFG Import Layer (2026/07/12 20:30:00) ───\\nbind \\"a\\" \\"+moveleft\\"\\nsensitivity 1.5\\n// ─── VCFG Import Layer End ───\\n\\n// ─── SrP-CFG User Layer ───\\n// 手动编写的个人差异\\n// ─── User Layer End ───\\n</code></pre>\\n<p>VCFG Import Layer 中的命令位于 Preset 之后、User 之前，因此优先级低于 User Layer 中的同名命令。如果需要覆盖某个导入值，在 User Layer 中写一行新的即可。</p>\\n<h2 id=\\"回到-valve-原始测试基线\\">回到 Valve 原始测试基线</h2>\\n<p>控制台执行：</p>\\n<pre><code class=\\"language-text\\">srp_reset_valve\\n</code></pre>\\n<p>它会恢复 SrP-CFG 管理范围内的 Valve 默认偏好，并调用游戏自带 <code>binddefaults</code>。它故意不执行 User，方便在纯基线上测试。</p>\\n<p>常用变体：</p>\\n<pre><code class=\\"language-text\\">srp_reset_valve_settings\\nsrp_reset_valve_keys\\nsrp_reset_valve_user\\n</code></pre>\\n<p>重置改变的是当前游戏状态，不会删除 <code>custom.cfg</code>，也不会由安装器直接覆盖 VCFG。完成测试后执行 <code>srp_reload</code>，返回自己的 Runtime → User 链。</p>\\n<h2 id=\\"功能与按键为什么分成两个命令\\">功能与按键为什么分成两个命令</h2>\\n<p>例如：</p>\\n<pre><code class=\\"language-text\\">srp_preview       // 只应用预览设置\\nsrp_preview_keys  // 设置 + 预览工作区键位\\n</code></pre>\\n<p>practice、guidemake、demo、crosshair-view、autoview、zeus 都采用同一规则。这样可以先检查 <code>keymap.cfg</code>，再决定是否交出实体键位。</p>\\n<h2 id=\\"查看模块术语\\">查看模块术语</h2>\\n<pre><code class=\\"language-text\\">srp_help\\nsrp_help_presets\\nsrp_help_practice\\nsrp_help_guidemake\\nsrp_help_preview\\nsrp_help_demo\\nsrp_help_crosshair\\nsrp_help_reset\\n</code></pre>\\n<h2 id=\\"需求应该放在哪里\\">需求应该放在哪里</h2>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">需求</th><th align=\\"left\\">推荐位置</th></tr></thead><tbody><tr><td align=\\"left\\">只使用功能，普通设置随游戏保存</td><td align=\\"left\\">不启用 <code>srp_apply_*</code>，交给 VCFG</td></tr><tr><td align=\\"left\\">每次启动使用作者推荐值</td><td align=\\"left\\"><code>custom.cfg</code> 顶部写 <code>srp_apply_default</code></td></tr><tr><td align=\\"left\\">每次启动使用 YSZH 等案例</td><td align=\\"left\\"><code>custom.cfg</code> 顶部写相应 <code>srp_apply_*</code></td></tr><tr><td align=\\"left\\">在案例之上保留个人差异</td><td align=\\"left\\">写在同一 <code>custom.cfg</code> 的 Preset 命令之后</td></tr><tr><td align=\\"left\\">把当前游戏设置持久化到 <code>custom.cfg</code></td><td align=\\"left\\">安装器\\"写入 VCFG 当前配置\\"，自动对比 Valve 默认值</td></tr><tr><td align=\\"left\\">排查问题、回到可审计基线</td><td align=\\"left\\"><code>srp_reset_valve</code></td></tr><tr><td align=\\"left\\">分辨率、显卡和设备画质</td><td align=\\"left\\">游戏设置或 <code>cs2_video.txt</code></td></tr></tbody></table>\\n<h2 id=\\"继续阅读\\">继续阅读</h2>\\n<ul>\\n<li><a href=\\"/docs/autoexec\\">autoexec.cfg</a></li>\\n<li><a href=\\"/docs/vcfg\\">VCFG 与 Steam Cloud</a></li>\\n<li><a href=\\"/docs/practice\\">practice 模式</a></li>\\n<li><a href=\\"/docs/demo_hlae\\">Demo / HLAE</a></li>\\n</ul>","toc":[{"title":"第一步：安装唯一配置包","url":"#第一步安装唯一配置包","items":[]},{"title":"模式 A：只使用 Runtime 功能","url":"#模式-a只使用-runtime-功能","items":[]},{"title":"模式 B：Preset 起点 + 个人配置","url":"#模式-bpreset-起点--个人配置","items":[]},{"title":"以 YSZH 用户为例","url":"#以-yszh-用户为例","items":[]},{"title":"Default 与其他案例","url":"#default-与其他案例","items":[]},{"title":"从 VCFG 写入当前配置","url":"#从-vcfg-写入当前配置","items":[]},{"title":"回到 Valve 原始测试基线","url":"#回到-valve-原始测试基线","items":[]},{"title":"功能与按键为什么分成两个命令","url":"#功能与按键为什么分成两个命令","items":[]},{"title":"查看模块术语","url":"#查看模块术语","items":[]},{"title":"需求应该放在哪里","url":"#需求应该放在哪里","items":[]},{"title":"继续阅读","url":"#继续阅读","items":[]}]},{"title":"VCFG 与 Steam Cloud","description":"CS2 持久配置文件的实测结论、能力边界与 v3 设计依据","slug":"vcfg","content":"<blockquote>\\n<p>调研基线：2026-07-10。VCFG 是 CS2 管理的持久状态，不是供配置包直接分发的新版 autoexec。</p>\\n</blockquote>\\n<h2 id=\\"结论\\">结论</h2>\\n<ul>\\n<li>CFG 是命令脚本；VCFG 是游戏把当前绑定和可归档 ConVar 序列化后的状态。</li>\\n<li>CFG 放在游戏目录还是账号目录，不决定执行结果是否持久化。</li>\\n<li>VCFG 能保存“键名 → 命令字符串”，不能保存 alias 实现、多文件模块、注释或版本结构。</li>\\n<li>删除 CFG 不会撤销此前已经写入 VCFG 的值。</li>\\n<li>第三方安装器适合只读解析和外部快照，不应在 CS2 / Steam Cloud 背后覆盖 VCFG。</li>\\n</ul>\\n<h2 id=\\"观察到的文件\\">观察到的文件</h2>\\n<p>典型目录：</p>\\n<pre><code class=\\"language-text\\">Steam/userdata/&#x3C;accountId>/730/local/cfg/\\n</code></pre>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">文件</th><th align=\\"left\\">已观察内容</th><th align=\\"left\\">同步情况</th></tr></thead><tbody><tr><td align=\\"left\\"><code>cs2_user_keys_0_slot0.vcfg</code></td><td align=\\"left\\"><code>bindings</code>、<code>analogbindings</code></td><td align=\\"left\\">日志显示上传为 <code>cs2_user_keys.vcfg</code></td></tr><tr><td align=\\"left\\"><code>cs2_user_convars_0_slot0.vcfg</code></td><td align=\\"left\\">用户级 <code>convars</code></td><td align=\\"left\\">日志显示上传为 <code>cs2_user_convars.vcfg</code></td></tr><tr><td align=\\"left\\"><code>cs2_machine_convars.vcfg</code></td><td align=\\"left\\">大量机器相关 ConVar</td><td align=\\"left\\">本次 remote cache 未观察到对应云对象</td></tr><tr><td align=\\"left\\"><code>cs2_user_keys_0_slot1..3.vcfg</code></td><td align=\\"left\\">其他 split-screen slot，通常为空</td><td align=\\"left\\">由游戏决定</td></tr><tr><td align=\\"left\\"><code>cs2_video.txt</code></td><td align=\\"left\\">视频设备与画质，KeyValues 文本</td><td align=\\"left\\">独立资产，不是 VCFG</td></tr></tbody></table>\\n<p>“用户级”和“机器级”是依据当前文件内容、命名与云记录做出的工程分类，不是 Valve 对第三方承诺的永久 schema。</p>\\n<h2 id=\\"本机实测\\">本机实测</h2>\\n<p>同一台机器上三个实际 CS2 账号的 slot 0 均存在 keys、user convars、machine convars、两份 <code>_lastclouded</code> 镜像和 <code>cs2_video.txt</code>。只读解析得到：</p>\\n<ul>\\n<li>绑定数分别为 65、88、87。</li>\\n<li>用户 ConVar 均为 92。</li>\\n<li>机器 ConVar 为 336–338。</li>\\n</ul>\\n<p>数量差异说明安装器必须动态读取，不能把字段表或条目数写死。</p>\\n<p>本机 <code>game/csgo/console.log</code> 的同一启动序列还显示：</p>\\n<pre><code class=\\"language-text\\">[SplitScreen] Writing configuration for slot 0\\nSaved 'cs2_user_keys.vcfg' to SteamRemoteStorage\\nSaved 'cs2_user_convars.vcfg' to SteamRemoteStorage\\n[InputService] execing autoexec.cfg\\n[InputService] execing ...自定义 CFG\\n[SplitScreen] Writing configuration for slot 0\\nSaved 'cs2_user_keys.vcfg' to SteamRemoteStorage\\nSaved 'cs2_user_convars.vcfg' to SteamRemoteStorage\\n</code></pre>\\n<p>这证明至少在该版本中，游戏会先载入/保存账号状态，再执行 autoexec，随后再次保存。也就是说，Preset 与 User 中执行的绑定或可归档 ConVar 可能成为新的持久状态。</p>\\n<p><code>game/csgo/gameinfo.gi</code> 同时声明：</p>\\n<pre><code class=\\"language-text\\">\\"UserSettingsPathID\\" \\"USRLOCAL\\"\\n\\"UserSettingsFileEx\\" \\"cs2_\\"\\n</code></pre>\\n<p>Steam 的 <code>remotecache.vdf</code> 则列出了远端对象 <code>cs2_user_keys.vcfg</code> 与 <code>cs2_user_convars.vcfg</code>。</p>\\n<h2 id=\\"vcfg-能做什么\\">VCFG 能做什么</h2>\\n<ul>\\n<li>保存键名到命令字符串的映射。</li>\\n<li>保存游戏标记为可归档的用户或机器 ConVar。</li>\\n<li>由游戏在设置变化、启动、退出或其他时机重写。</li>\\n<li>对部分用户级状态，通过 Steam Remote Storage 跨设备同步。</li>\\n</ul>\\n<h2 id=\\"vcfg-不能做什么\\">VCFG 不能做什么</h2>\\n<ul>\\n<li>不会保存 alias 的实现。例如它可以保存 <code>bind p srp_practice_keys</code>，但不会保存 <code>srp_practice_keys</code> 如何加载 practice 模块。</li>\\n<li>不能自然表达多文件依赖、注释、发行包继承或用户层优先级。</li>\\n<li>不能保证第三方手工编辑后不被游戏或云端版本覆盖。</li>\\n<li>不能替代 <code>cs2_video.txt</code> 处理硬件相关画质。</li>\\n<li>不能让侵入式模式自动回滚按键。</li>\\n</ul>\\n<h2 id=\\"对-v3-架构的直接影响\\">对 v3 架构的直接影响</h2>\\n<h3 id=\\"alias-必须永久属于-runtime\\">Alias 必须永久属于 Runtime</h3>\\n<p>只要某个可能同步的绑定引用 <code>keyhud</code>、<code>srp_practice_keys</code>、<code>view_0</code> 或 Zeus 攻击 alias，对应定义就必须在每台机器启动时注册。v3 因此让每个模块的 <code>runtime.cfg</code> 永久注册 alias。</p>\\n<h3 id=\\"preset-与-vcfg-是不同能力\\">Preset 与 VCFG 是不同能力</h3>\\n<p>Preset 是确定性案例，VCFG 是游戏保存的当前状态。v3 不会由发行包自动选择 Preset；是否重放案例取决于用户有没有在 <code>user/custom.cfg</code> 中启用 <code>srp_apply_*</code>。</p>\\n<p>启用后，一次典型启动顺序是：VCFG 先载入当前状态，Runtime 注册能力，User 调用 Preset，随后 User 的其余命令最终覆盖。CS2 之后仍可能把结果保存回 VCFG。</p>\\n<h3 id=\\"两种模式都来自同一个-runtime-core\\">两种模式都来自同一个 Runtime Core</h3>\\n<p>不启用 <code>srp_apply_*</code> 时，Runtime 不会主动重放普通偏好和键位。用户可继续在游戏菜单中修改，由 VCFG 保存；需要明确、可审查的个性化项仍可写入 <code>user/custom.cfg</code>。</p>\\n<p>启用一个 <code>srp_apply_*</code> 时，Preset 涉及的字段会在每次启动或 <code>srp_reload</code> 时重放。游戏内修改若要跨启动保留，应写在该命令之后；若希望完全由 VCFG 管理，则停用 Preset。</p>\\n<p>在控制台单独执行 <code>srp_apply_&#x3C;name></code> 只改变当前状态，不会再次执行 User。CS2 后续是否以及何时写盘仍由游戏控制；需要重放完整 User 链时使用 <code>srp_reload</code>。</p>\\n<h3 id=\\"valve-重置仍不写-vcfg\\">Valve 重置仍不写 VCFG</h3>\\n<p><code>srp_reset_valve_keys</code> 使用游戏公开的 <code>binddefaults</code>，让当前 CS2 版本读取自己的 <code>user_keys_default.vcfg</code>。偏好重置则显式恢复 SrP-CFG 实际涉及的字段。两者都通过控制台状态改变，让 CS2 决定何时保存，不覆盖序列化文件。</p>\\n<p>本机安装与当前公开跟踪数据给出的证据是：</p>\\n<ul>\\n<li>游戏随包文件 <code>game/csgo/cfg/user_keys_default.vcfg</code> 明确提供默认 <code>bindings</code> 与 <code>analogbindings</code>。</li>\\n<li><code>engine2.dll</code> 将 <code>binddefaults</code> 描述为 <code>Bind all keys to their default values</code>；当前命令转储也把它标为 release 命令。</li>\\n<li>当前命令转储中唯一类似全局 ConVar 重置的 <code>reset_gameconvars</code> 被标为 cheat；没有可用的 <code>cvar_reset</code>。</li>\\n<li><code>machine_convars_default.vcfg</code> 本身为空，并明确要求默认值由代码或 <code>gameinfo.gi</code> 提供，因此不能把它当作完整偏好模板。</li>\\n<li><code>presets/valve/settings.cfg</code> 的默认值以当前 CS2 ConVar 转储为基线，并由校验器保证覆盖所有 SrP-CFG 实际触及的客户端偏好字段。</li>\\n</ul>\\n<p>所以 <code>srp_reset_valve</code> 的准确能力边界是“恢复当前游戏自带的默认键位，并恢复 SrP-CFG 管理范围内的 Valve 默认偏好”。它不会伪造一个 Valve 并未提供的“重置任意未知 ConVar”能力。</p>\\n<h3 id=\\"清理-convar按钮的实际含义\\">“清理 ConVar”按钮的实际含义</h3>\\n<p>Desktop“我的配置”中的“清理 ConVar”会复制 <code>srp_reset_valve_settings</code>。把它粘贴到运行中的 CS2 控制台后，游戏会执行 <code>presets/valve/settings.cfg</code>：仅把 SrP-CFG 管理的偏好恢复到已审计的 Valve 基线，再由 CS2 自己决定何时持久化。</p>\\n<p>它不是删除 VCFG 文件，也不会清空未知 ConVar。直接删除 <code>cs2_user_convars_0_slot0.vcfg</code> 仍可能被运行中的 CS2、<code>_lastclouded</code> 或 Steam Cloud 恢复；同时修改 <code>remotecache.vdf</code> 会把第三方工具带入 Steam 同步协议。因此项目不会把这种高风险文件操作包装成“干净状态”。若还要恢复键位，使用 <code>srp_reset_valve</code>；测试结束后使用 <code>srp_reload</code> 返回 User 配置。</p>\\n<h2 id=\\"安装器边界与-vcfg-写入\\">安装器边界与 VCFG 写入</h2>\\n<p>SrP-CFG Installer 会：</p>\\n<ol>\\n<li>只读统计 bindings、analog bindings、用户 ConVar 与机器 ConVar。</li>\\n<li>支持\\"写入 VCFG 当前配置\\"功能：只读解析 VCFG 文件，对比 <code>presets/valve/settings.cfg</code>（Valve 基准线），只过滤出用户修改过的 ConVar 命令写入 <code>custom.cfg</code> 的独立分区（按键绑定全量导出）。重复导入会自动替换旧块，并支持一键撤销（撤销标记保存在文件中，跨会话有效）。</li>\\n<li>在安装可能应用偏好或键位的未知自定义 CFG 前保存账号级 JSON 基线。</li>\\n<li>阻止 <code>.vcfg</code>、<code>.vcfg_lastclouded</code> 与 <code>remotecache.vdf</code> 进入暂存和发行包。</li>\\n<li>明确区分 Runtime 回滚、安装前原文件、User 保护与 VCFG 状态快照。</li>\\n</ol>\\n<p>安装器不会：</p>\\n<ol>\\n<li>直写或覆盖游戏的 <code>.vcfg</code> 序列化文件。</li>\\n<li>修改 <code>_lastclouded</code> 镜像。</li>\\n<li>修改 <code>remotecache.vdf</code>。</li>\\n</ol>\\n<p>这种\\"读取 VCFG 生成 CFG 文本追加到 <code>custom.cfg</code>，让游戏启动时自己执行命令\\"的设计，既保证了 VCFG 被破坏时的安全边界，又实现了偏好的可视化与持久化。</p>\\n<h2 id=\\"公开资料与能力边界\\">公开资料与能力边界</h2>\\n<ul>\\n<li>Steam Cloud 的一般同步机制：<a href=\\"https://partner.steamgames.com/doc/features/cloud\\">Steamworks Cloud 文档</a></li>\\n<li>KeyValues 格式背景：<a href=\\"https://developer.valvesoftware.com/wiki/KeyValues\\">Valve Developer Community — KeyValues</a></li>\\n<li>当前 CS2 默认键位文件镜像：<a href=\\"https://github.com/SteamDatabase/GameTracking-CS2/blob/master/game/csgo/cfg/user_keys_default.vcfg\\">GameTracking-CS2 — user_keys_default.vcfg</a></li>\\n<li>当前 CS2 命令及权限标记：<a href=\\"https://github.com/SteamDatabase/GameTracking-CS2/blob/master/DumpSource2/commands.txt\\">GameTracking-CS2 — commands.txt</a></li>\\n<li>当前 CS2 ConVar 默认值与标记：<a href=\\"https://github.com/SteamDatabase/GameTracking-CS2/blob/master/DumpSource2/convars.txt\\">GameTracking-CS2 — convars.txt</a></li>\\n</ul>\\n<p>Valve 目前没有公开一份面向第三方工具、承诺长期稳定的 CS2 VCFG schema。文件名、节点层级、slot 规则、字段归属和保存时机都可能随游戏更新改变，所以解析器必须容错、未知节点不作假设。</p>","toc":[{"title":"结论","url":"#结论","items":[]},{"title":"观察到的文件","url":"#观察到的文件","items":[]},{"title":"本机实测","url":"#本机实测","items":[]},{"title":"VCFG 能做什么","url":"#vcfg-能做什么","items":[]},{"title":"VCFG 不能做什么","url":"#vcfg-不能做什么","items":[]},{"title":"对 v3 架构的直接影响","url":"#对-v3-架构的直接影响","items":[{"title":"Alias 必须永久属于 Runtime","url":"#alias-必须永久属于-runtime","items":[]},{"title":"Preset 与 VCFG 是不同能力","url":"#preset-与-vcfg-是不同能力","items":[]},{"title":"两种模式都来自同一个 Runtime Core","url":"#两种模式都来自同一个-runtime-core","items":[]},{"title":"Valve 重置仍不写 VCFG","url":"#valve-重置仍不写-vcfg","items":[]},{"title":"“清理 ConVar”按钮的实际含义","url":"#清理-convar按钮的实际含义","items":[]}]},{"title":"安装器边界与 VCFG 写入","url":"#安装器边界与-vcfg-写入","items":[]},{"title":"公开资料与能力边界","url":"#公开资料与能力边界","items":[]}]},{"title":"zeus 功能","description":"电击枪自动切换，使用后自动切回主/副武器","slug":"zeus","content":"<blockquote>\\n<p>模块目录：<code>srp-cfg/features/zeus/</code></p>\\n</blockquote>\\n<h2 id=\\"简介\\">简介</h2>\\n<p>zeus 模块实现电击枪使用后自动切回主武器或副武器。左键发射电击枪后自动切换回枪械，手持电击枪时右键则不使用电击枪、直接切回枪械。</p>\\n<p>该功能避免了电击枪使用后需要手动切枪的延迟，在实战中能更快恢复火力。</p>\\n<h2 id=\\"激活方式\\">激活方式</h2>\\n<p>输入 <code>srp_zeus</code> 只刷新攻击 alias，不修改实体键。输入 <code>srp_zeus_keys</code> 才会安装 1-5/Q 工作键表；简写 <code>zeus</code> 指向带按键入口。</p>\\n<p>功能与键位现已拆分到 <code>settings.cfg</code> 与 <code>keymap.cfg</code>，便于先审查再启用。</p>\\n<h2 id=\\"工作原理\\">工作原理</h2>\\n<p>通过重绑鼠标按键实现自动切换：</p>\\n<ol>\\n<li>按下 4 键选择电击枪时，mouse1/mouse2 被替换为自定义 alias</li>\\n<li>左键释放后自动执行 <code>slot2;slot1</code> 切回枪械</li>\\n<li>右键按下时直接执行 <code>slot2;slot1</code>（不触发电击枪攻击）</li>\\n<li>切回后自动恢复 mouse1/mouse2 的默认攻击绑定</li>\\n</ol>\\n<p>同时重绑按键 1-5 和 Q 键，确保从电击枪切换到任意武器后按键状态正确。</p>\\n<h2 id=\\"受影响的按键\\">受影响的按键</h2>\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n<table><thead><tr><th align=\\"left\\">按键</th><th align=\\"left\\">功能变化</th></tr></thead><tbody><tr><td align=\\"left\\">1</td><td align=\\"left\\">主武器 + 恢复攻击绑定</td></tr><tr><td align=\\"left\\">2</td><td align=\\"left\\">副武器 + 恢复攻击绑定</td></tr><tr><td align=\\"left\\">3</td><td align=\\"left\\">匕首 + 恢复攻击绑定</td></tr><tr><td align=\\"left\\">4</td><td align=\\"left\\">选择电击枪 + 启用自动切换机制</td></tr><tr><td align=\\"left\\">5</td><td align=\\"left\\">C4 + 恢复攻击绑定</td></tr><tr><td align=\\"left\\">Q</td><td align=\\"left\\">切换最近武器 + 恢复攻击绑定</td></tr></tbody></table>\\n<h2 id=\\"相关文件\\">相关文件</h2>\\n<ul>\\n<li><a href=\\"/docs/autoexec\\">autoexec.cfg</a> — v3 Runtime、内置 Preset 与用户层说明</li>\\n</ul>\\n<h2 id=\\"注意事项\\">注意事项</h2>\\n<ul>\\n<li>加载后按键 1-5、Q、MOUSE1、MOUSE2 的命令字符串可能写入 user keys VCFG</li>\\n<li>重新加载 Runtime 不会恢复原按键；可执行 <code>srp_reset_valve_keys</code> 或应用自己的 Preset/User</li>\\n<li>4 键必须绑定为电击枪（slot11），否则自动切换不会触发</li>\\n<li>电击枪充电完成有声音提示，注意利用该声音做战术调整，或直接丢弃电击枪避免暴露位置</li>\\n</ul>","toc":[{"title":"简介","url":"#简介","items":[]},{"title":"激活方式","url":"#激活方式","items":[]},{"title":"工作原理","url":"#工作原理","items":[]},{"title":"受影响的按键","url":"#受影响的按键","items":[]},{"title":"相关文件","url":"#相关文件","items":[]},{"title":"注意事项","url":"#注意事项","items":[]}]}]`);
const docs$1 = docsJson;
const take = (ids) => ids.map((id) => docs$1.find((doc) => doc.slug === id)).filter((d) => Boolean(d));
const guideOrder = ["srpcfg-1", "srpcfg-3", "autoexec", "vcfg"];
const featureOrder = ["crosshair_view", "autoview", "knife", "zeus"];
const modeOrder = ["practice", "previewmode", "guidemake", "demo_hlae"];
const referenceOrder = ["helps", "cs2_video"];
const known = /* @__PURE__ */ new Set([...guideOrder, ...featureOrder, ...modeOrder, ...referenceOrder]);
const remaining = docs$1.filter((doc) => !known.has(doc.slug) && doc.slug !== "srpcfg-2");
const navGroups = [
  { label: "开始与原理", docs: take(guideOrder) },
  { label: "功能", docs: take(featureOrder) },
  { label: "模式", docs: take(modeOrder) },
  { label: "参考", docs: [...take(referenceOrder), ...remaining] }
].filter((group) => group.docs.length > 0);
const orderedDocs = navGroups.flatMap((group) => group.docs);
const indexGroups = [
  {
    label: "开始与原理",
    description: "安装之前先理解启动顺序、用户层和 CS2 持久状态。",
    docs: take(["srpcfg-1", "srpcfg-3", "autoexec", "vcfg"])
  },
  {
    label: "常驻功能",
    description: "按需启用准星、视角、刀具与 Zeus 能力。",
    docs: take(["crosshair_view", "autoview", "knife", "zeus"])
  },
  {
    label: "会话模式",
    description: "进入跑图、预览、地图指南或 Demo/HLAE 工作区。",
    docs: take(["practice", "previewmode", "guidemake", "demo_hlae"])
  },
  {
    label: "资源与参考",
    description: "查询控制台帮助、视频预设和地图 Annotation 资源。",
    docs: take(["helps", "cs2_video", "annotations", "pwa_prac"])
  }
];
new Map(docs$1.map((doc) => [doc.slug, doc]));
const meta$1 = () => [{
  title: "文档中心 — SrP-CFG"
}, {
  name: "description",
  content: "SrP-CFG v3 架构、安装、功能、模式、恢复边界与 CS2 VCFG 参考文档。"
}];
const groupIcons = [BookOpen, Crosshair, Boxes, Terminal];
const featured = [{
  href: "/docs/srpcfg-1",
  eyebrow: "01 / Understand",
  title: "先理解四层边界",
  description: "分清 Runtime、Preset、User 与 VCFG，避免把脚本能力、个人覆盖和游戏持久状态混为一谈。",
  icon: Boxes
}, {
  href: "/docs/srpcfg-3",
  eyebrow: "02 / Install",
  title: "安装并选择使用模式",
  description: "安装唯一 Runtime Core，再决定只使用功能，还是选一个 Preset 起点并继续写个人差异。",
  icon: Gauge
}, {
  href: "/docs/helps",
  eyebrow: "03 / Operate",
  title: "在控制台找到功能",
  description: "从 srp_help 进入完整帮助树；普通入口只应用设置，带 _keys 的入口才会接管物理按键。",
  icon: Terminal
}];
const docs = UNSAFE_withComponentProps(function DocsPage() {
  return /* @__PURE__ */ jsxs(Fragment, {
    children: [/* @__PURE__ */ jsx("section", {
      className: "border-b border-border bg-[radial-gradient(circle_at_18%_18%,rgba(242,138,26,0.09),transparent_34%)]",
      children: /* @__PURE__ */ jsxs("div", {
        className: "mx-auto max-w-[1280px] px-5 pb-14 pt-16 sm:px-7 sm:pb-20 sm:pt-24",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "grid gap-10 lg:grid-cols-[minmax(0,760px)_300px] lg:items-end lg:gap-16",
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("p", {
              className: "font-mono text-xs uppercase tracking-[0.18em] text-accent",
              children: "Documentation / v3"
            }), /* @__PURE__ */ jsxs("h1", {
              className: "mt-4 max-w-[760px] font-display text-[clamp(2.75rem,8vw,6rem)] font-bold leading-[0.94] tracking-[-0.04em] text-text",
              children: ["从边界出发，", /* @__PURE__ */ jsx("br", {}), "再开始配置。"]
            }), /* @__PURE__ */ jsx("p", {
              className: "mt-6 max-w-[700px] text-base leading-8 text-text-secondary sm:text-lg",
              children: "文档按“架构 → 安装 → 功能 → 模式 → 参考”组织。先确定谁负责保存状态，再选择会覆盖哪些设置与按键的入口。"
            })]
          }), /* @__PURE__ */ jsxs("aside", {
            className: "border-l-2 border-accent pl-5",
            children: [/* @__PURE__ */ jsx("p", {
              className: "font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint",
              children: "Fast path"
            }), /* @__PURE__ */ jsx("p", {
              className: "mt-2 text-sm leading-6 text-text-secondary",
              children: "首次使用按前三张卡片阅读；遇到具体 ConVar 数值问题，直接进入指令中心。"
            }), /* @__PURE__ */ jsxs(Link, {
              to: "/commands",
              className: "mt-4 inline-flex min-h-11 items-center gap-2 font-display text-sm font-bold text-accent no-underline transition-colors hover:text-accent-light",
              children: [/* @__PURE__ */ jsx(Search, {
                className: "h-4 w-4"
              }), "检索 CS2 指令与数值", /* @__PURE__ */ jsx(ArrowRight, {
                className: "h-4 w-4"
              })]
            })]
          })]
        }), /* @__PURE__ */ jsx("div", {
          className: "mt-12 grid gap-px overflow-hidden rounded-[var(--radius)] border border-border bg-border md:grid-cols-3",
          children: featured.map((item) => {
            const Icon = item.icon;
            return /* @__PURE__ */ jsxs(Link, {
              to: item.href,
              className: "group min-h-[230px] bg-bg-card p-6 no-underline transition-colors hover:bg-bg-hover sm:p-7",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-start justify-between gap-4",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint",
                  children: item.eyebrow
                }), /* @__PURE__ */ jsx(Icon, {
                  className: "h-5 w-5 text-accent"
                })]
              }), /* @__PURE__ */ jsx("h2", {
                className: "mt-10 font-display text-xl font-bold leading-tight text-text group-hover:text-accent",
                children: item.title
              }), /* @__PURE__ */ jsx("p", {
                className: "mt-3 text-sm leading-6 text-text-muted",
                children: item.description
              }), /* @__PURE__ */ jsxs("span", {
                className: "mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-accent",
                children: ["开始阅读", /* @__PURE__ */ jsx(ArrowRight, {
                  className: "h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                })]
              })]
            }, item.href);
          })
        })]
      })
    }), /* @__PURE__ */ jsxs("section", {
      className: "mx-auto max-w-[1280px] px-5 py-14 sm:px-7 sm:py-20",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mb-9 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between",
        children: [/* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("p", {
            className: "font-mono text-[11px] uppercase tracking-[0.16em] text-accent",
            children: "Browse all"
          }), /* @__PURE__ */ jsx("h2", {
            className: "mt-2 font-display text-3xl font-bold text-text sm:text-4xl",
            children: "按任务浏览"
          })]
        }), /* @__PURE__ */ jsxs("p", {
          className: "font-mono text-xs text-text-faint",
          children: [indexGroups.reduce((n, g) => n + g.docs.length, 0), " 篇文档 · ", indexGroups.length, " 个分组"]
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "space-y-12",
        children: indexGroups.map((group, groupIndex) => {
          const GroupIcon = groupIcons[groupIndex] ?? BookOpen;
          return /* @__PURE__ */ jsxs("section", {
            "aria-labelledby": `docs-group-${groupIndex}`,
            className: "grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10",
            children: [/* @__PURE__ */ jsxs("header", {
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-2 text-accent",
                children: [/* @__PURE__ */ jsx(GroupIcon, {
                  className: "h-4 w-4"
                }), /* @__PURE__ */ jsx("span", {
                  className: "font-mono text-[10px] uppercase tracking-[0.15em]",
                  children: String(groupIndex + 1).padStart(2, "0")
                })]
              }), /* @__PURE__ */ jsx("h3", {
                id: `docs-group-${groupIndex}`,
                className: "mt-3 font-display text-xl font-bold text-text",
                children: group.label
              }), /* @__PURE__ */ jsx("p", {
                className: "mt-2 text-sm leading-6 text-text-muted",
                children: group.description
              })]
            }), /* @__PURE__ */ jsx("div", {
              className: "grid gap-3 md:grid-cols-2",
              children: group.docs.map((doc) => /* @__PURE__ */ jsxs(Link, {
                to: `/docs/${doc.slug}`,
                className: "group flex min-h-[132px] flex-col justify-between rounded-[var(--radius-sm)] border border-border bg-bg-card p-5 no-underline transition-colors hover:border-border-highlight hover:bg-bg-hover",
                children: [/* @__PURE__ */ jsxs("div", {
                  children: [/* @__PURE__ */ jsxs("div", {
                    className: "flex items-start justify-between gap-4",
                    children: [/* @__PURE__ */ jsx("h4", {
                      className: "font-display text-base font-bold text-text group-hover:text-accent",
                      children: doc.title
                    }), /* @__PURE__ */ jsx(ArrowRight, {
                      className: "h-4 w-4 shrink-0 text-text-faint transition-transform group-hover:translate-x-1 group-hover:text-accent"
                    })]
                  }), /* @__PURE__ */ jsx("p", {
                    className: "mt-2 text-sm leading-6 text-text-muted",
                    children: doc.description ?? "查看模块用法、作用边界与相关文件。"
                  })]
                }), /* @__PURE__ */ jsxs("span", {
                  className: "mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint",
                  children: ["/docs/", doc.slug]
                })]
              }, doc.slug))
            })]
          }, group.label);
        })
      }), /* @__PURE__ */ jsxs("a", {
        href: "https://deepwiki.com/RolinShmily/SrP-CFG_ForCS2",
        target: "_blank",
        rel: "noopener",
        "aria-label": "前往 DeepWiki 询问 SrP-CFG 项目问题（在新窗口打开）",
        className: "group mt-12 flex min-h-14 items-center justify-center gap-3 rounded-[var(--radius)] border-2 border-accent/70 bg-accent-bg px-5 py-4 text-center font-display text-base font-bold text-accent no-underline shadow-[0_0_0_1px_rgba(242,138,26,0.04),0_14px_40px_rgba(242,138,26,0.08)] transition-[border-color,background-color,color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-[rgba(242,138,26,0.16)] hover:text-accent-light hover:shadow-[0_16px_46px_rgba(242,138,26,0.14)] sm:text-lg",
        children: [/* @__PURE__ */ jsx(MessageCircleQuestion, {
          className: "h-5 w-5 shrink-0",
          "aria-hidden": "true"
        }), /* @__PURE__ */ jsx("span", {
          children: "有疑问？询问 DeepWiki！"
        }), /* @__PURE__ */ jsx(ArrowRight, {
          className: "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1",
          "aria-hidden": "true"
        })]
      })]
    }), /* @__PURE__ */ jsx("section", {
      className: "border-y border-border bg-bg-card",
      children: /* @__PURE__ */ jsxs("div", {
        className: "mx-auto grid max-w-[1280px] gap-px bg-border md:grid-cols-2",
        children: [/* @__PURE__ */ jsxs(Link, {
          to: "/download",
          className: "group bg-bg-card px-5 py-9 no-underline transition-colors hover:bg-bg-hover sm:px-7",
          children: [/* @__PURE__ */ jsx(Wrench, {
            className: "h-5 w-5 text-accent"
          }), /* @__PURE__ */ jsx("p", {
            className: "mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint",
            children: "Ready to install"
          }), /* @__PURE__ */ jsx("h2", {
            className: "mt-2 font-display text-2xl font-bold text-text group-hover:text-accent",
            children: "获取 Installer 与 Runtime Core"
          })]
        }), /* @__PURE__ */ jsxs(Link, {
          to: "/commands",
          className: "group bg-bg-card px-5 py-9 no-underline transition-colors hover:bg-bg-hover sm:px-7",
          children: [/* @__PURE__ */ jsx(Crosshair, {
            className: "h-5 w-5 text-accent"
          }), /* @__PURE__ */ jsx("p", {
            className: "mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint",
            children: "Need a value"
          }), /* @__PURE__ */ jsx("h2", {
            className: "mt-2 font-display text-2xl font-bold text-text group-hover:text-accent",
            children: "查询默认值、约束与离散模式"
          })]
        })]
      })
    })]
  });
});
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: docs,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
function DocsNavigation({
  groups,
  currentSlug
}) {
  return /* @__PURE__ */ jsxs("nav", { "aria-label": "文档导航", children: [
    /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/docs",
        className: "mb-5 flex min-h-11 items-center justify-between rounded-[var(--radius-sm)] border border-border bg-bg-card px-3.5 font-display text-sm font-bold text-text no-underline transition-colors hover:border-border-highlight hover:text-accent",
        children: [
          /* @__PURE__ */ jsx("span", { children: "全部文档" }),
          /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] text-text-faint", children: "INDEX" })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "space-y-5", children: groups.map((group) => /* @__PURE__ */ jsxs("section", { "aria-label": group.label, children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-1.5 flex items-center justify-between px-3", children: [
        /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-text-faint", children: group.label }),
        /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] text-text-faint", children: String(group.docs.length).padStart(2, "0") })
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-0.5", children: group.docs.map((doc) => {
        const active = doc.slug === currentSlug;
        return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
          Link,
          {
            to: `/docs/${doc.slug}`,
            "aria-current": active ? "page" : void 0,
            className: [
              "flex min-h-11 items-center rounded-[var(--radius-sm)] border-l-2 px-3 py-2 font-display text-sm font-semibold leading-5 no-underline transition-colors duration-200",
              active ? "border-accent bg-accent-bg text-accent" : "border-transparent text-text-muted hover:bg-bg-hover hover:text-text"
            ].join(" "),
            children: doc.title
          }
        ) }, doc.slug);
      }) })
    ] }, group.label)) })
  ] });
}
function flattenToc(toc) {
  const out = [];
  for (const entry2 of toc) {
    out.push({ id: entry2.url.replace(/^#/, ""), text: entry2.title, depth: 2 });
    for (const child of entry2.items) {
      out.push({ id: child.url.replace(/^#/, ""), text: child.title, depth: 3 });
    }
  }
  return out;
}
function DocsToc({ toc, roomy = false }) {
  const links2 = useMemo(() => flattenToc(toc), [toc]);
  const [activeId, setActiveId] = useState(null);
  useEffect(() => {
    if (links2.length === 0) return;
    const elements = links2.map((link) => document.getElementById(link.id)).filter((el) => Boolean(el));
    if (elements.length === 0) return;
    const update = () => {
      let active = elements[0];
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= 150) active = el;
        else break;
      }
      setActiveId(active.id);
    };
    const observer = new IntersectionObserver(update, {
      rootMargin: "-112px 0px -68% 0px",
      threshold: [0, 1]
    });
    elements.forEach((el) => observer.observe(el));
    requestAnimationFrame(update);
    return () => observer.disconnect();
  }, [links2]);
  return /* @__PURE__ */ jsxs("nav", { "aria-label": "本页目录", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-text-faint", children: "On this page" }),
      /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] text-text-faint", children: String(links2.length).padStart(2, "0") })
    ] }),
    /* @__PURE__ */ jsx("ul", { className: "border-l border-border", children: links2.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
      "a",
      {
        href: `#${item.id}`,
        "data-toc-link": true,
        "data-toc-target": item.id,
        "aria-current": activeId === item.id ? "location" : void 0,
        className: [
          "-ml-px block border-l pr-2 text-sm leading-5 text-text-muted no-underline transition-colors duration-200 hover:border-border-highlight hover:text-text",
          roomy ? "min-h-11 py-2.5" : "py-1.5",
          item.depth === 3 ? "pl-5" : "pl-3",
          activeId === item.id ? "border-accent text-accent-light" : "border-transparent"
        ].join(" "),
        children: item.text
      }
    ) }, item.id)) })
  ] });
}
function DocsShell({
  currentSlug,
  toc,
  children
}) {
  const [panel, setPanel] = useState(null);
  const close = () => setPanel(null);
  const toggle = (name) => setPanel((prev) => prev === name ? null : name);
  useEffect(() => {
    if (!panel) return;
    document.body.classList.add("doc-panel-open");
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };
    const media = window.matchMedia("(min-width: 1024px)");
    const onMedia = (event) => {
      if (event.matches) close();
    };
    document.addEventListener("keydown", onKey);
    media.addEventListener("change", onMedia);
    return () => {
      document.body.classList.remove("doc-panel-open");
      document.removeEventListener("keydown", onKey);
      media.removeEventListener("change", onMedia);
    };
  }, [panel]);
  const mobileBarBtn = "flex min-h-12 items-center justify-center gap-2 text-sm font-semibold text-text-muted transition-colors hover:bg-bg-hover hover:text-text";
  return /* @__PURE__ */ jsxs("div", { "data-doc-layout": true, children: [
    /* @__PURE__ */ jsx("div", { className: "sticky top-16 z-[70] mt-16 border-b border-border bg-bg-card lg:hidden", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => toggle("menu"),
          "aria-label": "打开文档菜单",
          "aria-controls": "mobile-doc-menu",
          "aria-expanded": panel === "menu",
          className: `${mobileBarBtn} border-r border-border`,
          children: [
            /* @__PURE__ */ jsx(Menu, { className: "h-4 w-4" }),
            "文档菜单"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => toggle("toc"),
          disabled: toc.length === 0,
          "aria-label": "打开本页目录",
          "aria-controls": "mobile-toc-panel",
          "aria-expanded": panel === "toc",
          className: `${mobileBarBtn} disabled:cursor-not-allowed disabled:opacity-40`,
          children: [
            /* @__PURE__ */ jsx(TableOfContents, { className: "h-4 w-4" }),
            "本页目录"
          ]
        }
      )
    ] }) }),
    panel === "menu" && /* @__PURE__ */ jsx(
      "div",
      {
        id: "mobile-doc-menu",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "mobile-doc-menu-title",
        tabIndex: -1,
        className: "fixed inset-x-0 bottom-0 top-28 z-[60] overflow-y-auto bg-bg px-5 py-5 lg:hidden",
        children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-[720px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between border-b border-border pb-3", children: [
            /* @__PURE__ */ jsx("p", { id: "mobile-doc-menu-title", className: "font-display text-lg font-bold", children: "浏览文档" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: close,
                className: "flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-border text-text-muted",
                "aria-label": "关闭文档菜单",
                children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx(DocsNavigation, { groups: navGroups, currentSlug })
        ] })
      }
    ),
    panel === "toc" && /* @__PURE__ */ jsx(
      "div",
      {
        id: "mobile-toc-panel",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "mobile-toc-title",
        tabIndex: -1,
        className: "fixed inset-x-0 bottom-0 top-28 z-[60] overflow-y-auto bg-bg px-5 py-5 lg:hidden",
        children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-[720px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between border-b border-border pb-3", children: [
            /* @__PURE__ */ jsx("p", { id: "mobile-toc-title", className: "font-display text-lg font-bold", children: "本页目录" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: close,
                className: "flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-border text-text-muted",
                "aria-label": "关闭本页目录",
                children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx(DocsToc, { toc, roomy: true })
        ] })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-5 py-10 sm:px-7 lg:grid-cols-[220px_minmax(0,760px)] lg:justify-center lg:gap-10 lg:pb-20 lg:pt-28 xl:grid-cols-[220px_minmax(0,760px)_220px] xl:gap-12", children: [
      /* @__PURE__ */ jsx("aside", { className: "hidden lg:block", children: /* @__PURE__ */ jsx("div", { className: "sticky top-24", children: /* @__PURE__ */ jsx(DocsNavigation, { groups: navGroups, currentSlug }) }) }),
      /* @__PURE__ */ jsx("article", { className: "min-w-0 pb-8", children }),
      /* @__PURE__ */ jsx("aside", { className: "hidden xl:block", children: toc.length > 0 && /* @__PURE__ */ jsx("div", { className: "sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-8 pr-1", children: /* @__PURE__ */ jsx(DocsToc, { toc }) }) })
    ] })
  ] });
}
async function loader({
  params
}) {
  const doc = docs$1.find((d) => d.slug === params.slug);
  if (!doc) throw new Response("Not Found", {
    status: 404
  });
  return doc;
}
const meta = ({
  data
}) => [{
  title: `${data.title} — SrP-CFG 文档`
}, {
  name: "description",
  content: data.description ?? `SrP-CFG 文档：${data.title}`
}];
const docsDetail = UNSAFE_withComponentProps(function DocsDetailPage() {
  const doc = useLoaderData();
  const currentIndex = orderedDocs.findIndex((d) => d.slug === doc.slug);
  const previousDoc = currentIndex > 0 ? orderedDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex >= 0 && currentIndex < orderedDocs.length - 1 ? orderedDocs[currentIndex + 1] : null;
  return /* @__PURE__ */ jsxs(DocsShell, {
    currentSlug: doc.slug,
    toc: doc.toc,
    children: [/* @__PURE__ */ jsxs("nav", {
      "aria-label": "面包屑",
      className: "mb-7 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-text-faint",
      children: [/* @__PURE__ */ jsx(Link, {
        to: "/docs",
        className: "text-text-muted no-underline hover:text-accent",
        children: "Docs"
      }), /* @__PURE__ */ jsx("span", {
        "aria-hidden": "true",
        children: "/"
      }), /* @__PURE__ */ jsx("span", {
        "aria-current": "page",
        children: doc.title
      })]
    }), /* @__PURE__ */ jsxs("header", {
      className: "mb-10 border-b border-border pb-8",
      children: [/* @__PURE__ */ jsx("p", {
        className: "font-mono text-xs uppercase tracking-[0.16em] text-accent",
        children: "SrP-CFG Documentation"
      }), /* @__PURE__ */ jsx("h1", {
        className: "mt-3 font-display text-[clamp(2.25rem,6vw,4rem)] font-bold leading-[1.04] tracking-[-0.025em] text-text",
        children: doc.title
      }), doc.description && /* @__PURE__ */ jsx("p", {
        className: "mt-4 max-w-[680px] text-base leading-7 text-text-secondary sm:text-lg sm:leading-8",
        children: doc.description
      })]
    }), /* @__PURE__ */ jsx("div", {
      className: "prose-doc",
      dangerouslySetInnerHTML: {
        __html: doc.content
      }
    }), /* @__PURE__ */ jsxs("nav", {
      "aria-label": "前后篇文档",
      className: "mt-14 grid grid-cols-1 gap-3 border-t border-border pt-6 sm:grid-cols-2",
      children: [previousDoc ? /* @__PURE__ */ jsx(Link, {
        to: `/docs/${previousDoc.slug}`,
        className: "group block no-underline",
        children: /* @__PURE__ */ jsxs(Card, {
          padding: "none",
          className: "p-4 transition-colors duration-200 group-hover:border-border-highlight group-hover:bg-bg-hover",
          children: [/* @__PURE__ */ jsxs("span", {
            className: "flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint",
            children: [/* @__PURE__ */ jsx(ChevronLeft, {
              className: "h-3.5 w-3.5"
            }), "上一篇"]
          }), /* @__PURE__ */ jsx("strong", {
            className: "mt-2 block font-display text-sm text-text-secondary group-hover:text-accent",
            children: previousDoc.title
          })]
        })
      }) : /* @__PURE__ */ jsx("span", {}), nextDoc && /* @__PURE__ */ jsx(Link, {
        to: `/docs/${nextDoc.slug}`,
        className: "group block no-underline",
        children: /* @__PURE__ */ jsxs(Card, {
          padding: "none",
          className: "p-4 text-right transition-colors duration-200 group-hover:border-border-highlight group-hover:bg-bg-hover",
          children: [/* @__PURE__ */ jsxs("span", {
            className: "flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint",
            children: ["下一篇", /* @__PURE__ */ jsx(ChevronRight, {
              className: "h-3.5 w-3.5"
            })]
          }), /* @__PURE__ */ jsx("strong", {
            className: "mt-2 block font-display text-sm text-text-secondary group-hover:text-accent",
            children: nextDoc.title
          })]
        })
      })]
    })]
  });
});
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: docsDetail,
  loader,
  meta
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
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: commands
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-DrQZ2J-V.js", "imports": ["/assets/chunk-62JRHF6Z-BWKVPo1m.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/root-yPwnwGzF.js", "imports": ["/assets/chunk-62JRHF6Z-BWKVPo1m.js"], "css": ["/assets/root-B0It-9oG.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "layout": { "id": "layout", "parentId": "root", "path": void 0, "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/layout-7xElGVpq.js", "imports": ["/assets/chunk-62JRHF6Z-BWKVPo1m.js", "/assets/navigation-IywTUcR9.js", "/assets/github-Sb1PQ1Py.js", "/assets/x-bscOztqE.js", "/assets/book-open-DotJL0PM.js", "/assets/download-Btl4jWHg.js", "/assets/createLucideIcon-C3Bzz8Wx.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "layout", "path": "/", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/home-C18DE2_p.js", "imports": ["/assets/chunk-62JRHF6Z-BWKVPo1m.js", "/assets/Badge-OlOBJAuu.js", "/assets/createLucideIcon-C3Bzz8Wx.js", "/assets/download-Btl4jWHg.js", "/assets/book-open-DotJL0PM.js", "/assets/Card-DdScE1Ii.js", "/assets/SectionHeader-M-MCP-W6.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/download": { "id": "routes/download", "parentId": "layout", "path": "/download", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/download-D2MvJmS2.js", "imports": ["/assets/chunk-62JRHF6Z-BWKVPo1m.js", "/assets/Card-DdScE1Ii.js", "/assets/SectionHeader-M-MCP-W6.js", "/assets/Badge-OlOBJAuu.js", "/assets/navigation-IywTUcR9.js", "/assets/download-Btl4jWHg.js", "/assets/createLucideIcon-C3Bzz8Wx.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/about": { "id": "routes/about", "parentId": "layout", "path": "/about", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/about-B1M-yJha.js", "imports": ["/assets/chunk-62JRHF6Z-BWKVPo1m.js", "/assets/Card-DdScE1Ii.js", "/assets/SectionHeader-M-MCP-W6.js", "/assets/navigation-IywTUcR9.js", "/assets/github-Sb1PQ1Py.js", "/assets/createLucideIcon-C3Bzz8Wx.js", "/assets/boxes-1r3_WYqC.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/docs": { "id": "routes/docs", "parentId": "layout", "path": "/docs", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/docs-BJX1hmgq.js", "imports": ["/assets/chunk-62JRHF6Z-BWKVPo1m.js", "/assets/docs-data-B8_XiKoD.js", "/assets/createLucideIcon-C3Bzz8Wx.js", "/assets/boxes-1r3_WYqC.js", "/assets/book-open-DotJL0PM.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/docs-detail": { "id": "routes/docs-detail", "parentId": "layout", "path": "/docs/:slug", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/docs-detail-B8ZwhI0K.js", "imports": ["/assets/chunk-62JRHF6Z-BWKVPo1m.js", "/assets/Card-DdScE1Ii.js", "/assets/docs-data-B8_XiKoD.js", "/assets/x-bscOztqE.js", "/assets/createLucideIcon-C3Bzz8Wx.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/commands": { "id": "routes/commands", "parentId": "layout", "path": "/commands", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/commands-B3vunXb5.js", "imports": ["/assets/chunk-62JRHF6Z-BWKVPo1m.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-cb82d6b6.js", "version": "cb82d6b6", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "v8_passThroughRequests": false, "v8_trailingSlashAwareDataRequests": false, "unstable_previewServerPrerendering": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = ["/", "/download", "/about", "/docs", "/docs/annotations", "/docs/autoexec", "/docs/autoview", "/docs/crosshair_view", "/docs/cs2_video", "/docs/demo_hlae", "/docs/guidemake", "/docs/helps", "/docs/knife", "/docs/practice", "/docs/previewmode", "/docs/pwa_prac", "/docs/srpcfg-1", "/docs/srpcfg-3", "/docs/vcfg", "/docs/zeus", "/commands"];
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
  "routes/docs-detail": {
    id: "routes/docs-detail",
    parentId: "layout",
    path: "/docs/:slug",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/commands": {
    id: "routes/commands",
    parentId: "layout",
    path: "/commands",
    index: void 0,
    caseSensitive: void 0,
    module: route7
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
