import { describe, it, expect } from "vitest";
import { evaluateRigRules } from "@/lib/alerts/rigEvaluator";
import type { RigAlertRule, RigHealthSnapshot } from "@/lib/alerts/types";

const NOW = 1_700_000_000_000;
const FIVE_MIN = 5 * 60 * 1000;

function snap(overrides: Partial<RigHealthSnapshot> = {}): RigHealthSnapshot {
  return {
    health: 80,
    drifted: 0,
    failed: 0,
    inMempool: 0,
    sent: 100,
    miningSessions: 50,
    fetchedAt: NOW,
    ...overrides,
  };
}

describe("rigEvaluator", () => {
  it("fires health-below when health drops under threshold", () => {
    const rules: RigAlertRule[] = [
      { id: "r1", kind: "health-below", threshold: 50, enabled: true, cooldownMs: FIVE_MIN },
    ];
    const events = evaluateRigRules(snap({ health: 40 }), null, rules, NOW);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe("health-below");
  });

  it("does not fire health-below when health is at or above threshold", () => {
    const rules: RigAlertRule[] = [
      { id: "r1", kind: "health-below", threshold: 50, enabled: true, cooldownMs: FIVE_MIN },
    ];
    expect(evaluateRigRules(snap({ health: 50 }), null, rules, NOW)).toHaveLength(0);
    expect(evaluateRigRules(snap({ health: 80 }), null, rules, NOW)).toHaveLength(0);
  });

  it("respects enabled flag", () => {
    const rules: RigAlertRule[] = [
      { id: "r1", kind: "health-below", threshold: 50, enabled: false, cooldownMs: FIVE_MIN },
    ];
    expect(evaluateRigRules(snap({ health: 10 }), null, rules, NOW)).toHaveLength(0);
  });

  it("respects cooldown via lastTriggeredAt", () => {
    const rule: RigAlertRule = {
      id: "r1",
      kind: "health-below",
      threshold: 50,
      enabled: true,
      cooldownMs: FIVE_MIN,
      lastTriggeredAt: NOW - 1000, // fired 1s ago
    };
    expect(evaluateRigRules(snap({ health: 10 }), null, [rule], NOW)).toHaveLength(0);

    const stale: RigAlertRule = { ...rule, lastTriggeredAt: NOW - FIVE_MIN - 1 };
    expect(evaluateRigRules(snap({ health: 10 }), null, [stale], NOW)).toHaveLength(1);
  });

  it("fires drifted-spike only when delta meets minDelta", () => {
    const rules: RigAlertRule[] = [
      { id: "r1", kind: "drifted-spike", minDelta: 2, enabled: true, cooldownMs: FIVE_MIN },
    ];
    // Without previous snapshot, no delta possible
    expect(evaluateRigRules(snap({ drifted: 5 }), null, rules, NOW)).toHaveLength(0);
    // Delta of 1 is below minDelta 2
    expect(evaluateRigRules(snap({ drifted: 5 }), snap({ drifted: 4 }), rules, NOW)).toHaveLength(0);
    // Delta of 2 fires
    expect(evaluateRigRules(snap({ drifted: 6 }), snap({ drifted: 4 }), rules, NOW)).toHaveLength(1);
  });

  it("fires failed-spike on delta", () => {
    const rules: RigAlertRule[] = [
      { id: "r1", kind: "failed-spike", minDelta: 1, enabled: true, cooldownMs: FIVE_MIN },
    ];
    const events = evaluateRigRules(snap({ failed: 3 }), snap({ failed: 1 }), rules, NOW);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe("failed-spike");
  });

  it("evaluates multiple rules independently", () => {
    const rules: RigAlertRule[] = [
      { id: "r1", kind: "health-below", threshold: 50, enabled: true, cooldownMs: FIVE_MIN },
      { id: "r2", kind: "health-critical", threshold: 25, enabled: true, cooldownMs: FIVE_MIN },
    ];
    const events = evaluateRigRules(snap({ health: 20 }), null, rules, NOW);
    expect(events.map((e) => e.kind).sort()).toEqual(["health-below", "health-critical"]);
  });
});
