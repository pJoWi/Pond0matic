"use client";
import React from "react";
import { SwapDirectionButton } from "./SwapDirectionButton";

interface SwapInterfaceProps {
  fromMint: string;
  toMint: string;
  amount: string;
  tokenBalance: number;
  tokenNames: Record<string, string>;
  tokenOptions: string[];
  onFromMintChange: (mint: string) => void;
  onToMintChange: (mint: string) => void;
  onAmountChange: (amount: string) => void;
  onSwapDirection: () => void;
  wallet?: string;
}

export function SwapInterface({
  fromMint,
  toMint,
  amount,
  tokenBalance,
  tokenNames,
  tokenOptions,
  onFromMintChange,
  onToMintChange,
  onAmountChange,
  onSwapDirection,
  wallet,
}: SwapInterfaceProps) {
  return (
    <div className="space-y-3">
      {/* FROM Section */}
      <div>
        <label htmlFor="from-token-compact" className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1.5">
          From
        </label>
        <div className="flex gap-2">
          {/* Token Selector */}
          <select
            id="from-token-compact"
            className="w-[100px] px-3 py-2.5 bg-cyber-black/60 border border-ember-orange/40 rounded-lg text-sm font-bold text-ember-orange-light focus:border-ember-orange/60 focus:outline-none focus:ring-2 focus:ring-ember-orange/40 transition-all cursor-pointer hover:border-ember-orange/50"
            value={fromMint}
            onChange={(e) => onFromMintChange(e.target.value)}
          >
            {tokenOptions.map((m) => (
              <option key={m} value={m}>
                {tokenNames[m]}
              </option>
            ))}
          </select>

          {/* Amount Input */}
          <div className="flex-1 flex gap-2">
            <input
              id="from-amount-compact"
              type="text"
              className="flex-1 px-4 py-2.5 bg-cyber-black/60 border border-ember-orange/40 rounded-lg text-lg font-mono font-bold text-right text-white focus:border-ember-orange/60 focus:outline-none focus:ring-2 focus:ring-ember-orange/40 transition-all placeholder-gray-600"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="0.0"
            />
            {wallet && tokenBalance > 0 && (
              <button
                onClick={() => onAmountChange(tokenBalance.toString())}
                className="px-3 py-2 bg-ember-orange/20 border border-ember-orange/50 rounded-lg text-xs font-semibold text-ember-orange hover:bg-ember-orange/30 hover:scale-105 active:scale-95 transition-all"
              >
                MAX
              </button>
            )}
          </div>
        </div>
        {wallet && (
          <div className="text-[11px] text-gray-500 mt-1.5 ml-1">
            Balance: {tokenBalance.toFixed(4)} {tokenNames[fromMint]}
          </div>
        )}
      </div>

      {/* Swap Direction Button */}
      <SwapDirectionButton onSwap={onSwapDirection} disabled={!wallet} />

      {/* TO Section */}
      <div>
        <label htmlFor="to-token-compact" className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1.5">
          To
        </label>
        <select
          id="to-token-compact"
          className="w-full px-3 py-2.5 bg-cyber-black/60 border border-ember-amber/40 rounded-lg text-sm font-bold text-ember-amber-light focus:border-ember-amber/60 focus:outline-none focus:ring-2 focus:ring-ember-amber/40 transition-all cursor-pointer hover:border-ember-amber/50"
          value={toMint}
          onChange={(e) => onToMintChange(e.target.value)}
        >
          {tokenOptions.map((m) => (
            <option key={m} value={m}>
              {tokenNames[m]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
