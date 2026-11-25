import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Boxes, CornerDownLeft, Download, Flag, FolderTree, Search, Terminal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { useI18n } from "@/context/i18n-context";
import type { ConsoleRecordType } from "@/lib/console/types";
import { searchConsole, type SearchHit } from "@/lib/pagefind";

export function openCommandPalette(initialQuery = "") {
  window.dispatchEvent(new CustomEvent("srp:open-search", { detail: { query: initialQuery } }));
}

const POPULAR_QUERIES = [
  "cl_crosshair",
  "viewmodel_fov",
  "fps_max",
  "sv_cheats",
  "mp_warmup",
  "cl_radar",
  "sensitivity",
  "annotation_load",
];

export function CommandPalette() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | ConsoleRecordType>("all");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [engine, setEngine] = useState<"pagefind" | "index">("pagefind");
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onCustomOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ query?: string }>).detail;
      if (detail?.query !== undefined) setQuery(detail.query);
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("srp:open-search", onCustomOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("srp:open-search", onCustomOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setHits([]);
      setSearching(false);
      setActiveIndex(0);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      const result = await searchConsole(trimmed, filterType, 14);
      if (cancelled) return;
      setHits(result.hits);
      setEngine(result.engine);
      setActiveIndex(0);
      setSearching(false);
    }, 90);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, filterType]);

  function goTo(url: string) {
    setOpen(false);
    navigate(url);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!hits.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + hits.length) % hits.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[activeIndex] ?? hits[0];
      if (hit) goTo(hit.url);
    }
  }

  const quickLinks = [
    { to: "/console/convars", label: locale === "zh" ? "浏览全部 ConVars" : "Browse all ConVars", icon: Boxes },
    { to: "/console/commands", label: locale === "zh" ? "浏览全部 Commands" : "Browse all Commands", icon: Terminal },
    { to: "/console/categories", label: locale === "zh" ? "按分类浏览" : "Browse by category", icon: FolderTree },
    { to: "/console/flags", label: locale === "zh" ? "按 Flags 筛选" : "Browse by flags", icon: Flag },
    { to: "/download", label: locale === "zh" ? "下载桌面套件与内容包" : "Download desktop suite & packages", icon: Download },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          onKeyDown={handleKeyDown}
          className="fixed left-1/2 top-[11vh] z-50 w-[min(680px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-2xl shadow-black/70 focus:outline-none"
        >
          <Dialog.Title className="sr-only">{t.search.title}</Dialog.Title>

          {/* Search input bar */}
          <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
            <Search size={18} className="shrink-0 text-dim" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.search.placeholder}
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label={t.search.clear}
                className="rounded-md p-1 text-dim transition hover:bg-white/5 hover:text-ink"
              >
                <X size={15} />
              </button>
            )}
            <Dialog.Close
              aria-label={t.nav.close}
              className="rounded-md border border-line bg-card px-2 py-0.5 font-mono text-[11px] text-dim transition hover:border-line-strong hover:text-ink"
            >
              ESC
            </Dialog.Close>
          </div>

          {/* Type filter tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-line bg-canvas/50 px-4 py-2">
            <div className="flex items-center gap-1.5" role="group" aria-label={t.search.filterLabel}>
              {(["all", "convar", "command"] as const).map((item) => {
                const active = filterType === item;
                const label =
                  item === "all"
                    ? t.search.filterAll
                    : item === "convar"
                      ? "ConVars"
                      : "Commands";
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilterType(item)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      active
                        ? "bg-cs-orange/15 text-cs-orange ring-1 ring-inset ring-cs-orange/30"
                        : "text-dim hover:bg-white/5 hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <span className="font-mono text-[11px] text-muted">
              {engine === "pagefind" ? "Pagefind" : "Index"}
            </span>
          </div>

          {/* Results or empty suggestions */}
          <div className="max-h-[56vh] overflow-y-auto p-2">
            {!query.trim() ? (
              <div className="space-y-4 p-2">
                <div>
                  <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {t.search.popular}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_QUERIES.map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => setQuery(sample)}
                        className="rounded-lg border border-line bg-card px-2.5 py-1 font-mono text-xs text-dim transition hover:border-cs-orange/40 hover:text-ink"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {t.search.quickNav}
                  </div>
                  <div className="space-y-0.5">
                    {quickLinks.map(({ to, label, icon: Icon }) => (
                      <button
                        key={to}
                        type="button"
                        onClick={() => goTo(to)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-dim transition hover:bg-white/[0.04] hover:text-ink"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon size={15} className="text-muted" aria-hidden="true" />
                          {label}
                        </span>
                        <ArrowRight size={14} className="text-muted" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : searching ? (
              <div className="py-10 text-center text-sm text-dim">{t.search.searching}</div>
            ) : hits.length === 0 ? (
              <div className="space-y-3 py-10 text-center">
                <p className="text-sm text-dim">{t.search.empty}</p>
                <button
                  type="button"
                  onClick={() => goTo(`/console/convars?q=${encodeURIComponent(query.trim())}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs text-ink transition hover:border-cs-orange/40"
                >
                  {t.search.searchInTable}
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <ul className="space-y-1" role="listbox">
                {hits.map((hit, idx) => {
                  const selected = idx === activeIndex;
                  return (
                    <li key={hit.url} role="option" aria-selected={selected}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => goTo(hit.url)}
                        className={`flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                          selected ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-mono text-sm font-semibold text-ink">
                              {hit.title}
                            </span>
                            {hit.type && (
                              <span
                                className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase ${
                                  hit.type === "convar"
                                    ? "bg-cs-emerald/15 text-cs-emerald"
                                    : "bg-cs-blue/15 text-cs-blue"
                                }`}
                              >
                                {hit.type}
                              </span>
                            )}
                          </div>
                          {hit.excerpt && (
                            <p
                              className="pagefind-excerpt mt-1 line-clamp-2 text-xs leading-relaxed text-dim"
                              dangerouslySetInnerHTML={{ __html: hit.excerpt }}
                            />
                          )}
                        </div>
                        <CornerDownLeft
                          size={14}
                          className={`mt-1 shrink-0 ${selected ? "text-cs-orange" : "text-muted/50"}`}
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center justify-between border-t border-line bg-canvas/60 px-4 py-2 text-[11px] text-muted">
            <div className="flex items-center gap-3">
              <span>↑↓ {t.search.hintNavigate}</span>
              <span>↵ {t.search.hintOpen}</span>
              <span>ESC {t.search.hintClose}</span>
            </div>
            {query.trim() && (
              <button
                type="button"
                onClick={() => goTo(`/console/convars?q=${encodeURIComponent(query.trim())}`)}
                className="text-dim transition hover:text-cs-orange"
              >
                {t.search.openFullList} →
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
