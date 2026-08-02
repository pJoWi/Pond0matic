"use client";
import React, { createContext, useContext, useMemo, useState } from "react";
import type { SwapMode } from "@/types/swapModes";
import { TOKEN_VAULTS_AFFILIATE_1, TOKEN_VAULTS_AFFILIATE_2 } from "@/lib/vaults";
import { useSettings } from "@/contexts/SettingsContext";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const WPOND_MINT = "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq";

interface SwapConfigValue {
  fromMint: string;
  toMint: string;
  setFromMint: (m: string) => void;
  setToMint: (m: string) => void;
  flipMints: () => void;
  amount: string;
  setAmount: (v: string) => void;
  maxAmount: string;
  setMaxAmount: (v: string) => void;
  loopReturnAmount: string;
  setLoopReturnAmount: (v: string) => void;
  swapMode: SwapMode;
  setSwapMode: (m: SwapMode) => void;
  referralLink: string;
  setReferralLink: (v: string) => void;
  swapsPerRound: number;
  setSwapsPerRound: (n: number) => void;
  numberOfRounds: number;
  setNumberOfRounds: (n: number) => void;
  numberOfSwaps: number;
  setNumberOfSwaps: (n: number) => void;
  swapDelayMs: number;
  setSwapDelayMs: (n: number) => void;
  autoDelayMs: number;
  setAutoDelayMs: (n: number) => void;
  /** Fee vault for the current fromMint under the active affiliate, or null. */
  currentVault: string | null;
  /** Vault map for the active affiliate (needed for return swaps on toMint). */
  vaultMap: Record<string, string>;
}

const SwapConfigContext = createContext<SwapConfigValue | undefined>(undefined);

export function SwapConfigProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [fromMint, setFromMint] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_FROM_MINT || SOL_MINT
  );
  const [toMint, setToMint] = useState(process.env.NEXT_PUBLIC_DEFAULT_TO_MINT || WPOND_MINT);
  const [amount, setAmount] = useState(process.env.NEXT_PUBLIC_DEFAULT_MIN_AMOUNT || "0.01");
  const [maxAmount, setMaxAmount] = useState(process.env.NEXT_PUBLIC_DEFAULT_MAX_AMOUNT || "0.02");
  const [loopReturnAmount, setLoopReturnAmount] = useState("");
  const [swapMode, setSwapMode] = useState<SwapMode>("boost");
  const [referralLink, setReferralLink] = useState("");
  const [swapsPerRound, setSwapsPerRound] = useState(
    Number(process.env.NEXT_PUBLIC_DEFAULT_SWAPS_PER_ROUND) || 18
  );
  const [numberOfRounds, setNumberOfRounds] = useState(
    Number(process.env.NEXT_PUBLIC_DEFAULT_ROUNDS) || 3
  );
  const [numberOfSwaps, setNumberOfSwaps] = useState(
    Number(process.env.NEXT_PUBLIC_DEFAULT_REWARDS_SWAPS) || 5
  );
  const [swapDelayMs, setSwapDelayMs] = useState(
    Number(process.env.NEXT_PUBLIC_DEFAULT_SWAP_DELAY_MS) || 6000
  );
  const [autoDelayMs, setAutoDelayMs] = useState(3000);

  const vaultMap = useMemo(
    () => (settings.affiliate === "pond0x" ? TOKEN_VAULTS_AFFILIATE_1 : TOKEN_VAULTS_AFFILIATE_2),
    [settings.affiliate]
  );
  const currentVault = vaultMap[fromMint] ?? null;

  const value = useMemo<SwapConfigValue>(
    () => ({
      fromMint, toMint, setFromMint, setToMint,
      flipMints: () => { setFromMint(toMint); setToMint(fromMint); },
      amount, setAmount, maxAmount, setMaxAmount,
      loopReturnAmount, setLoopReturnAmount,
      swapMode, setSwapMode, referralLink, setReferralLink,
      swapsPerRound, setSwapsPerRound, numberOfRounds, setNumberOfRounds,
      numberOfSwaps, setNumberOfSwaps, swapDelayMs, setSwapDelayMs,
      autoDelayMs, setAutoDelayMs, currentVault, vaultMap,
    }),
    [fromMint, toMint, amount, maxAmount, loopReturnAmount, swapMode, referralLink,
     swapsPerRound, numberOfRounds, numberOfSwaps, swapDelayMs, autoDelayMs,
     currentVault, vaultMap]
  );

  return <SwapConfigContext.Provider value={value}>{children}</SwapConfigContext.Provider>;
}

export function useSwapConfig(): SwapConfigValue {
  const ctx = useContext(SwapConfigContext);
  if (!ctx) throw new Error("useSwapConfig must be used within SwapConfigProvider");
  return ctx;
}
