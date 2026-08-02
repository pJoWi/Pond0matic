"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicKey } from "@solana/web3.js";
import { useVisibilityPolling } from "./useVisibilityPolling";
import type { RigHealthSnapshot } from "@/lib/rig/types";

interface UseRigHealthResult {
  current: RigHealthSnapshot | null;
  previous: RigHealthSnapshot | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

const EMPTY: Omit<UseRigHealthResult, "refresh"> = {
  current: null,
  previous: null,
  loading: false,
  error: null,
};

function parseSnapshot(data: any, fetchedAt: number): RigHealthSnapshot | null {
  const stats = data?.stats;
  if (!stats || typeof stats !== "object") return null;
  return {
    health: typeof stats.health === "number" ? stats.health * 10 : 0,
    drifted: typeof stats.drifted === "number" ? stats.drifted : 0,
    failed: typeof stats.failed === "number" ? stats.failed : 0,
    inMempool: typeof stats.in_mempool === "number" ? stats.in_mempool : 0,
    sent: typeof stats.sent === "number" ? stats.sent : 0,
    miningSessions: typeof stats.mining_sessions === "number" ? stats.mining_sessions : 0,
    fetchedAt,
  };
}

/**
 * Polls /api/rig/health/[wallet] on a visibility-aware schedule and exposes
 * the latest two snapshots so delta-based rules (drift spike, failed spike)
 * can be evaluated cheaply by the alert engine.
 *
 * Returns the empty disconnected state when publicKey is null. Survives
 * RPC errors without crashing — error is exposed but state stays consistent.
 */
export function useRigHealth(publicKey: PublicKey | null): UseRigHealthResult {
  const [state, setState] = useState<Omit<UseRigHealthResult, "refresh">>(EMPTY);
  const [tick, setTick] = useState(0);
  const intervalMs = useVisibilityPolling();
  const previousRef = useRef<RigHealthSnapshot | null>(null);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!publicKey) {
      previousRef.current = null;
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    const wallet = publicKey.toBase58();

    const fetchOnce = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetch(`/api/rig/health/${wallet}`);
        if (!res.ok) throw new Error(`Rig health fetch failed: ${res.status}`);
        const data = await res.json();
        const snap = parseSnapshot(data, Date.now());
        if (cancelled) return;
        if (!snap) {
          setState({ current: null, previous: null, loading: false, error: new Error("Invalid rig health payload") });
          return;
        }
        const previous = previousRef.current;
        previousRef.current = snap;
        setState({ current: snap, previous, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      }
    };

    fetchOnce();
    const id = setInterval(fetchOnce, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [publicKey, intervalMs, tick]);

  return { ...state, refresh };
}
