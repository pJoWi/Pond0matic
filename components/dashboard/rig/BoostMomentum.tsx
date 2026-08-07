"use client";
import type { useRigTelemetry } from "@/hooks/useRigTelemetry";

const chip = "rounded-md bg-surface-2 px-2 py-1 text-[11px] text-ink-muted";

export function BoostMomentum({ rig }: { rig: ReturnType<typeof useRigTelemetry> }) {
  const p = rig.projection;
  const m = rig.manifest;
  const totalSwaps = m?.solSwaps ?? null;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {/* Total swaps — authoritative cary0x count; climbs as you swap-to-mine */}
        <div className="submerged-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">Total swaps</div>
          <div className="metric-glow font-num text-lg text-accent">
            {totalSwaps != null ? totalSwaps.toLocaleString("en-US") : "—"}
          </div>
          <div className="mt-1 text-[11px] text-ink-muted">
            {rig.sessionSwaps > 0
              ? `+${rig.sessionSwaps} this session`
              : "Sol swaps Pond0x recognizes"}
            {m && m.bxSwaps > 0 ? ` · ${m.bxSwaps.toLocaleString("en-US")} Bx` : ""}
          </div>
        </div>
        {/* Bubbles — cary0x bubbles metric */}
        <div className="submerged-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">Bubbles</div>
          <div className="font-num text-lg text-ink">
            {rig.bubbles != null ? rig.bubbles.toLocaleString("en-US") : "—"}
          </div>
          <div className="mt-1 text-[11px] text-ink-muted">your Pond0x bubbles</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {rig.boost != null && (
          <span className={chip}>to max 615 → ~{p.swapsToMax.toLocaleString("en-US")} swaps to go</span>
        )}
        <span className={chip}>1 run (18×3) = +9 boost = +3 sessions buffer</span>
      </div>
    </div>
  );
}
