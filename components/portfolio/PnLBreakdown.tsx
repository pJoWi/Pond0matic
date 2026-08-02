"use client";
import React from "react";
import type { PnLBreakdown as PnLBreakdownType } from "@/lib/portfolio/pnl";

function fmtUsd(v: number): string {
  const sign = v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toFixed(2)}`;
}

function fmtWpond(v: number): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function PnLBreakdown({ breakdown }: { breakdown: PnLBreakdownType }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "wPOND received from swaps", value: fmtWpond(breakdown.swappedInWpond) },
    { label: "wPOND spent in swaps", value: fmtWpond(breakdown.swappedOutWpond) },
    { label: "Net swapped wPOND", value: fmtWpond(breakdown.netSwappedWpond) },
    { label: "Mined wPOND (no cost basis)", value: fmtWpond(breakdown.minedWpond) },
    { label: "Cost basis of held wPOND", value: fmtUsd(breakdown.swapNetCostBasis) },
    { label: "Held value at current price", value: fmtUsd(breakdown.swapHoldingValue) },
    { label: "Swap unrealized PnL", value: fmtUsd(breakdown.swapUnrealizedPnL) },
  ];

  return (
    <div className="px-4 py-3 bg-bg border border-edge rounded-2xl">
      <div className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase mb-2">
        Breakdown
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-0.5">
            <dt className="text-ink-muted">{row.label}</dt>
            <dd className="font-num text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
