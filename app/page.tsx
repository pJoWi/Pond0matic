"use client";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { SwapPanel } from "@/components/swap/SwapPanel";
import { MobileSwapSheet } from "@/components/swap/MobileSwapSheet";

export default function DashboardPage() {
  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
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
