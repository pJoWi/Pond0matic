"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SwapMode } from "@/types/swapModes";

interface ModeSelectorV2Props {
  mode: SwapMode;
  onModeChange: (mode: SwapMode) => void;
  disabled?: boolean;
}

const modeConfig = {
  normal: {
    label: "Normal",
    icon: "🤝",
    shortDesc: "Single swap",
    description: "Execute a single swap from one token to another. Simple and straightforward.",
    color: "from-lily-green to-lily-bright",
    borderColor: "border-lily-green/50",
    glowColor: "shadow-[0_0_20px_rgba(107,157,120,0.3)]",
    activeGlow: "shadow-[0_0_30px_rgba(107,157,120,0.5)]",
    hoverGlow: "hover:shadow-[0_0_25px_rgba(107,157,120,0.6),_0_0_40px_rgba(74,124,89,0.3)] hover:border-lily-bright/60",
    features: [
      "Single swap execution",
      "Immediate token conversion",
      "No automatic return swap",
      "Best for one-time trades",
    ],
    checkColor: "text-lily-bright",
  },
  boost: {
    label: "Boost",
    icon: "⚡",
    shortDesc: "Loop swaps",
    description: "Execute multiple small swaps with randomized amounts, then return swap all accumulated tokens. Perfect for accumulation strategies.",
    color: "from-ember-orange to-ember-amber",
    borderColor: "border-ember-orange/50",
    glowColor: "shadow-[0_0_20px_rgba(255,107,53,0.3)]",
    activeGlow: "shadow-[0_0_30px_rgba(255,107,53,0.5)]",
    hoverGlow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.6),_0_0_40px_rgba(255,107,53,0.3)] hover:border-amber-500/60",
    features: [
      "Randomized amounts per swap",
      "Multiple swaps per round",
      "Configurable rounds (finite or infinite)",
      "Return swap with all accumulated tokens",
    ],
    checkColor: "text-green-400",
  },
  rewards: {
    label: "Rewards",
    icon: "💰",
    shortDesc: ">$10 roundtrip",
    description: "Execute swaps worth more than $10 USD with automatic roundtrip after each swap. Ideal for mining rewards with referral links.",
    color: "from-cyan-400 to-blue-500",
    borderColor: "border-cyan-500/50",
    glowColor: "shadow-[0_0_20px_rgba(34,211,238,0.3)]",
    activeGlow: "shadow-[0_0_30px_rgba(34,211,238,0.5)]",
    hoverGlow: "hover:shadow-[0_0_25px_rgba(34,211,238,0.6),_0_0_40px_rgba(59,130,246,0.3)] hover:border-cyan-400/60",
    features: [
      "Minimum $10 USD per swap",
      "Automatic A→B→A roundtrip",
      "Referral link support",
      "Optimized for mining rewards",
    ],
    checkColor: "text-cyan-400",
  },
};

export function ModeSelectorV2({ mode, onModeChange, disabled }: ModeSelectorV2Props) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="space-y-2">
      {/* Compact Mode Selector */}
      <div className="flex items-center gap-2">
        {/* Mode Buttons */}
        <div className="flex-1 grid grid-cols-3 gap-2">
          {(Object.keys(modeConfig) as SwapMode[]).map((m) => {
            const config = modeConfig[m];
            const isActive = mode === m;

            return (
              <button
                key={m}
                onClick={() => !disabled && onModeChange(m)}
                disabled={disabled}
                className={cn(
                  "relative group overflow-hidden rounded-xl px-3 py-2 transition-all duration-300 transform-gpu",
                  "border",
                  isActive
                    ? cn(
                        "glass-intense",
                        config.borderColor,
                        config.activeGlow
                      )
                    : cn(
                        "bg-cyber-darker/50 border-gray-600/30",
                        config.hoverGlow,
                        disabled && "opacity-50 cursor-not-allowed"
                      ),
                  "active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-cyber-darker",
                  isActive
                    ? (m === "boost" ? "focus:ring-ember-orange" : m === "rewards" ? "focus:ring-cyan-400" : "focus:ring-lily-green")
                    : "focus:ring-lily-green"
                )}
              >
                {/* Background Gradient */}
                {isActive && (
                  <div
                    className={cn(
                      "absolute inset-0 opacity-10 bg-gradient-to-br",
                      config.color
                    )}
                  />
                )}

                {/* Content */}
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-wide",
                      isActive ? "text-white" : "text-gray-400"
                    )}
                  >
                    {config.label}
                  </span>
                  {isActive && (
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full animate-led-pulse",
                      m === "boost" ? "bg-ember-orange" : m === "rewards" ? "bg-cyan-400" : "bg-lily-green"
                    )} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Button */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg",
            "bg-cyber-darker/50 border border-blue-500/30",
            "text-blue-400 hover:text-blue-300 hover:border-blue-400/50",
            "transition-all duration-200",
            "shadow-[0_0_10px_rgba(59,130,246,0.3)]",
            showInfo && "bg-blue-500/20 border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          )}
          title="Mode information"
        >
          <span className="text-sm">ⓘ</span>
        </button>
      </div>

      {/* Info Popup */}
      {showInfo && (
        <div className="glass-premium border border-blue-500/40 rounded-xl p-3 space-y-2 animate-fade-in shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <div className="flex items-center gap-2">
            <div className="text-xl">{modeConfig[mode].icon}</div>
            <div className="flex-1">
              <div className="text-xs font-bold text-white mb-0.5">
                {modeConfig[mode].label} Mode
              </div>
              <div className="text-[10px] text-gray-400 leading-relaxed">
                {modeConfig[mode].description}
              </div>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="text-gray-500 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          {/* Feature List */}
          <div className="space-y-1 pt-2 border-t border-gray-700/50">
            {modeConfig[mode].features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px]">
                <span className={modeConfig[mode].checkColor}>✓</span>
                <span className="text-gray-400">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
