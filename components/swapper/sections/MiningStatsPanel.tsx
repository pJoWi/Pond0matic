"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { WaterRipple } from "@/components/ui/WaterRipple";
import { DewdropGlow } from "@/components/ui/DewdropGlow";
import { LilyPadCard } from "@/components/ui/LilyPadCard";

type HealthStatus = "positive" | "warning" | "negative";

function getHealthStatus(health: number): HealthStatus {
  if (health >= 80) return "positive";
  if (health >= 50) return "warning";
  return "negative";
}

interface MiningStatsPanelProps {
  rigHealth: number;
  miningSessionsCount: number;
  isPro: boolean;
  isLoading?: boolean;
  proSwapsSol: number;
  proSwapsBx: number;
  inMempool: number;
  sent: number;
  failed: number;
  drifted: number;
  estimatedSolUsd?: number;
  maxClaimEstimateUsd?: number;
}

/**
 * Mining ecosystem stats: rig health gauge, pro tier card, transaction metrics.
 */
export function MiningStatsPanel({
  rigHealth,
  miningSessionsCount,
  isPro,
  isLoading = false,
  proSwapsSol,
  proSwapsBx,
  inMempool,
  sent,
  failed,
  drifted,
  estimatedSolUsd = 0,
  maxClaimEstimateUsd = 0,
}: MiningStatsPanelProps) {
  const healthStatus = getHealthStatus(rigHealth);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="font-semibold text-xl tracking-wide text-teal-100 flex items-center gap-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          <span className="text-2xl">⚡</span>
          <span>Pond Operations</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rig health */}
        <div className="md:col-span-2">
          <div
            className={cn(
              "relative backdrop-blur-2xl border-2 p-8 overflow-hidden transition-all duration-500 shadow-[0_16px_56px_rgba(0,0,0,0.5)]",
              "rounded-[3rem_2rem_3rem_2.5rem]",
              "animate-pond-float",
              healthStatus === "positive" && "bg-emerald-950/85 border-emerald-400/50",
              healthStatus === "warning" && "bg-amber-950/85 border-amber-400/50",
              healthStatus === "negative" && "bg-rose-950/85 border-pink-400/50"
            )}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-30" />
            <div className="absolute inset-0 opacity-20">
              <div
                className={cn(
                  "absolute top-1/4 right-1/4 w-32 h-32 rounded-full blur-3xl",
                  healthStatus === "positive" && "bg-emerald-400/50",
                  healthStatus === "warning" && "bg-amber-400/50",
                  healthStatus === "negative" && "bg-pink-400/50"
                )}
              />
            </div>

            <WaterRipple delay={200} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="text-xs font-medium tracking-wide text-teal-300/90 uppercase flex items-center gap-2">
                  <span>Mining Ecosystem Health</span>
                </div>
                <div
                  className={cn(
                    "px-4 py-2 rounded-full font-semibold text-xs tracking-wide backdrop-blur-sm flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.4)]",
                    healthStatus === "positive" && "bg-emerald-900/60 text-emerald-200 border border-emerald-400/50",
                    healthStatus === "warning" && "bg-amber-900/60 text-amber-200 border border-amber-400/50",
                    healthStatus === "negative" && "bg-rose-900/60 text-pink-200 border border-pink-400/50"
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      healthStatus === "positive" && "bg-emerald-400",
                      healthStatus === "warning" && "bg-amber-400",
                      healthStatus === "negative" && "bg-pink-400"
                    )}
                  />
                  {healthStatus === "positive" && "Thriving"}
                  {healthStatus === "warning" && "Stressed"}
                  {healthStatus === "negative" && "Critical"}
                </div>
              </div>

              <div className="flex items-end gap-3 mb-6">
                <div
                  className={cn(
                    "text-6xl font-bold tabular-nums tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]",
                    healthStatus === "positive" && "text-emerald-300",
                    healthStatus === "warning" && "text-amber-300",
                    healthStatus === "negative" && "text-pink-300"
                  )}
                >
                  {rigHealth}
                </div>
                <div className="text-3xl font-bold text-teal-400/60 mb-2">%</div>
              </div>

              <div className="relative w-full h-4 bg-black/40 overflow-hidden rounded-full border border-teal-400/30 shadow-inner">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 transition-all duration-1000 ease-out rounded-full",
                    healthStatus === "positive" && "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400",
                    healthStatus === "warning" && "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400",
                    healthStatus === "negative" && "bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400"
                  )}
                  style={{ width: `${rigHealth}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pond-shimmer-slow" />
                </div>
              </div>

              <div className="mt-4 text-xs font-medium text-teal-400/80 tracking-wide flex items-center gap-2">
                <span>{miningSessionsCount} ecosystem cycles completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pro tier */}
        <div className="relative bg-amber-950/85 backdrop-blur-2xl border-2 border-amber-400/40 p-8 rounded-[2rem_3rem_2.5rem_2rem] overflow-hidden transition-all duration-500 hover:border-amber-400/60 hover:shadow-[0_16px_56px_rgba(251,191,36,0.3)] animate-pond-float shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-amber-300/10 opacity-30" />

          <WaterRipple delay={400} />

          <div className="relative h-full flex flex-col z-10">
            <div className="text-xs font-medium tracking-wide text-amber-300/90 uppercase mb-6">
              Membership Tier
            </div>

            <div className="flex-1 flex items-center justify-center">
              {isPro ? (
                <div className="text-center">
                  <div className="text-5xl mb-3 animate-pond-pulse-soft filter drop-shadow-[0_4px_20px_rgba(251,191,36,0.8)]">
                    ✨
                  </div>
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

      {/* Transaction metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <LilyPadCard title="SOL Swaps" value={proSwapsSol.toLocaleString()} subtitle="Executed" loading={isLoading} status="neutral" icon="💜" />
        <LilyPadCard title="BX Swaps" value={proSwapsBx.toLocaleString()} subtitle="Executed" loading={isLoading} status="neutral" icon="🔷" />
        <LilyPadCard title="In Mempool" value={inMempool.toLocaleString()} subtitle="Pending" loading={isLoading} status="warning" icon="⏳" />
        <LilyPadCard title="Sent" value={sent.toLocaleString()} subtitle="Confirmed" loading={isLoading} status="positive" icon="✓" />
        <LilyPadCard title="Failed" value={failed.toLocaleString()} subtitle="Rejected" loading={isLoading} status={failed > 0 ? "negative" : "neutral"} icon="✗" />
        <LilyPadCard title="Drifted" value={drifted.toLocaleString()} subtitle="Off-target" loading={isLoading} status={drifted > 0 ? "warning" : "neutral"} icon="〜" />
        {estimatedSolUsd > 0 && (
          <LilyPadCard title="SOL Value" value={`$${estimatedSolUsd.toFixed(2)}`} subtitle="Market Price" loading={isLoading} status="neutral" icon="💰" />
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
}
