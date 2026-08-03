"use client";
import { useRig } from "@/contexts/RigContext";
import { BoostHero } from "@/components/dashboard/rig/BoostHero";
import { BoostMomentum } from "@/components/dashboard/rig/BoostMomentum";
import { RigStats } from "@/components/dashboard/rig/RigStats";
import { RigProfile } from "@/components/dashboard/rig/RigProfile";

export function RigTab() {
  const rig = useRig();

  if (!rig.connected) {
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
        <span className={`flex items-center gap-1.5 rounded-full border border-edge px-3 py-1 text-xs ${rig.live ? "text-accent" : "text-ink-muted"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${rig.live ? "bg-accent rig-pulse" : "bg-edge"}`} />
          {rig.live ? "MINING (live)" : "idle · ~schatting"}
        </span>
      </div>
      <BoostHero rig={rig} />
      <BoostMomentum rig={rig} />
      <RigStats rig={rig} />
      <RigProfile rig={rig} />
    </div>
  );
}
