import type { RigHealthSnapshot } from "@/lib/alerts/types";
import type { ClickerStatus } from "./types";

export interface ClickerPolicyInput {
  swapperRunning: boolean;
  miningActive: boolean;
  manualPause: boolean;
  status: ClickerStatus | null;
  processAlive: boolean;
  now: number; // ms epoch
}

export interface ClickerPolicyResult {
  led: "green" | "yellow" | "red" | "gray";
  label: string;
  shouldSendHeartbeat: boolean;
  desiredPaused: boolean;
  shouldStop: boolean;
  offline: boolean;
}

const STATUS_STALE_MS = 20_000;

/**
 * Pure function: given swapper/mining/user state and the clicker's last
 * reported status, decide what the UI should display and do. No side effects;
 * the orchestrator hook applies the result.
 */
export function evaluateClickerPolicy(input: ClickerPolicyInput): ClickerPolicyResult {
  const { swapperRunning, miningActive, manualPause, status, processAlive, now } = input;

  if (!status || status.state === "stopped" || !processAlive) {
    const reason =
      status?.state === "stopped" ? status.reason
      : status ? "process died"
      : "not started";
    return { led: "gray", label: `stopped (${reason})`, shouldSendHeartbeat: false, desiredPaused: false, shouldStop: false, offline: false };
  }

  if (now - status.last_scan_ts * 1000 > STATUS_STALE_MS) {
    return { led: "red", label: "offline (stale status)", shouldSendHeartbeat: false, desiredPaused: false, shouldStop: true, offline: true };
  }

  if (!swapperRunning) {
    return { led: "red", label: "disarming (swapper stopped)", shouldSendHeartbeat: false, desiredPaused: false, shouldStop: true, offline: false };
  }

  const desiredPaused = miningActive || manualPause;
  if (status.state === "paused" || desiredPaused) {
    const why = miningActive ? "mining active" : manualPause ? "manual pause" : "resuming";
    return { led: "yellow", label: `paused (${why})`, shouldSendHeartbeat: true, desiredPaused, shouldStop: false, offline: false };
  }

  return { led: "green", label: "armed", shouldSendHeartbeat: true, desiredPaused: false, shouldStop: false, offline: false };
}

/**
 * Heuristic: the cary0x health data has no "is mining" flag, so mining is
 * considered active while claims sit in the mempool or the session count
 * just increased. The panel also offers a manual pause as a safety net.
 */
export function deriveMiningActive(
  current: RigHealthSnapshot | null,
  previous: RigHealthSnapshot | null
): boolean {
  if (!current) return false;
  if (current.inMempool > 0) return true;
  if (previous && current.miningSessions > previous.miningSessions) return true;
  return false;
}
