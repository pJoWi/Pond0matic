"use client";
import type { CSSProperties } from "react";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { SwapPanel } from "@/components/swap/SwapPanel";
import { MobileSwapSheet } from "@/components/swap/MobileSwapSheet";

// Fixed positions (no Math.random → no hydration drift) for the rising bubbles.
const BUBBLES: { left: string; size: number; dur: string; delay: string }[] = [
  { left: "7%", size: 10, dur: "14s", delay: "0s" },
  { left: "21%", size: 6, dur: "18s", delay: "3.5s" },
  { left: "38%", size: 15, dur: "21s", delay: "7s" },
  { left: "54%", size: 8, dur: "16s", delay: "1.5s" },
  { left: "69%", size: 5, dur: "19s", delay: "5s" },
  { left: "83%", size: 12, dur: "23s", delay: "9.5s" },
  { left: "94%", size: 7, dur: "17s", delay: "2.5s" },
];

export default function DashboardPage() {
  return (
    <div className="flex gap-6">
      <div className="deep-water relative min-w-0 flex-1">
        <div className="bubbles" aria-hidden="true">
          {BUBBLES.map((b, i) => (
            <span
              key={i}
              className="bubble"
              style={
                {
                  left: b.left,
                  width: b.size,
                  height: b.size,
                  animationDuration: b.dur,
                  animationDelay: b.delay,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <DashboardTabs />
      </div>
      <div className="hidden w-[340px] shrink-0 xl:block">
        <div className="sticky top-6">
          <SwapPanel />
        </div>
      </div>
      <MobileSwapSheet />
    </div>
  );
}
