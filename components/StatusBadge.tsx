"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

type LEDStatus = "green" | "red" | "yellow" | "blue" | "gray";

interface StatusBadgeProps {
  label: string;
  value: string | number;
  ledStatus?: LEDStatus;
  flyoutContent?: React.ReactNode;
  className?: string;
}

export function StatusBadge({
  label,
  value,
  ledStatus = "gray",
  flyoutContent,
  className
}: StatusBadgeProps) {
  const [showFlyout, setShowFlyout] = useState(false);

  const ledColors = {
    green: "bg-neon-pink-light shadow-pink-green-sm",
    red: "bg-neon-red shadow-neon-red-sm",
    yellow: "bg-neon-red-light shadow-neon-red-sm",
    blue: "bg-neon-rose shadow-neon-rose-sm",
    gray: "bg-gray-500"
  };

  const ledPulse = {
    green: "animate-led-pulse",
    red: "animate-led-pulse",
    yellow: "animate-led-pulse",
    blue: "animate-led-pulse",
    gray: ""
  };

  return (
    <div
      className={cn("relative group", className)}
      onMouseEnter={() => flyoutContent && setShowFlyout(true)}
      onMouseLeave={() => flyoutContent && setShowFlyout(false)}
      onClick={() => flyoutContent && setShowFlyout(!showFlyout)}
    >
      {/* Badge */}
      <div className="flex items-center gap-3 px-4 py-3 bg-cyber-darker/80 backdrop-blur-md border border-neon-pink/20 rounded-lg hover:border-neon-pink/50 hover:shadow-neon-pink-sm transition-all duration-300 cursor-pointer">
        {/* LED Indicator */}
        <div className="relative flex items-center justify-center w-3 h-3">
          <div className={cn(
            "absolute w-3 h-3 rounded-full",
            ledColors[ledStatus],
            ledPulse[ledStatus]
          )}></div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
            {label}
          </div>
          <div className="text-sm font-bold text-white truncate">
            {value}
          </div>
        </div>
      </div>

      {/* Flyout Menu */}
      {flyoutContent && showFlyout && (
        <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-cyber-black/95 backdrop-blur-lg border border-neon-red/40 rounded-lg shadow-neon-red-sm p-4 animate-slide-down">
          <div className="text-sm text-gray-300">
            {flyoutContent}
          </div>
        </div>
      )}
    </div>
  );
}
