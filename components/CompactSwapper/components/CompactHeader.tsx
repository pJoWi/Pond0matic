"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { StatusLED } from "./StatusLED";
import { short } from "@/lib/utils";
import type { SwapMode } from "@/types/swapModes";

interface CompactHeaderProps {
  wallet: string;
  networkStatus: "online" | "offline";
  onConnect: () => Promise<string>;
  onDisconnect: () => Promise<void>;
  mode?: SwapMode;
  useNewModes?: boolean;
}

export function CompactHeader({ wallet, networkStatus, onConnect, onDisconnect, mode = "normal", useNewModes = true }: CompactHeaderProps) {
  // Mode-based theme colors for buttons only
  const modeTheme = {
    normal: {
      badgeGradient: "from-lily-green to-emerald-600",
      border: "border-lily-green/60",
      glow: "rgba(107, 157, 120, 0.4)",
    },
    boost: {
      badgeGradient: "from-orange-500 to-red-600",
      border: "border-orange-500/60",
      glow: "rgba(255, 107, 53, 0.4)",
    },
    rewards: {
      badgeGradient: "from-cyan-400 to-blue-600",
      border: "border-cyan-400/60",
      glow: "rgba(109, 213, 237, 0.4)",
    },
  }[mode];

  return (
    <div className="relative overflow-hidden">
      {/* Circuitboard background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        {/* Horizontal circuit lines */}
        <div className="absolute top-[25%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lily-green/40 to-transparent" style={{ animation: "circuit-glow 3s ease-in-out infinite" }} />
        <div className="absolute top-[50%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lily-green/40 to-transparent" style={{ animation: "circuit-glow 4s ease-in-out infinite 0.5s" }} />
        <div className="absolute top-[75%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lily-green/40 to-transparent" style={{ animation: "circuit-glow 3.5s ease-in-out infinite 1s" }} />

        {/* Vertical circuit lines */}
        <div className="absolute left-[20%] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-lily-green/30 to-transparent" style={{ animation: "circuit-glow 4s ease-in-out infinite 0.3s" }} />
        <div className="absolute left-[50%] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-lily-green/30 to-transparent" style={{ animation: "circuit-glow 3.5s ease-in-out infinite 0.8s" }} />
        <div className="absolute left-[80%] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-lily-green/30 to-transparent" style={{ animation: "circuit-glow 4s ease-in-out infinite 1.2s" }} />

        {/* Circuit nodes at intersections */}
        <div className="absolute top-[25%] left-[20%] w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: "spark-pulse 2s ease-in-out infinite" }} />
        <div className="absolute top-[50%] left-[50%] w-1.5 h-1.5 rounded-full bg-orange-400" style={{ animation: "spark-pulse 2.5s ease-in-out infinite 0.5s" }} />
        <div className="absolute top-[75%] left-[80%] w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: "spark-pulse 2.2s ease-in-out infinite 1s" }} />

        {/* Traveling sparks */}
        <div className="absolute top-[50%] left-0 right-0 h-0.5">
          <div className="absolute w-6 h-full bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full" style={{ animation: "spark-travel 4s linear infinite" }} />
        </div>
      </div>

      <div
        className={cn(
          "relative px-4 py-3 border-b backdrop-blur-xl transition-all duration-500",
          "bg-gradient-to-br from-lily-green/15 via-pond-deep/90 to-lily-green/20",
          "border-lily-green/30"
        )}
        style={{ boxShadow: "0 4px 12px rgba(74, 124, 89, 0.15)" }}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            {/* Mode Badge */}
            {useNewModes && (
              <div
                className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all duration-500",
                  `bg-gradient-to-r ${modeTheme.badgeGradient} ${modeTheme.border}`,
                  "text-white shadow-md"
                )}
                style={{ boxShadow: `0 0 10px ${modeTheme.glow}` }}
              >
                {mode === "normal" && "⚡ Normal"}
                {mode === "boost" && "🔥 Boost"}
                {mode === "rewards" && "❄️ Rewards"}
              </div>
            )}
          </div>

          {/* Mode Badge + Wallet Status */}
          <div className="flex items-center gap-3">
           

            {/* Wallet Status */}
            {wallet ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                <button
                  onClick={onDisconnect}
                  className="px-2 py-1 text-[11px] font-mono text-gray-300 hover:text-white transition-colors"
                >
                  {short(wallet, 4)}
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                className={cn(
                  "px-3 py-1 rounded-lg text-[11px] font-semibold border-2 transition-all duration-300",
                  `bg-gradient-to-r ${modeTheme.badgeGradient} ${modeTheme.border}`,
                  "text-white hover:scale-105 active:scale-95"
                )}
                style={{ boxShadow: `0 0 12px ${modeTheme.glow}` }}
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
