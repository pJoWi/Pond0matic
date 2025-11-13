"use client";
import React from "react";
import { ProgressBar } from "./ProgressBar";

interface AutoSwapSectionProps {
  autoActive: boolean;
  autoCount: number;
  autoDelayMs: number;
  running: boolean;
  currentSwapIndex: number;
  onAutoActiveChange: (active: boolean) => void;
  onAutoCountChange: (count: number) => void;
  onAutoDelayChange: (ms: number) => void;
}

export function AutoSwapSection({
  autoActive,
  autoCount,
  autoDelayMs,
  running,
  currentSwapIndex,
  onAutoActiveChange,
  onAutoCountChange,
  onAutoDelayChange,
}: AutoSwapSectionProps) {
  return (
    <div className="space-y-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
      {/* Toggle Row */}
      <label className="flex items-center justify-between cursor-pointer group">
        <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">Auto-Swap</span>
        <input
          type="checkbox"
          checked={autoActive}
          onChange={(e) => onAutoActiveChange(e.target.checked)}
          className="w-5 h-5 accent-blue-500 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-cyber-darker transition-all rounded"
        />
      </label>

      {/* Settings (when auto-swap is active) */}
      {autoActive && (
        <div className="grid grid-cols-2 gap-3 animate-slide-down">
          <div>
            <label htmlFor="auto-count" className="block text-[10px] text-blue-300/80 mb-1">
              Count
            </label>
            <input
              id="auto-count"
              type="number"
              min={1}
              value={autoCount}
              onChange={(e) => onAutoCountChange(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-1.5 bg-cyber-black/50 border border-blue-500/30 rounded-lg text-xs font-mono text-white focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            />
          </div>
          <div>
            <label htmlFor="auto-delay" className="block text-[10px] text-blue-300/80 mb-1">
              Delay (ms)
            </label>
            <input
              id="auto-delay"
              type="number"
              min={1000}
              step={500}
              value={autoDelayMs}
              onChange={(e) => onAutoDelayChange(Math.max(1000, Number(e.target.value)))}
              className="w-full px-3 py-1.5 bg-cyber-black/50 border border-blue-500/30 rounded-lg text-xs font-mono text-white focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            />
          </div>
        </div>
      )}

      {/* Progress Bar (during auto-swap) */}
      {running && autoActive && (
        <ProgressBar current={currentSwapIndex} total={autoCount} className="mt-3 animate-slide-down" />
      )}
    </div>
  );
}
