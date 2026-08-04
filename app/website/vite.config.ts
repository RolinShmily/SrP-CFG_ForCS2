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
import { defineConfig, type Plugin } from "vite";
import { fetchLatestVersion } from "./src/data/version";

/**
 * 构建/启动时获取 GitHub Releases 最新版本（失败回落 "0.0.0"，逻辑见 fetchLatestVersion），
 * 经 define 注入全局常量 __SRP_CFG_LATEST_VERSION__，SSG 产物直接带上真实版本号。
 */
function latestVersionPlugin(): Plugin {
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

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    reactRouter(),
    latestVersionPlugin(),
  ],
});
