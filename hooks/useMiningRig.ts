/**
 * Mining rig data hook for Pond0x protocol integration
 *
 * Manages mining rig state including:
 * - Health, power, and temperature metrics
 * - Boost and luck point tracking
 * - Flywheel data (sessions, boosts, penalties)
 * - API integration for manifest and health data
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

  // Vault Stats (On-chain data)
  vaultTotalSol: number;
  vaultTransactionCount: number;
}

export interface HealthApiResponse {
  account: string;
  stats: {
    mining_sessions: number;
    in_mempool: number;
    sent: number;
    failed: number;
    drifted: number;
    drift_risk: number;
    priority: number;
    estimates: {
      sol_usd: number;
      wpond_usd: number;
      drift_risk_usd: number;
      max_claim_estimate_usd: number;
      drifted_usd: number;
    };
    health: number;
  };
  ai_beta: string[];
  data: {
    msg: string;
  };
}

export interface ManifestApiResponse {
  isPro: boolean;
  proAgo: string;
  proExpiry: string;
  proSwapsSol: number;
  proSwapsBx: number;
  badges: string;
  hasTwitter: boolean;
  cope: boolean;
}

export interface VaultStatsApiResponse {
  totalSolSent: number;
  transactionCount: number;
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

  // Manifest State
  const [isPro, setIsPro] = useState<boolean>(false);
  const [proSwapsSol, setProSwapsSol] = useState<number>(0);
  const [proSwapsBx, setProSwapsBx] = useState<number>(0);
  const [badges, setBadges] = useState<string>("");
  const [hasTwitter, setHasTwitter] = useState<boolean>(false);

  // Health Stats State
  const [inMempool, setInMempool] = useState<number>(0);
  const [sent, setSent] = useState<number>(0);
  const [failed, setFailed] = useState<number>(0);
  const [drifted, setDrifted] = useState<number>(0);
  const [maxClaimEstimateUsd, setMaxClaimEstimateUsd] = useState<number>(0);
  const [driftedUsd, setDriftedUsd] = useState<number>(0);

  // Vault Stats State (On-chain data)
  const [vaultTotalSol, setVaultTotalSol] = useState<number>(0);
  const [vaultTransactionCount, setVaultTransactionCount] = useState<number>(0);

  // Loading State
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Fetch user's mining rig manifest data
   * Contains pro status, swap counts, badges, and social connections
   *
   * @returns Manifest data object or null if fetch fails
   */
  const fetchManifest = useCallback(async () => {
    if (!wallet) return null;

    try {
      const response = await fetch(`/api/rig/manifest/${wallet}`);
      if (!response.ok) {
        throw new Error(`Manifest fetch failed: ${response.status}`);
      }
      const data: ManifestApiResponse = await response.json();

      // Update state with manifest data
      setIsPro(data.isPro);
      setProSwapsSol(data.proSwapsSol);
      setProSwapsBx(data.proSwapsBx);
      setBadges(data.badges);
      setHasTwitter(data.hasTwitter);

      onLog?.(`Rig manifest loaded: ${data.badges || "no badges"}`);
      return data;
    } catch (error: any) {
      onLog?.(`Manifest fetch error: ${error?.message || String(error)}`);
      return null;
    }
  }, [wallet, onLog]);

  /**
   * Fetch vault statistics (on-chain transaction data)
   * Includes total SOL sent and transaction count to Hashrate Booster vault
   *
   * @returns Vault stats data object or null if fetch fails
   */
  const fetchVaultStats = useCallback(async () => {
    if (!wallet) return null;

    try {
      const response = await fetch(`/api/rig/vault-stats/${wallet}`);
      if (!response.ok) {
        // Don't log as error - vault stats are optional
        return null;
      }
      const data: VaultStatsApiResponse = await response.json();

      // Update state with vault stats
      setVaultTotalSol(data.totalSolSent);
      setVaultTransactionCount(data.transactionCount);

      // Only log if we have actual stats
      if (data.transactionCount > 0) {
        onLog?.(`Vault stats loaded: ${data.transactionCount} transactions | ${data.totalSolSent.toFixed(4)} SOL`);
      }
      return data;
    } catch (error: any) {
      // Vault stats are optional - fail silently
      console.debug("Vault stats unavailable:", error?.message);
      return null;
    }
  }, [wallet, onLog]);

  /**
   * Fetch mining rig health and performance data
   * Includes session stats, transaction status, priority, and USD estimates
   *
   * @returns Health data object or null if fetch fails
   */
  const fetchHealth = useCallback(async () => {
    if (!wallet) return null;

    try {
      const response = await fetch(`/api/rig/health/${wallet}`);
      if (!response.ok) {
        throw new Error(`Health fetch failed: ${response.status}`);
      }
      const data: HealthApiResponse = await response.json();

      // Update state with health data
      const stats = data.stats;
      setRigHealth(stats.health * 10); // Convert 0-10 scale to 0-100 percentage
      setMiningSessionsCount(stats.mining_sessions);
      setInMempool(stats.in_mempool);
      setSent(stats.sent);
      setFailed(stats.failed);
      setDrifted(stats.drifted);
      setDriftRisk(stats.drift_risk);
      setPriority(stats.priority);

      // Update USD estimates
      setEstimatedSolUsd(stats.estimates.sol_usd);
      setEstimatedWpondUsd(stats.estimates.wpond_usd);
      setMaxClaimEstimateUsd(stats.estimates.max_claim_estimate_usd);
      setDriftedUsd(stats.estimates.drifted_usd);

      // Calculate derived flywheel values
      const confirmedSwapCount = stats.mining_sessions - stats.in_mempool;
      setTotalBoosts(confirmedSwapCount);
      setSwapBoost(confirmedSwapCount / 6); // Swap boost formula: count ÷ 6
      setSessionPenalty(stats.mining_sessions * 3); // Session penalty formula: sessions × 3
      setCurrentBoost(confirmedSwapCount / 6 - stats.mining_sessions * 3); // Net boost

      // Update power percentage (target: 615 swaps = 100%)
      const powerPercentage = Math.min(100, (confirmedSwapCount / 615) * 100);
      setRigPower(powerPercentage);

      setLastHealthUpdate(Date.now());
      onLog?.(`Rig health: ${stats.health * 10}% | Sessions: ${stats.mining_sessions} | Priority: ${stats.priority}`);
      return data;
    } catch (error: any) {
      onLog?.(`Health fetch error: ${error?.message || String(error)}`);
      return null;
    }
  }, [wallet, onLog]);

  /**
   * Increment boost count after a successful swap
   * Recalculates swap boost, current boost, and power percentage
   */
  const incrementBoosts = useCallback(() => {
    setTotalBoosts((prev) => {
      const newTotal = prev + 1;
      setSwapBoost(newTotal / 6); // Swap boost formula: count ÷ 6
      setCurrentBoost(newTotal / 6 - sessionPenalty); // Net boost after penalty

      // Update power percentage (target: 615 swaps = 100%)
      const powerPercentage = Math.min(100, (newTotal / 615) * 100);
      setRigPower(powerPercentage);

      return newTotal;
    });
  }, [sessionPenalty]);

  /**
   * Add a permanent boost by sending SOL to hashrate booster
   * Increases permanent boost total and improves rig health by 10%
   *
   * @param solAmount - Amount of SOL sent for permanent boost
   */
  const addPermanentBoost = useCallback((solAmount: number) => {
    setPermanentBoostTotal((prev) => prev + solAmount);
    setRigHealth((prev) => Math.min(100, prev + 10)); // Cap health at 100%
  }, []);

  /**
   * Add luck points from luck burn operation
   * Increases luck points and improves rig health by 5%
   *
   * @param points - Number of luck points to add
   */
  const addLuckPoints = useCallback((points: number) => {
    setLuckPoints((prev) => prev + points);
    setRigHealth((prev) => Math.min(100, prev + 5)); // Cap health at 100%
  }, []);

  /**
   * Fetch all rig data (health + manifest) in parallel
   * Prevents duplicate fetches with loading state guard
   */
  const fetchRigData = useCallback(async () => {
    if (!wallet) {
      onLog?.("Connect wallet to fetch rig data");
      return;
    }

    // Prevent duplicate fetches
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    onLog?.("Fetching rig data...");

    try {
      // Fetch health, manifest, and vault stats data in parallel
      const [healthResult, manifestResult, vaultStatsResult] = await Promise.all([
        fetchHealth(),
        fetchManifest(),
        fetchVaultStats()
      ]);

      if (healthResult || manifestResult || vaultStatsResult) {
        onLog?.("Rig data loaded successfully");
      } else {
        onLog?.("Failed to fetch rig data - check connection");
      }
    } finally {
      setIsLoading(false);
    }
  }, [wallet, fetchHealth, fetchManifest, fetchVaultStats, onLog, isLoading]);

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

    // Manifest State
    isPro,
    proSwapsSol,
    proSwapsBx,
    badges,
    hasTwitter,

    // Health Stats State
    inMempool,
    sent,
    failed,
    drifted,
    maxClaimEstimateUsd,
    driftedUsd,

    // Vault Stats State
    vaultTotalSol,
    vaultTransactionCount,

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

    // Loading State
    isLoading,

    // Actions
    fetchManifest,
    fetchHealth,
    fetchVaultStats,
    fetchRigData,
    incrementBoosts,
    addPermanentBoost,
    addLuckPoints,
  };
}
