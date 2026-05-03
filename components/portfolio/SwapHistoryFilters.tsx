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
        <span className="text-[10px] uppercase tracking-wide text-teal-400/80">Mode</span>
        <select
          value={filters.mode ?? ""}
          onChange={(e) => onChange({ ...filters, mode: (e.target.value as Filters["mode"]) || undefined })}
          className="mt-1 bg-black/40 border border-teal-400/30 rounded-lg px-2 py-1.5 text-xs text-cyan-200"
        >
          <option value="">Any</option>
          <option value="normal">Normal</option>
          <option value="boost">Boost</option>
          <option value="rewards">Rewards</option>
        </select>
      </label>

      <label className="block">
        <span className="text-[10px] uppercase tracking-wide text-teal-400/80">Status</span>
        <select
          value={filters.status ?? ""}
          onChange={(e) => onChange({ ...filters, status: (e.target.value as Filters["status"]) || undefined })}
          className="mt-1 bg-black/40 border border-teal-400/30 rounded-lg px-2 py-1.5 text-xs text-cyan-200"
        >
          <option value="">Any</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </label>

      <label className="block">
        <span className="text-[10px] uppercase tracking-wide text-teal-400/80">Symbol</span>
        <input
          type="text"
          value={filters.symbol ?? ""}
          onChange={(e) => onChange({ ...filters, symbol: e.target.value || undefined })}
          placeholder="e.g. wPOND"
          className="mt-1 bg-black/40 border border-teal-400/30 rounded-lg px-2 py-1.5 text-xs text-cyan-200 w-32"
        />
      </label>

      <button
        type="button"
        onClick={() => onChange({})}
        className="px-3 py-1.5 bg-slate-950/60 hover:bg-slate-900/60 border border-slate-500/40 rounded-lg text-xs font-medium text-slate-300 transition-all"
      >
        Clear
      </button>
    </div>
  );
}
