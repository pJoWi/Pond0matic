"use client";
import { useCallback } from "react";
import { CompactSwapper } from "@/components/CompactSwapper";
import { useSwapExecution } from "@/hooks/useSwapExecution";

export default function SwapperPage() {
  const {
    stopAuto,
    executeBoostMode,
    executeRewardsMode,
    executeNormalMode
  } = useSwapExecution();

  // Normal mode handler (single swap)
  const handleSwap = useCallback(async () => {
    await executeNormalMode();
  }, [executeNormalMode]);

  // Boost mode handler
  const handleBoostMode = useCallback(async () => {
    await executeBoostMode();
  }, [executeBoostMode]);

  // Rewards mode handler
  const handleRewardsMode = useCallback(async () => {
    await executeRewardsMode();
  }, [executeRewardsMode]);

  const handleStop = useCallback(() => {
    stopAuto();
  }, [stopAuto]);

  return (
    <div className="pb-8 min-h-screen pt-10">
      <div className="max-w-xl mx-auto px-4">
        <CompactSwapper
          onSwap={handleSwap}
          onStop={handleStop}
          onBoostMode={handleBoostMode}
          onRewardsMode={handleRewardsMode}
        />
      </div>
    </div>
  );
}
