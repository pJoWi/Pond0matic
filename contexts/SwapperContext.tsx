"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useBalances } from "@/hooks/useBalances";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useMiningRig } from "@/hooks/useMiningRig";
import { useToast } from "@/hooks/useToast";
import { triggerSuccessConfetti, triggerQuickConfetti } from "@/lib/confetti";
import type { SwapMode } from "@/types/swapModes";
import type { ToastType } from "@/components/ui/Toast";

// Types
type Affiliate = "pond0x" | "aquavaults";
type AppTab = "autobot" | "void";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

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
  // Manifest data
  isPro: boolean;
  proSwapsSol: number;
  proSwapsBx: number;
  badges: string;
  hasTwitter: boolean;
  // Health stats
  inMempool: number;
  sent: number;
  failed: number;
  drifted: number;
  maxClaimEstimateUsd: number;
  driftedUsd: number;
  // Vault stats
  vaultTotalSol: number;
  vaultTransactionCount: number;
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
  // Loading
  isLoading: boolean;
  fetchRigData: () => Promise<void>;

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
  loopReturnAmount: string;
  setLoopReturnAmount: (amount: string) => void;
  platformFeeBps: number;
  setPlatformFeeBps: (bps: number) => void;
  slippageBps: number;
  setSlippageBps: (bps: number) => void;
  autoDelayMs: number;
  setAutoDelayMs: (ms: number) => void;
  swapDelayMs: number; // Delay between individual swaps in boost mode
  setSwapDelayMs: (ms: number) => void;

  // New Swap Mode System
  swapMode: SwapMode;
  setSwapMode: (mode: SwapMode) => void;
  referralLink: string;
  setReferralLink: (link: string) => void;
  swapsPerRound: number; // For boost mode
  setSwapsPerRound: (count: number) => void;
  numberOfRounds: number; // For boost mode (0 = infinite)
  setNumberOfRounds: (rounds: number) => void;
  numberOfSwaps: number; // For rewards mode (0 = infinite)
  setNumberOfSwaps: (swaps: number) => void;

  // Swap State
  running: boolean;
  setRunning: (running: boolean) => void;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  stopping: boolean;
  setStopping: (stopping: boolean) => void;
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

  // UI Feedback
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => string;
  dismissToast: (id: string) => void;
  successToast: (message: string) => void;
  errorToast: (message: string) => void;
  infoToast: (message: string) => void;
  warningToast: (message: string) => void;
  triggerConfetti: () => void;
  triggerQuickConfetti: () => void;
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
  const [loopReturnAmount, setLoopReturnAmount] = React.useState("");
  const [platformFeeBps, setPlatformFeeBps] = React.useState(initialPlatformFeeBps);
  const [slippageBps, setSlippageBps] = React.useState(initialSlippageBps);
  const [autoDelayMs, setAutoDelayMs] = React.useState(3000);
  const [swapDelayMs, setSwapDelayMs] = React.useState(Number(process.env.NEXT_PUBLIC_DEFAULT_SWAP_DELAY_MS) || 6000);

  // Swap Mode State
  const [swapMode, setSwapMode] = React.useState<SwapMode>("normal");
  const [referralLink, setReferralLink] = React.useState("");
  const [swapsPerRound, setSwapsPerRound] = React.useState(Number(process.env.NEXT_PUBLIC_DEFAULT_SWAPS_PER_ROUND) || 18);
  const [numberOfRounds, setNumberOfRounds] = React.useState(Number(process.env.NEXT_PUBLIC_DEFAULT_ROUNDS) || 3);
  const [numberOfSwaps, setNumberOfSwaps] = React.useState(Number(process.env.NEXT_PUBLIC_DEFAULT_REWARDS_SWAPS) || 5);

  // Swap Runtime State
  const [running, setRunning] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [stopping, setStopping] = React.useState(false);
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
  const toastHook = useToast();

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
      // Manifest data
      isPro: miningRigHook.isPro,
      proSwapsSol: miningRigHook.proSwapsSol,
      proSwapsBx: miningRigHook.proSwapsBx,
      badges: miningRigHook.badges,
      hasTwitter: miningRigHook.hasTwitter,
      // Health stats
      inMempool: miningRigHook.inMempool,
      sent: miningRigHook.sent,
      failed: miningRigHook.failed,
      drifted: miningRigHook.drifted,
      maxClaimEstimateUsd: miningRigHook.maxClaimEstimateUsd,
      driftedUsd: miningRigHook.driftedUsd,
      // Vault stats
      vaultTotalSol: miningRigHook.vaultTotalSol,
      vaultTransactionCount: miningRigHook.vaultTransactionCount,
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
      // Loading
      isLoading: miningRigHook.isLoading,
      fetchRigData: miningRigHook.fetchRigData,

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
      loopReturnAmount,
      setLoopReturnAmount,
      platformFeeBps,
      setPlatformFeeBps,
      slippageBps,
      setSlippageBps,
      autoDelayMs,
      setAutoDelayMs,
      swapDelayMs,
      setSwapDelayMs,

      // Swap Mode System
      swapMode,
      setSwapMode,
      referralLink,
      setReferralLink,
      swapsPerRound,
      setSwapsPerRound,
      numberOfRounds,
      setNumberOfRounds,
      numberOfSwaps,
      setNumberOfSwaps,

      // Swap State
      running,
      setRunning,
      paused,
      setPaused,
      stopping,
      setStopping,
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

      // UI Feedback
      toasts: toastHook.toasts,
      showToast: toastHook.showToast,
      dismissToast: toastHook.dismissToast,
      successToast: toastHook.success,
      errorToast: toastHook.error,
      infoToast: toastHook.info,
      warningToast: toastHook.warning,
      triggerConfetti: triggerSuccessConfetti,
      triggerQuickConfetti,
    }),
    [
      walletHook,
      rpc,
      balancesHook,
      activityLogHook,
      miningRigHook,
      toastHook,
      fromMint,
      toMint,
      amount,
      maxAmount,
      loopReturnAmount,
      platformFeeBps,
      slippageBps,
      autoDelayMs,
      swapDelayMs,
      swapMode,
      referralLink,
      swapsPerRound,
      numberOfRounds,
      numberOfSwaps,
      running,
      paused,
      stopping,
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
