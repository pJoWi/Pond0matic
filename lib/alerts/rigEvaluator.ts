import type { RigAlertRule, RigHealthSnapshot, AlertEvent } from "./types";

function uid(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isCooledDown(rule: RigAlertRule, now: number): boolean {
  return now - (rule.lastTriggeredAt ?? 0) >= rule.cooldownMs;
}

function evaluateOne(
  rule: RigAlertRule,
  current: RigHealthSnapshot,
  previous: RigHealthSnapshot | null,
  now: number
): AlertEvent | null {
  if (!rule.enabled) return null;
  if (!isCooledDown(rule, now)) return null;

  switch (rule.kind) {
    case "health-below": {
      if (current.health < rule.threshold) {
        return {
          id: uid(),
          ruleId: rule.id,
          kind: rule.kind,
          family: "rig",
          severity: "warning",
          title: "Rig health dropped",
          message: `Health is ${current.health}% (threshold ${rule.threshold}%)`,
          firedAt: now,
        };
      }
      return null;
    }
    case "health-critical": {
      if (current.health < rule.threshold) {
        return {
          id: uid(),
          ruleId: rule.id,
          kind: rule.kind,
          family: "rig",
          severity: "critical",
          title: "Rig health critical",
          message: `Health is ${current.health}% (critical threshold ${rule.threshold}%)`,
          firedAt: now,
        };
      }
      return null;
    }
    case "drifted-spike": {
      if (!previous) return null;
      const delta = current.drifted - previous.drifted;
      if (delta >= rule.minDelta) {
        return {
          id: uid(),
          ruleId: rule.id,
          kind: rule.kind,
          family: "rig",
          severity: "warning",
          title: "Drift spike",
          message: `Drift increased by ${delta} since last check`,
          firedAt: now,
        };
      }
      return null;
    }
    case "failed-spike": {
      if (!previous) return null;
      const delta = current.failed - previous.failed;
      if (delta >= rule.minDelta) {
        return {
          id: uid(),
          ruleId: rule.id,
          kind: rule.kind,
          family: "rig",
          severity: "warning",
          title: "Failed swap spike",
          message: `Failed count increased by ${delta} since last check`,
          firedAt: now,
        };
      }
      return null;
    }
  }
}

/**
 * Pure function: given a current rig snapshot, an optional previous snapshot,
 * a list of rules, and "now", return the list of alerts that should fire.
 *
 * This function does NOT mutate rules or perform side effects. The caller is
 * responsible for updating each rule's lastTriggeredAt and persisting them.
 */
export function evaluateRigRules(
  current: RigHealthSnapshot,
  previous: RigHealthSnapshot | null,
  rules: RigAlertRule[],
  now: number
): AlertEvent[] {
  const events: AlertEvent[] = [];
  for (const rule of rules) {
    const event = evaluateOne(rule, current, previous, now);
    if (event) events.push(event);
  }
  return events;
}
