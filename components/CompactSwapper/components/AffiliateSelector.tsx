"use client";
import React from "react";
import { cn } from "@/lib/utils";

type Affiliate = "pond0x" | "aquavaults";

interface AffiliateSelectorProps {
  affiliate: Affiliate;
  currentVault: string | null;
  onAffiliateChange: (affiliate: Affiliate) => void;
}

export function AffiliateSelector({ affiliate, currentVault, onAffiliateChange }: AffiliateSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
        Referral Program
      </label>

      {/* Affiliate Toggle Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onAffiliateChange("pond0x")}
          className={cn(
            "flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 border",
            affiliate === "pond0x"
              ? "bg-ember-orange/20 border-ember-orange text-ember-orange-light shadow-[0_0_10px_rgba(255,107,53,0.3)] scale-[1.02]"
              : "bg-cyber-black/30 border-gray-600 text-gray-400 hover:border-ember-orange/40 hover:text-gray-300",
            "active:scale-95 focus:outline-none focus:ring-2 focus:ring-ember-orange/50"
          )}
          aria-pressed={affiliate === "pond0x"}
        >
          Pond0x
        </button>
        <button
          onClick={() => onAffiliateChange("aquavaults")}
          className={cn(
            "flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 border",
            affiliate === "aquavaults"
              ? "bg-ember-orange/20 border-ember-orange text-ember-orange-light shadow-[0_0_10px_rgba(255,107,53,0.3)] scale-[1.02]"
              : "bg-cyber-black/30 border-gray-600 text-gray-400 hover:border-ember-orange/40 hover:text-gray-300",
            "active:scale-95 focus:outline-none focus:ring-2 focus:ring-ember-orange/50"
          )}
          aria-pressed={affiliate === "aquavaults"}
        >
          AquaVaults
        </button>
      </div>

      {/* Current Vault Display */}
      {currentVault && (
        <div className="p-2 bg-cyber-black/40 border border-gray-700/50 rounded-lg">
          <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-0.5">Fee Vault</div>
          <div className="font-mono text-[11px] text-ember-orange-light/80 truncate">{currentVault}</div>
        </div>
      )}
    </div>
  );
}
