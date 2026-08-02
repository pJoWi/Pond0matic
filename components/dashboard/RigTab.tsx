"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRig } from "@/contexts/RigContext";
import { StatCard } from "@/components/dashboard/StatCard";

export function RigTab() {
  const { connected } = useWallet();
  const rig = useRig();

  if (!connected) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-edge text-sm text-ink-muted">
        Connect a wallet to load your Pond0x rig stats.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Mining rig</h2>
        <button
          type="button"
          onClick={() => void rig.fetchRigData()}
          disabled={rig.isLoading}
          className="rounded-lg border border-edge px-3 py-1 text-xs text-ink-muted hover:text-ink disabled:opacity-50"
        >
          {rig.isLoading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Rig health" value={String(rig.rigHealth)} suffix="/100" accent />
        <StatCard label="Total boosts" value={String(rig.totalBoosts)} />
        <StatCard label="Priority" value={String(rig.priority)} sub={`luck ${rig.luckPoints}`} />
        <StatCard
          label="Health stats"
          value={String(rig.sent)}
          suffix="sent"
          sub={`${rig.inMempool} mempool · ${rig.failed} failed · ${rig.drifted} drifted`}
        />
        <StatCard
          label="Max claim est."
          value={`$${rig.maxClaimEstimateUsd.toFixed(2)}`}
          sub={`drifted $${rig.driftedUsd.toFixed(2)}`}
        />
        <StatCard
          label="Manifest"
          value={rig.isPro ? "PRO" : "standard"}
          sub={rig.badges || "no badges"}
          accent={rig.isPro}
        />
      </div>
      <div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-strong transition-all"
            style={{ width: `${Math.max(0, Math.min(100, rig.rigHealth))}%` }}
          />
        </div>
        <div className="mt-1 text-[10px] text-ink-muted">
          Keep the rig healthy with boost sessions — health drops when swapping stops.
        </div>
      </div>
    </div>
  );
}
