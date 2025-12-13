"use client";
import { cn } from "@/lib/utils";

interface TokenPriceSkeletonProps {
  borderColor?: string;
}

export function TokenPriceSkeleton({ borderColor = "border-lily-green/40" }: TokenPriceSkeletonProps) {
  return (
    <div
      className={cn(
        "relative bg-pond-water/30 backdrop-blur-xl border-2 rounded-xl p-4 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
        borderColor
      )}
    >
      {/* Header with token name and image skeleton */}
      <div className="flex items-center justify-between mb-2">
        <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
        <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
      </div>

      {/* Price skeleton */}
      <div className="h-8 w-24 bg-white/10 rounded mb-1 animate-pulse" />

      {/* Label skeleton */}
      <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
    </div>
  );
}
