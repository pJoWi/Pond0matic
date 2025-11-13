"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

type Mode = "normal" | "roundtrip" | "boost" | "loopreturn";

interface SwapConfigPanelProps {
  // Token state
  fromMint: string;
  toMint: string;
  tokenNames: Record<string, string>;
  tokenOptions: string[];
  onFromMintChange: (mint: string) => void;
  onToMintChange: (mint: string) => void;
  onSwapDirection: () => void;

  // Amount state
  amount: string;
  onAmountChange: (amount: string) => void;
  maxAmount: string;
  onMaxAmountChange: (amount: string) => void;
  tokenBalance: number;
  wallet: string;

  // Mode state
  mode: Mode;
  onModeChange: (mode: Mode) => void;

  // Auto-swap state
  autoActive: boolean;
  onAutoActiveChange: (active: boolean) => void;
  autoCount: number;
  onAutoCountChange: (count: number) => void;
  autoDelayMs: number;
  onAutoDelayChange: (ms: number) => void;

  // Advanced settings
  platformFeeBps: number;
  onPlatformFeeChange: (bps: number) => void;
  slippageBps: number;
  onSlippageChange: (bps: number) => void;

  // Actions
  running: boolean;
  onSwap: () => void;
  onStop: () => void;
}

export function SwapConfigPanel({
  fromMint,
  toMint,
  tokenNames,
  tokenOptions,
  onFromMintChange,
  onToMintChange,
  onSwapDirection,
  amount,
  onAmountChange,
  maxAmount,
  onMaxAmountChange,
  tokenBalance,
  wallet,
  mode,
  onModeChange,
  autoActive,
  onAutoActiveChange,
  autoCount,
  onAutoCountChange,
  autoDelayMs,
  onAutoDelayChange,
  platformFeeBps,
  onPlatformFeeChange,
  slippageBps,
  onSlippageChange,
  running,
  onSwap,
  onStop,
}: SwapConfigPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <section
      className="bg-cyber-darker/60 backdrop-blur-md border border-ember-orange/30 rounded-xl shadow-ember-orange-md overflow-hidden transition-all duration-300 hover:border-ember-orange/50"
      role="region"
      aria-label="Swap configuration"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-ember-orange/20 bg-gradient-to-br from-ember-orange/10 to-ember-amber/5">
        <h2 className="text-xl font-bold bg-gradient-to-r from-ember-orange via-ember-amber to-ember-gold bg-clip-text text-transparent">
          ⚡ SWAP
        </h2>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-1.5 bg-ember-orange/10 border border-ember-orange/40 rounded-lg text-xs font-semibold text-ember-orange-light hover:bg-ember-orange/20 hover:shadow-ember-orange-sm hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-black"
          aria-label={showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
        >
          {showAdvanced ? "▼" : "▶"} Advanced
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Mode Selector - Compact Pills */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Mode</label>
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Swap mode selection">
            {(["normal", "roundtrip", "boost", "loopreturn"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 border",
                  mode === m
                    ? "bg-ember-orange/20 border-ember-orange text-ember-orange-light shadow-ember-orange-sm scale-105"
                    : "bg-cyber-black/30 border-gray-600 text-gray-400 hover:border-ember-orange/40 hover:text-gray-300 hover:scale-[1.02]",
                  "active:scale-95 focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-black"
                )}
                aria-pressed={mode === m}
              >
                {m === "loopreturn" ? "Loop" : m}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Swap Interface */}
        <div className="space-y-3">
          {/* FROM Token - Compact */}
          <div className="relative">
            <label htmlFor="from-token" className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 block">
              {mode === "boost" ? "From (Min Amount)" : "From"}
            </label>
            <div className="flex gap-2">
              {/* Token Selector */}
              <select
                id="from-token"
                className="flex-shrink-0 px-3 py-3 bg-cyber-black/50 border border-ember-orange/30 rounded-lg text-sm font-bold text-ember-orange-light focus:border-ember-orange/60 focus:shadow-ember-orange-sm focus:outline-none focus:ring-2 focus:ring-ember-orange/40 transition-all cursor-pointer hover:border-ember-orange/50"
                value={fromMint}
                onChange={(e) => onFromMintChange(e.target.value)}
                aria-label="Select token to swap from"
              >
                {tokenOptions.map((m) => (
                  <option key={m} value={m}>
                    {tokenNames[m]}
                  </option>
                ))}
              </select>

              {/* Amount Input */}
              <div className="relative flex-1">
                <input
                  id="from-amount"
                  type="text"
                  className="w-full px-4 py-3 bg-cyber-black/50 border border-ember-orange/30 rounded-lg text-lg font-mono font-bold text-right text-white focus:border-ember-orange/60 focus:shadow-ember-orange-sm focus:outline-none focus:ring-2 focus:ring-ember-orange/40 transition-all placeholder-gray-600"
                  value={amount}
                  onChange={(e) => onAmountChange(e.target.value)}
                  placeholder="0.0"
                  aria-label="Amount to swap"
                />
                {wallet && tokenBalance > 0 && (
                  <button
                    onClick={() => onAmountChange(tokenBalance.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-ember-orange/20 border border-ember-orange/40 rounded text-xs font-semibold text-ember-orange hover:bg-ember-orange/30 hover:scale-105 active:scale-95 transition-all"
                    aria-label="Set to maximum balance"
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Swap Direction Button - Centered with smooth animation */}
          <div className="flex justify-center -my-1">
            <button
              onClick={onSwapDirection}
              className="group relative z-10 p-3 bg-gradient-to-br from-ember-orange/30 to-ember-amber/30 border-2 border-ember-orange/50 rounded-xl hover:border-ember-amber/70 hover:shadow-ember-orange hover:scale-110 active:scale-95 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-darker"
              aria-label="Switch token direction"
              style={{
                transform: "translateZ(0)", // Enable GPU acceleration for smooth animation
              }}
            >
              <svg
                className="w-5 h-5 text-ember-orange-light group-hover:text-ember-amber transition-all duration-500 group-hover:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{
                  transformOrigin: "center",
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* TO Token - Compact (no amount input) */}
          <div>
            <label htmlFor="to-token" className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 block">
              To
            </label>
            <select
              id="to-token"
              className="w-full px-3 py-3 bg-cyber-black/50 border border-ember-amber/30 rounded-lg text-sm font-bold text-ember-amber-light focus:border-ember-amber/60 focus:shadow-ember-amber-sm focus:outline-none focus:ring-2 focus:ring-ember-amber/40 transition-all cursor-pointer hover:border-ember-amber/50"
              value={toMint}
              onChange={(e) => onToMintChange(e.target.value)}
              aria-label="Select token to swap to"
            >
              {tokenOptions.map((m) => (
                <option key={m} value={m}>
                  {tokenNames[m]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Boost Mode Max Amount (conditionally shown) */}
        {mode === "boost" && (
          <div className="space-y-2 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <label htmlFor="max-amount" className="text-xs uppercase tracking-wider text-purple-400 font-semibold">
              🚀 Max Amount (Boost Mode)
            </label>
            <input
              id="max-amount"
              type="text"
              value={maxAmount}
              onChange={(e) => onMaxAmountChange(e.target.value)}
              className="w-full px-3 py-2 bg-cyber-black/50 border border-purple-500/30 rounded-lg text-sm font-mono text-white focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
              placeholder="0.0"
              aria-label="Maximum swap amount for boost mode"
            />
            <p className="text-xs text-gray-500">Randomizes swap amounts between min and max</p>
          </div>
        )}

        {/* Auto-Swap Toggle & Count (Compact) */}
        <div className="space-y-3 p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-lg">
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-semibold text-white group-hover:text-neon-blue-light transition-colors">Auto-Swap</span>
            <input
              type="checkbox"
              checked={autoActive}
              onChange={(e) => onAutoActiveChange(e.target.checked)}
              className="w-5 h-5 accent-neon-blue cursor-pointer focus:ring-2 focus:ring-neon-blue focus:ring-offset-2 focus:ring-offset-cyber-black transition-all"
              aria-describedby="auto-swap-desc"
            />
          </label>

          {autoActive && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label htmlFor="auto-count" className="text-xs text-gray-400">
                  Count
                </label>
                <input
                  id="auto-count"
                  type="number"
                  min={1}
                  value={autoCount}
                  onChange={(e) => onAutoCountChange(Math.max(1, Number(e.target.value)))}
                  className="w-full px-2 py-1.5 bg-cyber-black/50 border border-neon-blue/30 rounded text-sm font-mono text-white focus:border-neon-blue/60 focus:outline-none focus:ring-1 focus:ring-neon-blue/40 transition-all"
                  aria-label="Number of automatic swaps"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="swap-delay" className="text-xs text-gray-400">
                  Delay (s)
                </label>
                <input
                  id="swap-delay"
                  type="number"
                  min={0}
                  step={0.5}
                  value={autoDelayMs / 1000}
                  onChange={(e) => onAutoDelayChange(Math.max(0, Number(e.target.value)) * 1000)}
                  className="w-full px-2 py-1.5 bg-cyber-black/50 border border-neon-blue/30 rounded text-sm font-mono text-white focus:border-neon-blue/60 focus:outline-none focus:ring-1 focus:ring-neon-blue/40 transition-all"
                  aria-label="Delay between swaps in seconds"
                />
              </div>
            </div>
          )}
          <p id="auto-swap-desc" className="sr-only">
            Enable automatic execution of multiple swaps in sequence
          </p>
        </div>

        {/* Advanced Settings (Collapsible) */}
        {showAdvanced && (
          <div className="space-y-3 p-4 bg-gray-800/30 border border-gray-600/30 rounded-lg" role="form" aria-label="Advanced swap settings">
            <div className="grid grid-cols-2 gap-3">
              {/* Platform Fee */}
              <div className="space-y-1">
                <label htmlFor="platform-fee" className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  Fee (bps)
                </label>
                <input
                  id="platform-fee"
                  type="number"
                  min={0}
                  max={10000}
                  value={platformFeeBps}
                  onChange={(e) => onPlatformFeeChange(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2 py-1.5 bg-cyber-black/50 border border-gray-600/30 rounded text-sm font-mono text-white focus:border-ember-orange/60 focus:outline-none focus:ring-1 focus:ring-ember-orange/40 transition-all"
                  aria-describedby="platform-fee-display"
                />
                <div id="platform-fee-display" className="text-xs text-ember-orange-light font-semibold">
                  {(platformFeeBps / 100).toFixed(2)}%
                </div>
              </div>

              {/* Slippage */}
              <div className="space-y-1">
                <label htmlFor="slippage" className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  Slippage (bps)
                </label>
                <input
                  id="slippage"
                  type="number"
                  min={0}
                  max={1000}
                  value={slippageBps}
                  onChange={(e) => onSlippageChange(Math.max(0, Math.min(1000, Number(e.target.value))))}
                  className="w-full px-2 py-1.5 bg-cyber-black/50 border border-gray-600/30 rounded text-sm font-mono text-white focus:border-ember-orange/60 focus:outline-none focus:ring-1 focus:ring-ember-orange/40 transition-all"
                  aria-describedby="slippage-display"
                />
                <div id="slippage-display" className="text-xs text-ember-orange-light font-semibold">
                  {(slippageBps / 100).toFixed(2)}%
                </div>
                {slippageBps > 500 && (
                  <div className="text-xs text-yellow-400 font-medium flex items-center gap-1 mt-1">
                    <span>⚠️</span>
                    <span>High slippage increases sandwich attack risk</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Primary Action Button - Full Width, Prominent */}
        {!running ? (
          <button
            onClick={onSwap}
            disabled={!wallet || !amount || parseFloat(amount) <= 0}
            className="w-full px-6 py-4 bg-gradient-to-r from-ember-orange via-ember-amber to-ember-gold rounded-xl font-bold text-lg text-white hover:shadow-ember-orange hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-black"
            aria-label={autoActive ? `Execute ${autoCount} auto-swaps` : "Execute swap"}
          >
            {autoActive ? `⚡ AUTO-SWAP (${autoCount}x)` : "⚡ SWAP NOW"}
          </button>
        ) : (
          <button
            onClick={onStop}
            className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-500 rounded-xl font-bold text-lg text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-cyber-black"
            aria-label="Stop auto-swap sequence"
          >
            🛑 STOP
          </button>
        )}
      </div>
    </section>
  );
}
