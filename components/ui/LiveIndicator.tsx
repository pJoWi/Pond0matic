"use client";
import React from "react";

/**
 * Pulsing live-indicator. Used to flag real-time data sections.
 */
export function LiveIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pond-pulse-soft shadow-[0_0_10px_rgba(74,222,128,0.6)]" />
        <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-400/40 rounded-full animate-pond-ping-slow" />
      </div>
      <span className="text-[10px] font-medium tracking-wide text-emerald-300/90">Live</span>
    </div>
  );
}
