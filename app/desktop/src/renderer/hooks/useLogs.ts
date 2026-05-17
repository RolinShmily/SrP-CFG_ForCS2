import { useState, useEffect, useCallback, useRef } from "react";
import type { LogEntry } from "../types";

const MAX_LOGS = 1000;

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const bufferRef = useRef<LogEntry[]>([]);
  const rafRef = useRef<number | null>(null);

  const flushBuffer = useCallback(() => {
    if (bufferRef.current.length > 0) {
      const batch = bufferRef.current;
      bufferRef.current = [];
      setLogs((prev) => {
        const next = [...prev, ...batch];
        return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
      });
    }
    rafRef.current = null;
  }, []);

  const addLog = useCallback(
    (entry: LogEntry) => {
      bufferRef.current.push(entry);
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flushBuffer);
      }
    },
    [flushBuffer],
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
    bufferRef.current = [];
  }, []);

  useEffect(() => {
    const unsubscribe = window.api.onLog(addLog);
    return () => {
      unsubscribe();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [addLog]);

  return { logs, clearLogs };
}
