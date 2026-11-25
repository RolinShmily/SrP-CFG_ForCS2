import { CornerDownLeft, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import type { ConsoleRecordType } from "@/lib/console/types";
import { searchConsole, type SearchHit } from "@/lib/pagefind";
import { TypeBadge } from "./status-badge";

const QUICK_CHIPS = ["cl_crosshair", "viewmodel", "fps_max", "sv_cheats", "mp_warmup", "cl_radar"];

export function ConsoleSearch() {
  const { locale } = useI18n();
  const copy = consoleCopy[locale];
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | ConsoleRecordType>("all");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setHits([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const result = await searchConsole(trimmed, filterType, 10);
      if (cancelled) return;
      setHits(result.hits);
      setLoading(false);
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, filterType]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (hits[0]) {
      navigate(hits[0].url);
      return;
    }
    if (query.trim()) {
      const target = filterType === "command" ? "/console/commands" : "/console/convars";
      navigate(`${target}?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="mt-6">
      <form
        onSubmit={onSubmit}
        role="search"
        className="flex flex-col gap-2 rounded-2xl border border-line-strong bg-surface p-2 shadow-lg shadow-black/30 sm:flex-row sm:items-center"
      >
        <div className="flex flex-1 items-center gap-2.5 px-2.5">
          <Search size={17} className="shrink-0 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.overview.searchPlaceholder}
            aria-label={copy.common.search}
            autoComplete="off"
            spellCheck={false}
            className="h-10 w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear"
              className="rounded-md p-1 text-muted transition hover:text-ink"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 border-t border-line px-1 pt-2 sm:border-l sm:border-t-0 sm:pl-2 sm:pt-0">
          {(["all", "convar", "command"] as const).map((item) => {
            const active = filterType === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setFilterType(item)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-cs-orange/15 text-cs-orange"
                    : "text-dim hover:bg-white/[0.04] hover:text-ink"
                }`}
              >
                {item === "all" ? (locale === "zh" ? "全部" : "All") : item === "convar" ? "ConVars" : "Commands"}
              </button>
            );
          })}
        </div>
      </form>

      {/* Quick chips */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="mr-1 text-muted">{locale === "zh" ? "试试：" : "Try:"}</span>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setQuery(chip)}
            className="rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-[11px] text-dim transition hover:border-cs-orange/40 hover:text-ink"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Live Pagefind results dropdown */}
      {query.trim().length > 0 && (
        <div
          aria-live="polite"
          className="mt-3 overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-2xl shadow-black/50"
        >
          {loading ? (
            <div className="px-4 py-6 text-center text-xs text-dim">{copy.common.loading}</div>
          ) : hits.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-dim">{copy.common.noResults}</div>
          ) : (
            <div className="divide-y divide-line">
              {hits.map((hit) => (
                <Link
                  key={hit.url}
                  to={hit.url}
                  prefetch="intent"
                  className="flex items-start justify-between gap-4 px-4 py-3 transition hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-sm font-semibold text-ink">{hit.title}</span>
                      {hit.type && <TypeBadge type={hit.type} />}
                    </div>
                    {hit.excerpt && (
                      <p
                        className="pagefind-excerpt mt-1 line-clamp-2 text-xs leading-relaxed text-dim"
                        dangerouslySetInnerHTML={{ __html: hit.excerpt }}
                      />
                    )}
                  </div>
                  <CornerDownLeft size={14} className="mt-1 shrink-0 text-muted" aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
