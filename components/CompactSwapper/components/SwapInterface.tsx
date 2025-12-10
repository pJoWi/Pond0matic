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
    <div className="relative">
      {/* FROM Section */}
      <div className="pb-3">
        <label htmlFor="from-token-compact" className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1.5">
          From
        </label>
        <div className="flex gap-2">
          {/* Token Selector */}
          <select
            id="from-token-compact"
            className="w-[100px] theme-input text-sm font-bold text-white cursor-pointer"
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
              className="flex-1 theme-input text-lg font-mono font-bold text-right"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="0.0"
            />
            {wallet && tokenBalance > 0 && (
              <button
                onClick={() => onAmountChange(tokenBalance.toString())}
                className="px-2 py-2 rounded-lg text-[10px] font-bold theme-text-primary hover:theme-text-secondary hover:scale-105 active:scale-95 transition-all flex-shrink-0"
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

      {/* Swap Direction Button - Centered and Overlapping */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-0 z-10">
        <SwapDirectionButton onSwap={onSwapDirection} disabled={!wallet} />
      </div>

      {/* TO Section */}
      <div className="pt-3">
        <label htmlFor="to-token-compact" className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1.5">
          To
        </label>
        <select
          id="to-token-compact"
          className="w-full theme-input text-sm font-bold text-white cursor-pointer"
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
