"use client";
import { useSession } from "@/contexts/SessionContext";
import { useSwapConfig } from "@/contexts/SwapConfigContext";
import { useSwapEngine } from "@/hooks/useSwapEngine";
import { cn } from "@/lib/utils";

const START_LABEL: Record<string, string> = {
  normal: "Swap",
  boost: "▶ Start boost session",
  rewards: "▶ Start rewards session",
};

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export function SessionButton({ disabled }: { disabled: boolean }) {
  const { running, paused, stopping } = useSession();
  const { swapMode } = useSwapConfig();
  const { startSession, stopSession, pauseSession, resumeSession } = useSwapEngine();

  if (!running) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => void startSession()}
        className={cn(
          "pond-sheen group relative w-full rounded-xl py-3",
          "bg-gradient-to-br from-accent to-accent-strong text-sm font-bold tracking-tight text-accent-deep",
          "shadow-[0_6px_20px_-6px_var(--color-accent)] ring-1 ring-inset ring-white/15",
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-6px_var(--color-accent)]",
          "active:translate-y-0 active:shadow-[0_4px_12px_-6px_var(--color-accent)]",
          "disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none",
          FOCUS
        )}
      >
        {START_LABEL[swapMode]}
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      {swapMode !== "normal" ? (
        <button
          type="button"
          onClick={paused ? resumeSession : pauseSession}
          className={cn(
            "flex-1 rounded-xl border border-edge bg-surface py-3 text-sm font-bold text-ink",
            "transition-colors hover:border-accent/60 hover:text-accent-strong",
            FOCUS
          )}
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
      ) : null}
      <button
        type="button"
        onClick={stopSession}
        disabled={stopping}
        className={cn(
          "flex-[2] rounded-xl bg-gradient-to-br from-warn to-danger py-3 text-sm font-bold text-white",
          "shadow-[0_6px_18px_-8px_var(--color-danger)] ring-1 ring-inset ring-white/15",
          "transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60",
          FOCUS
        )}
      >
        {stopping ? "Stopping…" : "■ Stop session"}
      </button>
    </div>
  );
}
