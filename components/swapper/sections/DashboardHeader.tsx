"use client";
import React from "react";
import { TokenIcon } from "@/components/icons/tokens";
import { BubbleAnimation } from "@/components/ui/BubbleAnimation";
import { DewdropGlow } from "@/components/ui/DewdropGlow";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { getBadgeEmoji } from "@/lib/badges";

interface DashboardHeaderProps {
  badges?: string;
  isPro?: boolean;
  walletSlot?: React.ReactNode;
}

/**
 * POND0X-branded header card with logo, badges, and pro tier marker.
 * Renders a wallet slot below the header card if provided.
 */
export function DashboardHeader({ badges = "", isPro = false, walletSlot }: DashboardHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="relative bg-gradient-to-br from-slate-950/90 via-teal-950/85 to-cyan-950/90 backdrop-blur-2xl rounded-[3rem_2rem_3rem_2.5rem] border-2 border-teal-400/30 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-0 bg-black/30" />

        <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
          <BubbleAnimation bubbleCount={12} colorScheme="mixed" density="normal" />
        </div>

        <div className="absolute inset-0 overflow-hidden opacity-15 z-0">
          <div className="absolute top-0 left-1/4 w-32 h-full bg-gradient-to-b from-cyan-300/40 to-transparent rotate-12 blur-2xl animate-pond-sway" />
          <div className="absolute top-0 right-1/3 w-24 h-full bg-gradient-to-b from-teal-300/30 to-transparent -rotate-6 blur-2xl animate-pond-sway-delayed" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-300/10 animate-pond-shimmer-slow z-0" />

        <div className="relative z-10 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-5">
              <div className="relative animate-pond-float">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400/30 via-teal-400/25 to-cyan-400/30 border-2 border-emerald-400/50 flex items-center justify-center shadow-[0_0_40px_rgba(74,222,128,0.5)] backdrop-blur-sm">
                  <TokenIcon
                    info={{ symbol: "wPOND", icon: "/tokens/solana/wpond.png", name: "wPOND" }}
                    width={64}
                    height={64}
                    enableUnknownTokenWarning={false}
                  />
                </div>
                {isPro && (
                  <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center border-2 border-slate-950 text-sm shadow-[0_0_20px_rgba(251,191,36,0.7)] animate-pond-pulse-soft">
                    ✨
                  </div>
                )}
                <div className="absolute -top-2 left-4">
                  <DewdropGlow color="teal" size="sm" />
                </div>
                <div className="absolute -bottom-1 -right-2">
                  <DewdropGlow color="green" size="sm" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-bold tracking-wide text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]">
                    POND0X
                  </h1>
                  <LiveIndicator />
                </div>
                <p className="text-sm font-medium text-teal-200/90 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  Ecosystem Dashboard
                </p>
              </div>
            </div>
          </div>

          {badges && (
            <div className="flex flex-wrap items-center gap-3">
              {badges.split(", ").map((badge) => {
                const emoji = getBadgeEmoji(badge);
                return (
                  <div
                    key={badge}
                    className="px-4 py-2 bg-teal-950/70 backdrop-blur-xl border border-amber-400/50 rounded-full font-medium text-xs text-amber-200 flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-amber-400/70 hover:shadow-[0_6px_30px_rgba(251,191,36,0.3)] transition-all animate-pond-float"
                  >
                    {emoji && <span className="text-base">{emoji}</span>}
                    <span className="tracking-wide">{badge}</span>
                  </div>
                );
              })}

              {isPro && (
                <div className="px-4 py-2 bg-gradient-to-r from-amber-900/60 to-yellow-900/60 backdrop-blur-xl border border-amber-400/60 rounded-full font-semibold text-xs text-amber-100 flex items-center gap-2 shadow-[0_4px_24px_rgba(0,0,0,0.5)] animate-pond-float">
                  <span className="text-base">✨</span>
                  <span className="tracking-wide">PRO MEMBER</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {walletSlot}
    </div>
  );
}
