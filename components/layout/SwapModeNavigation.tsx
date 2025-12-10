"use client";
import React from "react";
import type { SwapMode } from "@/types/swapModes";
import { cn } from "@/lib/utils";

interface SwapModeNavigationProps {
  swapMode: SwapMode;
  onSwapModeChange: (mode: SwapMode) => void;
}

export function SwapModeNavigation({
  swapMode,
  onSwapModeChange,
}: SwapModeNavigationProps) {
  return (
    <div
      className="fixed top-[76px] left-0 right-0 z-40 backdrop-blur-2xl"
      style={{
        background:
          "linear-gradient(to bottom, rgba(13, 31, 45, 0.95), rgba(13, 31, 45, 0.9))",
        borderBottom: "1px solid rgba(139, 196, 159, 0.15)",
        boxShadow:
          "0 4px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 196, 159, 0.08)",
      }}
    >
      {/* Animated glow line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(139, 196, 159, 0.4) 50%, transparent 100%)",
          animation: "shimmer 3s ease-in-out infinite",
        }}
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center py-3">
          {/* Navigation Container */}
          <nav
            className="relative flex items-center justify-center gap-2 p-1.5 rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(26, 58, 82, 0.95), rgba(13, 31, 45, 0.95))",
              border: "1px solid rgba(139, 196, 159, 0.25)",
              boxShadow:
                "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            }}
            role="tablist"
            aria-label="Swap Mode Navigation"
          >
            {/* Animated background glow */}
            <div
              className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139, 196, 159, 0.05), rgba(74, 143, 184, 0.05), rgba(240, 198, 116, 0.05))",
                backgroundSize: "200% auto",
                animation: "gradient-shift 6s ease infinite",
              }}
            />

            {/* Normal Mode */}
            <SwapModeButton
              mode="normal"
              active={swapMode === "normal"}
              onClick={() => onSwapModeChange("normal")}
              label="Normal"
              description="Single swap execution"
              color="lily"
            />

            {/* Boost Mode */}
            <SwapModeButton
              mode="boost"
              active={swapMode === "boost"}
              onClick={() => onSwapModeChange("boost")}
              label="Boost"
              description="Multi-swap rounds"
              color="fire"
            />

            {/* Rewards Mode */}
            <SwapModeButton
              mode="rewards"
              active={swapMode === "rewards"}
              onClick={() => onSwapModeChange("rewards")}
              label="Rewards"
              description="Earn points & rewards"
              color="ice"
            />
          </nav>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes shimmer {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes lily-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
            filter: drop-shadow(0 0 6px currentColor);
          }
          50% {
            transform: scale(1.15);
            opacity: 0.85;
            filter: drop-shadow(0 0 12px currentColor) drop-shadow(0 0 18px currentColor);
          }
        }
        @keyframes lily-glow {
          0%,
          100% {
            box-shadow: 0 0 10px currentColor, 0 0 20px currentColor,
              0 0 30px currentColor;
          }
          50% {
            box-shadow: 0 0 15px currentColor, 0 0 30px currentColor,
              0 0 45px currentColor, 0 0 60px currentColor;
          }
        }
        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Swap Mode Button Component
interface SwapModeButtonProps {
  mode: SwapMode;
  active: boolean;
  onClick: () => void;
  label: string;
  description: string;
  color: "ice" | "fire" | "lily";
}

function SwapModeButton({
  mode,
  active,
  onClick,
  label,
  description,
  color,
}: SwapModeButtonProps) {
  const colorStyles = {
    ice: {
      active: {
        background: "linear-gradient(135deg, #00d4ff 0%, #7dd3fc 100%)",
        border: "1px solid rgba(0, 212, 255, 0.5)",
        boxShadow:
          "0 4px 16px rgba(0, 212, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 30px rgba(0, 212, 255, 0.2)",
        color: "#ffffff",
        lilyColor: "#00d4ff",
      },
      inactive: {
        color: "rgba(0, 212, 255, 0.6)",
        hoverColor: "#00d4ff",
        lilyColor: "rgba(0, 212, 255, 0.25)",
      },
    },
    fire: {
      active: {
        background: "linear-gradient(135deg, #ff6b35 0%, #f97316 100%)",
        border: "1px solid rgba(255, 107, 53, 0.5)",
        boxShadow:
          "0 4px 16px rgba(255, 107, 53, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 30px rgba(255, 107, 53, 0.2)",
        color: "#ffffff",
        lilyColor: "#ff6b35",
      },
      inactive: {
        color: "rgba(255, 107, 53, 0.6)",
        hoverColor: "#ff6b35",
        lilyColor: "rgba(255, 107, 53, 0.25)",
      },
    },
    lily: {
      active: {
        background: "linear-gradient(135deg, #4a7c59 0%, #6b9d78 100%)",
        border: "1px solid rgba(139, 196, 159, 0.5)",
        boxShadow:
          "0 4px 16px rgba(107, 157, 120, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 30px rgba(139, 196, 159, 0.2)",
        color: "#ffffff",
        lilyColor: "#8bc49f",
      },
      inactive: {
        color: "rgba(139, 196, 159, 0.6)",
        hoverColor: "#8bc49f",
        lilyColor: "rgba(139, 196, 159, 0.25)",
      },
    },
  };

  const styles = colorStyles[color];

  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      aria-label={`${label} mode: ${description}`}
      className={cn(
        "group relative px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-pond-deep",
        "min-w-[140px]"
      )}
      style={
        active
          ? styles.active
          : {
              background: "transparent",
              border: "1px solid transparent",
              color: styles.inactive.color,
            }
      }
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = styles.inactive.hoverColor;
          e.currentTarget.style.background = `${styles.inactive.hoverColor}08`;
          e.currentTarget.style.borderColor = `${styles.inactive.hoverColor}30`;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = styles.inactive.color;
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "transparent";
        }
      }}
    >
      {/* Ripple effect on active state */}
      {active && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
          style={{ opacity: 0.3 }}
        >
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              border: `2px solid ${styles.active.lilyColor}`,
              animation: "ripple 2s ease-in-out infinite",
            }}
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-2 relative z-10">
        {/* Lily Pad Indicator */}
        <div className="relative flex items-center justify-center h-8">
          <LilyPadIcon
            active={active}
            color={active ? styles.active.lilyColor : styles.inactive.lilyColor}
          />
        </div>

        {/* Label */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-bold text-base leading-tight">{label}</span>
          <span
            className="text-xs leading-tight opacity-75"
            style={{
              color: active ? "rgba(255, 255, 255, 0.8)" : "currentColor",
            }}
          >
            {description}
          </span>
        </div>
      </div>
    </button>
  );
}

// Lily Pad Icon Component with Pulsing Animation
interface LilyPadIconProps {
  active: boolean;
  color: string;
}

function LilyPadIcon({ active, color }: LilyPadIconProps) {
  return (
    <div className="relative w-8 h-8">
      {/* Outer Glow Ring - Only visible when active */}
      {active && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            animation: "lily-glow 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Main Lily Pad SVG */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{
          color: color,
          animation: active ? "lily-pulse 2s ease-in-out infinite" : "none",
          filter: active
            ? `drop-shadow(0 0 8px ${color})`
            : `drop-shadow(0 0 2px ${color})`,
        }}
      >
        {/* Lily Pad Shape */}
        <g fill="currentColor">
          {/* Main Pad */}
          <ellipse
            cx="50"
            cy="55"
            rx="45"
            ry="40"
            opacity={active ? "1" : "0.5"}
          />

          {/* V-notch at top */}
          <path
            d="M 50 15 L 40 30 L 50 27 L 60 30 Z"
            opacity={active ? "0.9" : "0.4"}
          />

          {/* Center highlight */}
          <ellipse
            cx="50"
            cy="55"
            rx="30"
            ry="25"
            opacity={active ? "0.3" : "0.15"}
            fill="white"
          />

          {/* Veins */}
          <g opacity={active ? "0.4" : "0.2"} stroke="currentColor" fill="none" strokeWidth="1.5">
            <path d="M 50 27 Q 50 45 30 60" />
            <path d="M 50 27 Q 50 50 50 75" />
            <path d="M 50 27 Q 50 45 70 60" />
            <path d="M 50 27 Q 35 40 20 50" />
            <path d="M 50 27 Q 65 40 80 50" />
          </g>
        </g>

        {/* Pulsing center dot - Only when active */}
        {active && (
          <circle
            cx="50"
            cy="55"
            r="4"
            fill="white"
            opacity="0.9"
            style={{
              animation: "lily-pulse 2s ease-in-out infinite",
            }}
          />
        )}
      </svg>
    </div>
  );
}
