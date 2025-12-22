"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  PigIcon,
  SolanaIcon,
  DropletIcon,
  MoneyIcon,
  PickaxeIcon,
} from "@/components/icons";
import { TokenLogo } from "@/components/icons/tokens";
import { TokenPriceSkeleton } from "@/components/ui/TokenPriceSkeleton";
import { BubbleAnimation } from "@/components/ui/BubbleAnimation";

const BADGE_EMOJIS: Record<string, string> = {
  pork: "🐽",
  chef: "👨‍🍳",
  points: "✨",
  swap: "🤝",
  diamond: "💎",
  crown: "👑",
  explorer: "🧭",
  guardian: "🛡️",
  puzzle: "🧩",
};

const getBadgeEmoji = (badgeName: string): string => {
  const lowerBadge = badgeName.toLowerCase().trim();
  return BADGE_EMOJIS[lowerBadge] || "";
};

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
}

function SimpleStat({ title, value, subtitle, loading }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-pond-light/20 bg-pond-deep/30 backdrop-blur-lg px-4 py-3 hover:border-lily-bright/50 transition-all duration-200">
      <div className="text-[11px] uppercase tracking-[0.08em] text-text-muted mb-1">
        {title}
      </div>
      <div className="text-xl font-bold text-white">
        {loading ? "--" : value}
      </div>
      {subtitle && (
        <div className="text-[11px] text-text-secondary mt-1">
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
  const [wpondPrice, setWpondPrice] = useState(0);
  const [pndcPrice, setPndcPrice] = useState(0);
  const [porkPrice, setPorkPrice] = useState(0);
  const [solPrice, setSolPrice] = useState(0);
  const [pondSolPrice, setPondSolPrice] = useState(0);
  const [loadingPrices, setLoadingPrices] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wpondRes, pndcRes, porkRes] = await Promise.all([
          fetch('/api/wpond-price'),
          fetch('/api/pndc-stats'),
          fetch('/api/pork-stats'),
        ]);

        const safeJson = async (res: Response) => {
          if (!res.ok) return null;
          try { return await res.json(); } catch { return null; }
        };

        const [wpondData, pndcData, porkData] = await Promise.all([
          safeJson(wpondRes), safeJson(pndcRes), safeJson(porkRes)
        ]);

        setWpondPrice(wpondData?.price || 0);
        setPndcPrice(pndcData?.price || 0);
        setPorkPrice(porkData?.price || 0);

        // Fetch SOL price from CoinGecko
        try {
          const solPriceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
          const solPriceData = await safeJson(solPriceRes);
          setSolPrice(solPriceData?.solana?.usd || 0);
        } catch {
          // Fallback: try to get from DexScreener SOL/USDC pair
          try {
            const dexRes = await fetch('https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112');
            const dexData = await safeJson(dexRes);
            const solPair = dexData?.pairs?.[0];
            setSolPrice(parseFloat(solPair?.priceUsd || '0'));
          } catch {
            // Silent fail - SOL price will show as 0
          }
        }

        // Fetch pondSOL price from DexScreener (if mint address is available)
        // Update this mint address with the actual pondSOL token mint
        const PONDSOL_MINT = 'pondSoL1111111111111111111111111111111111111'; // Replace with actual mint
        try {
          const pondSolRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${PONDSOL_MINT}`);
          const pondSolData = await safeJson(pondSolRes);
          const pondSolPair = pondSolData?.pairs?.[0];
          setPondSolPrice(parseFloat(pondSolPair?.priceUsd || '0'));
        } catch {
          // Silent fail - pondSOL price will show as 0
          setPondSolPrice(0);
        }
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toFixed(4)}`;
    if (price >= 0.01) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(8)}`;
  };

  const renderHeader = () => (
    <div className="relative bg-gradient-to-br from-black/30 via-pond-deep/30 to-black/30 backdrop-blur-xl border-2 border-pond-bright/40 rounded-2xl p-6 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      {/* Pond Water Animation */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Pond Water SVG Bubbles */}
        <BubbleAnimation
          bubbleCount={6}
          colorScheme="mixed"
          density="sparse"

        />
      </div>
      <div className="relative z-10">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full bg-lily-green/20 border-2 border-gold flex items-center justify-center shadow-[0_0_20px_var(--glow-green)] animate-pulse">
              <img className="w-10 h-10 rounded-full" alt="Pond" src="/tokens/solana/wpond.png" />
              <div className="absolute -right-1 -bottom-1 text-lg bg-black/30 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center">
                👑
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-lily-bright via-gold to-lily-bright bg-clip-text text-transparent">
                POND0X OVERVIEW
              </h2>
              <p className="text-sm text-text-secondary">Mining Dashboard</p>
            </div>
          </div>

        </div>

        {badges && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {badges.split(", ").map((badge) => {
              const emoji = getBadgeEmoji(badge);
              return (
                <span
                  key={badge}
                  className="px-3 py-1 bg-black/100 border border-gold-light/40 rounded-lg text-xs text-gold-light font-semibold flex items-center gap-1.5 shadow-[0_0_10px_var(--glow-gold)]"
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
  );

  const renderTokenPrices = () => (
    <div className="mt-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-10 h-10 rounded-full bg-lily-green/20 border-1 border-lily-bright flex items-center justify-center shadow-[0_0_20px_var(--glow-gold)]">
          <img className="w-8 h-8 rounded-full" alt="Pond" src="./leaf1.png" />
          <div className="absolute -right-2 -bottom-1 text-lg bg-black/30 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center">
            🪙
          </div>
        </div>
        <h3 className="text-lg font-bold text-gold mb-3 flex items-center gap-3">
          <span>Token Prices</span>
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {loadingPrices ? (
          <>
            <TokenPriceSkeleton borderColor="border-lily-green/40" />
            <TokenPriceSkeleton borderColor="border-lily-green/40" />
            <TokenPriceSkeleton borderColor="border-lily-green/40" />
            <TokenPriceSkeleton borderColor="border-purple-400/40" />
            <TokenPriceSkeleton borderColor="border-green-500/40" />
          </>
        ) : (
          <>

            <div className={cn("relative bg-pond-water/30 backdrop-blur-xl border-2 rounded-xl p-4 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.3)]", "border-lily-green/40 hover:border-pink-bright hover:shadow-[0_0_20px_var(--glow-pink)]", "hover:scale-105")}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white uppercase tracking-wide">$PORK</span>
                <div className="flex items-center justify-center w-10 h-10">
                  <TokenLogo symbol="PORK" size={40} fallback={<PigIcon className="text-pink-bright" size={38} />} />
                </div>
              </div>
              <div className="text-2xl font-bold text-pink-bright mb-1">{formatPrice(porkPrice)}</div>
              <div className="text-xs text-text-secondary opacity-70">PORK</div>
            </div>

            <div className={cn("relative bg-pond-water/30 backdrop-blur-xl border-2 rounded-xl p-4 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.3)]", "border-lily-green/40 hover:border-pond-bright hover:shadow-[0_0_20px_var(--glow-blue)]", "hover:scale-105")}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white uppercase tracking-wide">$PNDC</span>
                <div className="relative w-10 h-10">
                  <img className="w-full h-full rounded-full" alt="Pond" src="/tokens/solana/pndc.png" />
                </div>
              </div>
              <div className="text-2xl font-bold text-lily-bright mb-1">{formatPrice(pndcPrice)}</div>
              <div className="text-xs text-text-secondary opacity-70">POND COIN</div>
            </div>

            <div className={cn("relative bg-pond-water/30 backdrop-blur-xl border-2 rounded-xl p-4 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.3)]", "border-lily-green/40 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]", "hover:scale-105")}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white uppercase tracking-wide">$SOL</span>
                <div className="relative w-10 h-10">
                  <img className="w-full h-full rounded-full" alt="Solana" src="/tokens/solana/sol.png" />
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-500 mb-1">{formatPrice(solPrice)}</div>
              <div className="text-xs text-text-secondary opacity-70">SOLANA</div>
            </div>

            <div className={cn("relative bg-pond-water/40 backdrop-blur-xl border-2 rounded-xl p-4 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.3)]", "border-lily-green/40 hover:border-lily-bright hover:shadow-[0_0_20px_var(--glow-green)]", "hover:scale-105")}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white uppercase tracking-wide">$wPOND</span>
                <div className="relative w-10 h-10">
                  <img className="w-full h-full rounded-full" alt="Pond" src="/tokens/solana/wpond.png" />
                  <div className="absolute -right-1 -bottom-1 text-base bg-black/20 backdrop-blur-sm rounded-full w-5 h-5 flex items-center justify-center">⚡</div>
                </div>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-lily-bright via-gold to-lily-bright bg-clip-text text-transparent mb-1">{formatPrice(wpondPrice)}</div>
              <div className="text-xs text-text-secondary opacity-70">POND COIN - WARPED</div>
            </div>

            <div className={cn("relative bg-pond-water/30 backdrop-blur-xl border-2 rounded-xl p-4 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.3)]", "border-lily-green/40 hover:border-green-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]", "hover:scale-105")}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white uppercase tracking-wide">$pondSOL</span>
                <div className="relative w-10 h-10">
                  <img className="w-full h-full rounded-full" alt="PondSOL" src="/tokens/solana/pondSOL.png" />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-500 mb-1">{formatPrice(pondSolPrice)}</div>
              <div className="text-xs text-text-secondary opacity-70">pondSOL</div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderMiningStats = () => (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <div className="relative w-10 h-10 rounded-full bg-lily-green/20 border-0 border-lily-bright flex items-center justify-center shadow-[0_0_20px_var(--glow-gold)]">
          <img className="w-8 h-8 rounded-full" alt="Pond" src="./leaf1.png" />
          <div className="absolute -right-2 -bottom-1 text-lg bg-black/30 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center">
            ⛏️
          </div>
        </div>
        <h3 className="text-lg font-bold text-gold mb-3 flex items-center gap-2">
          <span>Mining Rig & Swap Stats</span>
        </h3>
      </div>

      <div className="relative bg-pond-water/30 backdrop-blur-xl border-2 border-lily-green/20 rounded-2xl p-6 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-pond-deep/60 to-pond-deep/60 backdrop-blur-lg rounded-lg p-4 border border-lily-green/20 hover:border-lily-bright/50 transition-all duration-300 hover:shadow-[0_0_15px_var(--glow-green)]">
            <div className="text-xs text-text-muted uppercase tracking-wide mb-1 flex items-center gap-1">
              <span className="text-sx">❤️</span>
              Mining Rig Health
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-2xl font-bold text-emerald-400">{rigHealth}%</div>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${rigHealth}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-pond-deep/60 to-pond-deep/60 backdrop-blur-lg rounded-lg p-4 border border-gold/20 hover:border-gold-light/50 transition-all duration-300 hover:shadow-[0_0_15px_var(--glow-gold)]">
            <div className="text-xs text-text-muted uppercase tracking-wide mb-1">⭐ Pro Status</div>
            <div className="text-2xl font-bold">
              {isPro ? (
                <span className="text-gold-light flex items-center gap-2">⭐ PRO</span>
              ) : (
                <span className="text-text-secondary">Standard</span>
              )}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              {isPro ? "Premium features enabled" : "Upgrade for benefits"}
            </div>
          </div>

          <div className="bg-gradient-to-br from-pond-deep/60 to-pond-deep/60 backdrop-blur-lg rounded-lg p-4 border border-pond-light/20 hover:border-pond-bright/50 transition-all duration-300 hover:shadow-[0_0_15px_var(--glow-blue)]">
            <div className="text-xs text-text-muted uppercase tracking-wide mb-1">⛏️ Mining Sessions</div>
            <div className="text-2xl font-bold text-pond-bright">{miningSessionsCount}</div>
            <div className="text-xs text-text-secondary mt-1">Total sessions completed</div>
          </div>
        </div>

        {/* Swap metrics inside mining section */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <SimpleStat title="🤝 SOL Swaps" value={proSwapsSol.toLocaleString()} subtitle="Count swaps executed" loading={isLoading} />
          <SimpleStat title="BX Swaps" value={proSwapsBx.toLocaleString()} subtitle="Bx token swaps" loading={isLoading} />
          <SimpleStat title="In Mempool" value={inMempool.toLocaleString()} subtitle="Queued mining rewards" loading={isLoading} />
          <SimpleStat title="Sent" value={sent.toLocaleString()} subtitle="Received mining rewards" loading={isLoading} />
          <SimpleStat title="Failed" value={failed.toLocaleString()} subtitle="Failed mining rewards" loading={isLoading} />
          <SimpleStat title="Drifted" value={drifted.toLocaleString()} subtitle="Drifted mining rewards" loading={isLoading} />
          {estimatedSolUsd > 0 && (
            <SimpleStat
              title="SOL Price"
              value={`$${estimatedSolUsd.toFixed(2)}`}
              subtitle="Current market price"
              loading={isLoading}
            />
          )}
          {maxClaimEstimateUsd > 0 && (
            <SimpleStat
              title="💰 Max Claim Estimate"
              value={`$${maxClaimEstimateUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              subtitle="Potential reward value"
              loading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {variant !== "stats" && renderHeader()}
      {variant !== "stats" && renderTokenPrices()}
      {variant !== "tokens" && renderMiningStats()}
    </div>
  );
}
