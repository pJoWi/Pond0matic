/**
 * Pure session planner for the swap engine.
 *
 * Behavior parity with the legacy loops in hooks/useSwapExecution.ts:
 * amounts, delays, ordering and infinite-session semantics are identical.
 * The engine (hooks/useSwapEngine.ts) executes the returned steps and owns
 * every side effect (balances, orders, signing, executing, pausing, stopping).
 */
import type { SwapMode } from "@/types/swapModes";

export interface SessionConfig {
  mode: SwapMode;
  /** UI amount for normal/rewards; minimum of the random range for boost */
  amount: string;
  /** Maximum of the random range for boost */
  maxAmount: string;
  /** Manual boost return-swap amount ("" = use accumulated balance) */
  loopReturnAmount: string;
  swapsPerRound: number;
  /** Boost rounds; 0 = infinite */
  numberOfRounds: number;
  /** Rewards rounds; 0 = infinite */
  numberOfSwaps: number;
  /** Delay between swaps within a round */
  swapDelayMs: number;
  /** Delay between rounds */
  autoDelayMs: number;
}

export type SessionStep =
  | { kind: "swap"; amountUi: string; swapInRound: number; swapsInRound: number }
  | { kind: "return-swap"; manualAmountUi: string | null }
  | { kind: "delay"; ms: number };

/** Legacy-parity randomizer (port of boostRandom in useSwapExecution.ts). */
export function randomAmount(min: number, max: number, rng: () => number): string {
  const minVal = Math.max(0, min);
  const maxVal = Math.max(minVal + Number.EPSILON, max || minVal);
  const v = rng() * (maxVal - minVal) + minVal;
  return String(Number(v.toFixed(12)));
}

export function totalRounds(config: SessionConfig): number {
  switch (config.mode) {
    case "normal":
      return 1;
    case "boost":
      return config.numberOfRounds === 0 ? Infinity : config.numberOfRounds;
    case "rewards":
      return config.numberOfSwaps === 0 ? Infinity : config.numberOfSwaps;
  }
}

export function hasNextRound(completedRounds: number, config: SessionConfig): boolean {
  return completedRounds < totalRounds(config);
}

export function planRound(
  config: SessionConfig,
  roundIndex: number,
  rng: () => number
): SessionStep[] {
  const steps: SessionStep[] = [];
  switch (config.mode) {
    case "normal":
      steps.push({ kind: "swap", amountUi: config.amount, swapInRound: 1, swapsInRound: 1 });
      return steps; // no return swap, no delays
    case "boost": {
      const swapsInRound = Math.max(1, config.swapsPerRound);
      for (let i = 1; i <= swapsInRound; i++) {
        steps.push({
          kind: "swap",
          amountUi: randomAmount(Number(config.amount), Number(config.maxAmount), rng),
          swapInRound: i,
          swapsInRound,
        });
        if (i < swapsInRound) steps.push({ kind: "delay", ms: config.swapDelayMs });
      }
      steps.push({ kind: "return-swap", manualAmountUi: config.loopReturnAmount || null });
      break;
    }
    case "rewards":
      steps.push({ kind: "swap", amountUi: config.amount, swapInRound: 1, swapsInRound: 1 });
      steps.push({ kind: "delay", ms: config.swapDelayMs });
      steps.push({ kind: "return-swap", manualAmountUi: null });
      break;
  }
  if (hasNextRound(roundIndex, config)) {
    steps.push({ kind: "delay", ms: config.autoDelayMs });
  }
  return steps;
}
