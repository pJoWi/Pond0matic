"use client";
import type { useRigTelemetry } from "@/hooks/useRigTelemetry";

const chip = "rounded-md bg-surface-2 px-2 py-1 text-[11px] text-ink-muted";

export function BoostMomentum({ rig }: { rig: ReturnType<typeof useRigTelemetry> }) {
  const p = rig.projection;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-xl border border-edge bg-surface p-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">Naar max 615</div>
          <div className="font-num text-lg text-accent">nog ~{p.swapsToMax.toLocaleString("nl-NL")} swaps</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">Deze sessie</div>
          <div className="font-num text-lg text-ink">+{rig.sessionSwaps} swaps → <span className="text-accent">+{p.sessionBoostAdded.toFixed(1)}</span></div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={chip}>1 run (18×3) = +9 boost = +3 sessies buffer</span>
        {rig.topBoost != null && (
          <span className={chip}>🏆 jij <b className="font-num">{(rig.boost ?? 0).toFixed(1)}</b> · top <b className="font-num">{rig.topBoost.toFixed(0)}</b></span>
        )}
      </div>
    </div>
  );
}
