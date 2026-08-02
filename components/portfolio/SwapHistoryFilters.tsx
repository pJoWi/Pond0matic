"use client";
import React from "react";
import type { SwapHistoryFilters as Filters } from "@/hooks/useSwapHistory";

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
}

export function SwapHistoryFilters({ filters, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="block">
        <span className="text-[10px] uppercase tracking-wide text-ink-muted">Mode</span>
        <select
          value={filters.mode ?? ""}
          onChange={(e) => onChange({ ...filters, mode: (e.target.value as Filters["mode"]) || undefined })}
          className="mt-1 bg-bg border border-edge rounded-lg px-2 py-1.5 text-xs text-ink"
        >
          <option value="">Any</option>
          <option value="normal">Normal</option>
          <option value="boost">Boost</option>
          <option value="rewards">Rewards</option>
        </select>
      </label>

      <label className="block">
        <span className="text-[10px] uppercase tracking-wide text-ink-muted">Status</span>
        <select
          value={filters.status ?? ""}
          onChange={(e) => onChange({ ...filters, status: (e.target.value as Filters["status"]) || undefined })}
          className="mt-1 bg-bg border border-edge rounded-lg px-2 py-1.5 text-xs text-ink"
        >
          <option value="">Any</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </label>

      <label className="block">
        <span className="text-[10px] uppercase tracking-wide text-ink-muted">Symbol</span>
        <input
          type="text"
          value={filters.symbol ?? ""}
          onChange={(e) => onChange({ ...filters, symbol: e.target.value || undefined })}
          placeholder="e.g. wPOND"
          className="mt-1 bg-bg border border-edge rounded-lg px-2 py-1.5 text-xs text-ink w-32"
        />
      </label>

      <button
        type="button"
        onClick={() => onChange({})}
        className="px-3 py-1.5 bg-surface-2 hover:bg-surface border border-edge rounded-lg text-xs font-medium text-ink-muted transition-all"
      >
        Clear
      </button>
    </div>
  );
}
