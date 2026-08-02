"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { solscanTx } from "@/lib/utils";
import type { SwapRecord } from "@/lib/portfolio/types";

const STATUS_STYLES: Record<SwapRecord["status"], string> = {
  confirmed: "text-accent border-accent bg-accent/10",
  pending: "text-warn border-warn bg-warn/10",
  failed: "text-danger border-danger bg-danger/10",
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
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2 bg-surface-2 border border-edge rounded-xl">
      <div className="flex flex-col items-start gap-1 min-w-[110px]">
        <span className="text-[10px] text-ink-muted font-num">{fmtTime(record.timestamp)}</span>
        <span className="text-[10px] uppercase tracking-wide text-ink-muted">{MODE_LABELS[record.mode]}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <span className="text-sm text-ink font-num">
          {fmtAmount(record.fromAmount)} {record.fromSymbol}
        </span>
        <span className="text-ink-muted">→</span>
        <span className="text-sm text-ink font-num">
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
            className="text-xs text-accent hover:text-accent-strong underline-offset-2 hover:underline font-num"
          >
            tx ↗
          </a>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(record.id)}
            className="text-xs px-2 py-1 text-danger hover:text-danger/80"
            title="Delete record"
          >
            ✕
          </button>
        )}
      </div>
    </li>
  );
}
