"use client";
import React from "react";
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
  return (
    <div className="px-4 py-3 border-b theme-border bg-black/50 backdrop-blur-sm transition-all duration-500">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-lg">🐽</span>
          <span className="text-sm font-semibold tracking-wide theme-gradient-text">PondX</span>
        </div>

        {/* Mode Badge + Wallet Status */}
        <div className="flex items-center gap-3">
          {/* Mode Badge */}
          {useNewModes && (
            <div className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider theme-border bg-theme-surface theme-text-primary transition-all duration-500">
              {mode === "normal" && "⚡ Normal"}
              {mode === "boost" && "🚀 Boost"}
              {mode === "rewards" && "💰 Rewards"}
            </div>
          )}

          {/* Wallet Status */}
          {wallet ? (
            <div className="flex items-center gap-2">
              <div className="status-dot" />
              <button
                onClick={onDisconnect}
                className="px-2 py-1 text-[11px] font-mono text-gray-300 hover:theme-text-primary transition-colors"
              >
                {short(wallet, 4)}
              </button>
            </div>
          ) : (
            <button
              onClick={onConnect}
              className="theme-button text-[11px] font-semibold hover:scale-105 active:scale-95"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
