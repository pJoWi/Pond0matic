"use client";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useSettings } from "@/contexts/SettingsContext";
import { testRpcEndpoint, testJupiterApiKey } from "@/lib/settings/validation";

export function ConnectionSettings() {
  const { settings, update } = useSettings();
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [rpcDraft, setRpcDraft] = useState(settings.rpc);
  const [keyDraft, setKeyDraft] = useState("");
  const [rpcMsg, setRpcMsg] = useState<string | null>(null);
  const [keyMsg, setKeyMsg] = useState<string | null>(null);

  const saveRpc = async () => {
    setRpcMsg("Testing…");
    const r = await testRpcEndpoint(rpcDraft);
    if (r.ok) {
      update({ rpc: rpcDraft.trim(), rpcVerified: true });
      setRpcMsg(`✓ slot ${r.slot} · ${r.latencyMs} ms`);
    } else {
      update({ rpcVerified: false });
      setRpcMsg(`✗ ${r.error}`);
    }
  };
  const saveKey = async () => {
    setKeyMsg("Testing…");
    const r = await testJupiterApiKey(keyDraft);
    if (r.ok) {
      update({ jupiterApiKey: keyDraft.trim(), apiKeyVerified: true });
      setKeyMsg("✓ Key accepted");
      setKeyDraft("");
    } else {
      setKeyMsg(`✗ ${r.error}`);
    }
  };
  const address = publicKey?.toBase58();

  return (
    <section className="rounded-2xl border border-edge bg-surface p-5">
      <h2 className="text-sm font-semibold">Connection</h2>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-ink-muted">
          Wallet{" "}
          {connected && address ? (
            <span className="font-num text-accent">{`${address.slice(0, 4)}…${address.slice(-4)}`}</span>
          ) : (
            <span className="text-danger">not connected</span>
          )}
        </div>
        {connected ? (
          <button type="button" onClick={() => void disconnect()} className="rounded-lg border border-edge px-3 py-1.5 text-xs text-ink-muted hover:text-danger">
            Disconnect
          </button>
        ) : (
          <button type="button" onClick={() => setVisible(true)} className="rounded-lg bg-gradient-to-br from-accent to-accent-strong px-3 py-1.5 text-xs font-bold text-accent-deep">
            Connect wallet
          </button>
        )}
      </div>

      <div className="mt-4">
        <label className="text-xs text-ink-muted" htmlFor="rpc-input">RPC endpoint</label>
        <div className="mt-1 flex gap-2">
          <input id="rpc-input" value={rpcDraft} onChange={(e) => setRpcDraft(e.target.value)}
            placeholder="https://mainnet.helius-rpc.com/?api-key=…"
            className="min-w-0 flex-1 rounded-lg border border-edge bg-bg px-3 py-2 font-num text-xs" />
          <button type="button" onClick={() => void saveRpc()} className="rounded-lg bg-surface-2 px-4 text-xs font-semibold text-accent">
            Test & save
          </button>
        </div>
        {rpcMsg ? <p className={`mt-1 text-xs ${rpcMsg.startsWith("✓") ? "text-accent" : "text-danger"}`}>{rpcMsg}</p> : null}
      </div>

      <div className="mt-4">
        <label className="text-xs text-ink-muted" htmlFor="jup-key-input">
          Jupiter API key {settings.apiKeyVerified ? <span className="text-accent">(saved ✓)</span> : null}
        </label>
        <div className="mt-1 flex gap-2">
          <input id="jup-key-input" type="password" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)}
            placeholder={settings.jupiterApiKey ? "••••••••  (enter new key to replace)" : "API key from portal.jup.ag"}
            className="min-w-0 flex-1 rounded-lg border border-edge bg-bg px-3 py-2 font-num text-xs" />
          <button type="button" onClick={() => void saveKey()} className="rounded-lg bg-surface-2 px-4 text-xs font-semibold text-accent">
            Test & save
          </button>
        </div>
        {keyMsg ? <p className={`mt-1 text-xs ${keyMsg.startsWith("✓") ? "text-accent" : "text-danger"}`}>{keyMsg}</p> : null}
      </div>
    </section>
  );
}
