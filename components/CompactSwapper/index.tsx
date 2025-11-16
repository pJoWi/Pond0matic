"use client";
import React, { useCallback } from "react";
import { useSwapperContext } from "@/contexts/SwapperContext";
import { cn } from "@/lib/utils";
import { TOKEN_NAMES } from "@/lib/vaults";

import { CompactHeader } from "./components/CompactHeader";
import { SwapInterface } from "./components/SwapInterface";
import { ModePills } from "./components/ModePills";
import { BoostPanel } from "./components/BoostPanel";
import { AutoSwapSection } from "./components/AutoSwapSection";
import { ActionButton } from "./components/ActionButton";
import { MiniActivityFeed } from "./components/MiniActivityFeed";
import { AffiliateSelector } from "./components/AffiliateSelector";
import { SettingsPanel } from "./components/SettingsPanel";

const TOKEN_OPTIONS = Object.keys(TOKEN_NAMES);

interface CompactSwapperProps {
  maxWidth?: number; // Default 400px
  showActivityFeed?: boolean;
  onSwap: () => void;
  onStop: () => void;
}

export function CompactSwapper({ maxWidth = 420, showActivityFeed = true, onSwap, onStop }: CompactSwapperProps) {
  const ctx = useSwapperContext();

  const handleSwapDirection = useCallback(() => {
    const temp = ctx.fromMint;
    ctx.setFromMint(ctx.toMint);
    ctx.setToMint(temp);
    ctx.log("Switched route FROM<->TO");
  }, [ctx]);

  return (
    <div
      className={cn(
        "mx-auto space-y-0 overflow-hidden",
        "bg-gradient-to-br from-cyber-darker/90 to-cyber-black/95",
        "backdrop-blur-cyber",
        "border border-ember-orange/30 rounded-2xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4),_0_0_40px_rgba(255,107,53,0.15)]",
        "transition-all duration-300",
        "hover:border-ember-orange/50 hover:shadow-ember-orange-md"
      )}
      style={{ maxWidth: `${maxWidth}px` }}
    >
      {/* Header */}
      <CompactHeader wallet={ctx.wallet} networkStatus={ctx.networkStatus} onConnect={ctx.connect} onDisconnect={ctx.disconnect} />

      {/* Main Content */}
      <div className="p-5 space-y-4">
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

        {/* Mode Pills */}
        <ModePills mode={ctx.mode} onModeChange={ctx.setMode} />

        {/* Boost Panel (conditional) */}
        {ctx.mode === "boost" && <BoostPanel minAmount={ctx.amount} maxAmount={ctx.maxAmount} onMinChange={ctx.setAmount} onMaxChange={ctx.setMaxAmount} />}

        {/* Auto-Swap Section */}
        <AutoSwapSection
          autoActive={ctx.autoActive}
          autoCount={ctx.autoCount}
          autoDelayMs={ctx.autoDelayMs}
          running={ctx.running}
          currentSwapIndex={ctx.currentSwapIndex}
          onAutoActiveChange={ctx.setAutoActive}
          onAutoCountChange={ctx.setAutoCount}
          onAutoDelayChange={ctx.setAutoDelayMs}
        />

        {/* Affiliate Selector */}
        <AffiliateSelector
          affiliate={ctx.affiliate}
          currentVault={ctx.currentVault}
          onAffiliateChange={ctx.setAffiliate}
        />

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
          autoActive={ctx.autoActive}
          autoCount={ctx.autoCount}
          currentSwapIndex={ctx.currentSwapIndex}
          disabled={!ctx.wallet || !ctx.amount || parseFloat(ctx.amount) <= 0}
          onStart={onSwap}
          onStop={onStop}
        />
      </div>

      {/* Mini Activity Feed (optional) */}
      {showActivityFeed && <MiniActivityFeed activities={ctx.activities.slice(-5)} onClear={ctx.clearLog} />}
    </div>
  );
}
