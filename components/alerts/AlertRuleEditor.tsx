"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type {
  RigAlertRule,
  PriceAlertRule,
  RigAlertKind,
  PriceAlertKind,
  TokenSymbol,
} from "@/lib/alerts/types";
import { TOKEN_SYMBOLS } from "@/lib/alerts/types";

const FIVE_MIN = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface RigEditorProps {
  initial?: RigAlertRule;
  onSave: (rule: RigAlertRule) => void;
  onCancel: () => void;
}

export function RigRuleEditor({ initial, onSave, onCancel }: RigEditorProps) {
  const [kind, setKind] = useState<RigAlertKind>(initial?.kind ?? "health-below");
  const [value, setValue] = useState<number>(() => {
    if (!initial) return 50;
    if (initial.kind === "health-below" || initial.kind === "health-critical") return initial.threshold;
    return initial.minDelta;
  });
  const [enabled, setEnabled] = useState<boolean>(initial?.enabled ?? true);

  const submit = () => {
    const id = initial?.id ?? newId("rig");
    const cooldownMs = initial?.cooldownMs ?? FIVE_MIN;
    let rule: RigAlertRule;
    switch (kind) {
      case "health-below":
      case "health-critical":
        rule = { id, kind, threshold: Math.max(0, Math.min(100, value)), enabled, cooldownMs };
        break;
      case "drifted-spike":
      case "failed-spike":
        rule = { id, kind, minDelta: Math.max(1, Math.floor(value)), enabled, cooldownMs };
        break;
    }
    onSave(rule);
  };

  return (
    <div className="space-y-3 p-4 bg-slate-950/80 border border-teal-400/30 rounded-xl">
      <div className="text-[11px] font-semibold tracking-wide text-teal-300 uppercase">
        {initial ? "Edit rig rule" : "New rig rule"}
      </div>
      <label className="block">
        <span className="text-xs text-teal-300/80">Type</span>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as RigAlertKind)}
          className="mt-1 w-full bg-black/40 border border-teal-400/30 rounded-lg px-2 py-1.5 text-sm text-cyan-200"
        >
          <option value="health-below">Health below %</option>
          <option value="health-critical">Health critical %</option>
          <option value="drifted-spike">Drift spike (Δ count)</option>
          <option value="failed-spike">Failed spike (Δ count)</option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-teal-300/80">
          {kind.startsWith("health") ? "Threshold (%)" : "Minimum delta"}
        </span>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
          className="mt-1 w-full bg-black/40 border border-teal-400/30 rounded-lg px-2 py-1.5 text-sm text-cyan-200"
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-teal-300">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enabled
      </label>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={submit} className={btnPrimary}>Save</button>
        <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
      </div>
    </div>
  );
}

interface PriceEditorProps {
  initial?: PriceAlertRule;
  onSave: (rule: PriceAlertRule) => void;
  onCancel: () => void;
}

export function PriceRuleEditor({ initial, onSave, onCancel }: PriceEditorProps) {
  const [symbol, setSymbol] = useState<TokenSymbol>(initial?.symbol ?? "wPOND");
  const [kind, setKind] = useState<PriceAlertKind>(initial?.kind ?? "above");
  const [threshold, setThreshold] = useState<number>(() => {
    if (!initial) return 0;
    if (initial.kind === "above" || initial.kind === "below") return initial.threshold;
    return initial.pctThreshold;
  });
  const [windowMs, setWindowMs] = useState<number>(() =>
    initial && initial.kind === "percent-change" ? initial.windowMs : ONE_HOUR
  );
  const [enabled, setEnabled] = useState<boolean>(initial?.enabled ?? true);
  const [oneShot, setOneShot] = useState<boolean>(initial?.oneShot ?? false);

  const submit = () => {
    const id = initial?.id ?? newId("price");
    const cooldownMs = initial?.cooldownMs ?? FIVE_MIN;
    let rule: PriceAlertRule;
    switch (kind) {
      case "above":
      case "below":
        rule = { id, symbol, kind, threshold: Math.max(0.0000000001, threshold), enabled, oneShot, cooldownMs };
        break;
      case "percent-change":
        rule = {
          id,
          symbol,
          kind,
          windowMs: Math.max(60_000, windowMs),
          pctThreshold: Math.max(0.0001, threshold),
          enabled,
          oneShot,
          cooldownMs,
        };
        break;
    }
    onSave(rule);
  };

  return (
    <div className="space-y-3 p-4 bg-slate-950/80 border border-teal-400/30 rounded-xl">
      <div className="text-[11px] font-semibold tracking-wide text-teal-300 uppercase">
        {initial ? "Edit price rule" : "New price rule"}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-xs text-teal-300/80">Token</span>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value as TokenSymbol)}
            className="mt-1 w-full bg-black/40 border border-teal-400/30 rounded-lg px-2 py-1.5 text-sm text-cyan-200"
          >
            {TOKEN_SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-teal-300/80">Kind</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as PriceAlertKind)}
            className="mt-1 w-full bg-black/40 border border-teal-400/30 rounded-lg px-2 py-1.5 text-sm text-cyan-200"
          >
            <option value="above">Above $</option>
            <option value="below">Below $</option>
            <option value="percent-change">% change in window</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-xs text-teal-300/80">
          {kind === "percent-change" ? "Move (e.g. 0.05 = 5%)" : "Threshold ($)"}
        </span>
        <input
          type="number"
          step="any"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
          className="mt-1 w-full bg-black/40 border border-teal-400/30 rounded-lg px-2 py-1.5 text-sm text-cyan-200"
        />
      </label>

      {kind === "percent-change" && (
        <label className="block">
          <span className="text-xs text-teal-300/80">Window (minutes)</span>
          <input
            type="number"
            min={1}
            value={Math.round(windowMs / 60_000)}
            onChange={(e) => setWindowMs(Math.max(1, parseInt(e.target.value, 10) || 1) * 60_000)}
            className="mt-1 w-full bg-black/40 border border-teal-400/30 rounded-lg px-2 py-1.5 text-sm text-cyan-200"
          />
        </label>
      )}

      <div className="flex items-center gap-4 pt-1">
        <label className="flex items-center gap-2 text-xs text-teal-300">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>
        <label className="flex items-center gap-2 text-xs text-teal-300">
          <input type="checkbox" checked={oneShot} onChange={(e) => setOneShot(e.target.checked)} />
          One-shot
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={submit} className={btnPrimary}>Save</button>
        <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
      </div>
    </div>
  );
}

const btnPrimary = cn(
  "px-4 py-2 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-400/50",
  "rounded-lg text-xs font-semibold text-emerald-200 transition-all"
);
const btnSecondary = cn(
  "px-4 py-2 bg-slate-950/60 hover:bg-slate-900/60 border border-slate-500/40",
  "rounded-lg text-xs font-medium text-slate-300 transition-all"
);
