import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, Meta, Links, ScrollRestoration, Scripts, NavLink, Link } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { useState } from "react";
import { Github, X, Menu, BookOpen, Download, Cloud, FileCode2, UserRoundCog, Check, ArrowDownRight, Blocks, SlidersHorizontal, CloudCog, ArrowUpRight, PackageCheck, Gamepad2 } from "lucide-react";
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
const LATEST_VERSION$1 = "3";
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
            LATEST_VERSION$1
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
const LATEST_VERSION = "3";
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
const meta = () => [{
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
  meta
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
const serverManifest = { "entry": { "module": "/assets/entry.client-7vJmYhde.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/root-DwBj_YJc.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js"], "css": ["/assets/root-BEtRH8CL.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "layout": { "id": "layout", "parentId": "root", "path": void 0, "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/layout-DuwrJB8P.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js", "/assets/download-ByjpPFAe.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "layout", "path": "/", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/home-Bwvdx0ua.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js", "/assets/download-ByjpPFAe.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/download": { "id": "routes/download", "parentId": "layout", "path": "/download", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/download-CR3XnSTX.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/about": { "id": "routes/about", "parentId": "layout", "path": "/about", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/about-C0gVTsU8.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/docs": { "id": "routes/docs", "parentId": "layout", "path": "/docs", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/docs-D_Ps-E2q.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/commands": { "id": "routes/commands", "parentId": "layout", "path": "/commands", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/commands-D67C7O6s.js", "imports": ["/assets/chunk-62JRHF6Z-nF-r9U12.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-a51d844e.js", "version": "a51d844e", "sri": void 0 };
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
