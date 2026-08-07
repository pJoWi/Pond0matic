"use client";
import { useSwapConfig } from "@/contexts/SwapConfigContext";
import { useSession } from "@/contexts/SessionContext";
import { cn } from "@/lib/utils";
import type { SwapMode } from "@/types/swapModes";

const MODES: { value: SwapMode; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "boost", label: "Boost" },
  { value: "rewards", label: "Rewards" },
];

export function ModeTabs() {
  const { swapMode, setSwapMode } = useSwapConfig();
  const { running } = useSession();
  return (
    <div className="flex gap-1 rounded-xl bg-bg p-1" role="tablist" aria-label="Swap mode">
      {MODES.map((m) => (
        <button
          key={m.value}
          role="tab"
          aria-selected={swapMode === m.value}
          disabled={running}
          onClick={() => setSwapMode(m.value)}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all duration-200 disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
            swapMode === m.value
              ? "bg-gradient-to-br from-accent to-accent-strong text-accent-deep shadow-[0_2px_10px_-2px_var(--color-accent)] ring-1 ring-inset ring-white/15"
              : "text-ink-muted hover:bg-surface/60 hover:text-ink"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
