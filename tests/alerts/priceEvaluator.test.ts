import { describe, it, expect } from "vitest";
import { evaluatePriceRules, refreshBaselines } from "@/lib/alerts/priceEvaluator";
import type {
  PriceAlertRule,
  PriceBaselines,
  PriceSnapshot,
} from "@/lib/alerts/types";

const NOW = 1_700_000_000_000;
const FIVE_MIN = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

function snap(prices: Partial<PriceSnapshot["prices"]> = {}): PriceSnapshot {
  return {
    fetchedAt: NOW,
    prices: {
      SOL: 100,
      wPOND: 0.0005,
      pondSOL: 110,
      ETH: 3000,
      PNDC: 0.0000001,
      PORK: 0.00000001,
      ...prices,
    },
  };
}

describe("priceEvaluator: above/below", () => {
  it("fires above when price exceeds threshold", () => {
    const rules: PriceAlertRule[] = [
      { id: "p1", symbol: "wPOND", kind: "above", threshold: 0.0004, enabled: true, oneShot: false, cooldownMs: FIVE_MIN },
    ];
    expect(evaluatePriceRules(snap(), { byRule: {} }, rules, NOW)).toHaveLength(1);
  });

  it("does not fire above when price equals or is below threshold", () => {
    const rules: PriceAlertRule[] = [
      { id: "p1", symbol: "wPOND", kind: "above", threshold: 0.0005, enabled: true, oneShot: false, cooldownMs: FIVE_MIN },
    ];
    expect(evaluatePriceRules(snap(), { byRule: {} }, rules, NOW)).toHaveLength(0);
  });

  it("fires below when price drops under threshold", () => {
    const rules: PriceAlertRule[] = [
      { id: "p1", symbol: "SOL", kind: "below", threshold: 200, enabled: true, oneShot: false, cooldownMs: FIVE_MIN },
    ];
    expect(evaluatePriceRules(snap(), { byRule: {} }, rules, NOW)).toHaveLength(1);
  });

  it("ignores rules whose token has zero or missing price", () => {
    const rules: PriceAlertRule[] = [
      { id: "p1", symbol: "wPOND", kind: "above", threshold: 0.0001, enabled: true, oneShot: false, cooldownMs: FIVE_MIN },
    ];
    expect(evaluatePriceRules(snap({ wPOND: 0 }), { byRule: {} }, rules, NOW)).toHaveLength(0);
  });

  it("respects cooldown via lastTriggeredAt", () => {
    const recent: PriceAlertRule = {
      id: "p1", symbol: "wPOND", kind: "above", threshold: 0.0001,
      enabled: true, oneShot: false, cooldownMs: FIVE_MIN, lastTriggeredAt: NOW - 1000,
    };
    expect(evaluatePriceRules(snap(), { byRule: {} }, [recent], NOW)).toHaveLength(0);

    const old: PriceAlertRule = { ...recent, lastTriggeredAt: NOW - FIVE_MIN - 1 };
    expect(evaluatePriceRules(snap(), { byRule: {} }, [old], NOW)).toHaveLength(1);
  });
});

describe("priceEvaluator: percent-change", () => {
  it("fires when change exceeds pctThreshold against baseline", () => {
    const rules: PriceAlertRule[] = [
      { id: "p1", symbol: "SOL", kind: "percent-change", windowMs: ONE_HOUR, pctThreshold: 0.05, enabled: true, oneShot: false, cooldownMs: FIVE_MIN },
    ];
    const baselines: PriceBaselines = { byRule: { p1: { baseline: 90, recordedAt: NOW - ONE_HOUR } } };
    // 100 vs 90 = +11.1%
    const events = evaluatePriceRules(snap({ SOL: 100 }), baselines, rules, NOW);
    expect(events).toHaveLength(1);
    expect(events[0].message).toContain("up");
  });

  it("does not fire when change is below pctThreshold", () => {
    const rules: PriceAlertRule[] = [
      { id: "p1", symbol: "SOL", kind: "percent-change", windowMs: ONE_HOUR, pctThreshold: 0.20, enabled: true, oneShot: false, cooldownMs: FIVE_MIN },
    ];
    const baselines: PriceBaselines = { byRule: { p1: { baseline: 90, recordedAt: NOW - ONE_HOUR } } };
    expect(evaluatePriceRules(snap({ SOL: 100 }), baselines, rules, NOW)).toHaveLength(0);
  });

  it("does not fire if no baseline is recorded yet", () => {
    const rules: PriceAlertRule[] = [
      { id: "p1", symbol: "SOL", kind: "percent-change", windowMs: ONE_HOUR, pctThreshold: 0.01, enabled: true, oneShot: false, cooldownMs: FIVE_MIN },
    ];
    expect(evaluatePriceRules(snap({ SOL: 100 }), { byRule: {} }, rules, NOW)).toHaveLength(0);
  });
});

describe("refreshBaselines", () => {
  it("creates baseline for new percent-change rule", () => {
    const rules: PriceAlertRule[] = [
      { id: "p1", symbol: "SOL", kind: "percent-change", windowMs: ONE_HOUR, pctThreshold: 0.05, enabled: true, oneShot: false, cooldownMs: FIVE_MIN },
    ];
    const next = refreshBaselines(snap(), { byRule: {} }, rules, NOW);
    expect(next.byRule.p1).toEqual({ baseline: 100, recordedAt: NOW });
  });

  it("does NOT replace baseline if window has not elapsed", () => {
    const rules: PriceAlertRule[] = [
      { id: "p1", symbol: "SOL", kind: "percent-change", windowMs: ONE_HOUR, pctThreshold: 0.05, enabled: true, oneShot: false, cooldownMs: FIVE_MIN },
    ];
    const baselines: PriceBaselines = { byRule: { p1: { baseline: 90, recordedAt: NOW - 100 } } };
    const next = refreshBaselines(snap(), baselines, rules, NOW);
    expect(next.byRule.p1).toEqual({ baseline: 90, recordedAt: NOW - 100 });
  });

  it("replaces baseline once window elapses", () => {
    const rules: PriceAlertRule[] = [
      { id: "p1", symbol: "SOL", kind: "percent-change", windowMs: ONE_HOUR, pctThreshold: 0.05, enabled: true, oneShot: false, cooldownMs: FIVE_MIN },
    ];
    const baselines: PriceBaselines = { byRule: { p1: { baseline: 90, recordedAt: NOW - ONE_HOUR - 1 } } };
    const next = refreshBaselines(snap(), baselines, rules, NOW);
    expect(next.byRule.p1).toEqual({ baseline: 100, recordedAt: NOW });
  });

  it("ignores non-percent-change rules", () => {
    const rules: PriceAlertRule[] = [
      { id: "p1", symbol: "SOL", kind: "above", threshold: 50, enabled: true, oneShot: false, cooldownMs: FIVE_MIN },
    ];
    const next = refreshBaselines(snap(), { byRule: {} }, rules, NOW);
    expect(next.byRule).toEqual({});
  });
});
