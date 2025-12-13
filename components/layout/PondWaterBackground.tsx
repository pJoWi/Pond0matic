"use client";
import React from "react";

interface PondWaterBackgroundProps {
  enabled: boolean;
}

/**
 * PondWaterBackground - Animated water/pond effect background
 * Features:
 * - Animated water surface with breathing effect
 * - Multiple ripple layers for depth
 * - Floating lily pads with shimmer
 * - Underwater light caustics
 * - Drifting water particles
 * - Surface reflections and wave lines
 *
 * Performance optimized with CSS animations
 */
export function PondWaterBackground({ enabled }: PondWaterBackgroundProps) {
  return (
    <div className={`pond-water-container ${enabled ? "" : "water-off"}`}>
      {/* Base water surface */}
      <div className="pond-water-surface" />

      {/* Depth gradient for pond feel */}
      <div className="pond-depth-gradient" />

      {/* Animated ripples (5 layers) */}
      <div className="pond-ripple pond-ripple-1" />
      <div className="pond-ripple pond-ripple-2" />
      <div className="pond-ripple pond-ripple-3" />
      <div className="pond-ripple pond-ripple-4" />
      <div className="pond-ripple pond-ripple-5" />

      {/* Floating lily pads */}
      <div className="lily-pad lily-pad-1" />
      <div className="lily-pad lily-pad-2" />
      <div className="lily-pad lily-pad-3" />

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

      {/* Surface reflection shimmer */}
      <div className="pond-surface-reflection" />

      {/* Horizontal wave lines */}
      <div className="wave-line wave-line-1" />
      <div className="wave-line wave-line-2" />
      <div className="wave-line wave-line-3" />


    </div>
  );
}
