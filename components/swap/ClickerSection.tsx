"use client";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "@/contexts/SessionContext";
import { useRigHealth } from "@/hooks/useRigHealth";
import { useClickerControl } from "@/hooks/useClickerControl";
import { deriveMiningActive } from "@/lib/clicker/clickerPolicyEvaluator";
import { cn } from "@/lib/utils";

// Inline LED dot — semantic tokens only; avoids dependency on legacy StatusLED
// which uses raw-palette classes (bg-green-500, shadow-[...], animate-led-pulse).
// Deviation from Step 7: StatusLED inlined as StatusDot.
type LEDColor = "green" | "blue" | "red" | "yellow" | "gray";

const LED_TOKEN: Record<LEDColor, string> = {
  green: "bg-accent",
  red: "bg-danger",
  yellow: "bg-warn",
  blue: "bg-ink-muted",
  gray: "bg-edge",
};

function StatusDot({ color, pulsing }: { color: LEDColor; pulsing?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full",
        LED_TOKEN[color] ?? "bg-edge",
        pulsing && "animate-pulse"
      )}
    />
  );
}

function getLedClass(color: unknown): string {
  return LED_TOKEN[color as keyof typeof LED_TOKEN] ?? "bg-edge";
}

const DEFAULTS = { scanIntervalS: 2, sessionMinutes: 60, clickBudget: 50 };

export function ClickerSection() {
  // Deviation from Step 7: useActivity not consumed here — the event log
  // comes from clicker.events (unchanged from useClickerControl), and only
  // .running was needed from the legacy useSwapperContext → useSession.
  const { running } = useSession();
  const { publicKey } = useWallet();
  const rig = useRigHealth(publicKey);
  const miningActive = deriveMiningActive(rig.current, rig.previous);

  const [manualPause, setManualPause] = useState(false);
  const [scanIntervalS, setScanIntervalS] = useState(DEFAULTS.scanIntervalS);
  const [sessionMinutes, setSessionMinutes] = useState(DEFAULTS.sessionMinutes);
  const [clickBudget, setClickBudget] = useState(DEFAULTS.clickBudget);
  const [dryRun, setDryRun] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clicker = useClickerControl({ swapperRunning: running, miningActive, manualPause });

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
    <details className="border-t border-edge pt-2">
      <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer text-[11px] text-ink-muted">
        <span className="inline-flex items-center gap-2">
          <StatusDot color={clicker.policy.led as LEDColor} pulsing={clicker.policy.led === "green"} />
          ⚙ Autoclicker
          <span className="text-[10px]">{clicker.policy.label}</span>
        </span>
      </summary>

      <div className="mt-3 space-y-3 text-sm">
        <p className="text-[11px] text-ink-muted">
          Clicks the wallet popup for you while the swapper runs. Auto-stops on the
          session timer, click budget, or ~15 s after the swapper loop stops. Pauses
          while your rig is mining. Emergency stop: slam the mouse into a screen corner.
        </p>

        <div className="grid grid-cols-3 gap-2">
          <label className="text-[11px] text-ink-muted">
            Scan interval (s)
            <input
              type="number" min={1} max={30} value={scanIntervalS} disabled={active}
              onChange={(e) => setScanIntervalS(Number(e.target.value))}
              className="mt-1 w-full rounded border border-edge bg-bg px-2 py-1 font-num text-ink disabled:opacity-50"
            />
          </label>
          <label className="text-[11px] text-ink-muted">
            Session (min)
            <input
              type="number" min={5} max={240} value={sessionMinutes} disabled={active}
              onChange={(e) => setSessionMinutes(Number(e.target.value))}
              className="mt-1 w-full rounded border border-edge bg-bg px-2 py-1 font-num text-ink disabled:opacity-50"
            />
          </label>
          <label className="text-[11px] text-ink-muted">
            Click budget
            <input
              type="number" min={1} max={500} value={clickBudget} disabled={active}
              onChange={(e) => setClickBudget(Number(e.target.value))}
              className="mt-1 w-full rounded border border-edge bg-bg px-2 py-1 font-num text-ink disabled:opacity-50"
            />
          </label>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1 text-[11px] text-ink-muted">
            <input type="checkbox" checked={dryRun} disabled={active} onChange={(e) => setDryRun(e.target.checked)} />
            Dry-run (log only, no clicks)
          </label>
          <label className="flex items-center gap-1 text-[11px] text-ink-muted">
            <input type="checkbox" checked={manualPause} onChange={(e) => setManualPause(e.target.checked)} />
            Pause
          </label>
        </div>

        {active ? (
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] text-ink">
              <span className="font-num">Clicks: {clicker.status!.clicks_used} / {clicker.status!.click_budget}</span>
              <span className="font-num">Time left: {Math.floor(secondsLeft / 60)}m {secondsLeft % 60}s</span>
              {clicker.status!.dry_run && <span className="text-warn">DRY-RUN</span>}
            </div>
            <button
              type="button" onClick={() => clicker.stop()}
              className="w-full rounded bg-danger py-1.5 font-semibold text-white hover:opacity-90"
            >
              Disarm
            </button>
          </div>
        ) : (
          <button
            type="button" onClick={handleArm} disabled={!running}
            title={running ? undefined : "Start the swapper loop first"}
            className="w-full rounded bg-accent py-1.5 font-semibold text-accent-deep hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Arm clicker
          </button>
        )}

        {error && <p className="text-[11px] text-danger">{error}</p>}

        {clicker.events.length > 0 && (
          <div className="max-h-32 space-y-1 overflow-y-auto rounded border border-edge bg-bg p-2">
            {[...clicker.events].reverse().map((event, i) => (
              <div key={`${event.ts}-${i}`} className="font-num text-[11px] text-ink-muted">
                {new Date(event.ts * 1000).toLocaleTimeString()} — {event.kind}
                {event.template ? ` ${event.action}:${event.template} @ (${event.x},${event.y})` : ""}
                {event.reason ? ` (${event.reason})` : ""}
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
