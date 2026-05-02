"use client";
/**
 * CompactPond0xDashboard — pond-water themed dashboard composer.
 *
 * This component is intentionally thin: it composes the section panels
 * (DashboardHeader, TokenPricesPanel, MiningStatsPanel) and the WalletBar
 * with a shared pond-water background. UI primitives live in components/ui/
 * and section panels in components/swapper/sections/.
 */
import React from "react";
import { BubbleAnimation } from "@/components/ui/BubbleAnimation";
import { DashboardHeader } from "@/components/swapper/sections/DashboardHeader";
import { TokenPricesPanel } from "@/components/swapper/sections/TokenPricesPanel";
import { MiningStatsPanel } from "@/components/swapper/sections/MiningStatsPanel";
import { WalletBar } from "@/components/wallet/WalletBar";
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

export function CompactPond0xDashboard({
  proSwapsSol,
  proSwapsBx,
  variant = "full",
  rigHealth = 0,
  isPro = false,
  miningSessionsCount = 0,
  isLoading = false,
  badges = "",
  estimatedSolUsd = 0,
  maxClaimEstimateUsd = 0,
  inMempool = 0,
  sent = 0,
  failed = 0,
  drifted = 0,
}: CompactPond0xDashboardProps) {
  const prices = useTokenPrices();

  return (
    <div className="pond-dashboard relative min-h-screen">
      {/* Pond background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-[#0a2f2f] via-[#0c3d3d] to-[#156565]" />

      <div className="fixed inset-0 -z-10 opacity-50 pointer-events-none">
        <BubbleAnimation bubbleCount={20} colorScheme="mixed" density="normal" speedMultiplier={0.8} />
      </div>

      <div className="fixed inset-0 -z-10 opacity-15 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-400 rounded-full blur-[120px] animate-pond-pulse-soft" />
        <div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-emerald-400 rounded-full blur-[100px] animate-pond-pulse-soft"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-400 rounded-full blur-[80px] animate-pond-pulse-soft"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="relative z-0 space-y-8 p-6">
        {variant !== "stats" && (
          <DashboardHeader badges={badges} isPro={isPro} walletSlot={<WalletBar />} />
        )}
        {variant !== "stats" && <TokenPricesPanel prices={prices} />}
        {variant !== "tokens" && (
          <MiningStatsPanel
            rigHealth={rigHealth}
            miningSessionsCount={miningSessionsCount}
            isPro={isPro}
            isLoading={isLoading}
            proSwapsSol={proSwapsSol}
            proSwapsBx={proSwapsBx}
            inMempool={inMempool}
            sent={sent}
            failed={failed}
            drifted={drifted}
            estimatedSolUsd={estimatedSolUsd}
            maxClaimEstimateUsd={maxClaimEstimateUsd}
          />
        )}
      </div>
    </div>
  );
}
