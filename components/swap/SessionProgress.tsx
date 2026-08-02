"use client";
import { useSession } from "@/contexts/SessionContext";
import { useSwapConfig } from "@/contexts/SwapConfigContext";
import { totalRounds, type SessionConfig } from "@/lib/swap/sessionPlanner";

export function SessionProgress() {
  const { running, currentSwapIndex, currentRound } = useSession();
  const config = useSwapConfig();
  if (!running) return null;

  const cfg: SessionConfig = {
    mode: config.swapMode,
    amount: config.amount,
    maxAmount: config.maxAmount,
    loopReturnAmount: config.loopReturnAmount,
    swapsPerRound: config.swapsPerRound,
    numberOfRounds: config.numberOfRounds,
    numberOfSwaps: config.numberOfSwaps,
    swapDelayMs: config.swapDelayMs,
    autoDelayMs: config.autoDelayMs,
  };
  const rounds = totalRounds(cfg);
  const roundsLabel = rounds === Infinity ? "∞" : String(rounds);
  const totalSwaps =
    cfg.mode === "boost" && rounds !== Infinity
      ? rounds * Math.max(1, cfg.swapsPerRound)
      : rounds !== Infinity
        ? rounds
        : Infinity;
  const pct =
    totalSwaps === Infinity ? null : Math.min(100, (currentSwapIndex / totalSwaps) * 100);

  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bg">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: pct === null ? "100%" : `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-muted">
        <span>
          swap <b className="font-num text-ink">{currentSwapIndex}{totalSwaps !== Infinity ? `/${totalSwaps}` : ""}</b>
        </span>
        {cfg.mode !== "normal" ? (
          <span>
            round <b className="font-num text-ink">{currentRound}/{roundsLabel}</b>
          </span>
        ) : null}
      </div>
    </div>
  );
}
