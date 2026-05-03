"use client";
import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTokenPrices } from "./useTokenPrices";
import { useRigHealth } from "./useRigHealth";
import { fire } from "@/lib/alerts/notifier";
import { evaluateRigRules } from "@/lib/alerts/rigEvaluator";
import { evaluatePriceRules, refreshBaselines } from "@/lib/alerts/priceEvaluator";
import {
  loadConfig,
  saveConfig,
  ALERTS_UPDATED_EVENT,
} from "@/lib/alerts/storage";
import type {
  AlertEvent,
  PriceAlertRule,
  PriceBaselines,
  PriceSnapshot,
  RigAlertRule,
  StoredAlertConfig,
  TokenSymbol,
} from "@/lib/alerts/types";

const TOKEN_SYMBOLS: TokenSymbol[] = ["SOL", "wPOND", "pondSOL", "ETH", "PNDC", "PORK"];

function pricesToSnapshot(prices: ReturnType<typeof useTokenPrices>): PriceSnapshot {
  return {
    fetchedAt: Date.now(),
    prices: {
      SOL: prices.solPrice,
      wPOND: prices.wpondPrice,
      pondSOL: prices.pondSolPrice,
      ETH: prices.ethPrice,
      PNDC: prices.pndcPrice,
      PORK: prices.porkPrice,
    },
  };
}

function applyEventsToConfig(
  config: StoredAlertConfig,
  events: AlertEvent[],
  now: number
): StoredAlertConfig {
  if (events.length === 0) return config;

  const firedRuleIds = new Set(events.map((e) => e.ruleId));

  const rigRules: RigAlertRule[] = config.rigRules.map((rule) =>
    firedRuleIds.has(rule.id) ? { ...rule, lastTriggeredAt: now } : rule
  );

  const priceRules: PriceAlertRule[] = config.priceRules.map((rule) => {
    if (!firedRuleIds.has(rule.id)) return rule;
    const updated: PriceAlertRule = { ...rule, lastTriggeredAt: now };
    if (updated.oneShot) updated.enabled = false;
    return updated;
  });

  const recentTriggers = [...events, ...config.recentTriggers].slice(0, 50);

  return { ...config, rigRules, priceRules, recentTriggers };
}

/**
 * The single orchestrator that listens for new price/rig snapshots, runs
 * the pure evaluators, fires notifications, and persists state changes.
 *
 * Mount this hook ONCE per app — typically in app/page.tsx (the dashboard).
 * Mounting it twice would double-fire alerts.
 */
export function useAlertEngine(): void {
  const { publicKey } = useWallet();
  const prices = useTokenPrices();
  const rig = useRigHealth(publicKey);

  // Mutable refs so we don't re-trigger the effect for state we own internally.
  const configRef = useRef<StoredAlertConfig>(loadConfig());
  const baselinesRef = useRef<PriceBaselines>({ byRule: {} });
  const lastPriceFetchRef = useRef<number>(0);
  const lastRigFetchRef = useRef<number>(0);

  // Re-load config when other tabs / the alerts page mutate it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      configRef.current = loadConfig();
    };
    window.addEventListener(ALERTS_UPDATED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(ALERTS_UPDATED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  // Evaluate price rules whenever prices tick.
  useEffect(() => {
    if (prices.loading) return;
    const fetchedAt = Date.now();
    if (fetchedAt === lastPriceFetchRef.current) return;
    lastPriceFetchRef.current = fetchedAt;

    const snapshot = pricesToSnapshot(prices);
    // Refresh baselines first so percent-change rules have something to compare against
    baselinesRef.current = refreshBaselines(
      snapshot,
      baselinesRef.current,
      configRef.current.priceRules,
      fetchedAt
    );

    const events = evaluatePriceRules(
      snapshot,
      baselinesRef.current,
      configRef.current.priceRules,
      fetchedAt
    );

    if (events.length > 0) {
      events.forEach(fire);
      configRef.current = applyEventsToConfig(configRef.current, events, fetchedAt);
      saveConfig(configRef.current);
    }
  }, [prices]);

  // Evaluate rig rules whenever a new snapshot arrives.
  useEffect(() => {
    if (!rig.current) return;
    if (rig.current.fetchedAt === lastRigFetchRef.current) return;
    lastRigFetchRef.current = rig.current.fetchedAt;

    const events = evaluateRigRules(
      rig.current,
      rig.previous,
      configRef.current.rigRules,
      rig.current.fetchedAt
    );

    if (events.length > 0) {
      events.forEach(fire);
      configRef.current = applyEventsToConfig(configRef.current, events, rig.current.fetchedAt);
      saveConfig(configRef.current);
    }
  }, [rig.current, rig.previous]);
}

// Token symbols re-export for callers that need the canonical list.
export { TOKEN_SYMBOLS };
