import { describe, it, expect } from "vitest";
import { computePondwaterPnL } from "@/lib/portfolio/pnl";
import type { SwapRecord } from "@/lib/portfolio/types";

const NOW = 1_700_000_000_000;

function record(overrides: Partial<SwapRecord> = {}): SwapRecord {
  return {
    id: "r-" + Math.random(),
    signature: "sig",
    mode: "normal",
    fromMint: "from-mint",
    fromSymbol: "SOL",
    fromAmount: 1,
    toMint: "to-mint",
    toSymbol: "wPOND",
    toAmount: 100_000,
    fromPriceUsd: 100,
    toPriceUsd: 0.0005,
    status: "confirmed",
    timestamp: NOW,
    walletAddress: "wallet-1",
    ...overrides,
  };
}

describe("computePondwaterPnL", () => {
  // Consumers (e.g. the Geoff insight card) must be able to quote the price
  // behind these figures without calling useTokenPrices() again — that hook
  // polls per call site, so a second instance can disagree with this one.
  it("echoes the price every USD figure was computed from", () => {
    const r = computePondwaterPnL({ records: [], currentBalance: 1000, currentPrice: 0.001 });
    expect(r.currentPrice).toBe(0.001);
    expect(r.totalValue).toBe(r.currentPrice * 1000);
  });

  it("returns all zeros when there are no records and balance is 0", () => {
    const r = computePondwaterPnL({ records: [], currentBalance: 0, currentPrice: 0.0005 });
    expect(r.totalValue).toBe(0);
    expect(r.totalPnL).toBe(0);
    expect(r.minedWpond).toBe(0);
    expect(r.swappedInWpond).toBe(0);
    expect(r.recordCount).toBe(0);
  });

  it("treats balance with no records as fully mined (cost basis 0)", () => {
    const r = computePondwaterPnL({ records: [], currentBalance: 1000, currentPrice: 0.001 });
    expect(r.minedWpond).toBe(1000);
    expect(r.minedValue).toBe(1);
    expect(r.totalPnL).toBe(1);
    expect(r.totalValue).toBe(1);
    expect(r.swapUnrealizedPnL).toBe(0);
  });

  it("computes swap-only PnL when all wPOND comes from swaps", () => {
    const records: SwapRecord[] = [
      record({ toAmount: 100_000, toPriceUsd: 0.0004 }), // cost basis 40
      record({ toAmount: 200_000, toPriceUsd: 0.0005 }), // cost basis 100
    ];
    const r = computePondwaterPnL({ records, currentBalance: 300_000, currentPrice: 0.001 });
    expect(r.swappedInWpond).toBe(300_000);
    expect(r.swappedOutWpond).toBe(0);
    expect(r.netSwappedWpond).toBe(300_000);
    expect(r.minedWpond).toBe(0);
    expect(r.swapCostBasis).toBeCloseTo(140);
    expect(r.swapHoldingValue).toBeCloseTo(300);
    expect(r.swapUnrealizedPnL).toBeCloseTo(160);
    expect(r.totalPnL).toBeCloseTo(160);
  });

  it("combines swapped + mined contributions", () => {
    const records: SwapRecord[] = [
      record({ toAmount: 100_000, toPriceUsd: 0.0005 }), // cost basis 50, holds 100k
    ];
    // Current balance 250k = 100k from swap + 150k mined
    const r = computePondwaterPnL({ records, currentBalance: 250_000, currentPrice: 0.001 });
    expect(r.netSwappedWpond).toBe(100_000);
    expect(r.minedWpond).toBe(150_000);
    expect(r.swapHoldingValue).toBeCloseTo(100);
    expect(r.swapCostBasis).toBeCloseTo(50);
    expect(r.swapUnrealizedPnL).toBeCloseTo(50);
    expect(r.minedValue).toBeCloseTo(150);
    expect(r.totalPnL).toBeCloseTo(200);
    expect(r.totalValue).toBeCloseTo(250);
  });

  it("flags negative-unaccounted when balance is below net swapped", () => {
    const records: SwapRecord[] = [
      record({ toAmount: 100_000, toPriceUsd: 0.0005 }),
    ];
    // Balance 50k but swap math expects 100k → 50k disposed off-app
    const r = computePondwaterPnL({ records, currentBalance: 50_000, currentPrice: 0.001 });
    expect(r.minedWpond).toBe(0);
    expect(r.unaccountedNegative).toBe(50_000);
    expect(r.hasNegativeUnaccounted).toBe(true);
  });

  it("subtracts wPOND-out swaps from net swapped and net cost basis", () => {
    const records: SwapRecord[] = [
      record({ toAmount: 200_000, toPriceUsd: 0.0005 }), // bought 200k @ 0.0005 = $100
      record({
        fromSymbol: "wPOND",
        fromMint: "to-mint",
        fromAmount: 50_000,
        fromPriceUsd: 0.0008,
        toSymbol: "USDC",
        toMint: "usdc-mint",
        toAmount: 40,
        toPriceUsd: 1,
      }), // sold 50k @ 0.0008 = $40 disposal proceeds
    ];
    const r = computePondwaterPnL({ records, currentBalance: 150_000, currentPrice: 0.001 });
    expect(r.swappedInWpond).toBe(200_000);
    expect(r.swappedOutWpond).toBe(50_000);
    expect(r.netSwappedWpond).toBe(150_000);
    expect(r.swapCostBasis).toBeCloseTo(100);
    expect(r.swapDisposalProceeds).toBeCloseTo(40);
    expect(r.swapNetCostBasis).toBeCloseTo(60);
    expect(r.swapHoldingValue).toBeCloseTo(150);
    expect(r.swapUnrealizedPnL).toBeCloseTo(90);
  });

  it("handles current price of 0 without producing NaN", () => {
    const records: SwapRecord[] = [
      record({ toAmount: 100_000, toPriceUsd: 0.0005 }),
    ];
    const r = computePondwaterPnL({ records, currentBalance: 100_000, currentPrice: 0 });
    expect(r.totalValue).toBe(0);
    expect(r.swapHoldingValue).toBe(0);
    expect(r.swapUnrealizedPnL).toBeCloseTo(-50);
    expect(r.totalPnL).toBeCloseTo(-50);
    expect(Number.isFinite(r.totalPnL)).toBe(true);
  });

  it("ignores non-confirmed records", () => {
    const records: SwapRecord[] = [
      record({ status: "pending", toAmount: 999_999, toPriceUsd: 0.001 }),
      record({ status: "failed", toAmount: 999_999, toPriceUsd: 0.001 }),
      record({ status: "confirmed", toAmount: 100_000, toPriceUsd: 0.0005 }),
    ];
    const r = computePondwaterPnL({ records, currentBalance: 100_000, currentPrice: 0.001 });
    expect(r.recordCount).toBe(1);
    expect(r.swappedInWpond).toBe(100_000);
  });

  it("ignores records that don't involve wPOND", () => {
    const records: SwapRecord[] = [
      record({ fromSymbol: "SOL", toSymbol: "USDC", toAmount: 100, toPriceUsd: 1 }),
    ];
    const r = computePondwaterPnL({ records, currentBalance: 0, currentPrice: 0.001 });
    expect(r.swappedInWpond).toBe(0);
    expect(r.swappedOutWpond).toBe(0);
    expect(r.totalPnL).toBe(0);
  });
});
