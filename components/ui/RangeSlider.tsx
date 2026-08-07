"use client";
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
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex items-center justify-between">
        <span className="text-ink-muted">{label}</span>
        <span className="font-semibold text-ink">{bpsToPct(valueBps)}%</span>
      </span>
      <input
        type="range"
        min={minBps}
        max={maxBps}
        step={stepBps}
        value={valueBps}
        onChange={(e) => onChangeBps(clampToStep(Number(e.target.value), minBps, maxBps, stepBps))}
        className="w-full accent-accent"
        aria-label={label}
      />
      {hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
    </label>
  );
}
