import type { SwapRecord } from "./types";

export interface PnLInputs {
  records: SwapRecord[];   // wallet-scoped, expected confirmed-only (caller filters)
  currentBalance: number;  // current wPOND balance
  currentPrice: number;    // current wPOND USD price
}

export interface PnLBreakdown {
  swappedInWpond: number;
  swappedOutWpond: number;
  netSwappedWpond: number;
  minedWpond: number;
  unaccountedNegative: number;

  swapCostBasis: number;
  swapDisposalProceeds: number;
  swapNetCostBasis: number;
  swapHoldingValue: number;
  swapUnrealizedPnL: number;
  minedValue: number;
  totalPnL: number;
  totalValue: number;

  recordCount: number;
  hasNegativeUnaccounted: boolean;
}

const WPOND = "wPOND";

/**
 * Compute pondwater (wPOND) unrealized PnL.
 *
 * Treatment:
 *   - swap-in records (toSymbol=wPOND) contribute to cost basis at toPriceUsd
 *   - swap-out records (fromSymbol=wPOND) reduce both held quantity and net cost basis
 *   - mined wPOND = current balance minus net swap quantity, floor at 0
 *   - mined wPOND has cost basis 0 (full current value = profit)
 *   - if user disposed more wPOND than swap records show (off-app burn), report
 *     hasNegativeUnaccounted = true so the UI can flag the data gap
 *
 * Pure function: no DOM, no storage, no React.
 */
export function computePondwaterPnL(inputs: PnLInputs): PnLBreakdown {
  const { records, currentBalance, currentPrice } = inputs;

  let swappedInWpond = 0;
  let swappedOutWpond = 0;
  let swapCostBasis = 0;
  let swapDisposalProceeds = 0;

  for (const r of records) {
    if (r.status !== "confirmed") continue;
    if (r.toSymbol === WPOND) {
      swappedInWpond += r.toAmount;
      swapCostBasis += r.toAmount * r.toPriceUsd;
    }
    if (r.fromSymbol === WPOND) {
      swappedOutWpond += r.fromAmount;
      swapDisposalProceeds += r.fromAmount * r.fromPriceUsd;
    }
  }

  const netSwappedWpond = swappedInWpond - swappedOutWpond;
  const rawUnaccounted = currentBalance - netSwappedWpond;
  const minedWpond = Math.max(0, rawUnaccounted);
  const unaccountedNegative = Math.abs(Math.min(0, rawUnaccounted));

  const swapNetCostBasis = swapCostBasis - swapDisposalProceeds;
  const swapHoldingValue = netSwappedWpond * currentPrice;
  const swapUnrealizedPnL = swapHoldingValue - swapNetCostBasis;
  const minedValue = minedWpond * currentPrice;
  const totalValue = currentBalance * currentPrice;
  const totalPnL = swapUnrealizedPnL + minedValue;

  return {
    swappedInWpond,
    swappedOutWpond,
    netSwappedWpond,
    minedWpond,
    unaccountedNegative,
    swapCostBasis,
    swapDisposalProceeds,
    swapNetCostBasis,
    swapHoldingValue,
    swapUnrealizedPnL,
    minedValue,
    totalPnL,
    totalValue,
    recordCount: records.filter((r) => r.status === "confirmed").length,
    hasNegativeUnaccounted: unaccountedNegative > 0,
  };
}
