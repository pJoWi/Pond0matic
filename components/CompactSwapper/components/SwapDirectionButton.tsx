"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface SwapDirectionButtonProps {
  onSwap: () => void;
  disabled?: boolean;
}

export function SwapDirectionButton({ onSwap, disabled }: SwapDirectionButtonProps) {
  const [isRotating, setIsRotating] = useState(false);

  const handleClick = () => {
    if (disabled || isRotating) return;

    setIsRotating(true);
    onSwap();

    setTimeout(() => setIsRotating(false), 500);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "relative group p-2.5 rounded-full border-2 transition-all duration-300",
        "bg-black/90 backdrop-blur-sm",
        "theme-border theme-glow",
        "hover:theme-border-hover hover:theme-glow-intense hover:scale-110",
        "active:scale-90",
        "focus:outline-none",
        "disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none",
        isRotating && "scale-110 theme-glow-intense"
      )}
      style={{
        transform: "translateZ(0)",
        willChange: "transform",
      }}
      aria-label="Swap token direction"
    >
      <svg
        className={cn(
          "w-5 h-5 transition-all duration-500 theme-text-primary",
          isRotating && "rotate-180"
        )}
        style={{
          transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          transformOrigin: "center",
        }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    </button>
  );
}
