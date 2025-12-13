"use client";
import React from "react";
import { useSwapperContext } from "@/contexts/SwapperContext";
import { useViewMode } from "@/components/layout/LayoutClient";
import { MiningRigDashboard } from "@/components/swapper/MiningRigDashboard";
import { CompactPond0xDashboard } from "@/components/swapper/CompactPond0xDashboard";
import { ActivityLog } from "@/components/swapper/ActivityLog";
import { LiveActivityMonitor } from "@/components/LiveActivityMonitor";

interface DashboardProps {
  onOpenSwapper: () => void;
}

export function Dashboard({ onOpenSwapper }: DashboardProps) {
  const ctx = useSwapperContext();
  const viewMode = useViewMode();

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Token prices / overview */}
        <CompactPond0xDashboard
          proSwapsSol={ctx.proSwapsSol}
          proSwapsBx={ctx.proSwapsBx}
          variant="tokens"
          badges={ctx.badges}
          isPro={ctx.isPro}
          rigHealth={ctx.rigHealth}
          isLoading={ctx.isLoading}
          onFetchRigData={ctx.fetchRigData}
          estimatedSolUsd={ctx.estimatedSolUsd}
          maxClaimEstimateUsd={ctx.maxClaimEstimateUsd}
        />

        {/* Mining rig stats - conditional render based on viewMode */}
        {viewMode === "enhanced" ? (
          <CompactPond0xDashboard
            proSwapsSol={ctx.proSwapsSol}
            proSwapsBx={ctx.proSwapsBx}
            onOpenSwapper={onOpenSwapper}
            variant="stats"
            totalBoosts={ctx.totalBoosts}
            rigHealth={ctx.rigHealth}
            isPro={ctx.isPro}
            miningSessionsCount={ctx.miningSessionsCount}
            isLoading={ctx.isLoading}
            onFetchRigData={ctx.fetchRigData}
            badges={ctx.badges}
            estimatedSolUsd={ctx.estimatedSolUsd}
            maxClaimEstimateUsd={ctx.maxClaimEstimateUsd}
            inMempool={ctx.inMempool}
            sent={ctx.sent}
            failed={ctx.failed}
            drifted={ctx.drifted}
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

        {/* Live Activity Monitor */}
        <LiveActivityMonitor maxItems={10} autoScroll={true} />

    </div>
  );
}
