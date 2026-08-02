"use client";
import { useState, useCallback, useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { CompactSwapper } from "@/components/CompactSwapper";
import { useSwapExecution } from "@/hooks/useSwapExecution";
import { useToast } from "@/hooks/useToast";
import { useSwapRecorder } from "@/hooks/useSwapRecorder";
import { cn } from "@/lib/utils";

export default function HomePage() {
  useSwapRecorder(); // Mount once: captures swap lifecycle events into the portfolio store
  const [swapperOpen, setSwapperOpen] = useState(false);
  const { info } = useToast();
  const {
    stopAuto,
    executeBoostMode,
    executeRewardsMode,
    executeNormalMode,
  } = useSwapExecution();

  const openSwapper = useCallback(() => {
    setSwapperOpen(true);
    info("Swapper activated");
  }, [info]);

  const closeSwapper = useCallback(() => {
    setSwapperOpen(false);
  }, []);

  const handleSwap = useCallback(async () => {
    await executeNormalMode();
  }, [executeNormalMode]);

  const handleBoostMode = useCallback(async () => {
    await executeBoostMode();
  }, [executeBoostMode]);

  const handleRewardsMode = useCallback(async () => {
    await executeRewardsMode();
  }, [executeRewardsMode]);

  const handleStop = useCallback(() => {
    stopAuto();
  }, [stopAuto]);

  // Close drawer on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && swapperOpen) {
        closeSwapper();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [swapperOpen, closeSwapper]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-pond-deep/80 backdrop-blur-sm",
          "transition-opacity duration-300",
          swapperOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeSwapper}
        aria-hidden="true"
      />

      {/* Main Dashboard */}
      <main
        className={cn(
          "pt-16 pb-8 transition-all duration-500 ease-out relative z-10",
          swapperOpen && "scale-95 blur-sm pointer-events-none"
        )}
      >
        <Dashboard onOpenSwapper={openSwapper} />
      </main>

      {/* Swapper Drawer */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-full md:w-[420px] z-50",
          "bg-space-black/95 backdrop-blur-xl",
          "border-l-2 border-lily-green shadow-lily-intense",
          "transition-transform duration-[400ms]",
          swapperOpen ? "translate-x-0" : "translate-x-full",
          "md:translate-y-0",
          !swapperOpen && "max-md:translate-y-full max-md:translate-x-0"
        )}
        data-theme="pond0x"
        role="dialog"
        aria-label="Token Swapper"
        aria-modal="true"
        {...(!swapperOpen ? { "aria-hidden": true } : {})}
      >
        <button
          type="button"
          className={cn(
            "absolute top-4 right-4 z-10 w-10 h-10 rounded-lg",
            "bg-black/40 border border-lily-green/30 flex items-center justify-center",
            "text-lily-bright hover:text-pink-bright hover:border-pink-bright hover:bg-black/60",
            "transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,192,227,0.5)]",
            "focus:outline-none focus:ring-2 focus:ring-lily-green focus:ring-offset-2 focus:ring-offset-space-black"
          )}
          onClick={closeSwapper}
          aria-label="Close swapper"
        >
          <span className="text-xl font-bold">✕</span>
        </button>

        <div className="h-full overflow-y-auto pt-16 pb-6">
          <CompactSwapper
            maxWidth={420}
            showActivityFeed={true}
            onSwap={handleSwap}
            onStop={handleStop}
            onBoostMode={handleBoostMode}
            onRewardsMode={handleRewardsMode}
          />
        </div>
      </aside>
    </div>
  );
}
