import { useCallback, useEffect, useState } from "react";

import { assetPath } from "@/lib/downloads";
import type { ConsoleIndex } from "./types";

let cache: Promise<ConsoleIndex> | null = null;

export function loadConsoleIndex(force = false): Promise<ConsoleIndex> {
  if (force) cache = null;
  if (!cache) {
    cache = fetch(assetPath("/data/console-index.json"), {
      headers: { Accept: "application/json" },
    }).then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as ConsoleIndex;
    });
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

export function useConsoleIndex() {
  const [index, setIndex] = useState<ConsoleIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadConsoleIndex(attempt > 0)
      .then((value) => {
        if (cancelled) return;
        setIndex(value);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : String(reason));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { index, loading, error, reload };
}
