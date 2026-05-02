"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { WaterRipple } from "./WaterRipple";

export type LilyPadStatus = "positive" | "negative" | "warning" | "neutral";

export interface LilyPadCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  loading?: boolean;
  status?: LilyPadStatus;
  icon?: string;
}

const STATUS_COLORS: Record<LilyPadStatus, string> = {
  positive: "bg-emerald-950/80 border-emerald-400/40 hover:border-emerald-400/60",
  negative: "bg-rose-950/80 border-pink-400/40 hover:border-pink-400/60",
  warning: "bg-amber-950/80 border-amber-400/40 hover:border-amber-400/60",
  neutral: "bg-slate-950/80 border-teal-400/30 hover:border-teal-400/50",
};

const VALUE_COLORS: Record<LilyPadStatus, string> = {
  positive: "text-emerald-300",
  negative: "text-pink-300",
  warning: "text-amber-300",
  neutral: "text-cyan-200",
};

/**
 * Organic lily-pad shaped metric card with glass-morphic surface
 * and a hover-triggered water ripple effect.
 */
export function LilyPadCard({
  title,
  value,
  subtitle,
  loading,
  status = "neutral",
  icon,
}: LilyPadCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative backdrop-blur-xl border-2 transition-all duration-500 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        "rounded-[2rem_3rem_2.5rem_2rem]",
        "hover:shadow-[0_12px_48px_rgba(45,212,191,0.2)]",
        "animate-pond-float",
        STATUS_COLORS[status]
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-30" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(45,212,191,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(74,222,128,0.15)_0%,transparent_50%)]" />
      </div>

      {isHovered && <WaterRipple />}

      <div className="relative p-5 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-medium tracking-wide text-teal-300/90 uppercase">
            {title}
          </div>
          {icon && <span className="text-lg opacity-80">{icon}</span>}
        </div>

        <div
          className={cn(
            "text-3xl font-semibold tabular-nums tracking-tight mb-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]",
            VALUE_COLORS[status]
          )}
        >
          {loading ? <span className="inline-block animate-pulse">--</span> : value}
        </div>

        {subtitle && (
          <div className="text-[10px] text-teal-400/70 tracking-wide">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
