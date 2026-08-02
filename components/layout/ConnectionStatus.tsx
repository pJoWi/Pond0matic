"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

function Led({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn("h-2 w-2 rounded-full", ok ? "bg-accent" : "bg-danger")}
        aria-hidden
      />
      <span className="text-ink-muted">{label}</span>
      {detail ? <span className="ml-auto font-num text-ink-muted">{detail}</span> : null}
    </div>
  );
}

export function ConnectionStatus() {
  const { connected, publicKey } = useWallet();
  const { settings } = useSettings();
  const address = publicKey?.toBase58();
  return (
    <div className="flex flex-col gap-1.5">
      <Led
        ok={connected}
        label="Wallet"
        detail={address ? `${address.slice(0, 4)}…${address.slice(-4)}` : undefined}
      />
      <Led ok={settings.rpcVerified} label="RPC" />
      <Led ok={settings.apiKeyVerified} label="Jupiter API" />
    </div>
  );
}
