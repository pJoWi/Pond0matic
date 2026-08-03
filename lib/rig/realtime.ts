/**
 * Thin wrapper over pond0x's public Supabase Realtime `blockengine` channel.
 * Read-only, anon key, no signature (verified 2026-08-03). Isolated here so a
 * schema/endpoint change is one file, and any failure degrades to the hook's
 * fallback rather than breaking the tab.
 */
import { RealtimeClient } from "@supabase/realtime-js";
import { findWalletRow, parsePoolRow, type PoolRow } from "@/lib/rig/telemetry";

const URL = process.env.NEXT_PUBLIC_POND0X_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_POND0X_SUPABASE_ANON_KEY;

export function subscribeMpool(
  wallet: string,
  onRow: (row: PoolRow | null) => void,
  onPool?: (rows: PoolRow[]) => void
): () => void {
  if (!URL || !KEY || !wallet) return () => {};

  const client = new RealtimeClient(`${URL.replace("https", "wss")}/realtime/v1`, {
    params: { apikey: KEY, eventsPerSecond: 5 },
  });
  const channel = client.channel("blockengine", { config: { broadcast: { ack: true } } });

  channel
    .on("broadcast", { event: "mpool" }, (msg: { payload?: { pool?: unknown } }) => {
      const pool = msg?.payload?.pool;
      onRow(findWalletRow(pool, wallet));
      if (onPool && Array.isArray(pool)) {
        onPool(pool.map(parsePoolRow).filter((r): r is PoolRow => r !== null));
      }
    })
    .subscribe();

  return () => {
    try { channel.unsubscribe(); client.disconnect(); } catch { /* ignore */ }
  };
}
