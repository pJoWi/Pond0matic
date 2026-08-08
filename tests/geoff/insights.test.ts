import { describe, expect, it } from "vitest";
import {
  buildInsightMessages,
  describePortfolio,
  describeRig,
} from "@/lib/geoff/insights";
import { MAX_BOOST } from "@/lib/rig/boost";
import {
  InsightSnapshotSchema,
  type PortfolioSnapshot,
  type RigSnapshot,
} from "@/lib/geoff/types";

const rig: RigSnapshot = {
  kind: "rig",
  boost: 400,
  maxBoost: MAX_BOOST,
  pctToMax: 65.04,
  swapsToMax: 1290,
  sessionBoostAdded: 3,
  sessionsBuffer: 133,
  sessionSwaps: 18,
  health: {
    health: 92,
    miningSessions: 41,
    inMempool: 2,
    sent: 380,
    failed: 4,
    drifted: 7,
    driftRisk: 0.12,
    priority: 3,
    maxClaimUsd: 12.5,
    driftedUsd: -3.25,
    aiHints: ["Claim window is open"],
  },
  manifest: {
    isPro: true,
    badges: ["pro", "og"],
    hasTwitter: true,
    solSwaps: 2400,
    bxSwaps: 0,
  },
  luck: { luck: 7, referrals: 2 },
  bubbles: 15000,
};

const portfolio: PortfolioSnapshot = {
  kind: "portfolio",
  wpondPriceUsd: 0.000123,
  netSwappedWpond: 1000,
  minedWpond: 250,
  swapNetCostBasis: 0.15,
  swapHoldingValue: 0.123,
  swapUnrealizedPnL: -0.027,
  minedValue: 0.03,
  totalPnL: 0.003,
  totalValue: 0.153,
  recordCount: 12,
  hasNegativeUnaccounted: false,
  modeCounts: { normal: 4, boost: 6, rewards: 2 },
};

describe("describeRig", () => {
  it("includes the boost, health and manifest figures", () => {
    const text = describeRig(rig);
    expect(text).toContain("400 of 615");
    expect(text).toContain("65.0%");
    expect(text).toContain("Health score: 92");
    expect(text).toContain("2,400");
    expect(text).toContain("Claim window is open");
  });

  it("formats negative USD with a leading minus, not a stray sign", () => {
    expect(describeRig(rig)).toContain("value drifted: -$3.25");
  });

  it("says 'unknown' rather than 0 when boost is unset", () => {
    const text = describeRig({ ...rig, boost: null });
    expect(text).toContain("unknown (user has not entered it)");
    expect(text).toContain("Swaps to reach max boost: unknown");
  });

  it("flags missing feeds instead of silently omitting them", () => {
    const text = describeRig({ ...rig, health: null, manifest: null, luck: null, bubbles: null });
    expect(text).toContain("HEALTH (cary0x): unknown");
    expect(text).toContain("MANIFEST (cary0x): unknown");
    expect(text).toContain("Bubbles: unknown");
  });
});

describe("describePortfolio", () => {
  it("reports the PnL breakdown and mode counts", () => {
    const text = describePortfolio(portfolio);
    expect(text).toContain("Total unrealized PnL: $0.00");
    expect(text).toContain("normal 4, boost 6, rewards 2");
    expect(text).toContain("12 total");
  });

  it("warns about the data gap when disposals are unaccounted", () => {
    expect(
      describePortfolio({ ...portfolio, hasNegativeUnaccounted: true })
    ).toContain("DATA GAP");
    expect(describePortfolio(portfolio)).not.toContain("DATA GAP");
  });
});

describe("buildInsightMessages", () => {
  it("puts the Pond0x mechanics in the system message and the data in the user message", () => {
    const [system, user] = buildInsightMessages(rig);
    expect(system.role).toBe("system");
    expect(system.content).toContain("Boost caps at 615");
    expect(system.content).toContain('"headline"');
    expect(user.role).toBe("user");
    expect(user.content).toContain("RIG SNAPSHOT");
  });

  it("switches focus and body for a portfolio snapshot", () => {
    const [, user] = buildInsightMessages(portfolio);
    expect(user.content).toContain("PONDWATER (wPOND) SNAPSHOT");
    expect(user.content).not.toContain("RIG SNAPSHOT");
  });

  it("never leaks a wallet address — the snapshot schema has no field for one", () => {
    const parsed = InsightSnapshotSchema.parse({
      ...rig,
      walletAddress: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    });
    expect(parsed).not.toHaveProperty("walletAddress");
    expect(JSON.stringify(buildInsightMessages(parsed))).not.toContain("9xQeWvG");
  });
});

describe("InsightSnapshotSchema", () => {
  it("rejects a snapshot with a non-finite number", () => {
    expect(() =>
      InsightSnapshotSchema.parse({ ...rig, sessionSwaps: Number.NaN })
    ).toThrow();
  });

  it("rejects an unknown snapshot kind", () => {
    expect(() => InsightSnapshotSchema.parse({ ...rig, kind: "wallet" })).toThrow();
  });
});
