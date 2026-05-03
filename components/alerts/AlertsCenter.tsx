"use client";
import React, { useCallback, useEffect, useState } from "react";
import { ALERTS_UPDATED_EVENT, loadConfig, saveConfig } from "@/lib/alerts/storage";
import type { PriceAlertRule, RigAlertRule, StoredAlertConfig } from "@/lib/alerts/types";
import { RigAlertsPanel } from "./RigAlertsPanel";
import { PriceAlertsPanel } from "./PriceAlertsPanel";
import { RecentTriggersLog } from "./RecentTriggersLog";
import { NotificationStatus } from "./NotificationStatus";
import { ExportImportConfig } from "./ExportImportConfig";

export function AlertsCenter() {
  const [config, setConfig] = useState<StoredAlertConfig | null>(null);

  useEffect(() => {
    setConfig(loadConfig());
    const handler = () => setConfig(loadConfig());
    window.addEventListener(ALERTS_UPDATED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(ALERTS_UPDATED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const update = useCallback((patch: Partial<StoredAlertConfig>) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveConfig(next);
      return next;
    });
  }, []);

  const onRigChange = useCallback((rigRules: RigAlertRule[]) => update({ rigRules }), [update]);
  const onPriceChange = useCallback((priceRules: PriceAlertRule[]) => update({ priceRules }), [update]);

  if (!config) {
    return <div className="p-8 text-center text-teal-400/70 text-sm">Loading alerts…</div>;
  }

  return (
    <div className="pond-dashboard relative min-h-screen">
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-[#0a2f2f] via-[#0c3d3d] to-[#156565]" />

      <div className="relative max-w-5xl mx-auto p-6 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-wide text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]">
              Alerts Center
            </h1>
            <p className="text-sm text-teal-200/80 mt-1">
              Get notified when your rig or token prices cross your thresholds.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationStatus />
            <ExportImportConfig />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-950/80 backdrop-blur-2xl border-2 border-teal-400/30 rounded-[2rem_3rem_2rem_2.5rem] p-5 shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
            <RigAlertsPanel rules={config.rigRules} onChange={onRigChange} />
          </div>
          <div className="bg-slate-950/80 backdrop-blur-2xl border-2 border-teal-400/30 rounded-[2.5rem_2rem_2.5rem_2rem] p-5 shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
            <PriceAlertsPanel rules={config.priceRules} onChange={onPriceChange} />
          </div>
        </div>

        <div className="bg-slate-950/80 backdrop-blur-2xl border-2 border-teal-400/30 rounded-[2.5rem_2.5rem_2rem_2rem] p-5 shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
          <h3 className="text-sm font-semibold tracking-wide text-teal-100 uppercase mb-3">
            Recent triggers ({config.recentTriggers.length})
          </h3>
          <RecentTriggersLog events={config.recentTriggers} />
        </div>
      </div>
    </div>
  );
}
