"use client";
import { useSettings } from "@/contexts/SettingsContext";

export function SwapDefaultsSettings() {
  const { settings, update } = useSettings();
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5">
      <h2 className="text-sm font-semibold">Swap defaults</h2>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Slippage (bps)
          <input
            type="number" min={0} max={10000} value={settings.slippageBps}
            onChange={(e) => update({ slippageBps: Math.max(0, Math.min(10000, Number(e.target.value) || 0)) })}
            className="rounded-lg border border-edge bg-bg px-3 py-2 font-num text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Platform fee (bps)
          <input
            type="number" min={0} max={10000} value={settings.platformFeeBps}
            onChange={(e) => update({ platformFeeBps: Math.max(0, Math.min(10000, Number(e.target.value) || 0)) })}
            className="rounded-lg border border-edge bg-bg px-3 py-2 font-num text-sm text-ink"
          />
        </label>
      </div>
      <fieldset className="mt-4">
        <legend className="text-xs text-ink-muted">Affiliate (fee vault routing)</legend>
        <div className="mt-1 flex gap-2">
          {(["pond0x", "aquavaults"] as const).map((a) => (
            <button
              key={a} type="button" onClick={() => update({ affiliate: a })}
              className={`rounded-lg px-4 py-2 text-xs font-semibold ${settings.affiliate === a ? "bg-accent/10 text-accent border border-accent" : "border border-edge text-ink-muted"}`}
            >
              {a}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-4">
        <legend className="text-xs text-ink-muted">Theme</legend>
        <div className="mt-1 flex gap-2">
          {(["dark", "light", "system"] as const).map((t) => (
            <button
              key={t} type="button" onClick={() => update({ theme: t })}
              className={`rounded-lg px-4 py-2 text-xs font-semibold ${settings.theme === t ? "bg-accent/10 text-accent border border-accent" : "border border-edge text-ink-muted"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
