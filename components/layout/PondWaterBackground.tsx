"use client";
import React from "react";

interface PondWaterBackgroundProps {
  enabled: boolean;
}

/**
 * PondWaterBackground - Enchanted Magical Pond Background
 * Features:
 * - Animated water surface with breathing effect
 * - Multiple ripple layers for depth
 * - Floating lily pads with V-notches, shimmer, and glint effects
 * - Underwater light caustics
 * - Drifting water particles
 * - Surface reflections
 * - Magical sparkles (fairy dust)
 * - Glowing fireflies
 * - Mystical fog and iridescent shimmer
 * - Enchanted ripples
 *
 * Performance optimized with GPU-accelerated CSS animations
 */
export function PondWaterBackground({ enabled }: PondWaterBackgroundProps) {
  return (
    <div className={`pond-water-container ${enabled ? "" : "water-off"}`}>
      {/* Base water surface */}
      <div className="pond-water-surface" />

      {/* Depth gradient for pond feel */}
      <div className="pond-depth-gradient" />

      {/* Mystical fog layer */}
      <div className="mystical-fog" />

      {/* Iridescent shimmer overlay */}
      <div className="iridescent-shimmer" />

      {/* Animated ripples (5 layers) */}
      <div className="pond-ripple pond-ripple-1" />
      <div className="pond-ripple pond-ripple-2" />
      <div className="pond-ripple pond-ripple-3" />
      <div className="pond-ripple pond-ripple-4" />
      <div className="pond-ripple pond-ripple-5" />

      {/* Enchanted magical ripples */}
      {/* <div className="enchanted-ripple enchanted-ripple-1" />
      <div className="enchanted-ripple enchanted-ripple-2" /> */}

      {/* Floating lily pads */}
      <div className="lily-pad lily-pad-1" />
      <div className="lily-pad lily-pad-2" />
      <div className="lily-pad lily-pad-3" />
      <div className="lily-pad lily-pad-4" />
      <div className="lily-pad lily-pad-5" />
      <div className="lily-pad lily-pad-6" />
      <div className="lily-pad lily-pad-7" />

      {/* Underwater light caustics */}
      <div className="water-caustics" />

      {/* Drifting water particles */}
      <div className="water-particle water-particle-1" />
      <div className="water-particle water-particle-2" />
      <div className="water-particle water-particle-3" />
      <div className="water-particle water-particle-4" />
      <div className="water-particle water-particle-5" />
      <div className="water-particle water-particle-6" />
      <div className="water-particle water-particle-7" />
      <div className="water-particle water-particle-8" />

      {/* Magical sparkles - fairy dust */}
      <div className="magic-sparkle magic-sparkle-1" />
      <div className="magic-sparkle magic-sparkle-2" />
      <div className="magic-sparkle magic-sparkle-3" />
      <div className="magic-sparkle magic-sparkle-4" />
      <div className="magic-sparkle magic-sparkle-5" />
      <div className="magic-sparkle magic-sparkle-6" />
      <div className="magic-sparkle magic-sparkle-7" />
      <div className="magic-sparkle magic-sparkle-8" />

      {/* Magical fireflies - glowing orbs */}
      <div className="magic-firefly magic-firefly-1" />
      <div className="magic-firefly magic-firefly-2" />
      <div className="magic-firefly magic-firefly-3" />
      <div className="magic-firefly magic-firefly-4" />
      <div className="magic-firefly magic-firefly-5" />

      {/* Surface reflection shimmer */}
      <div className="pond-surface-reflection" />
    </div>
  );
}
