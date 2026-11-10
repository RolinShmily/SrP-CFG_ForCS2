// Generate sitemap.xml from the console index.
// Only indexable detail pages are included; inferred, stale, missing and
// development-only records stay out of the sitemap even though their HTML is
// still generated for direct access.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const SITE = "https://cfg.srprolin.com";

const index = JSON.parse(
  await readFile(resolve(root, "public/data/console-index.json"), "utf8"),
);
const metadata = JSON.parse(
  await readFile(resolve(root, "data/console/metadata.json"), "utf8"),
);
const lastmod = metadata.upstream.fetchedAt.slice(0, 10);

const paths = new Set([
  "/",
  "/console/",
  "/console/convars/",
  "/console/commands/",
  "/console/categories/",
  "/console/flags/",
  "/console/changes/",
]);

for (const category of index.categories) {
  paths.add(`/console/categories/${encodeURIComponent(category.slug)}/`);
}

for (const flag of new Set(index.records.flatMap((record) => record.flags))) {
  paths.add(`/console/flags/${encodeURIComponent(flag)}/`);
}

for (const record of index.records) {
  if (!record.indexable) continue;
  const segment = record.type === "convar" ? "convars" : "commands";
  paths.add(`/console/${segment}/${encodeURIComponent(record.name)}/`);
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const urls = [...paths]
  .sort((left, right) => left.localeCompare(right))
  .map((path) => {
    const priority = path === "/" ? "1.0" : path === "/console/" ? "0.9" : "0.6";
    const changefreq = path === "/" || path === "/console/" ? "weekly" : "monthly";
    return [
      "  <url>",
      `    <loc>${escapeXml(SITE + path)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      "  </url>",
    ].join("\n");
  })
  .join("\n");

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  urls,
  "</urlset>",
  "",
].join("\n");

await mkdir(resolve(root, "public"), { recursive: true });
await writeFile(resolve(root, "public/sitemap.xml"), xml, "utf8");
console.log(`Wrote ${paths.size} URLs to public/sitemap.xml`);
