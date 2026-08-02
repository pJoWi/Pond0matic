"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSettings } from "@/contexts/SettingsContext";
import { ModeTabs } from "@/components/swap/ModeTabs";
import { AmountCard } from "@/components/swap/AmountCard";
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
      className="relative flex flex-col gap-3 rounded-2xl border border-edge bg-surface p-4"
    >
      <ModeTabs />
      <AmountCard />
      <ModeConfigRow />
      <SessionButton disabled={!ready} />
      <SessionProgress />
      <MiniFeed />
      <ClickerSection />
      {!ready ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-surface/70 backdrop-blur-[2px]">
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className="rounded-xl bg-gradient-to-br from-accent to-accent-strong px-5 py-2.5 text-sm font-bold text-accent-deep"
          >
            ⚡ Connect to swap
          </button>
        </div>
      ) : null}
    </section>
  );
}
