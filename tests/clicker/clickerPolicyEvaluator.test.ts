import { describe, it, expect } from "vitest";
import { evaluateClickerPolicy, deriveMiningActive } from "@/lib/clicker/clickerPolicyEvaluator";
import type { ClickerStatus } from "@/lib/clicker/types";
import type { RigHealthSnapshot } from "@/lib/alerts/types";

const NOW = 1_789_000_000_000; // ms

function status(overrides: Partial<ClickerStatus> = {}): ClickerStatus {
  return {
    state: "armed",
    reason: "running",
    clicks_used: 3,
    click_budget: 50,
    session_deadline: NOW / 1000 + 3600,
    last_scan_ts: NOW / 1000 - 2, // scanned 2 s ago
    pid: 1234,
    dry_run: false,
    ...overrides,
  };
}

function baseInput(overrides = {}) {
  return {
    swapperRunning: true,
    miningActive: false,
    manualPause: false,
    status: status(),
    processAlive: true,
    now: NOW,
    ...overrides,
  };
}

describe("evaluateClickerPolicy", () => {
  it("is idle gray when never started", () => {
    const r = evaluateClickerPolicy(baseInput({ status: null, processAlive: false }));
    expect(r).toMatchObject({ led: "gray", shouldSendHeartbeat: false, shouldStop: false, offline: false });
  });

  it("is gray with the stop reason after a stop", () => {
    const r = evaluateClickerPolicy(baseInput({ status: status({ state: "stopped", reason: "click_budget" }), processAlive: false }));
    expect(r.led).toBe("gray");
    expect(r.label).toContain("click_budget");
  });

  it("reports offline and requests stop when status is stale", () => {
    const r = evaluateClickerPolicy(baseInput({ status: status({ last_scan_ts: NOW / 1000 - 60 }) }));
    expect(r).toMatchObject({ led: "red", offline: true, shouldStop: true, shouldSendHeartbeat: false });
  });

  it("requests disarm when the swapper loop is not running", () => {
    const r = evaluateClickerPolicy(baseInput({ swapperRunning: false }));
    expect(r).toMatchObject({ led: "red", shouldStop: true, shouldSendHeartbeat: false });
  });

  it("pauses with heartbeat while mining is active", () => {
    const r = evaluateClickerPolicy(baseInput({ miningActive: true }));
    expect(r).toMatchObject({ led: "yellow", desiredPaused: true, shouldSendHeartbeat: true, shouldStop: false });
    expect(r.label).toContain("mining");
  });

  it("pauses on manual pause", () => {
    const r = evaluateClickerPolicy(baseInput({ manualPause: true }));
    expect(r).toMatchObject({ led: "yellow", desiredPaused: true, shouldSendHeartbeat: true });
  });

  it("resumes (desiredPaused false) when a paused clicker has no pause cause left", () => {
    const r = evaluateClickerPolicy(baseInput({ status: status({ state: "paused", reason: "paused" }) }));
    expect(r).toMatchObject({ led: "yellow", desiredPaused: false, shouldSendHeartbeat: true, shouldStop: false });
  });

  it("is green armed with heartbeat in the happy path", () => {
    const r = evaluateClickerPolicy(baseInput());
    expect(r).toMatchObject({ led: "green", desiredPaused: false, shouldSendHeartbeat: true, shouldStop: false, offline: false });
  });
});

function rig(overrides: Partial<RigHealthSnapshot> = {}): RigHealthSnapshot {
  return { health: 80, drifted: 0, failed: 0, inMempool: 0, sent: 100, miningSessions: 50, fetchedAt: NOW, ...overrides };
}

describe("deriveMiningActive", () => {
  it("is false without a snapshot", () => {
    expect(deriveMiningActive(null, null)).toBe(false);
  });

  it("is true when claims are in the mempool", () => {
    expect(deriveMiningActive(rig({ inMempool: 2 }), rig())).toBe(true);
  });

  it("is true when the mining-session count increased", () => {
    expect(deriveMiningActive(rig({ miningSessions: 51 }), rig({ miningSessions: 50 }))).toBe(true);
  });

  it("is false when nothing indicates activity", () => {
    expect(deriveMiningActive(rig(), rig())).toBe(false);
  });
});
