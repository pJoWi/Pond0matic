/**
 * Alert system type definitions.
 *
 * Alert rules describe a condition the user wants to be notified about.
 * AlertEvents are the records that get fired when a rule's condition is met.
 *
 * Rule types are split into rig (mining) and price (token) families.
 */

import { z } from "zod";

export const TOKEN_SYMBOLS = ["SOL", "wPOND", "pondSOL", "ETH", "PNDC", "PORK"] as const;
export type TokenSymbol = (typeof TOKEN_SYMBOLS)[number];

// ---------- Rig alert rules ----------

const baseRigRule = {
  id: z.string().min(1),
  enabled: z.boolean(),
  cooldownMs: z.number().int().nonnegative(),
  lastTriggeredAt: z.number().int().nonnegative().optional(),
};

export const RigAlertRuleSchema = z.discriminatedUnion("kind", [
  z.object({ ...baseRigRule, kind: z.literal("health-below"), threshold: z.number().min(0).max(100) }),
  z.object({ ...baseRigRule, kind: z.literal("health-critical"), threshold: z.number().min(0).max(100) }),
  z.object({ ...baseRigRule, kind: z.literal("drifted-spike"), minDelta: z.number().int().positive() }),
  z.object({ ...baseRigRule, kind: z.literal("failed-spike"), minDelta: z.number().int().positive() }),
]);

export type RigAlertRule = z.infer<typeof RigAlertRuleSchema>;
export type RigAlertKind = RigAlertRule["kind"];

// ---------- Price alert rules ----------

const basePriceRule = {
  id: z.string().min(1),
  symbol: z.enum(TOKEN_SYMBOLS),
  enabled: z.boolean(),
  oneShot: z.boolean(),
  cooldownMs: z.number().int().nonnegative(),
  lastTriggeredAt: z.number().int().nonnegative().optional(),
};

export const PriceAlertRuleSchema = z.discriminatedUnion("kind", [
  z.object({ ...basePriceRule, kind: z.literal("above"), threshold: z.number().positive() }),
  z.object({ ...basePriceRule, kind: z.literal("below"), threshold: z.number().positive() }),
  z.object({
    ...basePriceRule,
    kind: z.literal("percent-change"),
    windowMs: z.number().int().positive(),
    pctThreshold: z.number().positive(),
  }),
]);

export type PriceAlertRule = z.infer<typeof PriceAlertRuleSchema>;
export type PriceAlertKind = PriceAlertRule["kind"];

// ---------- Fired alert events ----------

export const AlertSeveritySchema = z.enum(["info", "warning", "critical"]);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const AlertEventSchema = z.object({
  id: z.string().min(1),
  ruleId: z.string().min(1),
  kind: z.string(),
  family: z.enum(["rig", "price"]),
  severity: AlertSeveritySchema,
  title: z.string(),
  message: z.string(),
  firedAt: z.number().int().nonnegative(),
});
export type AlertEvent = z.infer<typeof AlertEventSchema>;

// ---------- Stored config ----------

export const STORAGE_VERSION = 1 as const;

export const StoredAlertConfigSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  rigRules: z.array(RigAlertRuleSchema),
  priceRules: z.array(PriceAlertRuleSchema),
  recentTriggers: z.array(AlertEventSchema).max(200),
  notificationsRequested: z.boolean(),
});
export type StoredAlertConfig = z.infer<typeof StoredAlertConfigSchema>;

// ---------- Snapshot types passed to evaluators ----------

export interface RigHealthSnapshot {
  health: number;
  drifted: number;
  failed: number;
  inMempool: number;
  sent: number;
  miningSessions: number;
  fetchedAt: number;
}

export interface PriceSnapshot {
  prices: Record<TokenSymbol, number>;
  fetchedAt: number;
}

export interface PriceBaselines {
  // For percent-change rules: rolling baseline price per symbol with timestamp
  byRule: Record<string, { baseline: number; recordedAt: number }>;
}
