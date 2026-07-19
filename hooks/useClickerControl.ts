"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVisibilityPolling } from "./useVisibilityPolling";
import {
  evaluateClickerPolicy,
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
 * Poll cadence (5 s visible) doubles as the heartbeat, well inside the
 * Python side's 15 s dead-man's window.
 */
export function useClickerControl(args: UseClickerControlArgs): UseClickerControlResult {
  const { swapperRunning, miningActive, manualPause } = args;
  const [available, setAvailable] = useState(true);
  const [status, setStatus] = useState<ClickerStatus | null>(null);
  const [processAlive, setProcessAlive] = useState(false);
  const [events, setEvents] = useState<ClickerEvent[]>([]);
  const pollMs = useVisibilityPolling(5_000, 60_000);
  const busyRef = useRef(false);

  const policy = evaluateClickerPolicy({
    swapperRunning,
    miningActive,
    manualPause,
    status,
    processAlive,
    now: Date.now(),
  });

  const stop = useCallback(async () => {
    await fetch("/api/clicker/stop", { method: "POST" }).catch(() => undefined);
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
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Start failed";
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const res = await fetch("/api/clicker/status");
        if (res.status === 404) {
          if (!cancelled) setAvailable(false);
          return;
        }
        const data: ClickerStatusResponse = await res.json();
        if (cancelled) return;
        setAvailable(true);
        setStatus(data.status);
        setProcessAlive(data.processAlive);
        setEvents(data.events);

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
