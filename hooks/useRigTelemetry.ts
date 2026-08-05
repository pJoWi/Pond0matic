"use client";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { useSettings } from "@/contexts/SettingsContext";
import { boostProjection, type BoostProjection } from "@/lib/rig/boost";
import {
  parseHealth,
  parseManifest,
  parseLuck,
  parseBubbles,
  type CaryHealth,
  type CaryManifest,
  type Luck,
} from "@/lib/rig/telemetry";

export interface RigTelemetry {
  connected: boolean;
  /** User-entered current boost (read from pond0x.com/mining); null when unset.
   *  The live value is not fetchable — it's gated behind the active
   *  mining-session token — so the boost is a manual, persisted input. */
  boost: number | null;
  setBoost: (value: number) => void;
  projection: BoostProjection;
  /** Confirmed swaps this app session — drives the "this session" momentum. */
  sessionSwaps: number;
  health: CaryHealth | null;
  manifest: CaryManifest | null;
  luck: Luck | null;
  /** cary0x bubbles count; null until loaded / on error. */
  bubbles: number | null;
  incrementSwap: () => void;
  refresh: () => void;
}

export function useRigTelemetry(): RigTelemetry {
  const { publicKey } = useWallet();
  const { settings, update } = useSettings();
  const wallet = publicKey?.toBase58() ?? "";
  const intervalMs = useVisibilityPolling();

  const [health, setHealth] = useState<CaryHealth | null>(null);
  const [manifest, setManifest] = useState<CaryManifest | null>(null);
  const [luck, setLuck] = useState<Luck | null>(null);
  const [bubbles, setBubbles] = useState<number | null>(null);
  const [sessionSwaps, setSessionSwaps] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);

  // cary0x health + manifest + luck + bubbles via visibility-aware polling
  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    const load = async () => {
      const [h, m, l, b] = await Promise.all([
        fetch(`/api/rig/health/${wallet}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`/api/rig/manifest/${wallet}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`/api/rig/luck/${wallet}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`/api/rig/bubbles/${wallet}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      if (cancelled) return;
      try { setHealth(h ? parseHealth(h) : null); } catch { setHealth(null); }
      try { setManifest(m ? parseManifest(m) : null); } catch { setManifest(null); }
      try { setLuck(l ? parseLuck(l) : null); } catch { setLuck(null); }
      try { setBubbles(b ? parseBubbles(b).bubbles : null); } catch { setBubbles(null); }
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [wallet, intervalMs, refreshTick]);

  const incrementSwap = useCallback(() => setSessionSwaps((n) => n + 1), []);
  const refresh = useCallback(() => setRefreshTick((n) => n + 1), []);
  const setBoost = useCallback(
    (value: number) => update({ rigBoost: Math.max(0, Math.min(10000, value || 0)) }),
    [update]
  );

  const boost = settings.rigBoost > 0 ? settings.rigBoost : null;

  return {
    connected: Boolean(wallet),
    boost,
    setBoost,
    projection: boostProjection(boost ?? 0, sessionSwaps),
    sessionSwaps,
    health,
    manifest,
    luck,
    bubbles,
    incrementSwap,
    refresh,
  };
}
