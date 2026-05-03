"use client";
import { useEffect, useState } from "react";
import { ALERTS_UPDATED_EVENT, loadConfig } from "@/lib/alerts/storage";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function compute(): number {
  const cfg = loadConfig();
  const now = Date.now();
  return cfg.recentTriggers.filter((e) => now - e.firedAt < ONE_DAY_MS).length;
}

/**
 * Number of alert events fired in the last 24h.
 * Recomputes when alerts are updated (same tab) or storage changes (cross-tab).
 * Also reruns every minute to drop expired triggers from the count.
 */
export function useAlertsBadgeCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(compute());
    const refresh = () => setCount(compute());
    window.addEventListener(ALERTS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    const interval = setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener(ALERTS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      clearInterval(interval);
    };
  }, []);

  return count;
}
