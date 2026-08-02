"use client";
import React from "react";
import { cn } from "@/lib/utils";

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
  positive: "bg-surface border-accent hover:border-accent-strong",
  negative: "bg-surface border-danger",
  warning: "bg-surface border-warn",
  neutral: "bg-surface border-edge hover:border-accent",
};

const VALUE_COLORS: Record<LilyPadStatus, string> = {
  positive: "text-accent",
  negative: "text-danger",
  warning: "text-warn",
  neutral: "text-ink",
};

/**
 * Metric card with Deep Pond semantic tokens.
 * The `status` prop drives border accent and value colour.
 */
export function LilyPadCard({
  title,
  value,
  subtitle,
  loading,
  status = "neutral",
  icon,
}: LilyPadCardProps) {
  return (
    <div
      className={cn(
        "relative border transition-all duration-300 overflow-hidden rounded-card",
        STATUS_COLORS[status]
      )}
    >
      <div className="relative p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">
            {title}
          </div>
          {icon && <span className="text-lg opacity-80">{icon}</span>}
        </div>

        <div
          className={cn(
            "text-3xl font-semibold font-num tracking-tight mb-1.5",
            VALUE_COLORS[status]
          )}
        >
          {loading ? <span className="inline-block animate-pulse">--</span> : value}
        </div>

        {subtitle && (
          <div className="text-[10px] text-ink-muted tracking-wide">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
