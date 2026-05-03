"use client";
import React from "react";
import { cn } from "@/lib/utils";
import type { AlertEvent } from "@/lib/alerts/types";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString();
}

function severityColor(severity: AlertEvent["severity"]): string {
  switch (severity) {
    case "critical": return "border-pink-400/50 bg-rose-950/40 text-pink-200";
    case "warning":  return "border-amber-400/50 bg-amber-950/40 text-amber-200";
    case "info":
    default:         return "border-teal-400/40 bg-slate-950/60 text-teal-200";
  }
}

interface Props {
  events: AlertEvent[];
}

export function RecentTriggersLog({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-teal-400/60 text-sm">
        No alerts have fired yet.
      </div>
    );
  }
  return (
    <ul className="space-y-2 max-h-[400px] overflow-y-auto">
      {events.map((e) => (
        <li key={e.id} className={cn("px-3 py-2 border rounded-xl text-xs", severityColor(e.severity))}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold tracking-wide">{e.title}</span>
            <span className="text-[10px] opacity-70">{formatTime(e.firedAt)}</span>
          </div>
          <div className="mt-0.5 opacity-90">{e.message}</div>
        </li>
      ))}
    </ul>
  );
}
