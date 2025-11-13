/**
 * Mining rig data hook for Pond0x protocol integration
 */

import { useCallback, useState } from "react";

export interface MiningRigState {
  // Health & Performance
  rigHealth: number; // 0-100
  rigPower: number; // 0-100
  rigTemp: number; // Celsius

  // Boost & Stats
  totalBoosts: number; // Total swaps
  permanentBoostTotal: number; // Total SOL deposited
  luckPoints: number; // Burned tokens
  boostBotActive: boolean;

  // Flywheel Data
  miningSessionsCount: number;
  swapBoost: number; // Swap Count × 1/6
  sessionPenalty: number; // Sessions × -3
  currentBoost: number; // Net boost
  priority: number; // 1-100
  driftRisk: number; // At-risk sessions

  // Price estimates
  estimatedSolUsd: number;
  estimatedWpondUsd: number;
  lastHealthUpdate: number;
}

export function useMiningRig(wallet: string, onLog?: (message: string) => void) {
  // Health & Performance State
  const [rigHealth, setRigHealth] = useState<number>(75);
  const [rigPower, setRigPower] = useState<number>(50);
  const [rigTemp, setRigTemp] = useState<number>(68);

  // Boost & Stats State
  const [totalBoosts, setTotalBoosts] = useState<number>(0);
  const [permanentBoostTotal, setPermanentBoostTotal] = useState<number>(0);
  const [luckPoints, setLuckPoints] = useState<number>(0);
  const [boostBotActive, setBoostBotActive] = useState(false);

  // Flywheel State
  const [miningSessionsCount, setMiningSessionsCount] = useState<number>(0);
  const [swapBoost, setSwapBoost] = useState<number>(0);
  const [sessionPenalty, setSessionPenalty] = useState<number>(0);
  const [currentBoost, setCurrentBoost] = useState<number>(0);
  const [priority, setPriority] = useState<number>(50);
  const [driftRisk, setDriftRisk] = useState<number>(0);

  // Price State
  const [estimatedSolUsd, setEstimatedSolUsd] = useState<number>(0);
  const [estimatedWpondUsd, setEstimatedWpondUsd] = useState<number>(0);
  const [lastHealthUpdate, setLastHealthUpdate] = useState<number>(0);

  const fetchManifest = useCallback(async () => {
    if (!wallet) return null;

    try {
      const response = await fetch(`https://www.cary0x.com/api/manifest/${wallet}`);
      if (!response.ok) {
        throw new Error(`Manifest fetch failed: ${response.status}`);
      }
      const data = await response.json();
      onLog?.(`Rig manifest loaded for ${wallet}`);
      return data;
    } catch (error: any) {
      onLog?.(`Manifest fetch error: ${error?.message || String(error)}`);
      return null;
    }
  }, [wallet, onLog]);

  const fetchHealth = useCallback(async () => {
    if (!wallet) return null;

    try {
      const response = await fetch(`https://www.cary0x.com/api/health/${wallet}`);
      if (!response.ok) {
        throw new Error(`Health fetch failed: ${response.status}`);
      }
      const data = await response.json();
      setLastHealthUpdate(Date.now());
      onLog?.(`Rig health updated for ${wallet}`);
      return data;
    } catch (error: any) {
      onLog?.(`Health fetch error: ${error?.message || String(error)}`);
      return null;
    }
  }, [wallet, onLog]);

  const incrementBoosts = useCallback(() => {
    setTotalBoosts((prev) => {
      const newTotal = prev + 1;
      setSwapBoost(newTotal / 6);
      setCurrentBoost(newTotal / 6 - sessionPenalty);

      // Update power based on boost (target 615 for 100%)
      const powerPercentage = Math.min(100, (newTotal / 615) * 100);
      setRigPower(powerPercentage);

      return newTotal;
    });
  }, [sessionPenalty]);

  const addPermanentBoost = useCallback((solAmount: number) => {
    setPermanentBoostTotal((prev) => prev + solAmount);
    setRigHealth((prev) => Math.min(100, prev + 10));
  }, []);

  const addLuckPoints = useCallback((points: number) => {
    setLuckPoints((prev) => prev + points);
    setRigHealth((prev) => Math.min(100, prev + 5));
  }, []);

  return {
    // State
    rigHealth,
    rigPower,
    rigTemp,
    totalBoosts,
    permanentBoostTotal,
    luckPoints,
    boostBotActive,
    miningSessionsCount,
    swapBoost,
    sessionPenalty,
    currentBoost,
    priority,
    driftRisk,
    estimatedSolUsd,
    estimatedWpondUsd,
    lastHealthUpdate,

    // Setters
    setRigHealth,
    setRigPower,
    setRigTemp,
    setBoostBotActive,
    setMiningSessionsCount,
    setSessionPenalty,
    setPriority,
    setDriftRisk,
    setEstimatedSolUsd,
    setEstimatedWpondUsd,

    // Actions
    fetchManifest,
    fetchHealth,
    incrementBoosts,
    addPermanentBoost,
    addLuckPoints,
  };
}
