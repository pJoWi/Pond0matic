"use client";
import React, { useState } from "react";
import { useSwapperContext } from "@/contexts/SwapperContext";
import { MiningRigDashboard } from "@/components/swapper/MiningRigDashboard";
import { CompactPond0xDashboard } from "@/components/swapper/CompactPond0xDashboard";
import { ActivityLog } from "@/components/swapper/ActivityLog";
import { WalletPanel } from "@/components/swapper/WalletPanel";

interface DashboardProps {
  onOpenSwapper: () => void;
}

export function Dashboard({ onOpenSwapper }: DashboardProps) {
  const ctx = useSwapperContext();
  const [viewMode, setViewMode] = useState<"enhanced" | "classic">("enhanced");

  return (
    <div className="pt-20 pb-8 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Wallet Panel */}
        <WalletPanel
          wallet={ctx.wallet}
          connecting={ctx.connecting}
          rpc={ctx.rpc}
          onConnect={async () => {
            await ctx.connect();
          }}
          onDisconnect={async () => {
            await ctx.disconnect();
          }}
          onRpcChange={ctx.setRpc}
        />

        {/* View Toggle */}
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-2 bg-pond-water/90 backdrop-blur-md border-2 border-lily-green/30 rounded-lg p-1">
            <button
              onClick={() => setViewMode("enhanced")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                viewMode === "enhanced"
                  ? "bg-lily-green text-white shadow-[0_0_20px_var(--glow-green)]"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              🐸 Pond0x View
            </button>
            <button
              onClick={() => setViewMode("classic")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                viewMode === "classic"
                  ? "bg-pond-bright text-white shadow-[0_0_20px_var(--glow-blue)]"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              📊 Classic View
            </button>
          </div>
        </div>

        {/* Conditional Dashboard Rendering */}
        {viewMode === "enhanced" ? (
          <CompactPond0xDashboard
            proSwapsSol={ctx.proSwapsSol}
            proSwapsBx={ctx.proSwapsBx}
            onOpenSwapper={onOpenSwapper}
            totalBoosts={ctx.totalBoosts}
            isPro={ctx.isPro}
            miningSessionsCount={ctx.miningSessionsCount}
            isLoading={ctx.isLoading}
            onFetchRigData={ctx.fetchRigData}
            badges={ctx.badges}
            estimatedSolUsd={ctx.estimatedSolUsd}
            maxClaimEstimateUsd={ctx.maxClaimEstimateUsd}
          />
        ) : (
          <MiningRigDashboard
            rigHealth={ctx.rigHealth}
            rigPower={ctx.rigPower}
            rigTemp={ctx.rigTemp}
            totalBoosts={ctx.totalBoosts}
            permanentBoostTotal={ctx.permanentBoostTotal}
            luckPoints={ctx.luckPoints}
            boostBotActive={ctx.boostBotActive}
            miningSessionsCount={ctx.miningSessionsCount}
            swapBoost={ctx.swapBoost}
            sessionPenalty={ctx.sessionPenalty}
            currentBoost={ctx.currentBoost}
            priority={ctx.priority}
            driftRisk={ctx.driftRisk}
            inMempool={ctx.inMempool}
            sent={ctx.sent}
            failed={ctx.failed}
            drifted={ctx.drifted}
            estimatedSolUsd={ctx.estimatedSolUsd}
            maxClaimEstimateUsd={ctx.maxClaimEstimateUsd}
            badges={ctx.badges}
            isPro={ctx.isPro}
            proSwapsSol={ctx.proSwapsSol}
            proSwapsBx={ctx.proSwapsBx}
            onOpenSwapper={onOpenSwapper}
            wallet={ctx.wallet}
            isLoading={ctx.isLoading}
            onFetchRigData={ctx.fetchRigData}
            onSendPermanentBoost={(amount) => {
              ctx.log(`Permanent boost: ${amount} SOL (not implemented)`);
            }}
            onSendLuckBurn={(amount) => {
              ctx.log(`Luck burn: ${amount} SOL (not implemented)`);
            }}
          />
        )}

        {/* Activity Log */}
        <ActivityLog activities={ctx.activities} onClear={ctx.clearLog} />
      </div>
    </div>
  );
}
