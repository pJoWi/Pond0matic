"use client";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { boostProjection, type BoostProjection } from "@/lib/rig/boost";
import {
  parseHealth, parseManifest, parseLuck,
  type CaryHealth, type CaryManifest, type Luck, type PoolRow,
} from "@/lib/rig/telemetry";
import { subscribeMpool } from "@/lib/rig/realtime";

export interface RigTelemetry {
  connected: boolean;
  live: boolean;               // true when our wallet is in the live pool
  boost: number | null;        // live, else last-known
  unclaimed: number | null;
  projection: BoostProjection;
  sessionSwaps: number;        // confirmed swaps this app session
  health: CaryHealth | null;
  manifest: CaryManifest | null;
  luck: Luck | null;
  topBoost: number | null;     // highest boost in the live pool (leaderboard)
  incrementSwap: () => void;
  refresh: () => void;
}

export function useRigTelemetry(): RigTelemetry {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";
  const intervalMs = useVisibilityPolling();

  const [boost, setBoost] = useState<number | null>(null);
  const [unclaimed, setUnclaimed] = useState<number | null>(null);
  const [live, setLive] = useState(false);
  const [topBoost, setTopBoost] = useState<number | null>(null);
  const [health, setHealth] = useState<CaryHealth | null>(null);
  const [manifest, setManifest] = useState<CaryManifest | null>(null);
  const [luck, setLuck] = useState<Luck | null>(null);
  const [sessionSwaps, setSessionSwaps] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);

  // Live boost/unclaimed via Supabase Realtime (present only while mining)
  useEffect(() => {
    if (!wallet) return;
    const unsub = subscribeMpool(
      wallet,
      (row: PoolRow | null) => {
        if (row) { setBoost(row.boost); setUnclaimed(row.unclaimed); setLive(true); }
        else setLive(false);
      },
      (rows: PoolRow[]) => setTopBoost(rows.reduce((m, r) => Math.max(m, r.boost), 0) || null)
    );
    return unsub;
  }, [wallet]);

  // cary0x health + manifest + luck via visibility-aware polling
  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    const load = async () => {
      const [h, m, l] = await Promise.all([
        fetch(`/api/rig/health/${wallet}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`/api/rig/manifest/${wallet}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`/api/rig/luck/${wallet}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      if (cancelled) return;
      try { setHealth(h ? parseHealth(h) : null); } catch { setHealth(null); }
      try { setManifest(m ? parseManifest(m) : null); } catch { setManifest(null); }
      try { setLuck(l ? parseLuck(l) : null); } catch { setLuck(null); }
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [wallet, intervalMs, refreshTick]);

  const incrementSwap = useCallback(() => setSessionSwaps((n) => n + 1), []);
  const refresh = useCallback(() => setRefreshTick((n) => n + 1), []);

  return {
    connected: Boolean(wallet),
    live, boost, unclaimed,
    projection: boostProjection(boost ?? 0, sessionSwaps),
    sessionSwaps, health, manifest, luck, topBoost,
    incrementSwap, refresh,
  };
}
