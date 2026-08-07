"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSettings } from "@/contexts/SettingsContext";
import { ModeTabs } from "@/components/swap/ModeTabs";
import { AmountCard } from "@/components/swap/AmountCard";
import { SwapTuningCard } from "@/components/swap/SwapTuningCard";
import { ModeConfigRow } from "@/components/swap/ModeConfigRow";
import { SessionButton } from "@/components/swap/SessionButton";
import { SessionProgress } from "@/components/swap/SessionProgress";
import { MiniFeed } from "@/components/swap/MiniFeed";
import { ClickerSection } from "@/components/swap/ClickerSection";

export function SwapPanel() {
  const { connected } = useWallet();
  const { settingsReady, setSetupOpen } = useSettings();
  const ready = connected && settingsReady;

  return (
    <section
      aria-label="Swap panel"
      className="pond-depth relative flex flex-col gap-3 rounded-2xl border border-edge bg-surface p-4 shadow-[0_12px_40px_-16px_var(--color-accent-deep)] ring-1 ring-inset ring-white/5"
    >
      <ModeTabs />
      <AmountCard />
      <SwapTuningCard />
      <ModeConfigRow />
      <SessionButton disabled={!ready} />
      <SessionProgress />
      <MiniFeed />
      <ClickerSection />
      {!ready ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-surface/60 backdrop-blur-[3px]">
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className="pond-sheen rounded-xl bg-gradient-to-br from-accent to-accent-strong px-5 py-2.5 text-sm font-bold text-accent-deep shadow-[0_8px_24px_-6px_var(--color-accent)] ring-1 ring-inset ring-white/15 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            ⚡ Connect to swap
          </button>
        </div>
      ) : null}
    </section>
  );
}
