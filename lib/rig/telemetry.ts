/**
 * Boundary parsers + types for rig telemetry sources. Zod-validated
 * (convention #3). Cary0x/luck parsers throw on invalid input; the pool-row
 * parser is lenient (returns null) because it runs inside a realtime callback.
 */
import { z } from "zod";

export interface CaryHealth {
  health: number; miningSessions: number; inMempool: number; sent: number;
  failed: number; drifted: number; driftRisk: number; priority: number;
  maxClaimUsd: number; driftedUsd: number; aiHints: string[];
}
export interface CaryManifest { isPro: boolean; badges: string[]; hasTwitter: boolean; }
export interface PoolRow { wallet: string; boost: number; unclaimed: number; }
export interface Luck { luck: number; referrals: number; }

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
});
export function parseManifest(json: unknown): CaryManifest {
  const d = ManifestSchema.parse(json);
  return {
    isPro: d.isPro ?? false,
    hasTwitter: d.hasTwitter ?? false,
    badges: (d.badges ?? "").split(",").map((b) => b.trim()).filter(Boolean),
  };
}

const LuckSchema = z.looseObject({ luck: z.number().optional(), referrals: z.number().optional() });
export function parseLuck(json: unknown): Luck {
  const d = LuckSchema.parse(json);
  return { luck: d.luck ?? 0, referrals: d.referrals ?? 0 };
}

const PoolRowSchema = z.looseObject({
  address: z.string().optional(), wallet: z.string().optional(),
  boost: z.number().optional(), multiplier: z.number().optional(),
  unclaimed: z.union([z.number(), z.string()]).optional(),
});
export function parsePoolRow(raw: unknown): PoolRow | null {
  const r = PoolRowSchema.safeParse(raw);
  if (!r.success) return null;
  const d = r.data;
  const wallet = d.address ?? d.wallet;
  const boost = d.boost ?? d.multiplier;
  if (!wallet || boost == null) return null;
  const unclaimed = typeof d.unclaimed === "string" ? Number(d.unclaimed) : d.unclaimed ?? 0;
  return { wallet, boost, unclaimed: Number.isFinite(unclaimed) ? unclaimed : 0 };
}

export function findWalletRow(pool: unknown, wallet: string): PoolRow | null {
  if (!Array.isArray(pool)) return null;
  for (const raw of pool) {
    const row = parsePoolRow(raw);
    if (row && row.wallet === wallet) return row;
  }
  return null;
}
