"use client";
import React from "react";

interface BoostPanelProps {
  minAmount: string;
  maxAmount: string;
  onMinChange: (amount: string) => void;
  onMaxChange: (amount: string) => void;
}

export function BoostPanel({ minAmount, maxAmount, onMinChange, onMaxChange }: BoostPanelProps) {
  return (
    <div className="space-y-2 p-4 bg-purple-500/15 border border-purple-500/40 rounded-xl animate-slide-down">
      <div className="text-xs uppercase tracking-wider text-purple-400 font-semibold flex items-center gap-1.5">
        <span>🚀</span>
        <span>Boost Mode</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="boost-min" className="block text-[10px] text-purple-300/80 mb-1">
            Min
          </label>
          <input
            id="boost-min"
            type="text"
            value={minAmount}
            onChange={(e) => onMinChange(e.target.value)}
            className="w-full px-3 py-2 bg-cyber-black/50 border border-purple-500/30 rounded-lg text-sm font-mono text-white focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
            placeholder="0.0"
          />
        </div>
        <div>
          <label htmlFor="boost-max" className="block text-[10px] text-purple-300/80 mb-1">
            Max
          </label>
          <input
            id="boost-max"
            type="text"
            value={maxAmount}
            onChange={(e) => onMaxChange(e.target.value)}
            className="w-full px-3 py-2 bg-cyber-black/50 border border-purple-500/30 rounded-lg text-sm font-mono text-white focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
            placeholder="0.0"
          />
        </div>
      </div>
      <p className="text-[10px] text-purple-300/60">Randomizes swap amounts between min and max</p>
    </div>
  );
}
