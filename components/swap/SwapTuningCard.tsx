"use client";
import { useSettings } from "@/contexts/SettingsContext";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { JUPITER_MIN_FEE_BPS } from "@/lib/settings/storage";

const FEE_MAX_BPS = 255;
const FEE_STEP_BPS = 5;
const SLIP_MIN_BPS = 10;
const SLIP_MAX_BPS = 300;
const SLIP_STEP_BPS = 10;

export function SwapTuningCard() {
  const { settings, update } = useSettings();
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-edge bg-surface-2 p-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        <span className="h-1 w-1 rounded-full bg-accent" />
        Swap tuning
      </div>

      {/* Fee is the boost-relevant control — framed to stand out. */}
      <div className="rounded-lg bg-accent/[0.05] p-2.5 ring-1 ring-inset ring-accent/15">
        <RangeSlider
          label="Platform fee → boost"
          valueBps={settings.platformFeeBps}
          minBps={JUPITER_MIN_FEE_BPS}
          maxBps={FEE_MAX_BPS}
          stepBps={FEE_STEP_BPS}
          onChangeBps={(bps) => update({ platformFeeBps: bps })}
          hint="Fee routes to the pond0x vault so swaps count toward boost. Only ≥1.00% is confirmed to count."
        />
      </div>

      <div className="px-0.5">
        <RangeSlider
          label="Slippage"
          valueBps={settings.slippageBps}
          minBps={SLIP_MIN_BPS}
          maxBps={SLIP_MAX_BPS}
          stepBps={SLIP_STEP_BPS}
          onChangeBps={(bps) => update({ slippageBps: bps })}
          hint="Lower = better price, more failed fills. Higher = more fills, worse price."
        />
      </div>
    </div>
  );
}
