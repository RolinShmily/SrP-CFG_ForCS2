/**
 * Velite 内容管线配置（L3.3，替代 Astro Content Collections — D8）。
 *
 * - root: src/content —— 16 篇文档 md 原地由 Velite 管理（旧 Astro 结构保留到迁移完成）
 * - docs collection schema 与旧 content.config.ts 对齐（title 必填 / description 可选）
 * - s.markdown()：构建期渲染 md → HTML（GFM + rehype-slug 锚点，与 Astro 的 GitHub 风格 slug 一致）
 * - s.toc()：构建期从 md 提取目录树（h2 顶层 + h3 嵌套），供 DocsToc 使用
 * - output.data: .velite —— 生成 app/website/.velite/index.ts（构建期由 vite 直接 import）
 *
 * 运行：pnpm build:web（velite --clean && react-router build）
 */
import { defineConfig, s } from "velite";
import rehypeSlug from "rehype-slug";

export default defineConfig({
  root: "src/content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "index",
    clean: true,
  },
  collections: {
    docs: {
      name: "Docs",
      pattern: "docs/**/*.md",
      schema: s.object({
        title: s.string(),
        description: s.string().optional(),
        // velite 0.4 的 s.slug() 仅校验不派生（需 frontmatter 提供），
        // 这里用 s.path() 从文件路径派生（docs/xxx.md -> xxx），与旧 Astro doc.id 语义一致
        slug: s.path().transform((p) => p.replace(/^docs\//, "")),
        content: s.markdown({
          gfm: true,
          rehypePlugins: [rehypeSlug],
        }),
        toc: s.toc(),
      }),
    },
  },
});
