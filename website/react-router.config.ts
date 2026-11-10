import type { Config } from "@react-router/dev/config";

import { getPrerenderPaths } from "./src/lib/console/catalog.server";

/**
 * Static product site + console.
 *
 * `ssr: false` means there is no Node.js runtime in production: every route is
 * rendered to HTML at build time and hydrated in the browser. Dynamic detail
 * paths are added by `getPrerenderPaths()` so direct visits to
 * `/console/convars/fps_max/` receive a real page, not a client-only shell.
 */
export default {
  appDirectory: "src",
  ssr: false,
  routeDiscovery: { mode: "initial" },
  prerender: {
    concurrency: 4,
    paths: async ({ getStaticPaths }) => [
      ...getStaticPaths(),
      ...getPrerenderPaths(),
    ],
  },
} satisfies Config;
