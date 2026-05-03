"use client";
import React, { useState } from "react";
import type { PriceAlertRule } from "@/lib/alerts/types";
import { PriceRuleEditor } from "./AlertRuleEditor";

function formatPrice(p: number): string {
  if (p >= 1) return `$${p.toFixed(4)}`;
  if (p >= 0.01) return `$${p.toFixed(6)}`;
  return `$${p.toFixed(8)}`;
}

function describeRule(rule: PriceAlertRule): string {
  switch (rule.kind) {
    case "above":           return `${rule.symbol} above ${formatPrice(rule.threshold)}`;
    case "below":           return `${rule.symbol} below ${formatPrice(rule.threshold)}`;
    case "percent-change":  return `${rule.symbol} moves ≥ ${(rule.pctThreshold * 100).toFixed(2)}% in ${Math.round(rule.windowMs / 60_000)}m`;
  }
}

interface Props {
  rules: PriceAlertRule[];
  onChange: (rules: PriceAlertRule[]) => void;
}

export function PriceAlertsPanel({ rules, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const upsert = (rule: PriceAlertRule) => {
    const next = rules.some((r) => r.id === rule.id)
      ? rules.map((r) => (r.id === rule.id ? rule : r))
      : [...rules, rule];
    onChange(next);
    setEditingId(null);
    setCreating(false);
  };

  const remove = (id: string) => onChange(rules.filter((r) => r.id !== id));
  const toggle = (id: string) =>
    onChange(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-teal-100 uppercase">Price alerts</h3>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="px-3 py-1.5 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-400/40 rounded-lg text-xs font-medium text-teal-200 transition-all"
        >
          + Add rule
        </button>
      </div>

      {creating && (
        <PriceRuleEditor onSave={upsert} onCancel={() => setCreating(false)} />
      )}

      <ul className="space-y-2">
        {rules.length === 0 && !creating && (
          <li className="px-3 py-6 text-center text-xs text-teal-400/60">No price rules yet.</li>
        )}
        {rules.map((rule) => {
          if (editingId === rule.id) {
            return (
              <li key={rule.id}>
                <PriceRuleEditor initial={rule} onSave={upsert} onCancel={() => setEditingId(null)} />
              </li>
            );
          }
          return (
            <li key={rule.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/60 border border-teal-400/20 rounded-xl">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-cyan-200 truncate">{describeRule(rule)}</div>
                <div className="text-[10px] text-teal-400/70 mt-0.5">
                  {rule.oneShot ? "one-shot · " : "recurring · "}
                  cooldown {Math.round(rule.cooldownMs / 60_000)}m
                  {rule.enabled ? "" : " · disabled"}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => toggle(rule.id)} className="text-xs px-2 py-1 text-teal-300 hover:text-teal-100">
                  {rule.enabled ? "Disable" : "Enable"}
                </button>
                <button type="button" onClick={() => setEditingId(rule.id)} className="text-xs px-2 py-1 text-teal-300 hover:text-teal-100">
                  Edit
                </button>
                <button type="button" onClick={() => remove(rule.id)} className="text-xs px-2 py-1 text-pink-300 hover:text-pink-200">
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
