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
            "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
            swapMode === m.value
              ? "bg-gradient-to-br from-accent to-accent-strong text-accent-deep"
              : "text-ink-muted hover:text-ink"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
