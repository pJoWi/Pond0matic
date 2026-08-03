"use client";
import type { useRigTelemetry } from "@/hooks/useRigTelemetry";

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${warn ? "border-warn/40 bg-warn/10" : "border-edge bg-surface"}`}>
      <div className={`text-[10px] uppercase tracking-wider ${warn ? "text-warn" : "text-ink-muted"}`}>{label}</div>
      <div className="font-num text-xl text-ink">{value}</div>
    </div>
  );
}

export function RigStats({ rig }: { rig: ReturnType<typeof useRigTelemetry> }) {
  const h = rig.health;
  if (!h) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Health" value={`${h.health}/10`} />
        <Stat label="Priority" value={String(h.priority)} />
        <Stat label="Drift risk ⚠" value={String(h.drifted)} warn={h.drifted > 0} />
      </div>
      <div className="flex flex-wrap justify-between gap-2 rounded-xl border border-edge bg-surface p-4">
        {[["Sessions", h.miningSessions], ["Sent", h.sent], ["Failed", h.failed], ["Drifted", h.drifted], ["Mempool", h.inMempool]].map(([l, v]) => (
          <div key={String(l)}>
            <div className="text-[10px] uppercase tracking-wider text-ink-muted">{l}</div>
            <div className="font-num text-sm text-ink">{Number(v).toLocaleString("en-US")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
