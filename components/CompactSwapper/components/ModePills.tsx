"use client";
import React from "react";
import { cn } from "@/lib/utils";

type Mode = "normal" | "roundtrip" | "boost" | "loopreturn";

interface ModePillsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

const modeLabels: Record<Mode, string> = {
  normal: "Normal",
  roundtrip: "RTrip",
  boost: "Boost",
  loopreturn: "Loop",
};

export function ModePills({ mode, onModeChange }: ModePillsProps) {
  const modes: Mode[] = ["normal", "roundtrip", "boost", "loopreturn"];

  return (
    <div className="grid grid-cols-4 gap-2">
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => onModeChange(m)}
          className={cn(
            "h-9 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all duration-300 border",
            mode === m
              ? "bg-ember-orange/25 border-2 border-ember-orange text-ember-orange-light shadow-ember-orange-sm scale-105"
              : "bg-cyber-black/40 border border-gray-600/50 text-gray-400 hover:border-ember-orange/60 hover:text-gray-300 hover:scale-[1.02]",
            "active:scale-95 focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-darker"
          )}
          aria-pressed={mode === m}
        >
          {modeLabels[m]}
        </button>
      ))}
    </div>
  );
}
