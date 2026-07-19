"use client";
import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSwapperContext } from "@/contexts/SwapperContext";
import { useRigHealth } from "@/hooks/useRigHealth";
import { useClickerControl } from "@/hooks/useClickerControl";
import { deriveMiningActive } from "@/lib/clicker/clickerPolicyEvaluator";
import { StatusLED } from "./StatusLED";

const DEFAULTS = { scanIntervalS: 2, sessionMinutes: 60, clickBudget: 50 };

export function ClickerPanel() {
  const ctx = useSwapperContext();
  const { publicKey } = useWallet();
  const rig = useRigHealth(publicKey);
  const miningActive = deriveMiningActive(rig.current, rig.previous);

  const [manualPause, setManualPause] = useState(false);
  const [scanIntervalS, setScanIntervalS] = useState(DEFAULTS.scanIntervalS);
  const [sessionMinutes, setSessionMinutes] = useState(DEFAULTS.sessionMinutes);
  const [clickBudget, setClickBudget] = useState(DEFAULTS.clickBudget);
  const [dryRun, setDryRun] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const clicker = useClickerControl({ swapperRunning: ctx.running, miningActive, manualPause });

  if (!clicker.available) return null;

  const active = clicker.status !== null && clicker.status.state !== "stopped";
  const secondsLeft = clicker.status
    ? Math.max(0, Math.round(clicker.status.session_deadline - Date.now() / 1000))
    : 0;

  const handleArm = async () => {
    setError(null);
    const err = await clicker.start({ scanIntervalS, sessionMinutes, clickBudget, dryRun });
    if (err) setError(err);
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-3 text-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="flex items-center gap-2 font-semibold text-gray-200">
          <StatusLED color={clicker.policy.led} pulsing={clicker.policy.led === "green"} />
          Auto-Clicker
          <span className="text-xs font-normal text-gray-400">{clicker.policy.label}</span>
        </span>
        <span className="text-gray-400">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-gray-400">
            Clicks the wallet popup for you while the swapper runs. Auto-stops on the
            session timer, click budget, or ~15 s after the swapper loop stops. Pauses
            while your rig is mining. Emergency stop: slam the mouse into a screen corner.
          </p>

          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs text-gray-400">
              Scan interval (s)
              <input
                type="number" min={1} max={30} value={scanIntervalS} disabled={active}
                onChange={(e) => setScanIntervalS(Number(e.target.value))}
                className="mt-1 w-full rounded bg-gray-900 px-2 py-1 text-gray-200 disabled:opacity-50"
              />
            </label>
            <label className="text-xs text-gray-400">
              Session (min)
              <input
                type="number" min={5} max={240} value={sessionMinutes} disabled={active}
                onChange={(e) => setSessionMinutes(Number(e.target.value))}
                className="mt-1 w-full rounded bg-gray-900 px-2 py-1 text-gray-200 disabled:opacity-50"
              />
            </label>
            <label className="text-xs text-gray-400">
              Click budget
              <input
                type="number" min={1} max={500} value={clickBudget} disabled={active}
                onChange={(e) => setClickBudget(Number(e.target.value))}
                className="mt-1 w-full rounded bg-gray-900 px-2 py-1 text-gray-200 disabled:opacity-50"
              />
            </label>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1 text-xs text-gray-400">
              <input type="checkbox" checked={dryRun} disabled={active} onChange={(e) => setDryRun(e.target.checked)} />
              Dry-run (log only, no clicks)
            </label>
            <label className="flex items-center gap-1 text-xs text-gray-400">
              <input type="checkbox" checked={manualPause} onChange={(e) => setManualPause(e.target.checked)} />
              Pause
            </label>
          </div>

          {active ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-300">
                <span>Clicks: {clicker.status!.clicks_used} / {clicker.status!.click_budget}</span>
                <span>Time left: {Math.floor(secondsLeft / 60)}m {secondsLeft % 60}s</span>
                {clicker.status!.dry_run && <span className="text-yellow-400">DRY-RUN</span>}
              </div>
              <button
                type="button" onClick={() => clicker.stop()}
                className="w-full rounded bg-red-600 py-1.5 font-semibold text-white hover:bg-red-500"
              >
                Disarm
              </button>
            </div>
          ) : (
            <button
              type="button" onClick={handleArm} disabled={!ctx.running}
              title={ctx.running ? undefined : "Start the swapper loop first"}
              className="w-full rounded bg-green-600 py-1.5 font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Arm clicker
            </button>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          {clicker.events.length > 0 && (
            <div className="max-h-32 space-y-1 overflow-y-auto rounded bg-gray-900/60 p-2">
              {[...clicker.events].reverse().map((event, i) => (
                <div key={`${event.ts}-${i}`} className="text-[11px] text-gray-400">
                  {new Date(event.ts * 1000).toLocaleTimeString()} — {event.kind}
                  {event.template ? ` ${event.action}:${event.template} @ (${event.x},${event.y})` : ""}
                  {event.reason ? ` (${event.reason})` : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
