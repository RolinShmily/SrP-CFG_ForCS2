import { assetPath } from "@/lib/downloads";
import { detailPath } from "@/lib/console/paths";
import type { ConsoleIndex, ConsoleRecordType } from "@/lib/console/types";

export interface SearchHit {
  url: string;
  title: string;
  excerpt: string;
  type?: ConsoleRecordType;
  category?: string;
  status?: string;
}

interface PagefindResultData {
  url: string;
  excerpt: string;
  meta?: Record<string, string>;
  filters?: Record<string, string[]>;
}

interface PagefindModule {
  init?: () => Promise<void>;
  search: (
    query: string,
    options?: { filters?: Record<string, string | string[]> },
  ) => Promise<{
    results: Array<{ data: () => Promise<PagefindResultData> }>;
  }>;
}

let pagefindPromise: Promise<PagefindModule | null> | null = null;
let fallbackIndexPromise: Promise<ConsoleIndex | null> | null = null;

async function loadPagefind(): Promise<PagefindModule | null> {
  if (typeof window === "undefined") return null;
  if (!pagefindPromise) {
    const url = assetPath("/pagefind/pagefind.js");
    pagefindPromise = import(/* @vite-ignore */ url)
      .then(async (mod: PagefindModule) => {
        if (typeof mod.init === "function") await mod.init();
        return mod;
      })
      .catch(() => null);
  }
  return pagefindPromise;
}

async function loadFallbackIndex(): Promise<ConsoleIndex | null> {
  if (typeof window === "undefined") return null;
  if (!fallbackIndexPromise) {
    fallbackIndexPromise = fetch(assetPath("/data/console-index.json"))
      .then((res) => (res.ok ? (res.json() as Promise<ConsoleIndex>) : null))
      .catch(() => null);
  }
  return fallbackIndexPromise;
}

function normalizeUrl(raw: string): string {
  const clean = raw.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  return clean.startsWith("/") ? clean : `/${clean}`;
}

export async function searchConsole(
  query: string,
  filterType: "all" | ConsoleRecordType = "all",
  limit = 14,
): Promise<{ hits: SearchHit[]; engine: "pagefind" | "index" }> {
  const trimmed = query.trim();
  if (!trimmed) return { hits: [], engine: "pagefind" };

  const pf = await loadPagefind();
  if (pf) {
    try {
      const filters = filterType === "all" ? undefined : { type: filterType };
      const response = await pf.search(trimmed, filters ? { filters } : undefined);
      const top = response.results.slice(0, limit);
      const resolved = await Promise.all(top.map((item) => item.data()));
      const hits: SearchHit[] = resolved.map((entry) => {
        const typeVal = entry.meta?.type;
        const type: ConsoleRecordType | undefined =
          typeVal === "convar" || typeVal === "command" ? typeVal : undefined;
        return {
          url: normalizeUrl(entry.url),
          title: entry.meta?.title || normalizeUrl(entry.url),
          excerpt: entry.excerpt || "",
          type,
          category: entry.meta?.category,
          status: entry.meta?.status,
        };
      });
      return { hits, engine: "pagefind" };
    } catch {
      // Fall through to JSON index if Pagefind fails at runtime.
    }
  }

  const index = await loadFallbackIndex();
  if (!index) return { hits: [], engine: "index" };
  const needle = trimmed.toLowerCase();
  const hits: SearchHit[] = [];

  // Exact/prefix name matches first, then substring matches.
  const scored = index.records
    .filter((rec) => filterType === "all" || rec.type === filterType)
    .map((rec) => {
      const name = rec.name.toLowerCase();
      const summary = rec.summary.toLowerCase();
      let score = 0;
      if (name === needle) score = 100;
      else if (name.startsWith(needle)) score = 70;
      else if (name.includes(needle)) score = 45;
      else if (summary.includes(needle)) score = 25;
      else if (rec.flags.some((f) => f.toLowerCase().includes(needle))) score = 15;
      else if (rec.category.toLowerCase().includes(needle)) score = 10;
      return { rec, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.rec.name.localeCompare(b.rec.name))
    .slice(0, limit);

  for (const { rec } of scored) {
    hits.push({
      url: detailPath(rec.type, rec.name),
      title: rec.name,
      excerpt: rec.summary || "",
      type: rec.type,
      category: rec.category,
      status: rec.translationStatus,
    });
  }
  return { hits, engine: "index" };
}
