"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface DewdropGlowProps {
  color?: "teal" | "green" | "pink" | "amber";
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
} as const;

const COLOR_CLASSES = {
  teal: "bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.6)]",
  green: "bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]",
  pink: "bg-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.6)]",
  amber: "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]",
} as const;

/**
 * Decorative dewdrop accent with a soft pond-bioluminescent glow.
 */
export function DewdropGlow({ color = "teal", size = "sm" }: DewdropGlowProps) {
  return (
    <div
      className={cn(
        "rounded-full animate-pond-pulse-soft",
        SIZE_CLASSES[size],
        COLOR_CLASSES[color]
      )}
    />
  );
}
