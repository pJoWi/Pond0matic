"use client";
import { useCallback } from "react";
import { GeoffInsightCard } from "@/components/geoff/GeoffInsightCard";
import { useGeoffInsight } from "@/hooks/useGeoffInsight";
import { usePondwaterPnL } from "@/hooks/usePondwaterPnL";
import { useSwapHistory } from "@/hooks/useSwapHistory";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import type { InsightSnapshot } from "@/lib/geoff/types";

/**
 * Geoff briefing on the pondwater position. Sends only the computed PnL
 * breakdown and per-mode swap counts — never signatures or the wallet address.
 */
export function GeoffPortfolioInsight() {
  const breakdown = usePondwaterPnL();
  const history = useSwapHistory();
  const prices = useTokenPrices();

  const buildSnapshot = useCallback((): InsightSnapshot | null => {
    if (!breakdown) return null;
    const confirmed = history.records.filter((r) => r.status === "confirmed");
    return {
      kind: "portfolio",
      wpondPriceUsd: prices.wpondPrice,
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
  }, [breakdown, history.records, prices.wpondPrice]);

  const state = useGeoffInsight(buildSnapshot);

  return (
    <GeoffInsightCard
      {...state}
      title="Geoff on your pondwater"
      hint="Reads your PnL breakdown and swap counts — no wallet address is sent."
      disabled={!breakdown}
    />
  );
}
