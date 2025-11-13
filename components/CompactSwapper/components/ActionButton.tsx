"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  running: boolean;
  autoActive: boolean;
  autoCount: number;
  currentSwapIndex: number;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function ActionButton({ running, autoActive, autoCount, currentSwapIndex, disabled, onStart, onStop }: ActionButtonProps) {
  const getButtonLabel = () => {
    if (running) {
      if (currentSwapIndex > 0) {
        return `🛑 STOP (${currentSwapIndex}/${autoCount})`;
      }
      return "🛑 STOP";
    }
    return "⚡ START SWAP";
  };

  return (
    <button
      onClick={running ? onStop : onStart}
      disabled={disabled && !running}
      className={cn(
        "w-full h-14 rounded-xl font-bold text-lg text-white",
        "transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-darker",
        "active:scale-[0.98]",
        running
          ? "bg-gradient-to-r from-red-600 to-red-500 border-2 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-glow-pulse hover:shadow-[0_0_30px_rgba(239,68,68,0.8)] focus:ring-red-500"
          : "bg-gradient-to-r from-ember-orange via-ember-amber to-ember-gold border-2 border-ember-orange/50 shadow-ember-orange-md hover:shadow-ember-orange-intense hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 disabled:hover:shadow-ember-orange-md focus:ring-ember-orange"
      )}
      style={{
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      {getButtonLabel()}
    </button>
  );
}
