import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Inject build-time rendered markup into the Vite client build.
 *
 * Run after both builds:
 *   vite build
 *   vite build --ssr src/entry-server.tsx --outDir .ssr
 *   node scripts/prerender.mjs
 */
const root = fileURLToPath(new URL("../", import.meta.url));
const serverBundle = resolve(root, ".ssr/entry-server.js");
const indexFile = resolve(root, "out/index.html");
const marker = '<div id="root"></div>';

const { render } = await import(pathToFileURL(serverBundle).href);
if (typeof render !== "function") throw new Error(`Server entry ${serverBundle} does not export render()`);

const markup = render();
if (!markup.trim()) throw new Error("Prerender returned empty markup");

const html = await readFile(indexFile, "utf8");
if (!html.includes(marker)) throw new Error(`Missing prerender marker ${marker} in ${indexFile}`);

await writeFile(indexFile, html.replace(marker, `<div id="root">${markup}</div>`));
await rm(resolve(root, ".ssr"), { recursive: true, force: true });

console.log(`Prerendered ${markup.length} characters into out/index.html`);
