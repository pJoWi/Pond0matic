"use client";
import React from "react";
import { LilyPadCard } from "@/components/ui/LilyPadCard";
import { usePondwaterPnL } from "@/hooks/usePondwaterPnL";
import { PnLBreakdown } from "./PnLBreakdown";

function formatUsd(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}$${abs.toFixed(2)}`;
}

function formatWpond(amount: number): string {
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function PondwaterPnLPanel() {
  const breakdown = usePondwaterPnL();

  if (!breakdown) {
    return (
      <div className="px-4 py-8 text-center text-teal-300/80 text-sm">
        Connect a wallet to view your pondwater PnL.
      </div>
    );
  }

  const pnlStatus = breakdown.totalPnL >= 0 ? "positive" : "negative";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LilyPadCard
          title="Total Value"
          value={formatUsd(breakdown.totalValue)}
          subtitle={`${formatWpond(breakdown.swappedInWpond + breakdown.minedWpond - breakdown.swappedOutWpond)} wPOND`}
          status="neutral"
          icon="🪷"
        />
        <LilyPadCard
          title="Total PnL"
          value={`${breakdown.totalPnL >= 0 ? "+" : ""}${formatUsd(breakdown.totalPnL)}`}
          subtitle={`${breakdown.recordCount} confirmed swap${breakdown.recordCount === 1 ? "" : "s"}`}
          status={pnlStatus}
          icon={breakdown.totalPnL >= 0 ? "📈" : "📉"}
        />
        <LilyPadCard
          title="Mined Value"
          value={formatUsd(breakdown.minedValue)}
          subtitle={`${formatWpond(breakdown.minedWpond)} wPOND (cost basis 0)`}
          status="positive"
          icon="⛏️"
        />
      </div>

      {breakdown.hasNegativeUnaccounted && (
        <div className="px-3 py-2 bg-amber-950/40 border border-amber-400/40 rounded-xl text-xs text-amber-200">
          Heads up: your wPOND balance is lower than the swap-history math expects.
          That usually means you sent or burned wPOND outside Pond0matic. Mined
          value has been clamped to 0; treat the PnL number as a lower bound.
        </div>
      )}

      <PnLBreakdown breakdown={breakdown} />
    </div>
  );
}
