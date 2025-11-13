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
    <div className="flex justify-center -my-2">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "relative group p-3 rounded-2xl border-2 transition-all duration-500",
          "bg-gradient-to-br from-ember-orange/40 to-ember-amber/40",
          "border-ember-orange/60 shadow-ember-orange-sm",
          "hover:border-ember-amber/80 hover:shadow-ember-orange hover:scale-110",
          "active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-darker",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100",
          isRotating && "scale-110 shadow-ember-orange-intense"
        )}
        style={{
          transform: "translateZ(0)", // GPU acceleration
          willChange: "transform",
        }}
        aria-label="Swap token direction"
      >
        <svg
          className={cn(
            "w-6 h-6 text-ember-orange-light transition-all duration-500",
            "group-hover:text-ember-amber",
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
    </div>
  );
}
