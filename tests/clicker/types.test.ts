import { describe, it, expect } from "vitest";
import {
  ClickerStatusSchema,
  ClickerEventSchema,
  StartRequestSchema,
} from "@/lib/clicker/types";
import { clickerEnabled } from "@/lib/clicker/guard";

const VALID_STATUS = {
  state: "armed",
  reason: "running",
  clicks_used: 3,
  click_budget: 50,
  session_deadline: 1_789_000_000,
  last_scan_ts: 1_788_999_000,
  pid: 1234,
  dry_run: false,
};

describe("ClickerStatusSchema", () => {
  it("accepts a valid status.json payload", () => {
    expect(ClickerStatusSchema.safeParse(VALID_STATUS).success).toBe(true);
  });

  it("rejects an unknown state", () => {
    expect(ClickerStatusSchema.safeParse({ ...VALID_STATUS, state: "exploded" }).success).toBe(false);
  });

  it("rejects negative clicks_used", () => {
    expect(ClickerStatusSchema.safeParse({ ...VALID_STATUS, clicks_used: -1 }).success).toBe(false);
  });
});

describe("ClickerEventSchema", () => {
  it("accepts a click event with coordinates", () => {
    const event = { ts: 1_789_000_000, kind: "click", template: "confirm_button.png", action: "confirm", x: 812, y: 640, reason: "clicked" };
    expect(ClickerEventSchema.safeParse(event).success).toBe(true);
  });

  it("accepts a lifecycle event without coordinates", () => {
    expect(ClickerEventSchema.safeParse({ ts: 1_789_000_000, kind: "auto_stop", reason: "heartbeat_lost" }).success).toBe(true);
  });

  it("rejects an unknown kind", () => {
    expect(ClickerEventSchema.safeParse({ ts: 1, kind: "explode" }).success).toBe(false);
  });
});

describe("StartRequestSchema", () => {
  it("accepts valid settings and defaults dryRun to false", () => {
    const parsed = StartRequestSchema.parse({ scanIntervalS: 2, sessionMinutes: 60, clickBudget: 50 });
    expect(parsed.dryRun).toBe(false);
  });

  it("rejects out-of-range values", () => {
    expect(StartRequestSchema.safeParse({ scanIntervalS: 0, sessionMinutes: 60, clickBudget: 50 }).success).toBe(false);
    expect(StartRequestSchema.safeParse({ scanIntervalS: 2, sessionMinutes: 1_000, clickBudget: 50 }).success).toBe(false);
    expect(StartRequestSchema.safeParse({ scanIntervalS: 2, sessionMinutes: 60, clickBudget: 0 }).success).toBe(false);
  });
});

describe("clickerEnabled", () => {
  it("is enabled only with CLICKER_ENABLED=1 outside production", () => {
    expect(clickerEnabled({ CLICKER_ENABLED: "1", NODE_ENV: "development" })).toBe(true);
    expect(clickerEnabled({ CLICKER_ENABLED: "1", NODE_ENV: "production" })).toBe(false);
    expect(clickerEnabled({ CLICKER_ENABLED: undefined, NODE_ENV: "development" })).toBe(false);
    expect(clickerEnabled({ CLICKER_ENABLED: "true", NODE_ENV: "development" })).toBe(false);
    expect(clickerEnabled({})).toBe(false);
  });
});
