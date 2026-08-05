/**
 * Vite + React 19 + React Router 7（框架模式 SSG）构建配置。
 *
 * - react()：@vitejs/plugin-react，React 19 JSX 转换与 Fast Refresh
 * - tailwindcss()：@tailwindcss/vite，Tailwind CSS v4（沿用 src/styles/global.css 的 design tokens）
 * - reactRouter()：@react-router/dev 框架模式插件；appDirectory 指向 src/app（root.tsx / routes.ts 所在目录）
 * - srp-cfg-latest-version：构建期 fetch 最新版本并 define 注入（替代旧 Astro 模块顶层 await，
 *   见 src/data/version.ts；L3.2 下载页阶段改造）
 */
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readdirSync, writeFileSync } from "fs";
import { join, relative, sep } from "path";
import { defineConfig, type PluginOption } from "vite";
import { fetchLatestVersion } from "./src/data/version";

const SITE_URL = "https://srprolin.top";

/**
 * 构建/启动时获取 GitHub Releases 最新版本（失败回落 "0.0.0"，逻辑见 fetchLatestVersion），
 * 经 define 注入全局常量 __SRP_CFG_LATEST_VERSION__，SSG 产物直接带上真实版本号。
 */
function latestVersionPlugin(): PluginOption {
  return {
    name: "srp-cfg-latest-version",
    async config() {
      const version = await fetchLatestVersion();
      return {
        define: {
          __SRP_CFG_LATEST_VERSION__: JSON.stringify(version),
        },
      };
    },
  };
}

/**
 * 构建期生成 sitemap.xml（替换 @astrojs/sitemap，L3.7）。
 * 遍历 build/client 下所有 index.html（SSG 预渲染产物）推导 URL 清单，
 * 站点根 https://srprolin.top（与旧 astro.config.ts 一致）。
 */
function sitemapPlugin(): PluginOption {
  return {
    name: "srp-cfg-sitemap",
    apply: "build",
    closeBundle() {
      const outDir = "build/client";
      const urls: string[] = [];
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (entry.name === "index.html") {
            const rel = relative(outDir, dir).split(sep).join("/");
            urls.push(rel ? `/${rel}/` : "/");
          }
        }
      };
      walk(outDir);
      urls.sort();
      const lastmod = new Date().toISOString().slice(0, 10);
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((u) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${lastmod}</lastmod></url>`)
        .join("\n")}\n</urlset>\n`;
      writeFileSync(join(outDir, "sitemap.xml"), xml);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    reactRouter(),
    latestVersionPlugin(),
    sitemapPlugin(),
    // 根/子 vite（6.4.2/6.4.3）hoisting 导致两份 @types/estree，Plugin 类型身份不一致；
    // 运行时由 esbuild 转译不受影响，仅类型检查需要对齐（vite 双版本 hoisting）
  ] as PluginOption[],
  // 兼容旧 Astro 的 PUBLIC_ 前缀：Vite 默认只暴露 VITE_* 到 import.meta.env，
  // 若不加此配置，PUBLIC_TURNSTILE_SITE_KEY 构建期不会注入前端，AI 面板会报
  // “Turnstile Site Key 未配置”。
  envPrefix: ["VITE_", "PUBLIC_"],
  // 本机 /etc/hosts 的 localhost 只解析到 IPv6 ::1，Vite 默认绑定 localhost 会
  // 只在 IPv6 上监听，Firefox 走 IPv4 时连不上（“无法连接到 localhost:5173”）。
  // 显式绑定 ::（双栈）让 127.0.0.1 与 [::1] 都能访问。
  server: {
    host: "::",
  },
});
