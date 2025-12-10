"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RewardsModePanelProps {
  swapAmount: string;
  numberOfSwaps: number;
  referralLink: string;
  onSwapAmountChange: (amount: string) => void;
  onNumberOfSwapsChange: (swaps: number) => void;
  onReferralLinkChange: (link: string) => void;
  running?: boolean;
  estimatedUsdValue?: number;
}

export function RewardsModePanel({
  swapAmount,
  numberOfSwaps,
  referralLink,
  onSwapAmountChange,
  onNumberOfSwapsChange,
  onReferralLinkChange,
  running,
  estimatedUsdValue = 0,
}: RewardsModePanelProps) {
  const isInfinite = numberOfSwaps === 0;
  const [showReferralInfo, setShowReferralInfo] = useState(false);
  const meetsMinimum = estimatedUsdValue >= 10;

  return (
    <div className="rounded-xl theme-border p-4 space-y-4 bg-white/10 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <h3 className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Rewards Configuration
          </h3>
        </div>
        {running && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-led-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-green-400 font-semibold">
              Running
            </span>
          </div>
        )}
      </div>

      {/* Swap Amount */}
      <div className="space-y-2">
        <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
          Swap Amount (Fixed)
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 glass-premium border border-cyan-500/40 rounded-lg text-lg font-mono font-bold text-center text-white focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 smooth-transition placeholder-gray-600 disabled:opacity-50"
          value={swapAmount}
          onChange={(e) => onSwapAmountChange(e.target.value)}
          placeholder="0.01"
          disabled={running}
        />

        {/* USD Value Indicator */}
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-300",
          meetsMinimum
            ? "bg-green-500/10 border-green-500/50 glow-ember"
            : "bg-red-500/10 border-red-500/50 animate-pulse"
        )}>
          <div className="flex items-center gap-2">
            {meetsMinimum ? (
              <>
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-green-400 font-semibold">Meets Minimum</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-400 font-semibold">Below $10 Minimum</span>
              </>
            )}
          </div>
          <div className={cn(
            "text-lg font-bold font-mono",
            meetsMinimum ? "text-green-400" : "text-red-400"
          )}>
            ${estimatedUsdValue.toFixed(2)}
          </div>
        </div>

        {!meetsMinimum && (
          <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-[10px] text-red-300 leading-tight">
              Rewards mode requires swaps worth at least $10 USD. Increase the amount.
            </span>
          </div>
        )}
      </div>

      {/* Number of Swaps */}
      <div className="space-y-2">
        <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
          Number of Swaps (A→B→A cycles)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="100"
            className="flex-1 px-4 py-2.5 glass-premium border border-blue-500/40 rounded-lg text-lg font-mono font-bold text-center text-white focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 smooth-transition disabled:opacity-50"
            value={numberOfSwaps}
            onChange={(e) => onNumberOfSwapsChange(Math.max(0, parseInt(e.target.value) || 0))}
            disabled={running}
          />
          <div className="text-sm text-gray-400 min-w-[80px]">
            {isInfinite ? (
              <span className="text-cyan-400 font-semibold">∞ Infinite</span>
            ) : (
              <span>cycle{numberOfSwaps !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <span className="text-[10px] text-gray-300 leading-tight">
            {isInfinite ? (
              <><span className="text-cyan-400 font-semibold">∞</span> Infinite mode: Each cycle swaps A→B, then immediately B→A</>
            ) : (
              <>Each cycle: Forward swap (A→B) + instant return swap (B→A)</>
            )}
          </span>
        </div>
      </div>

      {/* Referral Link */}
      <div className="space-y-2 pt-3 border-t border-gray-700/50">
        <div className="flex items-center justify-between">
          <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
            Referral Link (Optional)
          </label>
          <button
            onClick={() => setShowReferralInfo(!showReferralInfo)}
            className="text-[9px] text-purple-400 hover:text-purple-300 transition-colors"
          >
            {showReferralInfo ? "Hide" : "What's this?"}
          </button>
        </div>

        {showReferralInfo && (
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg space-y-2 spring-bounce">
            <div className="text-[10px] text-gray-300 leading-relaxed space-y-1">
              <p><span className="text-purple-400 font-semibold">Referral links</span> let you earn rewards from Pond0x or Jupiter for your swaps.</p>
              <p className="mt-2"><span className="font-semibold">Supported formats:</span></p>
              <ul className="list-disc list-inside space-y-0.5 text-[9px] text-gray-400 ml-2">
                <li>Full URL: https://www.pond0x.com/swap/solana?ref=ABC...</li>
                <li>Jupiter URL: https://jup.ag/?referral=ABC...</li>
                <li>Direct address: ABC...</li>
              </ul>
            </div>
          </div>
        )}

        <input
          type="text"
          className="w-full px-4 py-2.5 glass-premium border border-purple-500/40 rounded-lg text-xs font-mono text-white focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/40 smooth-transition placeholder-gray-600 disabled:opacity-50"
          value={referralLink}
          onChange={(e) => onReferralLinkChange(e.target.value)}
          placeholder="https://www.pond0x.com/swap/solana?ref=..."
          disabled={running}
        />

        {referralLink && (
          <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
            <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] text-green-300 leading-tight">
              Referral link active - fees will be routed to your referral account
            </span>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="neomorph-pressed rounded-xl p-3 space-y-2">
        <div className="text-[9px] uppercase tracking-widest text-gray-500 font-semibold">
          Rewards Summary
        </div>
        <div className="space-y-1 text-[11px] text-gray-300">
          <div className="flex justify-between">
            <span className="text-gray-400">Strategy:</span>
            <span className="font-semibold text-purple-400">Instant Roundtrip</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Per Swap:</span>
            <span className={cn(
              "font-semibold",
              meetsMinimum ? "text-green-400" : "text-red-400"
            )}>
              {swapAmount} (~${estimatedUsdValue.toFixed(2)})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Swaps:</span>
            <span className="font-semibold">
              {isInfinite ? <span className="text-cyan-400">∞ Infinite</span> : `${numberOfSwaps} cycle${numberOfSwaps !== 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Referral:</span>
            <span className="font-semibold">
              {referralLink ? <span className="text-green-400">✓ Active</span> : <span className="text-gray-500">None</span>}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Min Requirement:</span>
            <span className={cn(
              "font-semibold",
              meetsMinimum ? "text-green-400" : "text-red-400"
            )}>
              {meetsMinimum ? "✓ Met" : "✗ Not Met"}
            </span>
          </div>
        </div>
      </div>

      {/* Warning if below minimum */}
      {!meetsMinimum && (
        <div className="neomorph-pressed rounded-xl p-3 border-2 border-red-500/50 animate-pulse">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-red-400">Cannot Start Rewards Mode</div>
              <div className="text-[10px] text-gray-300 leading-relaxed">
                Rewards mode requires swaps worth at least <span className="text-red-400 font-semibold">$10 USD</span>.
                Current value is <span className="text-red-400 font-semibold">${estimatedUsdValue.toFixed(2)}</span>.
                Please increase the swap amount.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
