"use client";
import { useCallback } from "react";
import { CompactSwapper } from "@/components/CompactSwapper";
import { SwapperProvider } from "@/contexts/SwapperContext";
import { useSwapExecution } from "@/hooks/useSwapExecution";
import { TOKEN_VAULTS_AFFILIATE_1, TOKEN_VAULTS_AFFILIATE_2, DEFAULT_RPC } from "@/lib/vaults";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function CompactSwapperWrapper() {
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
    <CompactSwapper
      onSwap={handleSwap}
      onStop={handleStop}
      onBoostMode={handleBoostMode}
      onRewardsMode={handleRewardsMode}
    />
  );
}

export default function CompactPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-cyber-black via-cyber-darker to-cyber-black">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 107, 53, 0.3) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Compact Swapper Container */}
      <div className="relative z-10 w-full max-w-xl">
        <SwapperProvider
          initialRpc={DEFAULT_RPC}
          initialFromMint={SOL_MINT}
          initialToMint={USDC_MINT}
          initialPlatformFeeBps={85}
          initialSlippageBps={50}
          tokenVaultsAffiliate1={TOKEN_VAULTS_AFFILIATE_1}
          tokenVaultsAffiliate2={TOKEN_VAULTS_AFFILIATE_2}
        >
          <CompactSwapperWrapper />
        </SwapperProvider>

        {/* Footer Attribution */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Powered by{" "}
            <span className="text-ember-orange font-semibold mx-1">Pond</span>
            <span className="mx-1">&</span>
            <span className="text-blue-400 font-semibold mx-1">Jupiter</span>
          </p>
        </div>
      </div>
    </div>
  );
}
