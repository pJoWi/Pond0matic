import type { RigAlertRule, PriceAlertRule, StoredAlertConfig } from "./types";
import { STORAGE_VERSION } from "./types";

const FIVE_MIN = 5 * 60 * 1000;

export function defaultRigRules(): RigAlertRule[] {
  return [
    { id: "rig-default-health-below", kind: "health-below", threshold: 50, enabled: true, cooldownMs: FIVE_MIN },
    { id: "rig-default-health-critical", kind: "health-critical", threshold: 25, enabled: true, cooldownMs: FIVE_MIN },
    { id: "rig-default-drifted-spike", kind: "drifted-spike", minDelta: 1, enabled: true, cooldownMs: FIVE_MIN },
    { id: "rig-default-failed-spike", kind: "failed-spike", minDelta: 1, enabled: true, cooldownMs: FIVE_MIN },
  ];
}

export function defaultPriceRules(): PriceAlertRule[] {
  // Empty by default: price thresholds are personal, no sensible global defaults.
  return [];
}

export function defaultConfig(): StoredAlertConfig {
  return {
    version: STORAGE_VERSION,
    rigRules: defaultRigRules(),
    priceRules: defaultPriceRules(),
    recentTriggers: [],
    notificationsRequested: false,
  };
}
