"use client";
import { useEffect, useState } from "react";

const DEFAULT_VISIBLE_MS = 30_000;
const DEFAULT_HIDDEN_MS = 5 * 60 * 1000;

/**
 * Tracks `document.visibilityState` and returns the appropriate poll interval.
 *
 *   visible -> visibleMs (default 30s)
 *   hidden  -> hiddenMs  (default 5m)
 *
 * Usage:
 *   const intervalMs = useVisibilityPolling();
 *   useEffect(() => {
 *     const id = setInterval(fetchSomething, intervalMs);
 *     return () => clearInterval(id);
 *   }, [intervalMs]);
 *
 * The returned value changes when visibility flips, so any effect that
 * depends on it will re-run with the new interval.
 */
export function useVisibilityPolling(
  visibleMs: number = DEFAULT_VISIBLE_MS,
  hiddenMs: number = DEFAULT_HIDDEN_MS
): number {
  const initial = typeof document !== "undefined" && document.visibilityState === "hidden" ? hiddenMs : visibleMs;
  const [intervalMs, setIntervalMs] = useState<number>(initial);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibilityChange = () => {
      setIntervalMs(document.visibilityState === "hidden" ? hiddenMs : visibleMs);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [visibleMs, hiddenMs]);

  return intervalMs;
}
