"use client";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Badge emoji mapping
const BADGE_EMOJIS: Record<string, string> = {
  pork: "🐽",
  chef: "🧑‍🍳",
  points: "✨",
  swap: "🤝",
};

// Helper function to get badge emoji
const getBadgeEmoji = (badgeName: string): string => {
  const lowerBadge = badgeName.toLowerCase().trim();
  return BADGE_EMOJIS[lowerBadge] || "";
};

interface CompactPond0xDashboardProps {
  proSwapsSol: number;
  proSwapsBx: number;
  onOpenSwapper?: () => void;
  // Mining rig stats
  totalBoosts?: number;
  isPro?: boolean;
  miningSessionsCount?: number;
  isLoading?: boolean;
  onFetchRigData?: () => void;
  // Additional mining data
  badges?: string;
  estimatedSolUsd?: number;
  maxClaimEstimateUsd?: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  subtitle?: string;
  loading?: boolean;
  color?: "green" | "blue" | "gold" | "pink";
  chain?: "solana" | "ethereum";
}

function MetricCard({ title, value, icon, subtitle, loading, color = "green", chain }: MetricCardProps) {
  const colorClasses = {
    green: "border-lily-green hover:border-lily-bright hover:shadow-[0_0_20px_var(--glow-green)]",
    blue: "border-pond-light hover:border-pond-bright hover:shadow-[0_0_20px_var(--glow-blue)]",
    gold: "border-gold hover:border-gold-light hover:shadow-[0_0_20px_var(--glow-gold)]",
    pink: "border-pink-soft hover:border-pink-bright hover:shadow-[0_0_20px_var(--glow-pink)]",
  };

  const chainBadgeClasses = {
    solana: "bg-gradient-to-r from-purple-500/20 to-green-500/20 border-purple-500/40 text-purple-300",
    ethereum: "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-blue-300",
  };

  return (
    <div className={cn(
      "relative bg-pond-water/90 backdrop-blur-md",
      "border-2 rounded-xl p-4",
      "transition-all duration-300",
      "shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
      colorClasses[color],
      "hover:scale-105"
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            {title}
          </span>
          {chain && (
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border w-fit",
              chainBadgeClasses[chain]
            )}>
              {chain === "solana" ? "◎ SOL" : "⟠ ETH"}
            </span>
          )}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
      {loading ? (
        <div className="h-8 bg-pond-deep/50 rounded animate-pulse"></div>
      ) : (
        <div className="text-2xl font-bold text-white mb-1">
          {value}
        </div>
      )}
      {subtitle && (
        <div className="text-xs text-text-secondary opacity-70">
          {subtitle}
        </div>
      )}
    </div>
  );
}

export function CompactPond0xDashboard({
  proSwapsSol,
  proSwapsBx,
  onOpenSwapper,
  totalBoosts = 0,
  isPro = false,
  miningSessionsCount = 0,
  isLoading = false,
  onFetchRigData,
  badges = "",
  estimatedSolUsd = 0,
  maxClaimEstimateUsd = 0,
}: CompactPond0xDashboardProps) {
  const [wpondPrice, setWpondPrice] = useState(0);
  const [pndcPrice, setPndcPrice] = useState(0);
  const [porkPrice, setPorkPrice] = useState(0);
  const [vaultBalance, setVaultBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wpondRes, pndcRes, porkRes, vaultRes] = await Promise.all([
          fetch('/api/wpond-price'),
          fetch('/api/pndc-stats'),
          fetch('/api/pork-stats'),
          fetch('/api/vault-balance'),
        ]);

        // Helper function to safely parse JSON responses
        const safeJsonParse = async (response: Response, apiName: string) => {
          if (!response.ok) {
            console.warn(`${apiName} returned ${response.status}: ${response.statusText}`);
            return null;
          }
          try {
            return await response.json();
          } catch (error) {
            console.warn(`${apiName} returned invalid JSON:`, error);
            return null;
          }
        };

        const [wpondData, pndcData, porkData, vaultData] = await Promise.all([
          safeJsonParse(wpondRes, 'wpond-price'),
          safeJsonParse(pndcRes, 'pndc-stats'),
          safeJsonParse(porkRes, 'pork-stats'),
          safeJsonParse(vaultRes, 'vault-balance'),
        ]);

        setWpondPrice(wpondData?.price || 0);
        setPndcPrice(pndcData?.price || 0);
        setPorkPrice(porkData?.price || 0);
        setVaultBalance(vaultData?.balance || 0);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update time on client side only to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };

    updateTime(); // Set initial time
    const interval = setInterval(updateTime, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toFixed(4)}`;
    if (price >= 0.01) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(8)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-pond-water/95 via-pond-deep/90 to-pond-water/95 backdrop-blur-md border-2 border-lily-green rounded-2xl p-6 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
        {/* Floating sparkles */}
        <div className="sparkle-container">
          <div className="sparkle"></div>
          <div className="sparkle"></div>
          <div className="sparkle"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-lily-green/20 border-2 border-lily-bright flex items-center justify-center text-3xl shadow-[0_0_20px_var(--glow-green)] animate-pulse">
                🐸
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-lily-bright via-gold-light to-lily-bright bg-clip-text text-transparent">
                  POND0X OVERVIEW
                </h2>
                <p className="text-sm text-text-secondary">Mystical Mining Dashboard</p>
              </div>
            </div>
            <div className="enchantment-dot"></div>
          </div>

          {/* Badges */}
          {badges && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {badges.split(", ").map((badge) => {
                const emoji = getBadgeEmoji(badge);
                return (
                  <span
                    key={badge}
                    className="px-3 py-1 bg-gold/20 border border-gold-light/40 rounded-lg text-xs text-gold-light font-semibold flex items-center gap-1.5 shadow-[0_0_10px_var(--glow-gold)]"
                  >
                    {emoji && <span className="text-base">{emoji}</span>}
                    <span>{badge}</span>
                  </span>
                );
              })}
              {isPro && (
                <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-lg text-xs text-purple-300 font-semibold shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                  ⭐ PRO
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Token Prices - TOP SECTION with Chain Indicators */}
      <div>
        <h3 className="text-lg font-bold text-lily-bright mb-3 flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <span>Token Prices</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="$wPOND"
            value={formatPrice(wpondPrice)}
            icon="🌊"
            subtitle="Wrapped Pond"
            loading={loading}
            color="green"
            chain="solana"
          />
          <MetricCard
            title="$PNDC"
            value={formatPrice(pndcPrice)}
            icon="💎"
            subtitle="Pond Crystal"
            loading={loading}
            color="pink"
            chain="ethereum"
          />
          <MetricCard
            title="$PORK"
            value={formatPrice(porkPrice)}
            icon="🐷"
            subtitle="Pork Token"
            loading={loading}
            color="pink"
            chain="ethereum"
          />
        </div>
      </div>

      {/* Main Metrics - Compact 3-column grid */}
      <div>
        <h3 className="text-lg font-bold text-lily-bright mb-3 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <span>Swap Statistics</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="SOL SWAPS"
            value={proSwapsSol.toLocaleString()}
            icon="◎"
            subtitle="Solana swaps executed"
            color="green"
            chain="solana"
          />
          <MetricCard
            title="BX SWAPS"
            value={proSwapsBx.toLocaleString()}
            icon="💧"
            subtitle="Bx token swaps"
            color="blue"
            chain="solana"
          />
          <MetricCard
            title="TOTAL BOOSTED"
            value={`${vaultBalance.toFixed(2)} SOL`}
            icon="🚀"
            subtitle="Vault: 4ngq...sU36"
            loading={loading}
            color="gold"
            chain="solana"
          />
        </div>
      </div>

      {/* Mining Rig Stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-lily-bright flex items-center gap-2">
            <span className="text-2xl">⛏️</span>
            <span>Mining Rig Stats</span>
          </h3>
          {onFetchRigData && (
            <button
              onClick={onFetchRigData}
              disabled={isLoading}
              className={cn(
                "px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300",
                "bg-lily-green/20 border-2 border-lily-green text-lily-bright",
                "hover:bg-lily-green/30 hover:border-lily-bright hover:shadow-[0_0_20px_var(--glow-green)]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isLoading && "animate-pulse"
              )}
            >
              {isLoading ? "⏳ Loading..." : "🔄 Fetch Data"}
            </button>
          )}
        </div>

        {/* SOL Price & Max Claim Estimate - TOP */}
        {(estimatedSolUsd > 0 || maxClaimEstimateUsd > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gradient-to-br from-gold/20 to-gold-light/10 backdrop-blur-md border-2 border-gold/40 rounded-xl p-4 shadow-[0_0_20px_var(--glow-gold)] hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1">
                  <span className="text-sm">◎</span>
                  SOL Price
                </div>
                <span className="text-2xl">💰</span>
              </div>
              {isLoading ? (
                <div className="h-8 bg-pond-deep/50 rounded animate-pulse"></div>
              ) : (
                <div className="text-3xl font-bold text-gold-light">
                  ${estimatedSolUsd.toFixed(2)}
                </div>
              )}
              <div className="text-xs text-text-secondary mt-1">Current market price</div>
            </div>

            <div className="bg-gradient-to-br from-pink-soft/20 to-pink-bright/10 backdrop-blur-md border-2 border-pink-soft/40 rounded-xl p-4 shadow-[0_0_20px_var(--glow-pink)] hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Max Claim Estimate
                </div>
                <span className="text-2xl">💎</span>
              </div>
              {isLoading ? (
                <div className="h-8 bg-pond-deep/50 rounded animate-pulse"></div>
              ) : (
                <div className="text-3xl font-bold text-pink-bright">
                  ${maxClaimEstimateUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              )}
              <div className="text-xs text-text-secondary mt-1">Potential reward value</div>
            </div>
          </div>
        )}

        <div className="relative bg-pond-water/90 backdrop-blur-md border-2 border-lily-green/30 rounded-2xl p-6 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-pond-deep/70 to-pond-deep/50 rounded-lg p-4 border border-lily-green/30 hover:border-lily-bright/50 transition-all duration-300 hover:shadow-[0_0_15px_var(--glow-green)]">
              <div className="text-xs text-text-muted uppercase tracking-wide mb-1 flex items-center gap-1">
                <span className="text-sm">◎</span>
                Total SOL Boosted
              </div>
              <div className="text-2xl font-bold text-lily-bright">{totalBoosts.toFixed(4)} SOL</div>
              <div className="text-xs text-text-secondary mt-1">Hash Booster Contract</div>
            </div>

            <div className="bg-gradient-to-br from-pond-deep/70 to-pond-deep/50 rounded-lg p-4 border border-gold/30 hover:border-gold-light/50 transition-all duration-300 hover:shadow-[0_0_15px_var(--glow-gold)]">
              <div className="text-xs text-text-muted uppercase tracking-wide mb-1">Pro Status</div>
              <div className="text-2xl font-bold">
                {isPro ? (
                  <span className="text-gold-light flex items-center gap-2">
                    ⭐ PRO
                  </span>
                ) : (
                  <span className="text-text-secondary">Standard</span>
                )}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {isPro ? "Premium features enabled" : "Upgrade for benefits"}
              </div>
            </div>

            <div className="bg-gradient-to-br from-pond-deep/70 to-pond-deep/50 rounded-lg p-4 border border-pond-light/30 hover:border-pond-bright/50 transition-all duration-300 hover:shadow-[0_0_15px_var(--glow-blue)]">
              <div className="text-xs text-text-muted uppercase tracking-wide mb-1">Mining Sessions</div>
              <div className="text-2xl font-bold text-pond-bright">{miningSessionsCount}</div>
              <div className="text-xs text-text-secondary mt-1">Total sessions completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {onOpenSwapper && (
        <div className="relative bg-pond-water/90 backdrop-blur-md border-2 border-gold rounded-2xl p-6 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:border-pink-bright hover:shadow-[0_12px_32px_var(--glow-pink)] transition-all duration-300">
          <div className="relative z-10 text-center">
            <button
              onClick={onOpenSwapper}
              className="ethereal-button w-full"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>🚀</span>
                <span>ACTIVATE SWAPPER</span>
                <span>🚀</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Footer Status */}
      <div className="flex items-center justify-between text-xs text-text-muted px-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-lily-bright shadow-[0_0_8px_var(--glow-green)]"></div>
            <span>Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pond-bright shadow-[0_0_8px_var(--glow-blue)]"></div>
            <span>Live</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-bright shadow-[0_0_8px_var(--glow-pink)]"></div>
            <span>Auto-refresh</span>
          </div>
        </div>
        <span>{currentTime || "--:--:--"}</span>
      </div>
    </div>
  );
}
