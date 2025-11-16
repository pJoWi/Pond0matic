"use client";
import React from "react";

interface SettingsPanelProps {
  platformFeeBps: number;
  slippageBps: number;
  onPlatformFeeChange: (bps: number) => void;
  onSlippageChange: (bps: number) => void;
}

export function SettingsPanel({
  platformFeeBps,
  slippageBps,
  onPlatformFeeChange,
  onSlippageChange,
}: SettingsPanelProps) {
  const formatBps = (bps: number) => {
    const percentage = (bps / 100).toFixed(2);
    return `${bps} bps (${percentage}%)`;
  };

  return (
    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Platform Fee Slider */}
        <div className="space-y-2">
          <label htmlFor="platform-fee-slider" className="block text-[10px] uppercase tracking-widest text-yellow-300/80 font-semibold">
            Platform Fee
          </label>
          <input
            id="platform-fee-slider"
            type="range"
            min="0"
            max="200"
            step="5"
            value={platformFeeBps}
            onChange={(e) => onPlatformFeeChange(Number(e.target.value))}
            className="w-full h-2 bg-cyber-black/50 rounded-lg appearance-none cursor-pointer accent-yellow-500
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-500
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-yellow-400
                     [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110
                     [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(234,179,8,0.6)]
                     [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-yellow-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-yellow-400
                     [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:scale-110
                     [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(234,179,8,0.6)]"
          />
          <div className="text-xs font-mono text-yellow-300 text-center">{formatBps(platformFeeBps)}</div>
        </div>

        {/* Slippage Slider */}
        <div className="space-y-2">
          <label htmlFor="slippage-slider" className="block text-[10px] uppercase tracking-widest text-yellow-300/80 font-semibold">
            Slippage
          </label>
          <input
            id="slippage-slider"
            type="range"
            min="10"
            max="200"
            step="10"
            value={slippageBps}
            onChange={(e) => onSlippageChange(Number(e.target.value))}
            className="w-full h-2 bg-cyber-black/50 rounded-lg appearance-none cursor-pointer accent-yellow-500
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-500
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-yellow-400
                     [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110
                     [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(234,179,8,0.6)]
                     [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-yellow-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-yellow-400
                     [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:scale-110
                     [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(234,179,8,0.6)]"
          />
          <div className="text-xs font-mono text-yellow-300 text-center">{formatBps(slippageBps)}</div>
        </div>
      </div>
    </div>
  );
}
