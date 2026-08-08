/**
 * Geoff (geoff.ai) insight types + Zod boundary schemas.
 *
 * Two directions are validated here:
 *   1. Snapshot IN  — what the browser posts to /api/geoff/insight. Validated
 *      server-side so a malformed/oversized payload never reaches Geoff.
 *   2. Insight OUT  — what the model returns. Model output is untrusted text;
 *      it is JSON-parsed then Zod-validated before it can reach the UI.
 *
 * Privacy: snapshots deliberately carry NO wallet address, transaction
 * signature, or API key — only derived numbers. Keep it that way; this payload
 * leaves the machine.
 */
import { z } from "zod";

/** Geoff model IDs: preview = fast/cheap text, duce = audio, magma = 1M ctx. */
export const GEOFF_MODELS = ["preview", "duce", "magma"] as const;
export type GeoffModel = (typeof GEOFF_MODELS)[number];

// ---------------------------------------------------------------------------
// Snapshot in
// ---------------------------------------------------------------------------

const finite = z.number().finite();

export const RigSnapshotSchema = z.object({
  kind: z.literal("rig"),
  /** User-entered live boost from pond0x.com/mining; null when unset. */
  boost: finite.nullable(),
  maxBoost: finite,
  pctToMax: finite,
  swapsToMax: finite,
  sessionBoostAdded: finite,
  sessionsBuffer: finite,
  /** Confirmed swaps in this app session. */
  sessionSwaps: finite,
  health: z
    .object({
      health: finite,
      miningSessions: finite,
      inMempool: finite,
      sent: finite,
      failed: finite,
      drifted: finite,
      driftRisk: finite,
      priority: finite,
      maxClaimUsd: finite,
      driftedUsd: finite,
      aiHints: z.array(z.string().max(400)).max(10),
    })
    .nullable(),
  manifest: z
    .object({
      isPro: z.boolean(),
      badges: z.array(z.string().max(60)).max(30),
      hasTwitter: z.boolean(),
      solSwaps: finite,
      bxSwaps: finite,
    })
    .nullable(),
  luck: z.object({ luck: finite, referrals: finite }).nullable(),
  bubbles: finite.nullable(),
});
export type RigSnapshot = z.infer<typeof RigSnapshotSchema>;

export const PortfolioSnapshotSchema = z.object({
  kind: z.literal("portfolio"),
  wpondPriceUsd: finite,
  netSwappedWpond: finite,
  minedWpond: finite,
  swapNetCostBasis: finite,
  swapHoldingValue: finite,
  swapUnrealizedPnL: finite,
  minedValue: finite,
  totalPnL: finite,
  totalValue: finite,
  recordCount: finite,
  hasNegativeUnaccounted: z.boolean(),
  /** Confirmed swap counts per session mode, for behaviour context. */
  modeCounts: z.object({ normal: finite, boost: finite, rewards: finite }),
});
export type PortfolioSnapshot = z.infer<typeof PortfolioSnapshotSchema>;

export const InsightSnapshotSchema = z.discriminatedUnion("kind", [
  RigSnapshotSchema,
  PortfolioSnapshotSchema,
]);
export type InsightSnapshot = z.infer<typeof InsightSnapshotSchema>;

export const InsightRequestSchema = z.object({
  snapshot: InsightSnapshotSchema,
  model: z.enum(GEOFF_MODELS).optional(),
});
export type InsightRequest = z.infer<typeof InsightRequestSchema>;

// ---------------------------------------------------------------------------
// Insight out
// ---------------------------------------------------------------------------

export const InsightStatusSchema = z.enum([
  "positive",
  "warning",
  "negative",
  "neutral",
]);
export type InsightStatus = z.infer<typeof InsightStatusSchema>;

export const GeoffInsightSchema = z.object({
  /** One-line verdict, rendered as the card headline. */
  headline: z.string().min(1).max(120),
  status: InsightStatusSchema,
  findings: z
    .array(
      z.object({
        label: z.string().min(1).max(40),
        detail: z.string().min(1).max(240),
      })
    )
    .min(1)
    .max(4),
  /** Single concrete next step, or "" when nothing is worth doing. */
  nextAction: z.string().max(240),
  confidence: z.enum(["low", "medium", "high"]),
});
export type GeoffInsight = z.infer<typeof GeoffInsightSchema>;

/** What /api/geoff/insight returns on success. */
export interface InsightResponse {
  insight: GeoffInsight;
  model: string;
  generatedAt: number;
}
