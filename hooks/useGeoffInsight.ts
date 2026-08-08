"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GeoffInsight,
  InsightResponse,
  InsightSnapshot,
} from "@/lib/geoff/types";

/**
 * Orchestrator for Geoff insight cards: owns availability, fetching, cooldown
 * and cancellation. All rules about *what* to say live in lib/geoff (pure);
 * this hook only deals with side effects.
 *
 * Deliberately NOT polled — every run costs Geoff tokens, so an insight is
 * generated on an explicit user action and then held until asked again.
 */
const COOLDOWN_MS = 20_000;

export interface GeoffInsightState {
  /** null while the availability probe is in flight. */
  available: boolean | null;
  insight: GeoffInsight | null;
  model: string | null;
  generatedAt: number | null;
  loading: boolean;
  error: string | null;
  /** Blocked by the cooldown after a successful run. */
  cooldown: boolean;
  generate: () => void;
}

export function useGeoffInsight(
  buildSnapshot: () => InsightSnapshot | null
): GeoffInsightState {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [insight, setInsight] = useState<GeoffInsight | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  // Keep the latest builder without making `generate` change identity on every
  // render — the snapshot is read at click time, not at render time.
  const buildRef = useRef(buildSnapshot);
  buildRef.current = buildSnapshot;

  const abortRef = useRef<AbortController | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/geoff/insight")
      .then((r) => (r.ok ? r.json() : { configured: false }))
      .then((d) => {
        if (!cancelled) setAvailable(Boolean(d?.configured));
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    },
    []
  );

  const generate = useCallback(() => {
    const snapshot = buildRef.current();
    if (!snapshot) {
      setError("No data to analyse yet.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await fetch("/api/geoff/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snapshot }),
          signal: controller.signal,
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            (data as { error?: string } | null)?.error ??
              `Request failed (${response.status})`
          );
        }

        const result = data as InsightResponse;
        if (controller.signal.aborted) return;
        setInsight(result.insight);
        setModel(result.model);
        setGeneratedAt(result.generatedAt);
        setCooldown(true);
        cooldownRef.current = setTimeout(() => setCooldown(false), COOLDOWN_MS);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Geoff request failed.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
  }, []);

  return {
    available,
    insight,
    model,
    generatedAt,
    loading,
    error,
    cooldown,
    generate,
  };
}
