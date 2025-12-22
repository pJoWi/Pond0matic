"use client";

import React from "react";

interface BubbleAnimationProps {
  /**
   * Number of bubbles to display (default: 8)
   */
  bubbleCount?: number;
  /**
   * Color scheme for bubbles: 'blue' | 'green' | 'teal' | 'cyan' | 'mixed'
   * Default: 'mixed'
   */
  colorScheme?: "blue" | "green" | "teal" | "cyan" | "mixed";
  /**
   * Density of bubbles: 'sparse' | 'normal' | 'dense'
   * Default: 'normal'
   */
  density?: "sparse" | "normal" | "dense";
  /**
   * Animation speed multiplier (default: 1)
   * Lower = slower, Higher = faster
   */
  speedMultiplier?: number;
}

const COLOR_SCHEMES = {
  blue: [
    {
      id: "blue-1",
      colors: ["rgba(191, 219, 254, 0.9)", "rgba(96, 165, 250, 0.6)", "rgba(59, 130, 246, 0.3)"],
      stroke: "rgba(147, 197, 253, 0.5)",
    },
    {
      id: "blue-2",
      colors: ["rgba(147, 197, 253, 0.9)", "rgba(96, 165, 250, 0.6)", "rgba(37, 99, 235, 0.3)"],
      stroke: "rgba(191, 219, 254, 0.5)",
    },
  ],
  green: [
    {
      id: "green-1",
      colors: ["rgba(134, 239, 172, 0.8)", "rgba(74, 222, 128, 0.5)", "rgba(34, 197, 94, 0.3)"],
      stroke: "rgba(134, 239, 172, 0.4)",
    },
    {
      id: "green-2",
      colors: ["rgba(52, 211, 153, 0.85)", "rgba(16, 185, 129, 0.55)", "rgba(5, 150, 105, 0.3)"],
      stroke: "rgba(110, 231, 183, 0.5)",
    },
  ],
  teal: [
    {
      id: "teal-1",
      colors: ["rgba(94, 234, 212, 0.9)", "rgba(45, 212, 191, 0.6)", "rgba(20, 184, 166, 0.35)"],
      stroke: "rgba(153, 246, 228, 0.5)",
    },
    {
      id: "teal-2",
      colors: ["rgba(165, 243, 252, 0.8)", "rgba(103, 232, 249, 0.5)", "rgba(6, 182, 212, 0.3)"],
      stroke: "rgba(165, 243, 252, 0.4)",
    },
  ],
  cyan: [
    {
      id: "cyan-1",
      colors: ["rgba(125, 211, 252, 0.85)", "rgba(56, 189, 248, 0.55)", "rgba(14, 165, 233, 0.3)"],
      stroke: "rgba(186, 230, 253, 0.45)",
    },
    {
      id: "cyan-2",
      colors: ["rgba(6, 182, 212, 0.8)", "rgba(8, 145, 178, 0.5)", "rgba(21, 94, 117, 0.3)"],
      stroke: "rgba(103, 232, 249, 0.45)",
    },
  ],
  pink: [
    {
      id: "pink-1",
      colors: ["rgba(244, 114, 182, 0.9)", "rgba(244, 82, 160, 0.6)", "rgba(236, 72, 153, 0.3)"],
      stroke: "rgba(244, 114, 182, 0.5)",
    },
    {
      id: "pink-2",
      colors: ["rgba(255, 178, 208, 0.9)", "rgba(255, 138, 173, 0.6)", "rgba(255, 99, 132, 0.3)"],
      stroke: "rgba(255, 178, 208, 0.5)",
    },
  ],
};

const MIXED_COLORS = [
  ...COLOR_SCHEMES.blue,
  ...COLOR_SCHEMES.green,
  ...COLOR_SCHEMES.teal,
  ...COLOR_SCHEMES.cyan,
];

export function BubbleAnimation({
  bubbleCount = 8,
  colorScheme = "mixed",
  density = "normal",
  speedMultiplier = 1,
}: BubbleAnimationProps) {
  const colors = colorScheme === "mixed" ? MIXED_COLORS : COLOR_SCHEMES[colorScheme];

  // Generate bubble configurations
  const bubbles = React.useMemo(() => {
    const densityConfig = {
      sparse: { minSize: 3, maxSize: 5, minBottom: 1, maxBottom: 15 },
      normal: { minSize: 3, maxSize: 6, minBottom: 1, maxBottom: 20 },
      dense: { minSize: 2, maxSize: 6, minBottom: 1, maxBottom: 25 },
    };

    const config = densityConfig[density];
    const result = [];

    for (let i = 0; i < bubbleCount; i++) {
      const colorIndex = i % colors.length;
      const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
      const bottom = config.minBottom + Math.random() * (config.maxBottom - config.minBottom);
      const horizontal = 10 + Math.random() * 80; // 10% to 90% from left
      const duration = (6 + Math.random() * 6) / speedMultiplier; // 6-12s base
      const delay = (i * 1.5) / speedMultiplier; // Staggered start

      result.push({
        id: i,
        colorScheme: colors[colorIndex],
        size,
        bottom,
        horizontal,
        duration,
        delay,
      });
    }

    return result;
  }, [bubbleCount, colors, density, speedMultiplier]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {bubbles.map((bubble) => (
        <svg
          key={bubble.id}
          className="absolute"
          style={{
            bottom: `${bubble.bottom}%`,
            left: `${bubble.horizontal}%`,
            width: `${bubble.size * 4}px`,
            height: `${bubble.size * 4}px`,
            animation: `bubble-rise ${bubble.duration}s ease-in-out infinite ${bubble.delay}s`,
          }}
          viewBox="0 0 24 24"
        >
          <defs>
            <radialGradient id={`bubble-gradient-${bubble.id}`} cx="30%" cy="30%">
              <stop offset="0%" stopColor={bubble.colorScheme.colors[0]} />
              <stop offset="50%" stopColor={bubble.colorScheme.colors[1]} />
              <stop offset="100%" stopColor={bubble.colorScheme.colors[2]} />
            </radialGradient>
          </defs>
          <circle
            cx="12"
            cy="12"
            r="10"
            fill={`url(#bubble-gradient-${bubble.id})`}
            stroke={bubble.colorScheme.stroke}
            strokeWidth="0.5"
          />
          {/* Highlight/reflection */}
          <ellipse
            cx="8.5"
            cy="7.5"
            rx="2.5"
            ry="2"
            fill="rgba(255, 255, 255, 0.6)"
            opacity="0.8"
          />
        </svg>
      ))}
    </div>
  );
}
