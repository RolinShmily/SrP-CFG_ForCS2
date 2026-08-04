/**
 * 迁移骨架（WIP）—— Vite + React 19 + React Router 7（框架模式 SSG）构建配置。
 *
 * 背景：app/website 当前为 Astro 项目，本文件是并行搭建的 React 迁移骨架入口，
 * 待 Astro → Vite + React 迁移完成后，将删除旧的 Astro 结构（astro.config.ts / src/pages/*.astro 等）。
 *
 * - react()：@vitejs/plugin-react，React 19 JSX 转换与 Fast Refresh
 * - tailwindcss()：@tailwindcss/vite，Tailwind CSS v4（沿用 src/styles/global.css 的 design tokens）
 * - reactRouter()：@react-router/dev 框架模式插件；appDirectory 指向 src/app（root.tsx / routes.ts 所在目录）
 */
import { reactRouter } from "@react-router/dev";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    reactRouter({
      // React Router 框架模式的入口目录（包含 root.tsx 与 routes.ts）
      appDirectory: "src/app",
    }),
  ],
});
