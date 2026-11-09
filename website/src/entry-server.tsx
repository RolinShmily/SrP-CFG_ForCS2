import { renderToString } from "react-dom/server";

import { App } from "./App";

/**
 * Build-time entry for static first-paint HTML.
 *
 * `scripts/prerender.mjs` renders this into `out/index.html` after the client
 * build, and `src/main.tsx` hydrates the same markup in the browser. Keep this
 * entry free of browser globals and CSS imports so the SSR bundle stays small.
 */
export function render() {
  return renderToString(<App />);
}
