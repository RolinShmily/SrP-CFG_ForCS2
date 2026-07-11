import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import rehypeSlug from "rehype-slug";

export default defineConfig({
  site: "https://srprolin.top",
  integrations: [mdx(), sitemap()],
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },
  markdown: {
    rehypePlugins: [rehypeSlug],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
