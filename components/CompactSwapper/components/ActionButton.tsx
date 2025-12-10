"use client";
import React from "react";
import { cn } from "@/lib/utils";
import type { SwapMode } from "@/types/swapModes";

/**
 * Action button component for initiating or stopping swap operations
 * Displays different labels and styles based on the current mode and running state
 */
interface ActionButtonProps {
  /** Whether a swap is currently running */
  running: boolean;
  /** Total number of swaps to execute (or Infinity for continuous mode) */
  totalSwaps: number | typeof Infinity;
  /** Current swap index in the sequence */
  currentSwapIndex: number;
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Callback to start the swap operation */
  onStart: () => void;
  /** Callback to stop the swap operation */
  onStop: () => void;
  /** Current swap mode (normal, boost, or rewards) */
  mode?: SwapMode;
}

/**
 * Renders the primary action button for swap operations
 * Shows progress indicator when running, mode-specific labels when idle
 */
export function ActionButton({
  running,
  totalSwaps,
  currentSwapIndex,
  disabled,
  onStart,
  onStop,
  mode
}: ActionButtonProps) {
  /**
   * Determine button label based on running state and mode
   * Running: Shows "STOP (current/total)" or "STOP"
   * Idle: Shows mode-specific label (e.g., "SWAP", "START BOOST", "START REWARDS")
   */
  const getButtonLabel = () => {
    if (running) {
      if (currentSwapIndex > 0) {
        const countDisplay = totalSwaps === Infinity ? "∞" : totalSwaps;
        return `STOP (${currentSwapIndex}/${countDisplay})`;
      }
      return "STOP";
    }

    // Mode system labels
    if (mode === "normal") {
      return "SWAP";
    }
    if (mode === "boost") {
      return "START BOOST";
    }
    if (mode === "rewards") {
      return "START REWARDS";
    }

    // Default label
    return "START SWAP";
  };

  /**
   * Get button styling classes based on running state
   * Running: Red with pulse animation
   * Idle: Theme-aware gradient with glow effects
   */
  const getButtonStyles = () => {
    if (running) {
      return "bg-gradient-to-r from-red-600 to-red-500 border-2 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse hover:shadow-[0_0_30px_rgba(239,68,68,0.8)]";
    }

    // Use theme-aware styling (CSS variables change based on mode)
    return "theme-button-solid theme-glow-intense hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100";
  };

  return (
    <button
      onClick={running ? onStop : onStart}
      disabled={disabled && !running}
      aria-label={running ? "Stop swap execution" : `Start ${mode || "swap"} execution`}
      className={cn(
        "w-full h-14 rounded-xl font-bold text-lg text-white",
        "transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-darker",
        "active:scale-[0.98]",
        getButtonStyles()
      )}
      style={{
        transform: "translateZ(0)", // Enable GPU acceleration
        willChange: "transform", // Optimize for transform animations
      }}
    >
      {getButtonLabel()}
    </button>
  );
}
