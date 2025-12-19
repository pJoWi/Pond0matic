"use client";
import React, { useCallback, useState, useEffect } from "react";
import { useSwapperContext } from "@/contexts/SwapperContext";
import { cn } from "@/lib/utils";
import { TOKEN_NAMES } from "@/lib/vaults";
import type { SwapMode } from "@/types/swapModes";
import { DEFAULT_BOOST_CONFIG, DEFAULT_REWARDS_CONFIG } from "@/types/swapModes";

import { CompactHeader } from "./components/CompactHeader";
import { SwapInterface } from "./components/SwapInterface";
import { ActionButton } from "./components/ActionButton";
import { MiniActivityFeed } from "./components/MiniActivityFeed";
import { SettingsPanel } from "./components/SettingsPanel";

// Mode system components
import { ModeSelectorV2 } from "./components/ModeSelectorV2";
import { BoostModePanel } from "./components/BoostModePanel";
import { RewardsModePanel } from "./components/RewardsModePanel";

// Constants
const TOKEN_OPTIONS = Object.keys(TOKEN_NAMES);
const MIN_REWARDS_MODE_USD = 10; // Minimum USD value required for rewards mode
const DEFAULT_MAX_WIDTH = 420; // Default maximum width for compact swapper container
const SOL_MINT_ADDRESS = "So11111111111111111111111111111111111111112";
const USDC_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const WPOND_MINT_ADDRESS = "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq";

/**
 * Default price estimates for USD calculations
 * TODO: Replace with real-time price feed integration (CoinGecko, Jupiter, etc.)
 */
const PRICE_ESTIMATES: { SOL: number; USD_STABLE: number; OTHER: number } = {
  SOL: 180,
  USD_STABLE: 1,
  OTHER: 0.1,
};

interface CompactSwapperProps {
  maxWidth?: number;
  showActivityFeed?: boolean;
  onSwap: () => void;
  onStop: () => void;
  onBoostMode?: () => void;
  onRewardsMode?: () => void;
}

export function CompactSwapper({
  maxWidth = 420,
  showActivityFeed = true,
  onSwap,
  onStop,
  onBoostMode,
  onRewardsMode
}: CompactSwapperProps) {
  const ctx = useSwapperContext();

  // Toggle to show/hide configuration panels
  const [showConfig, setShowConfig] = useState(false);

  // USD value estimation for rewards mode
  const [estimatedUsd, setEstimatedUsd] = useState(0);

  /**
   * Calculate estimated USD value when amount or token changes
   * Uses hardcoded price estimates until real-time price feed is integrated
   */
  useEffect(() => {
    const amount = parseFloat(ctx.amount) || 0;

    let price = PRICE_ESTIMATES.OTHER; // Default to other token price

    // Determine price based on token type
    if (ctx.fromMint.includes(SOL_MINT_ADDRESS.slice(0, 4)) || TOKEN_NAMES[ctx.fromMint] === "SOL") {
      price = PRICE_ESTIMATES.SOL;
    } else if (TOKEN_NAMES[ctx.fromMint]?.includes("USD")) {
      price = PRICE_ESTIMATES.USD_STABLE;
    }

    setEstimatedUsd(amount * price);
  }, [ctx.amount, ctx.fromMint]);

  /**
   * Handle token swap direction button click
   * Swaps the FROM and TO token selections
   */
  const handleSwapDirection = useCallback(() => {
    const temp = ctx.fromMint;
    ctx.setFromMint(ctx.toMint);
    ctx.setToMint(temp);
    ctx.log("Switched route FROM<->TO");
  }, [ctx]);

  /**
   * Handle mode change with automatic defaults application
   * - Normal mode: SOL → wPOND, clear amounts
   * - Boost mode: USDC → SOL, apply boost defaults
   * - Rewards mode: USDC → SOL, apply rewards defaults
   */
  const handleModeChange = useCallback((mode: SwapMode) => {
    // Set the mode
    ctx.setSwapMode(mode);

    if (mode === "normal") {
      // Normal mode: SOL → wPOND, set default amount
      ctx.setFromMint(SOL_MINT_ADDRESS);
      ctx.setToMint(WPOND_MINT_ADDRESS);
      ctx.setAmount("0.01");
      ctx.setMaxAmount("");
      ctx.log("Mode: Normal | SOL → wPOND | 0.01 SOL");
    } else if (mode === "boost") {
      // Boost mode: USDC → SOL, apply boost defaults
      ctx.setFromMint(USDC_MINT_ADDRESS);
      ctx.setToMint(SOL_MINT_ADDRESS);
      ctx.setAmount(DEFAULT_BOOST_CONFIG.minAmount);
      ctx.setMaxAmount(DEFAULT_BOOST_CONFIG.maxAmount);
      ctx.setSwapsPerRound(DEFAULT_BOOST_CONFIG.swapsPerRound);
      ctx.setNumberOfRounds(DEFAULT_BOOST_CONFIG.numberOfRounds);
      ctx.setSwapDelayMs(DEFAULT_BOOST_CONFIG.delayMs);
      ctx.log(`Mode: Boost | USDC → SOL | ${DEFAULT_BOOST_CONFIG.swapsPerRound} swaps × ${DEFAULT_BOOST_CONFIG.numberOfRounds} rounds`);
    } else if (mode === "rewards") {
      // Rewards mode: USDC → SOL, apply rewards defaults
      ctx.setFromMint(USDC_MINT_ADDRESS);
      ctx.setToMint(SOL_MINT_ADDRESS);
      ctx.setAmount(DEFAULT_REWARDS_CONFIG.amount);
      ctx.setNumberOfSwaps(DEFAULT_REWARDS_CONFIG.numberOfSwaps);
      ctx.log(`Mode: Rewards | USDC → SOL | ${DEFAULT_REWARDS_CONFIG.amount} USDC × ${DEFAULT_REWARDS_CONFIG.numberOfSwaps} swaps`);
    }
  }, [ctx]);

  /**
   * Determine which action to execute based on current swap mode
   * Routes to the appropriate mode handler (normal, boost, or rewards)
   */
  const handleStart = useCallback(() => {
    if (ctx.swapMode === "boost" && onBoostMode) {
      onBoostMode();
    } else if (ctx.swapMode === "rewards" && onRewardsMode) {
      onRewardsMode();
    } else {
      onSwap();
    }
  }, [ctx.swapMode, onBoostMode, onRewardsMode, onSwap]);

  /**
   * Calculate total number of swaps based on current mode
   * - Normal: 1 swap
   * - Boost: swapsPerRound × numberOfRounds (or Infinity if infinite rounds)
   * - Rewards: numberOfSwaps (or Infinity if infinite swaps)
   *
   * @returns Total swap count or Infinity for continuous modes
   */
  const getTotalSwaps = () => {
    if (ctx.swapMode === "normal") {
      return 1;
    } else if (ctx.swapMode === "boost") {
      const rounds = ctx.numberOfRounds === 0 ? Infinity : ctx.numberOfRounds;
      return rounds === Infinity ? Infinity : ctx.swapsPerRound * rounds;
    } else {
      // Rewards mode
      return ctx.numberOfSwaps === 0 ? Infinity : ctx.numberOfSwaps;
    }
  };

  // Theme mode for CSS variables (dynamically changes based on swap mode)
  const themeMode = ctx.swapMode;

  return (
    <div
      data-mode={themeMode}
      className="dashboard-container"
    >
      <div
        className={cn(
          "premium-panel theme-glow-intense overflow-hidden relative",
          "transition-all duration-500"
        )}
        style={{
          background: 'linear-gradient(135deg, rgba(10, 10, 15, 0.95) 0%, rgba(13, 31, 45, 0.9) 100%)',
        }}
      >
        {/* Pond-themed decorative background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          {/* Water ripple effect */}
          <div
            className="absolute top-0 left-0 right-0 h-32"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(74, 143, 184, 0.15) 0%, transparent 70%)',
            }}
          />

          {/* Floating lily pads - top left */}
          <div
            className="absolute top-8 left-8 w-12 h-12 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(139, 196, 159, 0.2) 0%, transparent 70%)',
              animation: 'float 6s ease-in-out infinite',
            }}
          />

          {/* Floating lily pads - top right */}
          <div
            className="absolute top-16 right-12 w-16 h-16 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(107, 157, 120, 0.15) 0%, transparent 70%)',
              animation: 'float 8s ease-in-out infinite 1s',
            }}
          />

          {/* Gold mystical glow - bottom */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32"
            style={{
              background: 'radial-gradient(ellipse at 50% 100%, rgba(240, 198, 116, 0.1) 0%, transparent 60%)',
            }}
          />

          {/* Subtle pond surface shimmer */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(139, 196, 159, 0.05) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmerPond 4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Header */}
        <CompactHeader

          wallet={ctx.wallet}
          networkStatus={ctx.networkStatus}
          onConnect={ctx.connect}
          onDisconnect={ctx.disconnect}
          mode={ctx.swapMode}
          useNewModes={true}
        />

        {/* Main Content */}
        <div className="p-4 space-y-3 relative z-10">
          {/* Swap Interface */}
          <SwapInterface
            fromMint={ctx.fromMint}
            toMint={ctx.toMint}
            amount={ctx.amount}
            tokenBalance={ctx.tokenBalance}
            tokenNames={TOKEN_NAMES}
            tokenOptions={TOKEN_OPTIONS}
            onFromMintChange={ctx.setFromMint}
            onToMintChange={ctx.setToMint}
            onAmountChange={ctx.setAmount}
            onSwapDirection={handleSwapDirection}
            wallet={ctx.wallet}
          />

          {/* Mode Selector */}
          <ModeSelectorV2
            mode={ctx.swapMode}
            onModeChange={handleModeChange}
            disabled={ctx.running}
          />

          {/* Config Toggle Button - only show for boost/rewards modes */}
          {ctx.swapMode !== "normal" && (
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg",
                "bg-black/30 transition-all text-xs",
                "theme-border theme-text-primary theme-glow-subtle",
                "hover:theme-border-hover hover:theme-glow",
                showConfig && "bg-theme-surface theme-glow"
              )}
            >
              <span>Configuration</span>
              <span className={cn(
                "transition-transform duration-200",
                showConfig && "rotate-180"
              )}>
                v
              </span>
            </button>
          )}

          {/* Collapsible Configuration Panels */}
          {showConfig && ctx.swapMode !== "normal" && (
            <>
              {/* Boost Mode Panel */}
              {ctx.swapMode === "boost" && (
                <BoostModePanel
                  minAmount={ctx.amount}
                  maxAmount={ctx.maxAmount}
                  swapsPerRound={ctx.swapsPerRound}
                  numberOfRounds={ctx.numberOfRounds}
                  loopReturnAmount={ctx.loopReturnAmount}
                  toTokenBalance={ctx.tokenBalance}
                  toTokenName={TOKEN_NAMES[ctx.toMint] || "TOKEN"}
                  swapDelayMs={ctx.swapDelayMs}
                  onMinAmountChange={ctx.setAmount}
                  onMaxAmountChange={ctx.setMaxAmount}
                  onSwapsPerRoundChange={ctx.setSwapsPerRound}
                  onNumberOfRoundsChange={ctx.setNumberOfRounds}
                  onLoopReturnAmountChange={ctx.setLoopReturnAmount}
                  onSwapDelayMsChange={ctx.setSwapDelayMs}
                  running={ctx.running}
                />
              )}

              {/* Rewards Mode Panel */}
              {ctx.swapMode === "rewards" && (
                <RewardsModePanel
                  swapAmount={ctx.amount}
                  numberOfSwaps={ctx.numberOfSwaps}
                  referralLink={ctx.referralLink}
                  onSwapAmountChange={ctx.setAmount}
                  onNumberOfSwapsChange={ctx.setNumberOfSwaps}
                  onReferralLinkChange={ctx.setReferralLink}
                  running={ctx.running}
                  estimatedUsdValue={estimatedUsd}
                />
              )}
            </>
          )}

          {/* Settings Panel */}
          <SettingsPanel
            platformFeeBps={ctx.platformFeeBps}
            slippageBps={ctx.slippageBps}
            onPlatformFeeChange={ctx.setPlatformFeeBps}
            onSlippageChange={ctx.setSlippageBps}
          />

          {/* Action Button */}
          <ActionButton
            running={ctx.running}
            totalSwaps={getTotalSwaps()}
            currentSwapIndex={ctx.currentSwapIndex}
            disabled={
              !ctx.wallet ||
              !ctx.amount ||
              parseFloat(ctx.amount) <= 0 ||
              (ctx.swapMode === "rewards" && estimatedUsd < MIN_REWARDS_MODE_USD)
            }
            onStart={handleStart}
            onStop={onStop}
            mode={ctx.swapMode}
          />
        </div>

        {/* Mini Activity Feed (optional) */}
        {showActivityFeed && <MiniActivityFeed activities={ctx.activities.slice(-5)} onClear={ctx.clearLog} />}
      </div>

      {/* Pond-themed CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-10px) translateX(5px);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-5px) translateX(-5px);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-15px) translateX(3px);
            opacity: 0.6;
          }
        }

        @keyframes shimmerPond {
          0%, 100% {
            background-position: 0% 50%;
            opacity: 0.3;
          }
          50% {
            background-position: 100% 50%;
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
