"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { solscanTx } from "@/lib/utils";
import type { SwapRecord } from "@/lib/portfolio/types";

const STATUS_STYLES: Record<SwapRecord["status"], string> = {
  confirmed: "text-emerald-300 border-emerald-400/40 bg-emerald-950/40",
  pending: "text-amber-300 border-amber-400/40 bg-amber-950/40",
  failed: "text-pink-300 border-pink-400/40 bg-rose-950/40",
};

const MODE_LABELS: Record<SwapRecord["mode"], string> = {
  normal: "Normal",
  boost: "Boost",
  rewards: "Rewards",
};

function fmtAmount(v: number): string {
  if (v >= 1) return v.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return v.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleString();
}

interface Props {
  record: SwapRecord;
  onDelete?: (id: string) => void;
}

export function SwapHistoryRow({ record, onDelete }: Props) {
  const isRealSig = !record.signature.startsWith("pending-");

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2 bg-slate-950/60 border border-teal-400/20 rounded-xl">
      <div className="flex flex-col items-start gap-1 min-w-[110px]">
        <span className="text-[10px] text-teal-400/70 tabular-nums">{fmtTime(record.timestamp)}</span>
        <span className="text-[10px] uppercase tracking-wide text-teal-300/80">{MODE_LABELS[record.mode]}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <span className="text-sm text-cyan-200 tabular-nums">
          {fmtAmount(record.fromAmount)} {record.fromSymbol}
        </span>
        <span className="text-teal-400/70">→</span>
        <span className="text-sm text-cyan-200 tabular-nums">
          {fmtAmount(record.toAmount)} {record.toSymbol}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border", STATUS_STYLES[record.status])}>
          {record.status}
        </span>
        {isRealSig && (
          <a
            href={solscanTx(record.signature)}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-teal-300 hover:text-teal-100 underline-offset-2 hover:underline"
          >
            tx ↗
          </a>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(record.id)}
            className="text-xs px-2 py-1 text-pink-300 hover:text-pink-200"
            title="Delete record"
          >
            ✕
          </button>
        )}
      </div>
    </li>
  );
}
