"use client";
import { useRigTelemetry } from "@/hooks/useRigTelemetry";
import { useCountUp } from "@/hooks/useCountUp";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { MAX_BOOST } from "@/lib/rig/boost";

function compact(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return n.toFixed(0);
}

export function BoostHero({ rig }: { rig: ReturnType<typeof useRigTelemetry> }) {
  const { wpondPrice } = useTokenPrices();
  const boost = useCountUp(rig.boost ?? 0);
  const unclaimed = useCountUp(rig.unclaimed ?? 0);
  const pct = Math.max(0, Math.min(100, rig.projection.pctToMax));
  const usd = (rig.unclaimed ?? 0) * (wpondPrice || 0);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-edge bg-surface p-4">
        <div className="text-[10px] uppercase tracking-wider text-ink-muted">Huidige boost</div>
        <div className="font-num text-3xl text-ink">
          {rig.boost == null ? "—" : boost.toFixed(1)}
          {!rig.live && rig.boost != null && <span className="text-ink-muted"> ~</span>}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-gradient-to-r from-accent to-accent-strong transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 font-num text-[11px] text-ink-muted">{pct.toFixed(0)}% naar max {MAX_BOOST} · +0,167/swap</div>
      </div>
      <div className="rounded-xl border border-edge bg-surface p-4">
        <div className="text-[10px] uppercase tracking-wider text-ink-muted">Unclaimed wPOND</div>
        <div className="font-num text-3xl text-accent">{rig.unclaimed == null ? "—" : compact(unclaimed)}</div>
        <div className="mt-2 font-num text-xs text-ink-muted">≈ ${usd.toFixed(2)}</div>
        {rig.health && <div className="font-num text-[11px] text-ink-muted">max-claim potentieel ${compact(rig.health.maxClaimUsd)}</div>}
      </div>
    </div>
  );
}
