"use client";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const [prevCurrent, setPrevCurrent] = useState(current);
  const [isPulsing, setIsPulsing] = useState(false);

  const progress = Math.min((current / total) * 100, 100);

  // Trigger pulse animation on count change
  useEffect(() => {
    if (current > prevCurrent) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 400);
      setPrevCurrent(current);
      return () => clearTimeout(timer);
    }
  }, [current, prevCurrent]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Progress Track */}
      <div className="relative h-2 bg-cyber-black/50 rounded-full overflow-hidden">
        <div
          className={cn("h-full bg-gradient-to-r from-ember-orange via-ember-amber to-ember-gold", "transition-all duration-500 ease-out", "shadow-ember-orange-sm")}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Count Display */}
      <div className="text-center">
        <span
          className={cn("text-xs font-bold text-ember-orange-light", "transition-all duration-300", isPulsing && "scale-110 text-ember-amber")}
        >
          {current}/{total} Swaps
        </span>
      </div>
    </div>
  );
}
