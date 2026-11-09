import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/**
 * Static SPA build.
 *
 * `VITE_BASE_PATH` (or the legacy `NEXT_PUBLIC_BASE_PATH`) selects a sub-path
 * deployment such as `/SrP-CFG_ForCS2/`. Vite rewrites HTML, CSS and asset URLs
 * from it; runtime image paths go through `assetPath()` in `src/lib/downloads.ts`.
 */
function normalizeBase(value: string | undefined) {
  if (!value || value === "/") return "/";
  const base = value.replace(/\/+$/, "");
  return base.startsWith("/") || /^[a-z]+:\/\//i.test(base) ? `${base}/` : `/${base}/`;
}

const base = normalizeBase(process.env.VITE_BASE_PATH ?? process.env.NEXT_PUBLIC_BASE_PATH);

/**
 * Valve band artwork lives in `public/cs2`, so `globals.css` can only reference
 * it root-relatively. Inject the deployment prefix as a style block instead of
 * rewriting CSS at runtime: it must work before (and without) JavaScript.
 */
const artworkStyle: Plugin = {
  name: "srp-artwork-base-path",
  transformIndexHtml(html) {
    const style = [
      "<style>",
      ":root{",
      `--cs2-bg-header:url("${base}cs2/header_bg.svg");`,
      `--cs2-bg-orange:url("${base}cs2/bgOrange.svg");`,
      `--cs2-bg-blue:url("${base}cs2/bgDarkBlue.svg");`,
      `--cs2-bg-gray:url("${base}cs2/bgGray.svg");`,
      `--cs2-linemap:url("${base}cs2/linemap-20.png");`,
      "}",
      "</style>",
    ].join("");
    return html.replace("</head>", `${style}\n  </head>`);
  },
};

export default defineConfig({
  base,
  plugins: [react(), artworkStyle],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "out",
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
