"use client";
import React from "react";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";

export function NotificationStatus() {
  const { status, request } = useNotificationPermission();

  if (status === "granted") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-400/50 rounded-full text-[11px] font-semibold tracking-wide text-emerald-300">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pond-pulse-soft" />
        Browser notifications enabled
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/60 border border-pink-400/40 rounded-full text-[11px] font-semibold tracking-wide text-pink-300">
        Browser notifications blocked — unblock in browser settings
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <div className="px-3 py-1.5 bg-slate-950/60 border border-slate-500/40 rounded-full text-[11px] font-medium tracking-wide text-slate-400">
        Notifications not supported in this browser
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void request()}
      className="px-4 py-2 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-400/50 hover:border-emerald-400/80 rounded-xl text-xs font-semibold text-emerald-200 transition-all"
    >
      Enable browser notifications
    </button>
  );
}
