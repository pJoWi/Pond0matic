"use client";
/**
 * CompactPond0xDashboard - Serene Pond Water Themed Dashboard
 *
 * A tranquil, nature-inspired dashboard that displays real-time token prices,
 * mining statistics, and transaction metrics with pond ecosystem aesthetics.
 *
 * Design Philosophy:
 * - Organic flowing shapes inspired by lily pads and water surfaces
 * - Soft color palette: deep teals, aqua blues, lily greens, lotus pinks
 * - Water ripple effects and gentle wave animations
 * - Dark glass-morphic panels with strong backdrop blur mimicking water surfaces
 * - Bioluminescent glows and dewdrop accents
 * - Rounded, soft typography for natural feel
 * - Visible pond-water bubble animation in background
 */

import React, { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  PigIcon,
  SolanaIcon,
  DropletIcon,
  MoneyIcon,
  PickaxeIcon,
} from "@/components/icons";
import { TokenLogo, TokenIcon } from "@/components/icons/tokens";
import { TokenPriceSkeleton } from "@/components/ui/TokenPriceSkeleton";
import { BubbleAnimation } from "@/components/ui/BubbleAnimation";
import { WaterRipple } from "@/components/ui/WaterRipple";
import { DewdropGlow } from "@/components/ui/DewdropGlow";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { LilyPadCard } from "@/components/ui/LilyPadCard";
import { DashboardHeader } from "@/components/swapper/sections/DashboardHeader";
import { TokenPricesPanel } from "@/components/swapper/sections/TokenPricesPanel";
import { TOKEN_ICONS } from "@/lib/tokenIcons";
import { useTokenPrices } from "@/hooks/useTokenPrices";

interface CompactPond0xDashboardProps {
  proSwapsSol: number;
  proSwapsBx: number;
  onOpenSwapper?: () => void;
  variant?: "tokens" | "stats" | "full";
  totalBoosts?: number;
  rigHealth?: number;
  isPro?: boolean;
  miningSessionsCount?: number;
  miningSessionPenalties?: number;
  isLoading?: boolean;
  onFetchRigData?: () => void;
  badges?: string;
  estimatedSolUsd?: number;
  maxClaimEstimateUsd?: number;
  inMempool?: number;
  sent?: number;
  failed?: number;
  drifted?: number;
}

// Subcomponents (WaterRipple, DewdropGlow, LiveIndicator, LilyPadCard) live in components/ui/.

export function CompactPond0xDashboard({
  proSwapsSol,
  proSwapsBx,
  onOpenSwapper,
  variant = "full",
  totalBoosts = 0,
  rigHealth = 0,
  isPro = false,
  miningSessionsCount = 0,
  isLoading = false,
  onFetchRigData,
  badges = "",
  estimatedSolUsd = 0,
  maxClaimEstimateUsd = 0,
  inMempool = 0,
  sent = 0,
  failed = 0,
  drifted = 0,
}: CompactPond0xDashboardProps) {
  const pricesObj = useTokenPrices();
  const { wpondPrice, solPrice, pondSolPrice } = pricesObj;

  // Wallet connection state (mock — replaced by real WalletBar in next phase step)
  const [isWalletExpanded, setIsWalletExpanded] = useState(false);

  const mockWalletData = {
    connected: true,
    address: "7xKXtg2CW87d97TXJSDpbD5jBk",
    network: "Solana",
    balances: [
      { symbol: 'SOL', amount: 12.5, usdValue: 12.5 * solPrice, icon: TOKEN_ICONS.SOL },
      { symbol: 'wPOND', amount: 250.75, usdValue: 250.75 * wpondPrice, icon: TOKEN_ICONS.wPOND },
      { symbol: 'pondSOL', amount: 5.2, usdValue: 5.2 * pondSolPrice, icon: TOKEN_ICONS.pondSOL },
      { symbol: 'USDC', amount: 1000.0, usdValue: 1000.0, icon: TOKEN_ICONS.USDC },
    ]
  };

  /**
   * Get health status color based on percentage
   */
  const getHealthStatus = (health: number): 'positive' | 'warning' | 'negative' => {
    if (health >= 80) return 'positive';
    if (health >= 50) return 'warning';
    return 'negative';
  };

  /**
   * CollapsibleWalletBar - Floating wallet connection UI with pond-water aesthetics
   * Shows connection status, balance, and detailed wallet info on expand
   */
  const renderWalletBar = () => {
    const { connected, address, network, balances } = mockWalletData;
    const primaryBalance = balances[0]; // SOL balance

    /**
     * Truncate wallet address for display
     */
    const truncateAddress = (addr: string) => {
      return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    };

    /**
     * Copy address to clipboard with toast notification
     */
    const copyAddress = async () => {
      try {
        await navigator.clipboard.writeText(address);
        toast.success("Address copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy address");
      }
    };

    /**
     * Handle disconnect (mock function for now)
     */
    const handleDisconnect = () => {
      toast.info("Disconnect wallet functionality coming soon");
    };

    return (
      <div className="relative mb-6">
        {/* Wallet Connection Bar Container */}
        <div className={cn(
          "relative backdrop-blur-2xl border-2 border-teal-400/30 overflow-hidden transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
          "rounded-[2rem_2.5rem_2rem_2.5rem]", // Organic lily pad shape
          isWalletExpanded ? "bg-slate-950/90" : "bg-slate-950/80"
        )}>
          {/* Dark overlay for glass morphism */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />

          {/* Water surface shimmer */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-300/5 opacity-30" />

          {/* Gentle wave pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(45,212,191,0.15)_0%,transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(74,222,128,0.15)_0%,transparent_50%)]" />
          </div>

          <div className="relative z-10">
            {/* Collapsed State - Compact horizontal layout */}
            <div className="p-4 flex items-center justify-between gap-4">
              {/* Left: Status and Balance */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Connected Status Pill */}
                {connected && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-400/50 rounded-full backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
                    <div className="relative">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pond-pulse-soft shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                      <div className="absolute inset-0 w-2 h-2 bg-emerald-400/40 rounded-full animate-pond-ping-slow" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide text-emerald-300">Connected</span>
                  </div>
                )}

                {/* Primary Balance Display */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-shrink-0 w-7 h-7 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full ring-2 ring-teal-400/40" />
                    <TokenIcon
                      info={{
                        symbol: primaryBalance.symbol,
                        icon: primaryBalance.icon,
                        name: primaryBalance.symbol,
                      }}
                      width={28}
                      height={28}
                      enableUnknownTokenWarning={false}
                    />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-cyan-200 tabular-nums">
                      {primaryBalance.amount.toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-teal-400/80">
                      {primaryBalance.symbol}
                    </span>
                  </div>
                </div>

                {/* Network Badge (visible on desktop) */}
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-purple-950/50 border border-purple-400/40 rounded-full">
                  <span className="text-sm">💜</span>
                  <span className="text-[10px] font-semibold tracking-wide text-purple-300">{network}</span>
                </div>
              </div>

              {/* Right: Toggle Button */}
              <button
                onClick={() => setIsWalletExpanded(!isWalletExpanded)}
                className="flex-shrink-0 p-2.5 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-400/40 hover:border-teal-400/60 rounded-xl transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_24px_rgba(45,212,191,0.3)] group"
                aria-label={isWalletExpanded ? "Collapse wallet" : "Expand wallet"}
              >
                <svg
                  className={cn(
                    "w-5 h-5 text-teal-300 transition-transform duration-300",
                    isWalletExpanded && "rotate-180"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Expanded State - Detailed wallet info with smooth animation */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out",
                isWalletExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="px-4 pb-4 space-y-4 border-t border-teal-400/20">
                {/* Wallet Address Section */}
                <div className="pt-4 space-y-2">
                  <div className="text-[10px] font-medium tracking-wide text-teal-300/80 uppercase">
                    Wallet Address
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-black/40 border border-teal-400/30 rounded-xl font-mono text-sm text-cyan-200">
                      {truncateAddress(address)}
                    </div>
                    <button
                      onClick={copyAddress}
                      className="p-2.5 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-400/40 hover:border-teal-400/60 rounded-xl transition-all duration-300 group"
                      title="Copy address"
                    >
                      <svg
                        className="w-4 h-4 text-teal-300 group-hover:text-teal-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Token Balances */}
                <div className="space-y-2">
                  <div className="text-[10px] font-medium tracking-wide text-teal-300/80 uppercase flex items-center justify-between">
                    <span>Token Balances</span>
                    <span className="text-emerald-300">{balances.length} assets</span>
                  </div>

                  <div className="space-y-1.5">
                    {balances.map((token, idx) => (
                      <div
                        key={token.symbol}
                        className="flex items-center justify-between px-3 py-2.5 bg-black/30 hover:bg-black/40 border border-teal-400/20 hover:border-teal-400/30 rounded-xl transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full ring-2 ring-teal-400/30 group-hover:ring-emerald-400/50 transition-all" />
                            <TokenIcon
                              info={{
                                symbol: token.symbol,
                                icon: token.icon,
                                name: token.symbol,
                              }}
                              width={32}
                              height={32}
                              enableUnknownTokenWarning={false}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-cyan-200">
                              {token.symbol}
                            </span>
                            <span className="text-[10px] text-teal-400/70 tabular-nums">
                              {token.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-semibold text-emerald-300 tabular-nums">
                            ${token.usdValue.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Portfolio Value */}
                  <div className="pt-2 mt-2 border-t border-teal-400/20 flex items-center justify-between px-3 py-2">
                    <span className="text-xs font-semibold tracking-wide text-teal-300 uppercase">
                      Total Value
                    </span>
                    <span className="text-lg font-bold text-emerald-300 tabular-nums">
                      ${balances.reduce((sum, t) => sum + t.usdValue, 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={handleDisconnect}
                  className="w-full px-4 py-2.5 bg-rose-950/60 hover:bg-rose-900/60 border border-pink-400/40 hover:border-pink-400/60 rounded-xl font-semibold text-sm text-pink-300 hover:text-pink-200 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_24px_rgba(244,114,182,0.3)] flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Serene pond-themed header with organic shapes and glows
   */
  const renderHeader = () => (
    <DashboardHeader badges={badges} isPro={isPro} walletSlot={renderWalletBar()} />
  );

  /**
   * Token prices displayed on lily pad cards with organic layout
   */
  const renderTokenPrices = () => <TokenPricesPanel prices={pricesObj} />;

  /**
   * Mining statistics with lily pad cards and organic flow
   */
  const renderMiningStats = () => {
    const healthStatus = getHealthStatus(rigHealth);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="font-semibold text-xl tracking-wide text-teal-100 flex items-center gap-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            <span className="text-2xl">⚡</span>
            <span>Pond Operations</span>
          </h2>
        </div>

        {/* Primary health display - large lily pad */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rig Health - prominent feature */}
          <div className="md:col-span-2">
            <div className={cn(
              "relative backdrop-blur-2xl border-2 p-8 overflow-hidden transition-all duration-500 shadow-[0_16px_56px_rgba(0,0,0,0.5)]",
              "rounded-[3rem_2rem_3rem_2.5rem]",
              "animate-pond-float",
              healthStatus === 'positive' && 'bg-emerald-950/85 border-emerald-400/50',
              healthStatus === 'warning' && 'bg-amber-950/85 border-amber-400/50',
              healthStatus === 'negative' && 'bg-rose-950/85 border-pink-400/50'
            )}>
              {/* Dark overlay for depth */}
              <div className="absolute inset-0 bg-black/40" />

              {/* Water surface shimmer */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-30" />

              {/* Organic light spots */}
              <div className="absolute inset-0 opacity-20">
                <div className={cn(
                  "absolute top-1/4 right-1/4 w-32 h-32 rounded-full blur-3xl",
                  healthStatus === 'positive' && 'bg-emerald-400/50',
                  healthStatus === 'warning' && 'bg-amber-400/50',
                  healthStatus === 'negative' && 'bg-pink-400/50'
                )} />
              </div>

              <WaterRipple delay={200} />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="text-xs font-medium tracking-wide text-teal-300/90 uppercase flex items-center gap-2">
                    <span>Mining Ecosystem Health</span>
                  </div>
                  <div className={cn(
                    "px-4 py-2 rounded-full font-semibold text-xs tracking-wide backdrop-blur-sm flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.4)]",
                    healthStatus === 'positive' && 'bg-emerald-900/60 text-emerald-200 border border-emerald-400/50',
                    healthStatus === 'warning' && 'bg-amber-900/60 text-amber-200 border border-amber-400/50',
                    healthStatus === 'negative' && 'bg-rose-900/60 text-pink-200 border border-pink-400/50'
                  )}>
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      healthStatus === 'positive' && 'bg-emerald-400',
                      healthStatus === 'warning' && 'bg-amber-400',
                      healthStatus === 'negative' && 'bg-pink-400'
                    )} />
                    {healthStatus === 'positive' && 'Thriving'}
                    {healthStatus === 'warning' && 'Stressed'}
                    {healthStatus === 'negative' && 'Critical'}
                  </div>
                </div>

                <div className="flex items-end gap-3 mb-6">
                  <div className={cn(
                    "text-6xl font-bold tabular-nums tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]",
                    healthStatus === 'positive' && 'text-emerald-300',
                    healthStatus === 'warning' && 'text-amber-300',
                    healthStatus === 'negative' && 'text-pink-300'
                  )}>
                    {rigHealth}
                  </div>
                  <div className="text-3xl font-bold text-teal-400/60 mb-2">%</div>
                </div>

                {/* Organic health bar - like water level */}
                <div className="relative w-full h-4 bg-black/40 overflow-hidden rounded-full border border-teal-400/30 shadow-inner">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all duration-1000 ease-out rounded-full",
                      healthStatus === 'positive' && 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400',
                      healthStatus === 'warning' && 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400',
                      healthStatus === 'negative' && 'bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400'
                    )}
                    style={{ width: `${rigHealth}%` }}
                  >
                    {/* Gentle shimmer effect like water surface */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pond-shimmer-slow" />
                  </div>
                </div>

                <div className="mt-4 text-xs font-medium text-teal-400/80 tracking-wide flex items-center gap-2">
                  <span>{miningSessionsCount} ecosystem cycles completed</span>
                </div>
              </div>

            </div>
          </div>

          {/* Pro Status - lotus flower inspired */}
          <div className="relative bg-amber-950/85 backdrop-blur-2xl border-2 border-amber-400/40 p-8 rounded-[2rem_3rem_2.5rem_2rem] overflow-hidden transition-all duration-500 hover:border-amber-400/60 hover:shadow-[0_16px_56px_rgba(251,191,36,0.3)] animate-pond-float shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Water surface shimmer */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-amber-300/10 opacity-30" />

            <WaterRipple delay={400} />

            <div className="relative h-full flex flex-col z-10">
              <div className="text-xs font-medium tracking-wide text-amber-300/90 uppercase mb-6">
                Membership Tier
              </div>

              <div className="flex-1 flex items-center justify-center">
                {isPro ? (
                  <div className="text-center">
                    <div className="text-5xl mb-3 animate-pond-pulse-soft filter drop-shadow-[0_4px_20px_rgba(251,191,36,0.8)]">✨</div>
                    <div className="text-2xl font-bold text-amber-300 tracking-wide mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                      PRO
                    </div>
                    <div className="text-xs font-medium text-amber-400/80 flex items-center justify-center gap-2">
                      <DewdropGlow color="amber" size="sm" />
                      <span>Premium Active</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-xl font-semibold text-teal-400/70 tracking-wide mb-2">
                      STANDARD
                    </div>
                    <div className="text-xs font-medium text-teal-500/60">
                      Upgrade Available
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Transaction metrics - floating lily pads */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LilyPadCard
            title="SOL Swaps"
            value={proSwapsSol.toLocaleString()}
            subtitle="Executed"
            loading={isLoading}
            status="neutral"
            icon="💜"
          />
          <LilyPadCard
            title="BX Swaps"
            value={proSwapsBx.toLocaleString()}
            subtitle="Executed"
            loading={isLoading}
            status="neutral"
            icon="🔷"
          />
          <LilyPadCard
            title="In Mempool"
            value={inMempool.toLocaleString()}
            subtitle="Pending"
            loading={isLoading}
            status="warning"
            icon="⏳"
          />
          <LilyPadCard
            title="Sent"
            value={sent.toLocaleString()}
            subtitle="Confirmed"
            loading={isLoading}
            status="positive"
            icon="✓"
          />
          <LilyPadCard
            title="Failed"
            value={failed.toLocaleString()}
            subtitle="Rejected"
            loading={isLoading}
            status={failed > 0 ? "negative" : "neutral"}
            icon="✗"
          />
          <LilyPadCard
            title="Drifted"
            value={drifted.toLocaleString()}
            subtitle="Off-target"
            loading={isLoading}
            status={drifted > 0 ? "warning" : "neutral"}
            icon="〜"
          />
          {estimatedSolUsd > 0 && (
            <LilyPadCard
              title="SOL Value"
              value={`$${estimatedSolUsd.toFixed(2)}`}
              subtitle="Market Price"
              loading={isLoading}
              status="neutral"
              icon="💰"
            />
          )}
          {maxClaimEstimateUsd > 0 && (
            <LilyPadCard
              title="Max Claim"
              value={`$${maxClaimEstimateUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              subtitle="Estimated Value"
              loading={isLoading}
              status="positive"
              icon="💎"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pond-dashboard relative min-h-screen">
      {/* Serene pond background with depth gradient */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-[#0a2f2f] via-[#0c3d3d] to-[#156565]" />

      {/* MAIN BUBBLE ANIMATION BACKGROUND - Now properly visible */}
      <div className="fixed inset-0 -z-10 opacity-50 pointer-events-none">
        <BubbleAnimation
          bubbleCount={20}
          colorScheme="mixed"
          density="normal"
          speedMultiplier={0.8}
        />
      </div>

      {/* Organic light spots creating underwater atmosphere */}
      <div className="fixed inset-0 -z-10 opacity-15 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-400 rounded-full blur-[120px] animate-pond-pulse-soft" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-emerald-400 rounded-full blur-[100px] animate-pond-pulse-soft" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-400 rounded-full blur-[80px] animate-pond-pulse-soft" style={{ animationDelay: '4s' }} />
      </div>

      {/* Content with proper spacing */}
      <div className="relative z-0 space-y-8 p-6">
        {variant !== "stats" && renderHeader()}
        {variant !== "stats" && renderTokenPrices()}
        {variant !== "tokens" && renderMiningStats()}
      </div>
    </div>
  );
}
