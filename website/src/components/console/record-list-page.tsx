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
  // Start with empty filters so the first client render matches the static
  // prerendered HTML. URL parameters are applied after hydration; reading them
  // during the first render causes React #418 on direct `?q=` links.
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
    // Preserve a typed query when a category/flag select changes it; the query
    // itself is local-only until a reload or a link supplies `?q=`.
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
  const publicTotal =
    type === "convar" ? data.publicCounts.convars : data.publicCounts.commands;
  const visibleTotal = includeInternal ? total : publicTotal;
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = matches.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = Boolean(query || category || flag || includeInternal);
  const title = type === "convar" ? copy.list.convarsTitle : copy.list.commandsTitle;
  const description =
    type === "convar" ? copy.list.convarsDescription : copy.list.commandsDescription;

  return (
    <>
      <div className="console-list-head">
        <div>
          <p className="console-eyebrow">CS2 CONSOLE</p>
          <h1 className="console-list-title">{title}</h1>
          <p className="console-list-note">{description}</p>
        </div>
        <div className="console-card-count">
          {visibleTotal.toLocaleString()} {copy.common.records}
        </div>
      </div>

      <div className="console-filters">
        <div className="console-field" style={{ flex: 1 }}>
          <input
            className="console-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.list.searchPlaceholder}
            aria-label={copy.common.search}
          />
        </div>
        <div className="console-field">
          <select
            className="console-select"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              updateParam("category", event.target.value);
            }}
            aria-label={copy.list.filterCategory}
          >
            <option value="">{copy.list.filterCategory}</option>
            {data.categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {locale === "zh" ? item.zh : item.en} ({item.count})
              </option>
            ))}
          </select>
        </div>
        <div className="console-field">
          <select
            className="console-select"
            value={flag}
            onChange={(event) => {
              setFlag(event.target.value);
              updateParam("flag", event.target.value);
            }}
            aria-label={copy.list.filterFlag}
          >
            <option value="">{copy.list.filterFlag}</option>
            {data.flags.map((item) => (
              <option key={item.flag} value={item.flag}>
                {item.flag} ({item.count})
              </option>
            ))}
          </select>
        </div>
        <label className="console-toggle">
          <input
            type="checkbox"
            checked={includeInternal}
            onChange={(event) => setIncludeInternal(event.target.checked)}
          />
          <span>{copy.list.includeInternal}</span>
        </label>
        {hasFilters && (
          <button
            type="button"
            className="console-clear"
            onClick={() => {
              setSearchParams(new URLSearchParams(), { replace: true });
              setQuery("");
              setCategory("");
              setFlag("");
              setIncludeInternal(false);
            }}
          >
            {copy.list.clearFilters}
          </button>
        )}
      </div>

      <div className="console-muted" style={{ fontSize: 12, marginBottom: 10 }}>
        {copy.list.showing} {matches.length.toLocaleString()} {copy.common.of}{" "}
        {visibleTotal.toLocaleString()}
      </div>

      {loading ? (
        <div className="console-loading">{copy.list.loadingIndex}</div>
      ) : error ? (
        <div className="console-error">
          {copy.common.error} <span className="console-muted">{error}</span>
          <button type="button" className="console-retry" onClick={reload}>
            {copy.common.retry}
          </button>
        </div>
      ) : (
        <>
          <RecordTable
            records={visible}
            empty={copy.list.noResults}
            categories={data.categories}
          />
          {pageCount > 1 && (
            <div className="console-pager">
              <span>
                {copy.common.page} {safePage} {copy.common.of} {pageCount}
              </span>
              <div className="console-pager-actions">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  {copy.common.previous}
                </button>
                <button
                  type="button"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                >
                  {copy.common.next}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
