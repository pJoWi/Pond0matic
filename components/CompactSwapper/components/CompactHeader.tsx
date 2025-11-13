"use client";
import React from "react";
import { StatusLED } from "./StatusLED";
import { short } from "@/lib/utils";

interface CompactHeaderProps {
  wallet: string;
  networkStatus: "online" | "offline";
  onConnect: () => Promise<string>;
  onDisconnect: () => Promise<void>;
}

export function CompactHeader({ wallet, networkStatus, onConnect, onDisconnect }: CompactHeaderProps) {
  return (
    <div className="px-5 py-3 border-b border-ember-orange/20 bg-cyber-darker/90 backdrop-blur-cyber">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-lg">🌊</span>
          <span className="text-sm font-semibold text-ember-orange-light tracking-wide">PondX</span>
        </div>

        {/* Wallet Status */}
        <div className="flex items-center gap-2">
          {wallet ? (
            <>
              <StatusLED color="green" pulsing size="sm" />
              <button
                onClick={onDisconnect}
                className="px-2 py-1 text-[11px] font-mono text-gray-300 hover:text-ember-orange-light transition-colors"
              >
                {short(wallet, 4)}
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              className="px-3 py-1.5 bg-gradient-to-r from-ember-orange/20 to-ember-amber/20 border border-ember-orange/50 rounded-lg text-[11px] font-semibold text-ember-orange-light hover:bg-ember-orange/30 hover:scale-105 active:scale-95 transition-all"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
