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
import { TOKEN_ICONS } from "@/lib/tokenIcons";
import { getBadgeEmoji } from "@/lib/badges";
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

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  loading?: boolean;
  status?: 'positive' | 'negative' | 'warning' | 'neutral';
  icon?: string;
}

/**
 * WaterRipple - Animated water ripple effect component
 * Creates concentric circles that expand outward like ripples on pond water
 */
function WaterRipple({ delay = 0 }: { delay?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full border border-teal-400/20 animate-pond-ripple"
        style={{ animationDelay: `${delay}ms` }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full border border-teal-400/15 animate-pond-ripple"
        style={{ animationDelay: `${delay + 600}ms` }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full border border-teal-400/10 animate-pond-ripple"
        style={{ animationDelay: `${delay + 1200}ms` }}
      />
    </div>
  );
}

/**
 * DewdropGlow - Decorative dewdrop accent with soft glow
 * Adds bioluminescent effect to important metrics
 */
function DewdropGlow({ color = "teal", size = "sm" }: { color?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colorClasses = {
    teal: 'bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.6)]',
    green: 'bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]',
    pink: 'bg-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.6)]',
    amber: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]',
  };

  return (
    <div className={cn(
      "rounded-full animate-pond-pulse-soft",
      sizeClasses[size],
      colorClasses[color as keyof typeof colorClasses] || colorClasses.teal
    )} />
  );
}

/**
 * LiveIndicator - Gentle pulsing indicator for real-time data
 * Styled like a bioluminescent organism in pond water
 */
function LiveIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pond-pulse-soft shadow-[0_0_10px_rgba(74,222,128,0.6)]" />
        <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-400/40 rounded-full animate-pond-ping-slow" />
      </div>
      <span className="text-[10px] font-medium tracking-wide text-emerald-300/90">Live</span>
    </div>
  );
}

/**
 * LilyPadCard - Organic lily pad shaped card for displaying metrics
 * Features soft rounded edges, DARK glass-morphic surface with strong blur, and hover ripple effects
 */
function LilyPadCard({ title, value, subtitle, loading, status = 'neutral', icon }: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusColors = {
    positive: 'bg-emerald-950/80 border-emerald-400/40 hover:border-emerald-400/60',
    negative: 'bg-rose-950/80 border-pink-400/40 hover:border-pink-400/60',
    warning: 'bg-amber-950/80 border-amber-400/40 hover:border-amber-400/60',
    neutral: 'bg-slate-950/80 border-teal-400/30 hover:border-teal-400/50'
  };

  const valueColors = {
    positive: 'text-emerald-300',
    negative: 'text-pink-300',
    warning: 'text-amber-300',
    neutral: 'text-cyan-200'
  };

  const glowColors = {
    positive: 'green',
    negative: 'pink',
    warning: 'amber',
    neutral: 'teal'
  };

  return (
    <div
      className={cn(
        "relative backdrop-blur-xl border-2 transition-all duration-500 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        "rounded-[2rem_3rem_2.5rem_2rem]", // Organic lily pad shape
        "hover:shadow-[0_12px_48px_rgba(45,212,191,0.2)]",
        "animate-pond-float",
        statusColors[status]
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dark overlay for stronger glass effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />

      {/* Water surface shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-30" />

      {/* Gentle wave pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(45,212,191,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(74,222,128,0.15)_0%,transparent_50%)]" />
      </div>

      {/* Ripple effect on hover */}
      {isHovered && <WaterRipple />}

      <div className="relative p-5 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-medium tracking-wide text-teal-300/90 uppercase">
            {title}
          </div>
          {icon && <span className="text-lg opacity-80">{icon}</span>}
        </div>

        <div className={cn(
          "text-3xl font-semibold tabular-nums tracking-tight mb-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]",
          valueColors[status]
        )}>
          {loading ? (
            <span className="inline-block animate-pulse">--</span>
          ) : (
            value
          )}
        </div>

        {subtitle && (
          <div className="text-[10px] text-teal-400/70 tracking-wide">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

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
  const {
    wpondPrice,
    pndcPrice,
    porkPrice,
    solPrice,
    ethPrice,
    pondSolPrice,
    loading: loadingPrices,
  } = useTokenPrices();

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
   * Format price based on magnitude for optimal readability
   */
  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toFixed(4)}`;
    if (price >= 0.01) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(8)}`;
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
    <div className="space-y-6">
      {/* Main Header Card */}
      <div className="relative bg-gradient-to-br from-slate-950/90 via-teal-950/85 to-cyan-950/90 backdrop-blur-2xl rounded-[3rem_2rem_3rem_2.5rem] border-2 border-teal-400/30 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {/* Dark overlay for depth */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Enhanced bubble animation for pond atmosphere */}
        <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
          <BubbleAnimation
            bubbleCount={12}
            colorScheme="mixed"
            density="normal"
          />
        </div>

        {/* Underwater light rays */}
        <div className="absolute inset-0 overflow-hidden opacity-15 z-0">
          <div className="absolute top-0 left-1/4 w-32 h-full bg-gradient-to-b from-cyan-300/40 to-transparent rotate-12 blur-2xl animate-pond-sway" />
          <div className="absolute top-0 right-1/3 w-24 h-full bg-gradient-to-b from-teal-300/30 to-transparent -rotate-6 blur-2xl animate-pond-sway-delayed" />
        </div>

        {/* Gentle water surface shimmer */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-300/10 animate-pond-shimmer-slow z-0" />

        <div className="relative z-10 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-5">
              {/* Logo with lily pad inspired glow */}
              <div className="relative animate-pond-float">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400/30 via-teal-400/25 to-cyan-400/30 border-2 border-emerald-400/50 flex items-center justify-center shadow-[0_0_40px_rgba(74,222,128,0.5)] backdrop-blur-sm">
                  <TokenIcon
                    info={{
                      symbol: 'wPOND',
                      icon: '/tokens/solana/wpond.png',
                      name: 'wPOND',
                    }}
                    width={64}
                    height={64}
                    enableUnknownTokenWarning={false}
                  />
                </div>
                {isPro && (
                  <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center border-2 border-slate-950 text-sm shadow-[0_0_20px_rgba(251,191,36,0.7)] animate-pond-pulse-soft">
                    ✨
                  </div>
                )}
                {/* Dewdrop accents around logo */}
                <div className="absolute -top-2 left-4">
                  <DewdropGlow color="teal" size="sm" />
                </div>
                <div className="absolute -bottom-1 -right-2">
                  <DewdropGlow color="green" size="sm" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-bold tracking-wide text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]">
                    POND0X
                  </h1>
                  <LiveIndicator />
                </div>
                <p className="text-sm font-medium text-teal-200/90 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  Ecosystem Dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Badge collection - lotus petal inspired */}
          {badges && (
            <div className="flex flex-wrap items-center gap-3">
              {badges.split(", ").map((badge) => {
                const emoji = getBadgeEmoji(badge);
                return (
                  <div
                    key={badge}
                    className="px-4 py-2 bg-teal-950/70 backdrop-blur-xl border border-amber-400/50 rounded-full font-medium text-xs text-amber-200 flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-amber-400/70 hover:shadow-[0_6px_30px_rgba(251,191,36,0.3)] transition-all animate-pond-float"
                  >
                    {emoji && <span className="text-base">{emoji}</span>}
                    <span className="tracking-wide">{badge}</span>
                  </div>
                );
              })}

              {isPro && (
                <div className="px-4 py-2 bg-gradient-to-r from-amber-900/60 to-yellow-900/60 backdrop-blur-xl border border-amber-400/60 rounded-full font-semibold text-xs text-amber-100 flex items-center gap-2 shadow-[0_4px_24px_rgba(0,0,0,0.5)] animate-pond-float">
                  <span className="text-base">✨</span>
                  <span className="tracking-wide">PRO MEMBER</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Wallet Connection Bar - Integrated below header */}
      {renderWalletBar()}
    </div>
  );

  /**
   * Token prices displayed on lily pad cards with organic layout
   */
  const renderTokenPrices = () => {
    const solanaTokens = [
      { symbol: 'SOL', price: solPrice, icon: TOKEN_ICONS.SOL, featured: true },
      { symbol: 'wPOND', price: wpondPrice, icon: TOKEN_ICONS.wPOND, featured: true },
      { symbol: 'pondSOL', price: pondSolPrice, icon: TOKEN_ICONS.pondSOL, featured: false },
    ];

    const ethereumTokens = [
      { symbol: 'ETH', price: ethPrice, icon: TOKEN_ICONS.ETH, featured: true },
      { symbol: 'PNDC', price: pndcPrice, icon: TOKEN_ICONS.PNDC, featured: true },
      { symbol: 'PORK', price: porkPrice, icon: TOKEN_ICONS.PORK, featured: false },
    ];

    /**
     * Token row with gentle hover effects and water ripples
     */
    const TokenRow = ({ token }: { token: typeof solanaTokens[0] }) => {
      const [isHovered, setIsHovered] = useState(false);

      return (
        <div
          className="group relative flex items-center justify-between px-5 py-4 border-b border-teal-400/10 hover:bg-teal-400/10 transition-all duration-300 rounded-2xl"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Gentle glow on hover */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-full blur-sm" />

          {isHovered && (
            <div className="absolute inset-0 pointer-events-none">
              <WaterRipple delay={0} />
            </div>
          )}

          <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
            <div className="relative flex-shrink-0 w-11 h-11 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full ring-2 ring-teal-400/40 group-hover:ring-emerald-400/60 transition-all" />
              <TokenIcon
                info={{
                  symbol: token.symbol,
                  icon: token.icon,
                  name: token.symbol,
                }}
                width={44}
                height={44}
                enableUnknownTokenWarning={false}
              />
            </div>
            <span className={cn(
              "font-semibold text-base tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]",
              token.featured ? "text-cyan-100" : "text-teal-200"
            )}>
              {token.symbol}
            </span>
          </div>

          <div className={cn(
            "text-lg font-semibold tabular-nums tracking-tight relative z-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]",
            token.price > 0 ? "text-emerald-300" : "text-teal-500"
          )}>
            {loadingPrices ? (
              <span className="animate-pulse">---</span>
            ) : (
              formatPrice(token.price)
            )}
          </div>
        </div>
      );
    };

    /**
     * Chain section with dark water surface aesthetic and strong backdrop blur
     */
    const ChainSection = ({
      title,
      tokens,
      chainColor,
      chainIcon
    }: {
      title: string;
      tokens: typeof solanaTokens;
      chainColor: string;
      chainIcon: string;
    }) => (
      <div className="relative bg-slate-950/85 backdrop-blur-2xl border-2 border-teal-400/30 overflow-hidden rounded-[2.5rem_3rem_2rem_2.5rem] shadow-[0_12px_48px_rgba(0,0,0,0.5)] animate-pond-float">
        {/* Dark overlay for glass morphism */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />

        {/* Water surface shimmer */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-cyan-300/5 opacity-30" />

        {/* Gentle wave pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(74,222,128,0.2)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(45,212,191,0.2)_0%,transparent_50%)]" />
        </div>

        {/* Header - lotus petal inspired */}
        <div className={cn("relative px-6 py-4 border-b-2 z-10", chainColor, "bg-gradient-to-r from-teal-950/60 to-transparent backdrop-blur-sm")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl filter drop-shadow-[0_2px_12px_rgba(74,222,128,0.6)]">{chainIcon}</span>
              <h3 className="font-semibold text-base tracking-wide text-cyan-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                {title}
              </h3>
            </div>
            <LiveIndicator />
          </div>
        </div>

        {/* Token list */}
        <div className="relative p-2 z-10">
          {loadingPrices ? (
            <div className="px-4 py-12 text-center">
              <div className="inline-block">
                <div className="w-10 h-10 rounded-full border-3 border-teal-400/30 border-t-emerald-400 animate-spin" />
              </div>
              <p className="mt-4 text-xs font-medium text-teal-400/80 tracking-wide">
                Loading pond data...
              </p>
            </div>
          ) : tokens.length === 0 ? (
            <div className="px-4 py-12 text-center text-teal-400/60 font-medium text-sm tracking-wide">
              No tokens in pond
            </div>
          ) : (
            tokens.map((token) => <TokenRow key={token.symbol} token={token} />)
          )}
        </div>

      </div>
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="font-semibold text-xl tracking-wide text-teal-100 flex items-center gap-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            <span className="text-2xl">🪷</span>
            <span>Market Waters</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChainSection
            title="Solana Pond"
            tokens={solanaTokens}
            chainColor="border-purple-400/40"
            chainIcon="💜"
          />
          <ChainSection
            title="Ethereum Pond"
            tokens={ethereumTokens}
            chainColor="border-blue-400/40"
            chainIcon="💙"
          />
        </div>
      </div>
    );
  };

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
