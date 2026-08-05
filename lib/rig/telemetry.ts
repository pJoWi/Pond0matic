/**
 * Boundary parsers + types for rig telemetry sources (cary0x health/manifest,
 * pond0x luck). Zod-validated (convention #3); parsers throw on invalid input
 * and the caller catches → null.
 */
import { z } from "zod";

export interface CaryHealth {
  health: number; miningSessions: number; inMempool: number; sent: number;
  failed: number; drifted: number; driftRisk: number; priority: number;
  maxClaimUsd: number; driftedUsd: number; aiHints: string[];
}
export interface CaryManifest {
  isPro: boolean; badges: string[]; hasTwitter: boolean;
  /** Pond0x-recognized Solana swap count (manifest `proSwapsSol`) — a lifetime
   *  total, present even when isPro is false. The authoritative "total swaps". */
  solSwaps: number;
  /** Second manifest swap counter (`proSwapsBx`); "Bx" is undocumented. */
  bxSwaps: number;
}
export interface Luck { luck: number; referrals: number; }
/** cary0x bubbles metric — distinct from swaps (larger; semantics undocumented). */
export interface Bubbles { bubbles: number; }

const HealthSchema = z.looseObject({
  stats: z.looseObject({
    mining_sessions: z.number(), in_mempool: z.number(), sent: z.number(),
    failed: z.number(), drifted: z.number(), drift_risk: z.number(),
    priority: z.number(), health: z.number(),
    estimates: z.looseObject({
      max_claim_estimate_usd: z.number().optional(),
      drifted_usd: z.number().optional(),
    }).optional(),
  }),
  ai_beta: z.array(z.string()).optional(),
});

export function parseHealth(json: unknown): CaryHealth {
  const d = HealthSchema.parse(json);
  const s = d.stats;
  return {
    health: s.health, miningSessions: s.mining_sessions, inMempool: s.in_mempool,
    sent: s.sent, failed: s.failed, drifted: s.drifted, driftRisk: s.drift_risk,
    priority: s.priority, maxClaimUsd: s.estimates?.max_claim_estimate_usd ?? 0,
    driftedUsd: s.estimates?.drifted_usd ?? 0, aiHints: d.ai_beta ?? [],
  };
}

const ManifestSchema = z.looseObject({
  isPro: z.boolean().optional(),
  badges: z.string().optional(),
  hasTwitter: z.boolean().optional(),
  proSwapsSol: z.number().optional(),
  proSwapsBx: z.number().optional(),
});
export function parseManifest(json: unknown): CaryManifest {
  const d = ManifestSchema.parse(json);
  return {
    isPro: d.isPro ?? false,
    hasTwitter: d.hasTwitter ?? false,
    badges: (d.badges ?? "").split(",").map((b) => b.trim()).filter(Boolean),
    solSwaps: d.proSwapsSol ?? 0,
    bxSwaps: d.proSwapsBx ?? 0,
  };
}

const LuckSchema = z.looseObject({ luck: z.number().optional(), referrals: z.number().optional() });
export function parseLuck(json: unknown): Luck {
  const d = LuckSchema.parse(json);
  return { luck: d.luck ?? 0, referrals: d.referrals ?? 0 };
}

const BubblesSchema = z.looseObject({
  bubbles: z.number().optional(),
  error: z.string().optional(),
});
export function parseBubbles(json: unknown): Bubbles {
  const d = BubblesSchema.parse(json);
  // cary0x returns HTTP 200 with {"error":"Too many requests."} when rate-limited
  // — reject it so the caller falls back to null instead of showing a bogus 0.
  if (d.error) throw new Error(d.error);
  return { bubbles: d.bubbles ?? 0 };
}
