import { describe, it, expect } from "vitest";
import { parseHealth, parseManifest, parseLuck, parseBubbles } from "@/lib/rig/telemetry";

const health = {
  account: "GM8Qz8", stats: {
    mining_sessions: 9403, in_mempool: 9310, sent: 11, failed: 20, drifted: 61,
    drift_risk: 0, priority: 44, health: 7,
    estimates: { sol_usd: 73.9, wpond_usd: 5.4e-8, max_claim_estimate_usd: 244072.4, drifted_usd: 779 },
  }, ai_beta: ["Your Rig is 💪. gg."],
};

describe("parseHealth", () => {
  it("parses and normalizes cary0x health", () => {
    const h = parseHealth(health);
    expect(h.health).toBe(7);
    expect(h.miningSessions).toBe(9403);
    expect(h.priority).toBe(44);
    expect(h.maxClaimUsd).toBeCloseTo(244072.4, 1);
    expect(h.aiHints[0]).toMatch(/gg/);
  });
  it("throws on a non-object / missing stats", () => {
    expect(() => parseHealth("<html>")).toThrow();
    expect(() => parseHealth({ account: "x" })).toThrow();
  });
});

describe("parseManifest", () => {
  it("parses badges, pro flags, and swap counts", () => {
    const m = parseManifest({ isPro: false, badges: "pork, chef", hasTwitter: true, proSwapsSol: 177069, proSwapsBx: 2527, cope: false });
    expect(m.isPro).toBe(false);
    expect(m.badges).toEqual(["pork", "chef"]);
    expect(m.hasTwitter).toBe(true);
    expect(m.solSwaps).toBe(177069);
    expect(m.bxSwaps).toBe(2527);
  });
  it("tolerates missing badges and swap counts", () => {
    const m = parseManifest({ isPro: true });
    expect(m.badges).toEqual([]);
    expect(m.solSwaps).toBe(0);
    expect(m.bxSwaps).toBe(0);
  });
});

describe("parseBubbles", () => {
  it("parses the bubbles count", () => {
    expect(parseBubbles({ bubbles: 186953, boosts: [] }).bubbles).toBe(186953);
    expect(parseBubbles({}).bubbles).toBe(0);
  });
  it("throws on the rate-limit body cary0x returns with HTTP 200", () => {
    // {"error":"Too many requests."} must NOT be treated as bubbles=0.
    expect(() => parseBubbles({ error: "Too many requests." })).toThrow();
  });
});

describe("parseLuck", () => {
  it("parses luck + referrals, tolerates absence", () => {
    expect(parseLuck({ luck: 12, referrals: 3 }).luck).toBe(12);
    expect(parseLuck({}).luck).toBe(0);
  });
});
