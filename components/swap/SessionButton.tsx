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
          "w-full rounded-xl bg-gradient-to-br from-accent to-accent-strong py-2.5",
          "text-sm font-bold text-accent-deep transition-opacity disabled:opacity-40"
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
          className="flex-1 rounded-xl border border-edge py-2.5 text-sm font-bold text-ink"
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
      ) : null}
      <button
        type="button"
        onClick={stopSession}
        disabled={stopping}
        className="flex-[2] rounded-xl bg-gradient-to-br from-warn to-danger py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {stopping ? "Stopping…" : "■ Stop session"}
      </button>
    </div>
  );
}
