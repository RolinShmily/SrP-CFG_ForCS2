import { ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import type {
  ConsoleIndexRecord,
  ConsoleListLoaderData,
  ConsoleRecordType,
} from "@/lib/console/types";
import { useConsoleIndex } from "@/lib/console/use-console-index";
import { RecordTable } from "./record-table";

const PAGE_SIZE = 50;

function isInternal(record: ConsoleIndexRecord): boolean {
  return record.flags.includes("developmentonly") || record.flags.includes("defensive");
}

export function RecordListPage({
  type,
  data,
}: {
  type: ConsoleRecordType;
  data: ConsoleListLoaderData;
}) {
  const { locale } = useI18n();
  const copy = consoleCopy[locale];
  const [searchParams, setSearchParams] = useSearchParams();
  const { index, loading, error, reload } = useConsoleIndex();
  const [page, setPage] = useState(1);

  const qParam = searchParams.get("q") ?? "";
  const categoryParam = searchParams.get("category") ?? "";
  const flagParam = searchParams.get("flag") ?? "";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [flag, setFlag] = useState("");
  const [includeInternal, setIncludeInternal] = useState(false);

  useEffect(() => {
    setQuery(qParam);
    setCategory(categoryParam);
    setFlag(flagParam);
  }, [qParam, categoryParam, flagParam]);

  useEffect(() => {
    setPage(1);
  }, [query, category, flag, includeInternal]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (query) next.set("q", query);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  const matches = useMemo(() => {
    if (!index) return [];
    const needle = query.trim().toLowerCase();
    return index.records
      .filter((record) => record.type === type)
      .filter((record) => includeInternal || !isInternal(record))
      .filter((record) => !category || record.category === category)
      .filter((record) => !flag || record.flags.includes(flag))
      .filter((record) => {
        if (!needle) return true;
        return (
          record.name.toLowerCase().includes(needle) ||
          record.summary.toLowerCase().includes(needle) ||
          record.category.toLowerCase().includes(needle) ||
          record.flags.some((item) => item.toLowerCase().includes(needle))
        );
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [index, type, query, category, flag, includeInternal]);

  const total = type === "convar" ? data.counts.convars : data.counts.commands;
  const publicTotal = type === "convar" ? data.publicCounts.convars : data.publicCounts.commands;
  const visibleTotal = includeInternal ? total : publicTotal;
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = matches.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = Boolean(query || category || flag || includeInternal);
  const title = type === "convar" ? copy.list.convarsTitle : copy.list.commandsTitle;
  const description =
    type === "convar" ? copy.list.convarsDescription : copy.list.commandsDescription;

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-cs-orange">
            CS2 CONSOLE · {type === "convar" ? "CONVARS" : "COMMANDS"}
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
          <p className="mt-1.5 text-sm text-dim">{description}</p>
        </div>
        <div className="shrink-0 rounded-xl border border-line bg-surface px-3.5 py-2 font-mono text-xs text-dim">
          <span className="font-semibold text-ink">{visibleTotal.toLocaleString()}</span> {copy.common.records}
        </div>
      </header>

      {/* Filter workbench toolbar */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.list.searchPlaceholder}
            aria-label={copy.common.search}
            className="h-9 w-full rounded-lg border border-line bg-canvas pl-9 pr-3 text-xs text-ink placeholder:text-muted focus:border-cs-orange/50 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              updateParam("category", event.target.value);
            }}
            aria-label={copy.list.filterCategory}
            className="h-9 rounded-lg border border-line bg-canvas px-2.5 text-xs text-ink focus:border-cs-orange/50 focus:outline-none"
          >
            <option value="">{copy.list.filterCategory}</option>
            {data.categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {locale === "zh" ? item.zh : item.en} ({item.count})
              </option>
            ))}
          </select>

          <select
            value={flag}
            onChange={(event) => {
              setFlag(event.target.value);
              updateParam("flag", event.target.value);
            }}
            aria-label={copy.list.filterFlag}
            className="h-9 rounded-lg border border-line bg-canvas px-2.5 font-mono text-xs text-ink focus:border-cs-orange/50 focus:outline-none"
          >
            <option value="">{copy.list.filterFlag}</option>
            {data.flags.map((item) => (
              <option key={item.flag} value={item.flag}>
                {item.flag} ({item.count})
              </option>
            ))}
          </select>

          <label className="inline-flex h-9 cursor-pointer select-none items-center gap-2 rounded-lg border border-line bg-canvas px-3 text-xs text-dim transition hover:border-line-strong hover:text-ink">
            <input
              type="checkbox"
              checked={includeInternal}
              onChange={(event) => setIncludeInternal(event.target.checked)}
              className="accent-amber-500"
            />
            <span>{copy.list.includeInternal}</span>
          </label>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchParams(new URLSearchParams(), { replace: true });
                setQuery("");
                setCategory("");
                setFlag("");
                setIncludeInternal(false);
              }}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-line bg-card px-2.5 text-xs text-dim transition hover:border-line-strong hover:text-ink"
            >
              <X size={13} />
              {copy.list.clearFilters}
            </button>
          )}
        </div>
      </div>

      {/* Count summary */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {copy.list.showing}{" "}
          <strong className="font-mono text-dim">{matches.length.toLocaleString()}</strong>{" "}
          {copy.common.of}{" "}
          <span className="font-mono">{visibleTotal.toLocaleString()}</span>
        </span>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-line bg-surface px-6 py-14 text-center text-sm text-dim">
          {copy.list.loadingIndex}
        </div>
      ) : error ? (
        <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
          <span>
            {copy.common.error} <span className="text-rose-300/80">{error}</span>
          </span>
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-canvas px-3 py-1.5 text-xs font-medium text-ink"
          >
            <RefreshCw size={12} />
            {copy.common.retry}
          </button>
        </div>
      ) : (
        <>
          <RecordTable records={visible} empty={copy.list.noResults} categories={data.categories} />

          {pageCount > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-2.5 text-xs text-dim">
              <span>
                {copy.common.page} <strong className="font-mono text-ink">{safePage}</strong>{" "}
                {copy.common.of} <span className="font-mono">{pageCount}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas px-3 py-1.5 font-medium text-ink transition hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  {copy.common.previous}
                </button>
                <button
                  type="button"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas px-3 py-1.5 font-medium text-ink transition hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copy.common.next}
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
