import type {
  PriceAlertRule,
  PriceSnapshot,
  PriceBaselines,
  AlertEvent,
} from "./types";

function uid(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isCooledDown(rule: PriceAlertRule, now: number): boolean {
  return now - (rule.lastTriggeredAt ?? 0) >= rule.cooldownMs;
}

function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toFixed(4)}`;
  if (price >= 0.01) return `$${price.toFixed(6)}`;
  return `$${price.toFixed(8)}`;
}

function evaluateOne(
  rule: PriceAlertRule,
  snapshot: PriceSnapshot,
  baselines: PriceBaselines,
  now: number
): AlertEvent | null {
  if (!rule.enabled) return null;
  if (!isCooledDown(rule, now)) return null;

  const price = snapshot.prices[rule.symbol];
  if (typeof price !== "number" || price <= 0) return null;

  switch (rule.kind) {
    case "above": {
      if (price > rule.threshold) {
        return {
          id: uid(),
          ruleId: rule.id,
          kind: rule.kind,
          family: "price",
          severity: "info",
          title: `${rule.symbol} crossed above`,
          message: `${rule.symbol} is ${formatPrice(price)} (above ${formatPrice(rule.threshold)})`,
          firedAt: now,
        };
      }
      return null;
    }
    case "below": {
      if (price < rule.threshold) {
        return {
          id: uid(),
          ruleId: rule.id,
          kind: rule.kind,
          family: "price",
          severity: "info",
          title: `${rule.symbol} dropped below`,
          message: `${rule.symbol} is ${formatPrice(price)} (below ${formatPrice(rule.threshold)})`,
          firedAt: now,
        };
      }
      return null;
    }
    case "percent-change": {
      const baseline = baselines.byRule[rule.id];
      if (!baseline || baseline.baseline <= 0) return null;
      // Compare against current baseline. Caller refreshes baselines via
      // refreshBaselines() so old baselines do roll over after windowMs.
      const change = price / baseline.baseline - 1;
      if (Math.abs(change) >= rule.pctThreshold) {
        const direction = change > 0 ? "up" : "down";
        const pct = (change * 100).toFixed(2);
        return {
          id: uid(),
          ruleId: rule.id,
          kind: rule.kind,
          family: "price",
          severity: "info",
          title: `${rule.symbol} moved ${direction}`,
          message: `${rule.symbol} ${direction} ${pct}% in last ${Math.round(rule.windowMs / 60000)} min`,
          firedAt: now,
        };
      }
      return null;
    }
  }
}

/**
 * Pure function: given the latest price snapshot, current rolling baselines,
 * and the list of rules, return the events that should fire.
 *
 * Caller responsibilities:
 *  - update rule.lastTriggeredAt for each fired event
 *  - if oneShot, set rule.enabled = false after firing
 *  - update baselines outside this function (see refreshBaselines)
 */
export function evaluatePriceRules(
  snapshot: PriceSnapshot,
  baselines: PriceBaselines,
  rules: PriceAlertRule[],
  now: number
): AlertEvent[] {
  const events: AlertEvent[] = [];
  for (const rule of rules) {
    const event = evaluateOne(rule, snapshot, baselines, now);
    if (event) events.push(event);
  }
  return events;
}

/**
 * Recompute baselines for percent-change rules that have aged past their window.
 * Returns the updated baselines map. Pure: does not mutate the input.
 */
export function refreshBaselines(
  snapshot: PriceSnapshot,
  baselines: PriceBaselines,
  rules: PriceAlertRule[],
  now: number
): PriceBaselines {
  const next: PriceBaselines = { byRule: { ...baselines.byRule } };
  for (const rule of rules) {
    if (rule.kind !== "percent-change") continue;
    if (!rule.enabled) continue;
    const price = snapshot.prices[rule.symbol];
    if (typeof price !== "number" || price <= 0) continue;
    const existing = next.byRule[rule.id];
    if (!existing || now - existing.recordedAt >= rule.windowMs) {
      next.byRule[rule.id] = { baseline: price, recordedAt: now };
    }
  }
  return next;
}
