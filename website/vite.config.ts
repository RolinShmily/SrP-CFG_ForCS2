import { fileURLToPath, URL } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

/**
 * React Router Framework Mode with static prerendering.
 *
 * `react-router.config.ts` owns the route manifest, prerender paths and the
 * `ssr: false` policy. Vite only supplies the `@` alias here.
 */
export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
