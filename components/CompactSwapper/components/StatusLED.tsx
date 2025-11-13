"use client";
import React from "react";
import { cn } from "@/lib/utils";

type LEDColor = "green" | "blue" | "red" | "yellow" | "gray";

interface StatusLEDProps {
  color: LEDColor;
  pulsing?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const colorClasses: Record<LEDColor, string> = {
  green: "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.9)]",
  blue: "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]",
  red: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]",
  yellow: "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]",
  gray: "bg-gray-500 shadow-[0_0_6px_rgba(107,114,128,0.5)]",
};

const sizeClasses = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

export function StatusLED({ color, pulsing = false, size = "md", label, className }: StatusLEDProps) {
  return (
    <div className={cn("relative inline-flex items-center gap-2", className)} title={label}>
      <div
        className={cn(
          "rounded-full relative transition-all duration-300",
          sizeClasses[size],
          colorClasses[color],
          pulsing && "animate-led-pulse"
        )}
      >
        {/* Inner glow effect for active states */}
        {pulsing && color === "green" && (
          <div className="absolute inset-0 rounded-full bg-white opacity-40 animate-ping"></div>
        )}
      </div>
      {label && <span className="text-xs text-gray-400">{label}</span>}
    </div>
  );
}
