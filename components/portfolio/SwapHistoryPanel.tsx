"use client";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSwapHistory, type SwapHistoryFilters as Filters } from "@/hooks/useSwapHistory";
import { exportToCsv, exportToJson } from "@/lib/portfolio/exporter";
import { SwapHistoryFilters } from "./SwapHistoryFilters";
import { SwapHistoryRow } from "./SwapHistoryRow";

const PAGE_SIZE = 20;

function downloadBlob(data: string, mime: string, filename: string): void {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function SwapHistoryPanel() {
  const [filters, setFilters] = useState<Filters>({});
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const { records, total, deleteOne, clearAll } = useSwapHistory(filters);

  const visible = useMemo(() => records.slice(0, pageSize), [records, pageSize]);

  const exportJson = () => {
    if (records.length === 0) {
      toast.info("No records to export");
      return;
    }
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadBlob(exportToJson(records), "application/json", `pond0matic-swaps-${dateStamp}.json`);
    toast.success(`Exported ${records.length} record${records.length === 1 ? "" : "s"}`);
  };

  const exportCsv = () => {
    if (records.length === 0) {
      toast.info("No records to export");
      return;
    }
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadBlob(exportToCsv(records), "text/csv", `pond0matic-swaps-${dateStamp}.csv`);
    toast.success(`Exported ${records.length} record${records.length === 1 ? "" : "s"}`);
  };

  const onClearAll = () => {
    if (records.length === 0) return;
    if (!window.confirm("Clear all swap history for this wallet? This cannot be undone.")) return;
    clearAll();
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-ink uppercase">
            Swap history
          </h3>
          <p className="text-[11px] text-ink-muted mt-0.5">
            {total} record{total === 1 ? "" : "s"} stored, {records.length} match{records.length === 1 ? "" : "es"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={exportJson} className={btn}>JSON</button>
          <button type="button" onClick={exportCsv} className={btn}>CSV</button>
          <button type="button" onClick={onClearAll} className={btnDanger}>
            Clear all
          </button>
        </div>
      </header>

      <SwapHistoryFilters filters={filters} onChange={(next) => { setFilters(next); setPageSize(PAGE_SIZE); }} />

      {visible.length === 0 ? (
        <div className="px-4 py-8 text-center text-ink-muted text-sm">
          {total === 0 ? "No swaps recorded yet. Execute a swap from the dashboard to start tracking." : "No swaps match the current filters."}
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((r) => (
            <SwapHistoryRow key={r.id} record={r} onDelete={deleteOne} />
          ))}
        </ul>
      )}

      {visible.length < records.length && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setPageSize((s) => s + PAGE_SIZE)}
            className="px-4 py-2 bg-surface-2 hover:bg-surface border border-edge rounded-lg text-xs font-medium text-ink transition-all"
          >
            Load more ({records.length - visible.length} remaining)
          </button>
        </div>
      )}
    </section>
  );
}

const btn = "px-3 py-1.5 bg-surface-2 hover:bg-surface border border-edge rounded-lg text-xs font-medium text-ink transition-all";
const btnDanger = "px-3 py-1.5 bg-danger/10 hover:bg-danger/20 border border-danger rounded-lg text-xs font-medium text-danger transition-all";
