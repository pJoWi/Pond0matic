"use client";
import { useCallback } from "react";
import { GeoffInsightCard } from "@/components/geoff/GeoffInsightCard";
import { useGeoffInsight } from "@/hooks/useGeoffInsight";
import { usePondwaterPnL } from "@/hooks/usePondwaterPnL";
import { useSwapHistory } from "@/hooks/useSwapHistory";
import type { InsightSnapshot } from "@/lib/geoff/types";

/**
 * Geoff briefing on the pondwater position. Sends only the computed PnL
 * breakdown and per-mode swap counts — never signatures or the wallet address.
 *
 * The quoted price is read off the breakdown rather than from a second
 * useTokenPrices() call: that hook polls per call site, so an independent
 * instance can be a fetch cycle ahead of the one behind these figures and
 * would have Geoff pairing a live price with stale USD totals.
 */
export function GeoffPortfolioInsight() {
  const breakdown = usePondwaterPnL();
  const history = useSwapHistory();

  const buildSnapshot = useCallback((): InsightSnapshot | null => {
    // A zero price means the wPOND feed has not resolved (or failed) — every
    // USD figure would be 0, so there is nothing honest to report yet.
    if (!breakdown || breakdown.currentPrice <= 0) return null;
    const confirmed = history.records.filter((r) => r.status === "confirmed");
    return {
      kind: "portfolio",
      wpondPriceUsd: breakdown.currentPrice,
      netSwappedWpond: breakdown.netSwappedWpond,
      minedWpond: breakdown.minedWpond,
      swapNetCostBasis: breakdown.swapNetCostBasis,
      swapHoldingValue: breakdown.swapHoldingValue,
      swapUnrealizedPnL: breakdown.swapUnrealizedPnL,
      minedValue: breakdown.minedValue,
      totalPnL: breakdown.totalPnL,
      totalValue: breakdown.totalValue,
      recordCount: breakdown.recordCount,
      hasNegativeUnaccounted: breakdown.hasNegativeUnaccounted,
      modeCounts: {
        normal: confirmed.filter((r) => r.mode === "normal").length,
        boost: confirmed.filter((r) => r.mode === "boost").length,
        rewards: confirmed.filter((r) => r.mode === "rewards").length,
      },
    };
  }, [breakdown, history.records]);

  const state = useGeoffInsight(buildSnapshot);

  return (
    <GeoffInsightCard
      {...state}
      title="Geoff on your pondwater"
      hint="Reads your PnL breakdown and swap counts — no wallet address is sent."
      disabled={!breakdown || breakdown.currentPrice <= 0}
    />
  );
}
