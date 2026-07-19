"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVisibilityPolling } from "./useVisibilityPolling";
import {
  evaluateClickerPolicy,
  isConfirmedStop,
  type ClickerPolicyResult,
} from "@/lib/clicker/clickerPolicyEvaluator";
import type {
  ClickerEvent,
  ClickerStatus,
  ClickerStatusResponse,
  StartRequest,
} from "@/lib/clicker/types";

export interface UseClickerControlArgs {
  swapperRunning: boolean;
  miningActive: boolean;
  manualPause: boolean;
}

export interface UseClickerControlResult {
  available: boolean;
  status: ClickerStatus | null;
  events: ClickerEvent[];
  policy: ClickerPolicyResult;
  start: (settings: StartRequest) => Promise<string | null>;
  stop: () => Promise<void>;
}

/**
 * Orchestrator for the guard-railed autoclicker. All decisions live in
 * evaluateClickerPolicy; this hook only polls, applies the result
 * (heartbeat / pause / stop) and exposes actions to the panel.
 * Poll cadence (5 s visible / 10 s hidden) doubles as the heartbeat;
 * both cadences must stay below the Python side's 15 s dead-man's window.
 *
 * Disarm is level-triggered: stop() sets stopRequestedRef and retries up
 * to 3 times immediately; each subsequent tick re-asserts the stop POST
 * until a CONFIRMED stop is observed (data.status !== null AND state is
 * "stopped" OR processAlive is false).  When data.status === null (torn
 * read of status.json) the ref stays true and the stop is re-asserted —
 * unknown status must never be mistaken for "observed stopped".
 * Heartbeat writes are suppressed on every tick where the ref is true.
 * start() on success clears the ref so an explicit re-arm supersedes a
 * pending disarm.
 */
export function useClickerControl(args: UseClickerControlArgs): UseClickerControlResult {
  const { swapperRunning, miningActive, manualPause } = args;
  const [available, setAvailable] = useState(true);
  const [status, setStatus] = useState<ClickerStatus | null>(null);
  const [processAlive, setProcessAlive] = useState(false);
  const [events, setEvents] = useState<ClickerEvent[]>([]);
  const pollMs = useVisibilityPolling(5_000, 10_000);
  const busyRef = useRef(false);
  const unavailableRef = useRef(false);
  const stopRequestedRef = useRef(false);

  const policy = evaluateClickerPolicy({
    swapperRunning,
    miningActive,
    manualPause,
    status,
    processAlive,
    now: Date.now(),
  });

  const stop = useCallback(async () => {
    stopRequestedRef.current = true;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch("/api/clicker/stop", { method: "POST" });
        if (res.ok) return; // success — tick will clear the ref once process is observed stopped
      } catch {
        // transient fetch error — retry
      }
      if (attempt < 2) await new Promise<void>((r) => setTimeout(r, 250));
    }
    // All retries exhausted; stopRequestedRef stays true — the tick will
    // keep re-asserting the stop until the process is observed stopped.
  }, []);

  const start = useCallback(async (settings: StartRequest): Promise<string | null> => {
    try {
      const res = await fetch("/api/clicker/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        return data?.error ?? `Start failed (${res.status})`;
      }
      stopRequestedRef.current = false; // explicit re-arm supersedes any pending disarm
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Start failed";
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (unavailableRef.current) return;
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const res = await fetch("/api/clicker/status");
        if (res.status === 404) {
          unavailableRef.current = true;
          if (!cancelled) setAvailable(false);
          return;
        }
        const data: ClickerStatusResponse = await res.json();
        if (cancelled) return;
        setAvailable(true);
        setStatus(data.status);
        setProcessAlive(data.processAlive);
        setEvents(data.events);

        // Level-triggered disarm: clear the ref ONLY on a confirmed stop.
        // A confirmed stop requires data.status !== null AND (state is
        // "stopped" OR the process is not alive).  When data.status === null
        // (torn read of status.json) we keep the ref true and re-assert the
        // stop — unknown status must never be mistaken for observed stopped.
        if (stopRequestedRef.current) {
          const confirmedStop = isConfirmedStop(data.status, data.processAlive);
          if (confirmedStop) {
            stopRequestedRef.current = false; // confirmed stop — disarm achieved
          } else {
            // active session or unknown status — re-assert the stop
            fetch("/api/clicker/stop", { method: "POST" }).catch(() => undefined);
          }
          return; // suppress heartbeat on any tick where the ref was set
        }

        const decision = evaluateClickerPolicy({
          swapperRunning,
          miningActive,
          manualPause,
          status: data.status,
          processAlive: data.processAlive,
          now: Date.now(),
        });
        if (decision.shouldStop) {
          await fetch("/api/clicker/stop", { method: "POST" }).catch(() => undefined);
        } else if (decision.shouldSendHeartbeat) {
          await fetch("/api/clicker/control", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paused: decision.desiredPaused }),
          }).catch(() => undefined);
        }
      } catch {
        // dev server hiccup — keep last known state, next tick heals
      } finally {
        busyRef.current = false;
      }
    };

    tick();
    const id = setInterval(tick, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs, swapperRunning, miningActive, manualPause]);

  return { available, status, events, policy, start, stop };
}
