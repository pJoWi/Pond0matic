"use client";
import React, { useState } from "react";
import type { RigAlertRule } from "@/lib/alerts/types";
import { RigRuleEditor } from "./AlertRuleEditor";

function describeRule(rule: RigAlertRule): string {
  switch (rule.kind) {
    case "health-below":     return `Health below ${rule.threshold}%`;
    case "health-critical":  return `Health critical at ${rule.threshold}%`;
    case "drifted-spike":    return `Drift increased by ≥ ${rule.minDelta}`;
    case "failed-spike":     return `Failed swaps increased by ≥ ${rule.minDelta}`;
  }
}

interface Props {
  rules: RigAlertRule[];
  onChange: (rules: RigAlertRule[]) => void;
}

export function RigAlertsPanel({ rules, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const upsert = (rule: RigAlertRule) => {
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
        <h3 className="text-sm font-semibold tracking-wide text-teal-100 uppercase">Rig alerts</h3>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="px-3 py-1.5 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-400/40 rounded-lg text-xs font-medium text-teal-200 transition-all"
        >
          + Add rule
        </button>
      </div>

      {creating && (
        <RigRuleEditor onSave={upsert} onCancel={() => setCreating(false)} />
      )}

      <ul className="space-y-2">
        {rules.length === 0 && !creating && (
          <li className="px-3 py-6 text-center text-xs text-teal-400/60">No rig rules configured.</li>
        )}
        {rules.map((rule) => {
          if (editingId === rule.id) {
            return (
              <li key={rule.id}>
                <RigRuleEditor initial={rule} onSave={upsert} onCancel={() => setEditingId(null)} />
              </li>
            );
          }
          return (
            <li key={rule.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/60 border border-teal-400/20 rounded-xl">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-cyan-200 truncate">{describeRule(rule)}</div>
                <div className="text-[10px] text-teal-400/70 mt-0.5">
                  cooldown {Math.round(rule.cooldownMs / 60_000)}m {rule.enabled ? "" : "· disabled"}
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
