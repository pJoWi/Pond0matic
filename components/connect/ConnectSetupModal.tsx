"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useSettings } from "@/contexts/SettingsContext";
import { testRpcEndpoint, testJupiterApiKey } from "@/lib/settings/validation";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

export function ConnectSetupModal() {
  const { settings, update, setupOpen, setSetupOpen, settingsReady } = useSettings();
  const { connected, publicKey } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [step, setStep] = useState<Step>(1);
  const [rpcDraft, setRpcDraft] = useState(settings.rpc);
  const [keyDraft, setKeyDraft] = useState(settings.jupiterApiKey);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (setupOpen) {
      setRpcDraft(settings.rpc);
      setKeyDraft(settings.jupiterApiKey);
      setStep(1);
      setFeedback(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupOpen]);

  if (!setupOpen) return null;

  const address = publicKey?.toBase58();

  const testRpc = async () => {
    if (testing) return;
    setTesting(true);
    setFeedback(null);
    const result = await testRpcEndpoint(rpcDraft);
    setTesting(false);
    if (result.ok) {
      update({ rpc: rpcDraft.trim(), rpcVerified: true });
      setFeedback(`✓ Connected — slot ${result.slot} · ${result.latencyMs} ms`);
    } else {
      update({ rpcVerified: false });
      setFeedback(`✗ ${result.error}`);
    }
  };

  const testKey = async () => {
    if (testing) return;
    setTesting(true);
    setFeedback(null);
    const result = await testJupiterApiKey(keyDraft);
    setTesting(false);
    if (result.ok) {
      update({ jupiterApiKey: keyDraft.trim(), apiKeyVerified: true });
      setFeedback("✓ Key accepted");
    } else {
      update({ apiKeyVerified: false });
      setFeedback(`✗ ${result.error}`);
    }
  };

  const goTo = (next: Step) => {
    setStep(next);
    setFeedback(null);
  };

  const stepDone =
    step === 1 ? connected : step === 2 ? settings.rpcVerified : settings.apiKeyVerified;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-edge bg-surface p-6">
        <h2 className="text-base font-bold">Connect</h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          Wallet, RPC and Jupiter API key — all three are required to swap.
        </p>

        <ol className="my-5 flex items-center gap-2" aria-label="Setup progress">
          {([1, 2, 3] as const).map((n) => {
            const done =
              (n === 1 && connected) ||
              (n === 2 && settings.rpcVerified) ||
              (n === 3 && settings.apiKeyVerified);
            return (
              <li key={n} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    done
                      ? "bg-accent text-accent-deep"
                      : n === step
                        ? "border-2 border-accent text-accent"
                        : "border-2 border-edge text-ink-muted"
                  )}
                >
                  {done ? "✓" : n}
                </span>
                {n < 3 ? <span className="h-0.5 flex-1 bg-edge" /> : null}
              </li>
            );
          })}
        </ol>

        {step === 1 ? (
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold">1 · Connect your wallet</div>
            {connected && address ? (
              <div className="rounded-lg bg-surface-2 px-3 py-2 text-xs">
                ✓ Connected: <span className="font-num text-accent">{`${address.slice(0, 4)}…${address.slice(-4)}`}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setWalletModalVisible(true)}
                className="rounded-lg bg-gradient-to-br from-accent to-accent-strong px-3 py-2 text-sm font-bold text-accent-deep"
              >
                Select wallet
              </button>
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold">2 · RPC endpoint</div>
            <p className="text-xs text-ink-muted">
              Use a dedicated endpoint (Helius, QuickNode). Public RPC is rate-limited.
            </p>
            <div className="flex gap-2">
              <input
                value={rpcDraft}
                onChange={(e) => setRpcDraft(e.target.value)}
                placeholder="https://mainnet.helius-rpc.com/?api-key=…"
                className="min-w-0 flex-1 rounded-lg border border-edge bg-bg px-3 py-2 font-num text-xs"
              />
              <button
                type="button"
                onClick={testRpc}
                disabled={testing}
                className="rounded-lg bg-surface-2 px-4 py-2 text-xs font-semibold text-accent disabled:opacity-50"
              >
                {testing ? "…" : "Test"}
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold">3 · Jupiter API key</div>
            <p className="text-xs text-ink-muted">
              Create a free key at{" "}
              <a href="https://portal.jup.ag" target="_blank" rel="noreferrer" className="text-accent underline">
                portal.jup.ag
              </a>{" "}
              — required for quote/swap calls.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="API key"
                className="min-w-0 flex-1 rounded-lg border border-edge bg-bg px-3 py-2 font-num text-xs"
              />
              <button
                type="button"
                onClick={testKey}
                disabled={testing}
                className="rounded-lg bg-surface-2 px-4 py-2 text-xs font-semibold text-accent disabled:opacity-50"
              >
                {testing ? "…" : "Test"}
              </button>
            </div>
          </div>
        ) : null}

        {feedback ? (
          <p className={cn("mt-3 text-xs", feedback.startsWith("✓") ? "text-accent" : "text-danger")}>
            {feedback}
          </p>
        ) : null}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => (step === 1 ? setSetupOpen(false) : goTo((step - 1) as Step))}
            className="flex-1 rounded-lg border border-edge py-2 text-xs text-ink-muted"
          >
            {step === 1 ? "Close" : "Back"}
          </button>
          {step < 3 ? (
            <button
              type="button"
              disabled={!stepDone}
              onClick={() => goTo((step + 1) as Step)}
              className="flex-[2] rounded-lg bg-gradient-to-br from-accent to-accent-strong py-2 text-xs font-bold text-accent-deep disabled:opacity-40"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              disabled={!(connected && settingsReady)}
              onClick={() => setSetupOpen(false)}
              className="flex-[2] rounded-lg bg-gradient-to-br from-accent to-accent-strong py-2 text-xs font-bold text-accent-deep disabled:opacity-40"
            >
              Done — start swapping
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
