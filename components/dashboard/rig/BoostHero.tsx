"use client";
import { useRigTelemetry } from "@/hooks/useRigTelemetry";
import { MAX_BOOST } from "@/lib/rig/boost";

function compact(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return n.toFixed(0);
}

export function BoostHero({ rig }: { rig: ReturnType<typeof useRigTelemetry> }) {
  const pct = Math.max(0, Math.min(100, rig.projection.pctToMax));
  const maxClaim = rig.health?.maxClaimUsd ?? null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Boost — user-entered (the live value isn't fetchable) */}
      <div className="submerged-card p-4">
        <div className="text-[10px] uppercase tracking-wider text-ink-muted">Your boost</div>
        <div className="flex items-baseline gap-1">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={MAX_BOOST}
            value={rig.boost ?? ""}
            onChange={(e) => rig.setBoost(Number(e.target.value) || 0)}
            placeholder="—"
            aria-label="Current rig boost (from pond0x.com/mining)"
            className="w-24 bg-transparent font-num text-3xl text-ink outline-none placeholder:text-ink-muted focus:text-accent"
          />
          <span className="font-num text-sm text-ink-muted">/ {MAX_BOOST}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-accent-deep/20">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-strong shadow-[0_0_12px_var(--color-accent)] transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 font-num text-[11px] text-ink-muted">
          {rig.boost == null
            ? "enter your boost from pond0x.com/mining"
            : `${pct.toFixed(0)}% to max · +0.167/swap`}
        </div>
      </div>

      {/* Max claim estimate — real cary0x $ (replaces the unobtainable unclaimed) */}
      <div className="submerged-card p-4">
        <div className="text-[10px] uppercase tracking-wider text-ink-muted">Max claim est.</div>
        <div className="metric-glow font-num text-3xl text-accent">{maxClaim == null ? "—" : "$" + compact(maxClaim)}</div>
        {rig.health && (
          <div className="mt-2 font-num text-[11px] text-ink-muted">
            {rig.health.miningSessions.toLocaleString("en-US")} sessions · drift {rig.health.drifted}
          </div>
        )}
      </div>
    </div>
  );
}
