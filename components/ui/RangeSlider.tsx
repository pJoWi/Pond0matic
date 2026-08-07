"use client";
import type { CSSProperties } from "react";
import { clampToStep, bpsToPct } from "@/lib/ui/slider";

export function RangeSlider(props: {
  label: string;
  valueBps: number;
  minBps: number;
  maxBps: number;
  stepBps: number;
  onChangeBps: (bps: number) => void;
  hint?: string;
}) {
  const { label, valueBps, minBps, maxBps, stepBps, onChangeBps, hint } = props;
  const pct = Math.min(100, Math.max(0, ((valueBps - minBps) / (maxBps - minBps)) * 100));

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="flex items-center justify-between gap-2">
        <span className="text-ink-muted">{label}</span>
        <span className="font-num rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent-strong tabular-nums">
          {bpsToPct(valueBps)}%
        </span>
      </span>
      <input
        type="range"
        min={minBps}
        max={maxBps}
        step={stepBps}
        value={valueBps}
        onChange={(e) => onChangeBps(clampToStep(Number(e.target.value), minBps, maxBps, stepBps))}
        className="pond-range"
        style={{ "--pct": `${pct}%` } as CSSProperties}
        aria-label={label}
      />
      {hint ? <span className="text-[11px] leading-snug text-ink-muted">{hint}</span> : null}
    </label>
  );
}
