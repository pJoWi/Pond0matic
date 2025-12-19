"use client";
import { useState, useCallback, useEffect } from "react";
import { useSwapperContext, SwapperProvider } from "@/contexts/SwapperContext";
import { CompactPond0xDashboard } from "@/components/swapper/CompactPond0xDashboard";
import { CompactSwapper } from "@/components/CompactSwapper";
import { useSwapExecution } from "@/hooks/useSwapExecution";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { TOKEN_VAULTS_AFFILIATE_1, TOKEN_VAULTS_AFFILIATE_2, DEFAULT_RPC } from "@/lib/vaults";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const WPOND_MINT = "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq";

function UnifiedDashboardContent() {
  const [swapperOpen, setSwapperOpen] = useState(false);
  const ctx = useSwapperContext();
  const { toasts, dismissToast, success, info } = useToast();
  const {
    stopAuto,
    executeBoostMode,
    executeRewardsMode,
    executeNormalMode
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

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && swapperOpen) {
        closeSwapper();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [swapperOpen, closeSwapper]);

  return (
    <div className="relative min-h-screen bg-space-black overflow-hidden">
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
          "dashboard-container-wide transition-all duration-500 ease-out relative z-10",
          swapperOpen && "scale-95 blur-sm pointer-events-none"
        )}
      >
        <CompactPond0xDashboard
          proSwapsSol={ctx.proSwapsSol}
          proSwapsBx={ctx.proSwapsBx}
          onOpenSwapper={openSwapper}
        />
      </main>

      {/* Swapper Panel */}
      <aside
        className={cn(
          // Panel structure
          "fixed top-0 right-0 h-full w-full md:w-[420px] z-50",
          "bg-space-black/95 backdrop-blur-xl",
          "border-l-2 border-lily-green shadow-lily-intense",

          // Transition - custom cubic bezier for bounce effect
          "transition-transform duration-[400ms]",

          // States
          swapperOpen ? "translate-x-0" : "translate-x-full",

          // Mobile: slide from bottom
          "md:translate-y-0",
          !swapperOpen && "max-md:translate-y-full max-md:translate-x-0"
        )}
        data-theme="pond0x"
        role="dialog"
        aria-label="Token Swapper"
        aria-modal="true"
        aria-hidden={!swapperOpen}
      >
        {/* Close Button */}
        <button
          className={cn(
            "absolute top-4 right-4 z-10",
            "w-10 h-10 rounded-lg",
            "bg-black/40 border border-lily-green/30",
            "flex items-center justify-center",
            "text-lily-bright hover:text-pink-bright",
            "hover:border-pink-bright hover:bg-black/60",
            "transition-all duration-200",
            "hover:shadow-[0_0_20px_rgba(255,192,227,0.5)]",
            "focus:outline-none focus:ring-2 focus:ring-lily-green focus:ring-offset-2 focus:ring-offset-space-black"
          )}
          onClick={closeSwapper}
          aria-label="Close swapper"
        >
          <span className="text-xl font-bold">✕</span>
        </button>

        {/* Swapper Content */}
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

export default function UnifiedDashboard() {
  return (
    <SwapperProvider
      initialRpc={DEFAULT_RPC}
      initialFromMint={SOL_MINT}
      initialToMint={WPOND_MINT}
      initialPlatformFeeBps={Number(process.env.NEXT_PUBLIC_DEFAULT_PLATFORM_FEE_BPS) || 100}
      initialSlippageBps={Number(process.env.NEXT_PUBLIC_DEFAULT_SLIPPAGE_BPS) || 50}
      tokenVaultsAffiliate1={TOKEN_VAULTS_AFFILIATE_1}
      tokenVaultsAffiliate2={TOKEN_VAULTS_AFFILIATE_2}
    >
      <UnifiedDashboardContent />
    </SwapperProvider>
  );
}
