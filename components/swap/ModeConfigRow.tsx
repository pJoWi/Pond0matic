"use client";
import { useSwapConfig } from "@/contexts/SwapConfigContext";
import { useSession } from "@/contexts/SessionContext";

function NumField({
  label, value, onChange, disabled, min, hint,
}: {
  label: string; value: number; onChange: (n: number) => void;
  disabled: boolean; min: number; hint?: string;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 rounded-lg border border-edge bg-bg p-2 text-center">
      <input
        type="number"
        min={min}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
        className="w-full bg-transparent text-center font-num text-sm font-bold outline-none"
      />
      <span className="text-[10px] text-ink-muted">{label}</span>
      {hint ? <span className="text-[9px] text-ink-muted">{hint}</span> : null}
    </label>
  );
}

export function ModeConfigRow() {
  const config = useSwapConfig();
  const { running } = useSession();

  if (config.swapMode === "normal") return null;

  if (config.swapMode === "boost") {
    return (
      <div className="flex gap-1.5">
        <NumField
          label="swaps / round" min={1} disabled={running}
          value={config.swapsPerRound} onChange={config.setSwapsPerRound}
        />
        <NumField
          label="rounds" min={0} hint="0 = ∞" disabled={running}
          value={config.numberOfRounds} onChange={config.setNumberOfRounds}
        />
        <NumField
          label="delay (ms)" min={0} disabled={running}
          value={config.swapDelayMs} onChange={config.setSwapDelayMs}
        />
      </div>
    );
  }

  return (
    <div className="flex gap-1.5">
      <NumField
        label="rounds" min={0} hint="0 = ∞" disabled={running}
        value={config.numberOfSwaps} onChange={config.setNumberOfSwaps}
      />
      <NumField
        label="delay (ms)" min={0} disabled={running}
        value={config.swapDelayMs} onChange={config.setSwapDelayMs}
      />
    </div>
  );
}
