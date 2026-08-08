"use client";
import { useCallback } from "react";
import { GeoffInsightCard } from "@/components/geoff/GeoffInsightCard";
import { useRig } from "@/contexts/RigContext";
import { useGeoffInsight } from "@/hooks/useGeoffInsight";
import { MAX_BOOST } from "@/lib/rig/boost";
import type { InsightSnapshot } from "@/lib/geoff/types";

/**
 * Geoff briefing on the mining rig. Reads the same telemetry the rig cards
 * render, so the model never sees anything the user cannot already see —
 * and never the wallet address.
 */
export function GeoffRigInsight() {
  const rig = useRig();

  const buildSnapshot = useCallback((): InsightSnapshot | null => {
    if (!rig.connected) return null;
    return {
      kind: "rig",
      boost: rig.boost,
      maxBoost: MAX_BOOST,
      pctToMax: rig.projection.pctToMax,
      swapsToMax: rig.projection.swapsToMax,
      sessionBoostAdded: rig.projection.sessionBoostAdded,
      sessionsBuffer: rig.projection.sessionsBuffer,
      sessionSwaps: rig.sessionSwaps,
      health: rig.health,
      manifest: rig.manifest,
      luck: rig.luck,
      bubbles: rig.bubbles,
    };
  }, [rig]);

  const state = useGeoffInsight(buildSnapshot);

  return (
    <GeoffInsightCard
      {...state}
      title="Geoff on your rig"
      hint="Reads your boost, health and manifest — no wallet address is sent."
      disabled={!rig.connected || (!rig.health && !rig.manifest)}
    />
  );
}
