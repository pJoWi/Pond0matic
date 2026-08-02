"use client";
import React, { createContext, useContext } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMiningRig } from "@/hooks/useMiningRig";
import { useActivity } from "@/contexts/ActivityContext";

type RigValue = ReturnType<typeof useMiningRig>;

const RigContext = createContext<RigValue | undefined>(undefined);

export function RigProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet();
  const { log } = useActivity();
  const value = useMiningRig(publicKey?.toBase58() ?? "", log);
  return <RigContext.Provider value={value}>{children}</RigContext.Provider>;
}

export function useRig(): RigValue {
  const ctx = useContext(RigContext);
  if (!ctx) throw new Error("useRig must be used within RigProvider");
  return ctx;
}
