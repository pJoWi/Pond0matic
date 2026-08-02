"use client";
export function StatCard({
  label,
  value,
  suffix,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-4">
      <div className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</div>
      <div className={`mt-1 font-num text-2xl font-bold ${accent ? "text-accent" : "text-ink"}`}>
        {value}
        {suffix ? <span className="ml-1 text-sm text-ink-muted">{suffix}</span> : null}
      </div>
      {sub ? <div className="mt-1 text-[11px] text-ink-muted">{sub}</div> : null}
    </div>
  );
}
