"use client";
import React from "react";

interface WaterRippleProps {
  delay?: number;
}

/**
 * Concentric circles expanding outward like ripples on pond water.
 * Use as an overlay inside a `relative` parent.
 */
export function WaterRipple({ delay = 0 }: WaterRippleProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full border border-teal-400/20 animate-pond-ripple"
        style={{ animationDelay: `${delay}ms` }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full border border-teal-400/15 animate-pond-ripple"
        style={{ animationDelay: `${delay + 600}ms` }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full border border-teal-400/10 animate-pond-ripple"
        style={{ animationDelay: `${delay + 1200}ms` }}
      />
    </div>
  );
}
