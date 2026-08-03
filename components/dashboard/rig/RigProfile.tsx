"use client";
import type { useRigTelemetry } from "@/hooks/useRigTelemetry";

export function RigProfile({ rig }: { rig: ReturnType<typeof useRigTelemetry> }) {
  const m = rig.manifest;
  const hint = rig.health?.aiHints?.[0];
  return (
    <div className="flex flex-col gap-3">
      {(m || rig.luck) && (
        <div>
          <div className="mb-1.5 text-[10px] uppercase tracking-wider text-ink-muted">Badges &amp; profile</div>
          <div className="flex flex-wrap gap-1.5">
            {m?.badges.map((b) => (
              <span key={b} className="rounded-md border border-accent-strong/40 bg-accent/10 px-2 py-1 text-[11px] text-accent">🏅 {b}</span>
            ))}
            {m?.hasTwitter && <span className="rounded-md bg-surface-2 px-2 py-1 text-[11px] text-ink-muted">𝕏 linked</span>}
            {rig.luck && <span className="rounded-md bg-surface-2 px-2 py-1 text-[11px] text-ink-muted">luck {rig.luck.luck}</span>}
            {m && <span className="rounded-md bg-surface-2 px-2 py-1 text-[11px] text-ink-muted">{m.isPro ? "PRO" : "standard"}</span>}
          </div>
        </div>
      )}
      {hint && (
        <div className="border-l-2 border-accent-strong/40 pl-3 text-xs text-ink-muted">💬 {hint}</div>
      )}
    </div>
  );
}
