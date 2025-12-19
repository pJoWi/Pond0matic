/**
 * Type definitions for the swap mode system
 *
 * This module defines the core types for the refactored swap mode system,
 * which simplifies from 4 modes to 2 clear modes: boost and rewards.
 */

/**
 * Swap mode types
 * - normal: Execute a single swap
 * - boost: Execute multiple swaps per round with randomized amounts
 * - rewards: Execute swaps to earn rewards/points
 */
export type SwapMode = "normal" | "boost" | "rewards";

/**
 * Configuration for boost mode
 * In boost mode, multiple swaps are executed per round with randomized amounts
 */
export interface BoostModeConfig {
  /** Minimum amount to swap (base amount) */
  minAmount: string;

  /** Maximum amount to swap (used for randomization) */
  maxAmount: string;

  /** Number of swaps to execute per round (0 = infinite) */
  swapsPerRound: number;

  /** Number of rounds to execute (0 = infinite) */
  numberOfRounds: number;

  /** Delay in milliseconds between swaps */
  delayMs: number;

  /** Whether to execute infinite rounds */
  infinite: boolean;
}

/**
 * Configuration for rewards mode
 * In rewards mode, swaps are executed to earn rewards/points
 */
export interface RewardsModeConfig {
  /** Fixed amount to swap each time */
  amount: string;

  /** Number of swaps to execute (0 = infinite) */
  numberOfSwaps: number;

  /** Delay in milliseconds between swaps */
  delayMs: number;

  /** Whether to execute infinite swaps */
  infinite: boolean;
}

/**
 * Combined swap configuration
 * Contains settings for both modes and the current active mode
 */
export interface SwapConfig {
  /** Current active swap mode */
  mode: SwapMode;

  /** Configuration for boost mode */
  boost: BoostModeConfig;

  /** Configuration for rewards mode */
  rewards: RewardsModeConfig;

  /** Optional referral link for the swap */
  referralLink?: string;
}

/**
 * Default boost mode configuration
 */
export const DEFAULT_BOOST_CONFIG: BoostModeConfig = {
  minAmount: process.env.NEXT_PUBLIC_DEFAULT_MIN_AMOUNT || "0.01",
  maxAmount: process.env.NEXT_PUBLIC_DEFAULT_MAX_AMOUNT || "0.02",
  swapsPerRound: Number(process.env.NEXT_PUBLIC_DEFAULT_SWAPS_PER_ROUND) || 18,
  numberOfRounds: Number(process.env.NEXT_PUBLIC_DEFAULT_ROUNDS) || 3,
  delayMs: Number(process.env.NEXT_PUBLIC_DEFAULT_SWAP_DELAY_MS) || 6000,
  infinite: false,
};

/**
 * Default rewards mode configuration
 */
export const DEFAULT_REWARDS_CONFIG: RewardsModeConfig = {
  amount: process.env.NEXT_PUBLIC_DEFAULT_REWARDS_AMOUNT || "10",
  numberOfSwaps: Number(process.env.NEXT_PUBLIC_DEFAULT_REWARDS_SWAPS) || 5,
  delayMs: 3000,
  infinite: false,
};

/**
 * Default swap configuration
 */
export const DEFAULT_SWAP_CONFIG: SwapConfig = {
  mode: "boost",
  boost: DEFAULT_BOOST_CONFIG,
  rewards: DEFAULT_REWARDS_CONFIG,
};
