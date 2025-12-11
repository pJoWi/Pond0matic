"use client";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "circular" | "text" | "card";
  animation?: "pulse" | "shimmer" | "none";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "default",
  animation = "shimmer",
  width,
  height,
}: SkeletonProps) {
  const variantStyles = {
    default: "rounded-lg",
    circular: "rounded-full",
    text: "rounded h-4",
    card: "rounded-2xl",
  };

  const animationStyles = {
    pulse: "animate-led-pulse",
    shimmer: "skeleton",
    none: "",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn(
        "bg-cyber-black/40",
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

// Preset skeleton components for common use cases
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass-premium p-4 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonSwapCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "glass-intense mesh-gradient-bg rounded-2xl p-5 space-y-4 border border-ember-orange/30",
        className
      )}
    >
      {/* From Token */}
      <div className="space-y-2">
        <Skeleton variant="text" width="20%" height={12} />
        <div className="flex gap-2">
          <Skeleton width={100} height={40} className="rounded-lg" />
          <Skeleton className="flex-1 rounded-lg" height={40} />
        </div>
      </div>

      {/* Swap Icon */}
      <div className="flex justify-center">
        <Skeleton variant="circular" width={36} height={36} />
      </div>

      {/* To Token */}
      <div className="space-y-2">
        <Skeleton variant="text" width="20%" height={12} />
        <Skeleton className="rounded-lg" height={40} />
      </div>

      {/* Mode Pills */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={36} className="rounded-lg" />
        ))}
      </div>

      {/* Action Button */}
      <Skeleton height={48} className="rounded-xl" />
    </div>
  );
}

export function SkeletonActivityFeed({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 bg-cyber-black/40 rounded-lg">
          <Skeleton variant="circular" width={24} height={24} />
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="40%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}
