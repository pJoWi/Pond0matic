"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { SwapMode } from "@/types/swapModes";

/**
 * Dual action button component for pause/stop controls
 * Provides immediate visual feedback and granular control over swap sequences
 */
interface DualActionButtonProps {
  /** Whether a swap is currently running */
  running: boolean;
  /** Whether the swap sequence is paused */
  paused: boolean;
  /** Whether a stop request is pending */
  stopping: boolean;
  /** Total number of swaps to execute (or Infinity for continuous mode) */
  totalSwaps: number | typeof Infinity;
  /** Current swap index in the sequence */
  currentSwapIndex: number;
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Callback to start the swap operation */
  onStart: () => void;
  /** Callback to pause the swap operation */
  onPause: () => void;
  /** Callback to resume the swap operation */
  onResume: () => void;
  /** Callback to stop the swap operation */
  onStop: () => void;
  /** Current swap mode (normal, boost, or rewards) */
  mode?: SwapMode;
}

/**
 * Ripple effect interface for tracking click animations
 */
interface Ripple {
  x: number;
  y: number;
  id: number;
}

/**
 * Renders the primary action controls for swap operations
 * Shows single start button when idle, dual pause/stop buttons when running
 */
export function DualActionButton({
  running,
  paused,
  stopping,
  totalSwaps,
  currentSwapIndex,
  disabled,
  onStart,
  onPause,
  onResume,
  onStop,
  mode
}: DualActionButtonProps) {
  // Track click positions for ripple effect
  const [ripples, setRipples] = useState<Ripple[]>([]);

  /**
   * Create ripple animation on button click
   * Provides immediate tactile feedback
   */
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  };

  const countDisplay = totalSwaps === Infinity ? "∞" : totalSwaps;
  const progress = currentSwapIndex > 0 ? `(${currentSwapIndex}/${countDisplay})` : "";

  // IDLE State - Single Start Button
  if (!running && !paused) {
    const startLabel = mode === "normal" ? "SWAP" :
                      mode === "boost" ? "START BOOST" :
                      mode === "rewards" ? "START REWARDS" : "START SWAP";

    return (
      <button
        onClick={(e) => {
          handleRipple(e);
          onStart();
        }}
        disabled={disabled}
        aria-label={`Start ${mode || "swap"} execution`}
        className={cn(
          "relative overflow-hidden w-full h-14 rounded-xl font-bold text-lg text-white",
          "transition-all duration-300",
          "theme-button-solid theme-glow-intense",
          "hover:scale-[1.02] active:scale-[0.98]",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-darker",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100",
        )}
        style={{
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      >
        <RippleEffect ripples={ripples} color="var(--theme-glow)" />
        {startLabel}
      </button>
    );
  }

  // STOPPING State - Single Disabled Button
  if (stopping) {
    return (
      <button
        disabled
        aria-label="Stopping swap sequence"
        aria-live="polite"
        className={cn(
          "w-full h-14 rounded-xl font-bold text-lg text-white",
          "bg-gradient-to-r from-red-600 to-red-500",
          "border-2 border-red-500/50",
          "shadow-[0_0_20px_rgba(239,68,68,0.6)]",
          "animate-pulse opacity-60 cursor-not-allowed"
        )}
      >
        STOPPING... {progress}
      </button>
    );
  }

  // RUNNING or PAUSED State - Dual Buttons
  return (
    <div className="flex gap-2 w-full">
      {/* PAUSE/RESUME Button */}
      <button
        onClick={(e) => {
          handleRipple(e);
          paused ? onResume() : onPause();
        }}
        aria-label={paused ? `Resume swap sequence ${progress}` : `Pause swap sequence ${progress}`}
        className={cn(
          "relative overflow-hidden flex-1 h-14 rounded-xl font-bold text-base text-white",
          "transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-darker",
          "active:scale-[0.98]",
          paused
            ? "theme-button-solid theme-glow-intense hover:scale-[1.02]" // Resume: theme colors
            : "bg-gradient-to-r from-amber-600 to-yellow-500 border-2 border-amber-500/50 shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:shadow-[0_0_30px_rgba(251,191,36,0.8)] hover:scale-[1.02]" // Pause: amber
        )}
        style={{
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      >
        <RippleEffect
          ripples={ripples}
          color={paused ? "var(--theme-glow)" : "rgba(251,191,36,0.6)"}
        />
        {paused ? "RESUME" : "PAUSE"} {progress}
      </button>

      {/* STOP Button */}
      <button
        onClick={(e) => {
          handleRipple(e);
          onStop();
        }}
        aria-label={`Stop swap sequence completely ${progress}`}
        className={cn(
          "relative overflow-hidden flex-1 h-14 rounded-xl font-bold text-base text-white",
          "bg-gradient-to-r from-red-600 to-red-500",
          "border-2 border-red-500/50",
          "shadow-[0_0_20px_rgba(239,68,68,0.6)]",
          "hover:shadow-[0_0_30px_rgba(239,68,68,0.8)]",
          "transition-all duration-300",
          "hover:scale-[1.02] active:scale-[0.98]",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-darker focus:ring-red-500",
        )}
        style={{
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      >
        <RippleEffect ripples={ripples} color="rgba(239,68,68,0.6)" />
        STOP {progress}
      </button>
    </div>
  );
}

/**
 * Ripple effect component for tactile feedback
 * Creates expanding circle animation from click point
 */
function RippleEffect({
  ripples,
  color
}: {
  ripples: Ripple[];
  color: string;
}) {
  return (
    <>
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            backgroundColor: color,
          }}
        />
      ))}
    </>
  );
}
