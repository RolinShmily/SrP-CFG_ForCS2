import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import { detailPath } from "@/lib/console/paths";
import type { ConsoleIndexRecord } from "@/lib/console/types";
import { StatusBadge, TypeBadge } from "./status-badge";

export function ConsoleSearch({
  records,
  loading,
  error,
  onRetry,
}: {
  records: ConsoleIndexRecord[] | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}) {
  const { locale } = useI18n();
  const copy = consoleCopy[locale];
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === inputRef.current) {
        setQuery("");
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || !records) return [];
    return records
      .filter((record) => {
        return (
          record.name.toLowerCase().includes(needle) ||
          record.summary.toLowerCase().includes(needle) ||
          record.category.toLowerCase().includes(needle) ||
          record.flags.some((flag) => flag.toLowerCase().includes(needle))
        );
      })
      .slice(0, 12);
  }, [query, records]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const first = matches[0];
    if (first) {
      navigate(detailPath(first.type, first.name));
      return;
    }
    if (query.trim()) {
      navigate(`/console/convars?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const showResults = query.trim().length > 0;

  return (
    <div className="console-search-row">
      <form className="console-search" onSubmit={submit} role="search">
        <Search size={17} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.overview.searchPlaceholder}
          aria-label={copy.common.search}
          autoComplete="off"
          spellCheck={false}
        />
      </form>
      <p className="console-search-hint">{copy.overview.searchHint}</p>

      {showResults && (
        <div className="console-search-results" aria-live="polite">
          {loading ? (
            <div className="console-loading" style={{ border: 0, background: "transparent" }}>
              {copy.common.loading}
            </div>
          ) : error ? (
            <div className="console-error" style={{ border: 0, background: "transparent" }}>
              {copy.common.error} <span className="console-muted">{error}</span>
              {onRetry && (
                <button type="button" className="console-retry" onClick={onRetry}>
                  {copy.common.retry}
                </button>
              )}
            </div>
          ) : matches.length === 0 ? (
            <div className="console-empty" style={{ border: 0, background: "transparent" }}>
              {copy.common.noResults}
            </div>
          ) : (
            matches.map((record) => (
              <Link prefetch="intent"
                key={record.key}
                className="console-search-result"
                to={detailPath(record.type, record.name)}
              >
                <div className="console-search-result-main">
                  <strong>{record.name}</strong>
                  <span>{record.summary || copy.detail.missingTranslation}</span>
                </div>
                <div className="console-search-result-meta">
                  <TypeBadge type={record.type} />
                  <StatusBadge status={record.translationStatus} />
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
