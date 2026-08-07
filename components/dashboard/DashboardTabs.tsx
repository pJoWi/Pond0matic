"use client";
import { useState } from "react";
import { RigTab } from "@/components/dashboard/RigTab";
import { PricesTab } from "@/components/dashboard/PricesTab";
import { ActivityTab } from "@/components/dashboard/ActivityTab";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "rig", label: "Rig" },
  { id: "prices", label: "Prices" },
  { id: "activity", label: "Activity" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function DashboardTabs() {
  const [tab, setTab] = useState<TabId>("rig");
  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="submerged-card flex w-fit gap-1 p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
              tab === t.id
                ? "bg-bg text-accent ring-1 ring-inset ring-accent/25 shadow-[0_2px_10px_-4px_var(--color-accent)]"
                : "text-ink-muted hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "rig" ? <RigTab /> : tab === "prices" ? <PricesTab /> : <ActivityTab />}
    </div>
  );
}
