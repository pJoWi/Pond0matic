"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSwapConfig } from "@/contexts/SwapConfigContext";
import { useSession } from "@/contexts/SessionContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useBalances } from "@/hooks/useBalances";
import { TOKEN_NAMES } from "@/lib/vaults";
import { cn } from "@/lib/utils";

function TokenSelect({
  value,
  onChange,
  disabled,
  label,
}: {
  value: string;
  onChange: (mint: string) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="cursor-pointer rounded-full border border-edge bg-surface px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {Object.entries(TOKEN_NAMES).map(([mint, name]) => (
        <option key={mint} value={mint}>
          {name}
        </option>
      ))}
    </select>
  );
}

export function AmountCard() {
  const config = useSwapConfig();
  const { running } = useSession();
  const { settings } = useSettings();
  const { publicKey } = useWallet();
  const { solBalance, tokenBalance } = useBalances(
    publicKey?.toBase58() ?? "",
    settings.rpc,
    config.fromMint
  );
  const isBoost = config.swapMode === "boost";
  const fromIsSol = config.fromMint === "So11111111111111111111111111111111111111112";
  const fromBalance = fromIsSol ? solBalance : tokenBalance;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="rounded-xl border border-edge bg-bg p-3 transition-colors focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/15">
        <div className="flex items-center justify-between text-[11px] text-ink-muted">
          <span>{isBoost ? "You pay · randomized per swap" : "You pay"}</span>
          <span className="font-num">balance {fromBalance.toFixed(4)}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          {isBoost ? (
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <input
                value={config.amount}
                disabled={running}
                onChange={(e) => config.setAmount(e.target.value)}
                inputMode="decimal"
                aria-label="Minimum amount"
                className="w-full min-w-0 bg-transparent font-num text-base font-bold caret-accent outline-none"
              />
              <span className="text-ink-muted">–</span>
              <input
                value={config.maxAmount}
                disabled={running}
                onChange={(e) => config.setMaxAmount(e.target.value)}
                inputMode="decimal"
                aria-label="Maximum amount"
                className="w-full min-w-0 bg-transparent font-num text-base font-bold caret-accent outline-none"
              />
            </div>
          ) : (
            <input
              value={config.amount}
              disabled={running}
              onChange={(e) => config.setAmount(e.target.value)}
              inputMode="decimal"
              aria-label="Amount"
              className="min-w-0 flex-1 bg-transparent font-num text-base font-bold caret-accent outline-none"
            />
          )}
          <TokenSelect
            label="From token"
            value={config.fromMint}
            disabled={running}
            onChange={config.setFromMint}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={config.flipMints}
        disabled={running}
        aria-label="Flip swap direction"
        className={cn(
          "mx-auto -my-2 z-10 flex h-7 w-7 items-center justify-center rounded-full",
          "border border-edge bg-surface text-accent shadow-sm transition-all duration-300",
          "hover:rotate-180 hover:border-accent hover:text-accent-strong hover:ring-4 hover:ring-accent/20",
          "active:scale-95 disabled:rotate-0 disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        )}
      >
        ⇅
      </button>

      <div className="rounded-xl border border-edge bg-bg p-3 transition-colors focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/15">
        <div className="text-[11px] text-ink-muted">You receive (return-swapped each round)</div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="font-num text-base font-bold text-ink-muted">~market rate</span>
          <TokenSelect
            label="To token"
            value={config.toMint}
            disabled={running}
            onChange={config.setToMint}
          />
        </div>
      </div>
    </div>
  );
}
