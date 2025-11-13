"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useBalances } from "@/hooks/useBalances";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useMiningRig } from "@/hooks/useMiningRig";

// Types
type Mode = "normal" | "roundtrip" | "boost" | "loopreturn";
type Affiliate = "pond0x" | "aquavaults";
type AppTab = "autobot" | "void";

interface SwapperContextValue {
  // Wallet & Connection
  wallet: string;
  connecting: boolean;
  isConnected: boolean;
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
  rpc: string;
  setRpc: (rpc: string) => void;

  // Balances
  solBalance: number;
  tokenBalance: number;
  fetchingBalances: boolean;
  networkStatus: "online" | "offline";
  refetchBalances: () => Promise<void>;

  // Activity Log
  activities: string[];
  log: (message: string) => void;
  clearLog: () => void;

  // Mining Rig
  rigHealth: number;
  rigPower: number;
  rigTemp: number;
  totalBoosts: number;
  permanentBoostTotal: number;
  luckPoints: number;
  boostBotActive: boolean;
  miningSessionsCount: number;
  swapBoost: number;
  sessionPenalty: number;
  currentBoost: number;
  priority: number;
  driftRisk: number;
  estimatedSolUsd: number;
  estimatedWpondUsd: number;
  lastHealthUpdate: number;
  setRigHealth: (health: number) => void;
  setRigPower: (power: number) => void;
  setRigTemp: (temp: number) => void;
  setBoostBotActive: (active: boolean) => void;
  setMiningSessionsCount: (count: number) => void;
  setSessionPenalty: (penalty: number) => void;
  setPriority: (priority: number) => void;
  setDriftRisk: (risk: number) => void;
  setEstimatedSolUsd: (usd: number) => void;
  setEstimatedWpondUsd: (usd: number) => void;
  fetchManifest: () => Promise<any>;
  fetchHealth: () => Promise<any>;
  incrementBoosts: () => void;
  addPermanentBoost: (solAmount: number) => void;
  addLuckPoints: (points: number) => void;

  // Token Selection
  fromMint: string;
  toMint: string;
  setFromMint: (mint: string) => void;
  setToMint: (mint: string) => void;

  // Swap Configuration
  amount: string;
  setAmount: (amount: string) => void;
  maxAmount: string;
  setMaxAmount: (amount: string) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  platformFeeBps: number;
  setPlatformFeeBps: (bps: number) => void;
  slippageBps: number;
  setSlippageBps: (bps: number) => void;

  // Auto-swap
  autoActive: boolean;
  setAutoActive: (active: boolean) => void;
  autoCount: number;
  setAutoCount: (count: number) => void;
  autoDelayMs: number;
  setAutoDelayMs: (ms: number) => void;

  // Swap State
  running: boolean;
  setRunning: (running: boolean) => void;
  currentSwapIndex: number;
  setCurrentSwapIndex: (index: number) => void;

  // Affiliate
  affiliate: Affiliate;
  setAffiliate: (affiliate: Affiliate) => void;
  currentVault: string | null;

  // Tab Navigation
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;

  // Wetware
  lastWetwareOp: string;
  setLastWetwareOp: (op: string) => void;
}

const SwapperContext = createContext<SwapperContextValue | undefined>(undefined);

interface SwapperProviderProps {
  children: ReactNode;
  initialRpc: string;
  initialFromMint: string;
  initialToMint: string;
  initialPlatformFeeBps?: number;
  initialSlippageBps?: number;
  tokenVaultsAffiliate1: Record<string, string>;
  tokenVaultsAffiliate2: Record<string, string>;
}

export function SwapperProvider({
  children,
  initialRpc,
  initialFromMint,
  initialToMint,
  initialPlatformFeeBps = 85,
  initialSlippageBps = 50,
  tokenVaultsAffiliate1,
  tokenVaultsAffiliate2,
}: SwapperProviderProps) {
  // RPC State
  const [rpc, setRpc] = React.useState(initialRpc);

  // Token Selection State
  const [fromMint, setFromMint] = React.useState(initialFromMint);
  const [toMint, setToMint] = React.useState(initialToMint);

  // Swap Configuration State
  const [amount, setAmount] = React.useState("");
  const [maxAmount, setMaxAmount] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("normal");
  const [platformFeeBps, setPlatformFeeBps] = React.useState(initialPlatformFeeBps);
  const [slippageBps, setSlippageBps] = React.useState(initialSlippageBps);

  // Auto-swap State
  const [autoActive, setAutoActive] = React.useState(false);
  const [autoCount, setAutoCount] = React.useState(5);
  const [autoDelayMs, setAutoDelayMs] = React.useState(3000);

  // Swap Runtime State
  const [running, setRunning] = React.useState(false);
  const [currentSwapIndex, setCurrentSwapIndex] = React.useState(0);

  // Affiliate State
  const [affiliate, setAffiliate] = React.useState<Affiliate>("pond0x");

  // Tab Navigation State
  const [activeTab, setActiveTab] = React.useState<AppTab>("autobot");

  // Wetware State
  const [lastWetwareOp, setLastWetwareOp] = React.useState("");

  // Custom Hooks
  const walletHook = useWallet();
  const balancesHook = useBalances(walletHook.wallet, rpc, fromMint);
  const activityLogHook = useActivityLog();
  const miningRigHook = useMiningRig(walletHook.wallet, activityLogHook.log);

  // Calculate current vault
  const currentVault = React.useMemo(() => {
    const vaults = affiliate === "pond0x" ? tokenVaultsAffiliate1 : tokenVaultsAffiliate2;
    return vaults[fromMint] || null;
  }, [affiliate, fromMint, tokenVaultsAffiliate1, tokenVaultsAffiliate2]);

  const value: SwapperContextValue = React.useMemo(
    () => ({
      // Wallet
      wallet: walletHook.wallet,
      connecting: walletHook.connecting,
      isConnected: walletHook.isConnected,
      connect: walletHook.connect,
      disconnect: walletHook.disconnect,
      rpc,
      setRpc,

      // Balances
      solBalance: balancesHook.solBalance,
      tokenBalance: balancesHook.tokenBalance,
      fetchingBalances: balancesHook.fetching,
      networkStatus: balancesHook.networkStatus,
      refetchBalances: balancesHook.refetch,

      // Activity Log
      activities: activityLogHook.activities,
      log: activityLogHook.log,
      clearLog: activityLogHook.clear,

      // Mining Rig
      rigHealth: miningRigHook.rigHealth,
      rigPower: miningRigHook.rigPower,
      rigTemp: miningRigHook.rigTemp,
      totalBoosts: miningRigHook.totalBoosts,
      permanentBoostTotal: miningRigHook.permanentBoostTotal,
      luckPoints: miningRigHook.luckPoints,
      boostBotActive: miningRigHook.boostBotActive,
      miningSessionsCount: miningRigHook.miningSessionsCount,
      swapBoost: miningRigHook.swapBoost,
      sessionPenalty: miningRigHook.sessionPenalty,
      currentBoost: miningRigHook.currentBoost,
      priority: miningRigHook.priority,
      driftRisk: miningRigHook.driftRisk,
      estimatedSolUsd: miningRigHook.estimatedSolUsd,
      estimatedWpondUsd: miningRigHook.estimatedWpondUsd,
      lastHealthUpdate: miningRigHook.lastHealthUpdate,
      setRigHealth: miningRigHook.setRigHealth,
      setRigPower: miningRigHook.setRigPower,
      setRigTemp: miningRigHook.setRigTemp,
      setBoostBotActive: miningRigHook.setBoostBotActive,
      setMiningSessionsCount: miningRigHook.setMiningSessionsCount,
      setSessionPenalty: miningRigHook.setSessionPenalty,
      setPriority: miningRigHook.setPriority,
      setDriftRisk: miningRigHook.setDriftRisk,
      setEstimatedSolUsd: miningRigHook.setEstimatedSolUsd,
      setEstimatedWpondUsd: miningRigHook.setEstimatedWpondUsd,
      fetchManifest: miningRigHook.fetchManifest,
      fetchHealth: miningRigHook.fetchHealth,
      incrementBoosts: miningRigHook.incrementBoosts,
      addPermanentBoost: miningRigHook.addPermanentBoost,
      addLuckPoints: miningRigHook.addLuckPoints,

      // Token Selection
      fromMint,
      toMint,
      setFromMint,
      setToMint,

      // Swap Configuration
      amount,
      setAmount,
      maxAmount,
      setMaxAmount,
      mode,
      setMode,
      platformFeeBps,
      setPlatformFeeBps,
      slippageBps,
      setSlippageBps,

      // Auto-swap
      autoActive,
      setAutoActive,
      autoCount,
      setAutoCount,
      autoDelayMs,
      setAutoDelayMs,

      // Swap State
      running,
      setRunning,
      currentSwapIndex,
      setCurrentSwapIndex,

      // Affiliate
      affiliate,
      setAffiliate,
      currentVault,

      // Tab Navigation
      activeTab,
      setActiveTab,

      // Wetware
      lastWetwareOp,
      setLastWetwareOp,
    }),
    [
      walletHook,
      rpc,
      balancesHook,
      activityLogHook,
      miningRigHook,
      fromMint,
      toMint,
      amount,
      maxAmount,
      mode,
      platformFeeBps,
      slippageBps,
      autoActive,
      autoCount,
      autoDelayMs,
      running,
      currentSwapIndex,
      affiliate,
      currentVault,
      activeTab,
      lastWetwareOp,
    ]
  );

  return <SwapperContext.Provider value={value}>{children}</SwapperContext.Provider>;
}

export function useSwapperContext() {
  const context = useContext(SwapperContext);
  if (context === undefined) {
    throw new Error("useSwapperContext must be used within a SwapperProvider");
  }
  return context;
}
