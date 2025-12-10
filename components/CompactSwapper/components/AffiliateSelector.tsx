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
            "flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300",
            affiliate === "pond0x"
              ? "theme-button-solid theme-glow scale-[1.02]"
              : "bg-black/30 theme-border text-gray-400 hover:theme-border-hover hover:text-gray-300",
            "active:scale-95 focus:outline-none"
          )}
          aria-pressed={affiliate === "pond0x"}
        >
          Pond0x
        </button>
        <button
          onClick={() => onAffiliateChange("aquavaults")}
          className={cn(
            "flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300",
            affiliate === "aquavaults"
              ? "theme-button-solid theme-glow scale-[1.02]"
              : "bg-black/30 theme-border text-gray-400 hover:theme-border-hover hover:text-gray-300",
            "active:scale-95 focus:outline-none"
          )}
          aria-pressed={affiliate === "aquavaults"}
        >
          AquaVaults
        </button>
      </div>

      {/* Current Vault Display */}
      {currentVault && (
        <div className="p-2 bg-black/40 theme-border rounded-lg">
          <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-0.5">Fee Vault</div>
          <div className="font-mono text-[11px] theme-text-muted truncate">{currentVault}</div>
        </div>
      )}
    </div>
  );
}
