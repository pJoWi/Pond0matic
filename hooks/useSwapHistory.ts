"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  clearWallet,
  flushStorage,
  loadStorage,
  recordsForWallet,
  removeRecord,
} from "@/lib/portfolio/storage";
import { PORTFOLIO_UPDATED_EVENT, type SwapRecord } from "@/lib/portfolio/types";

export interface SwapHistoryFilters {
  mode?: SwapRecord["mode"];
  status?: SwapRecord["status"];
  symbol?: string; // matches fromSymbol or toSymbol (case-insensitive)
  from?: number;
  to?: number;
}

export interface UseSwapHistoryResult {
  records: SwapRecord[];
  total: number;
  refresh(): void;
  deleteOne(id: string): void;
  clearAll(): void;
}

function applyFilters(records: SwapRecord[], filters?: SwapHistoryFilters): SwapRecord[] {
  if (!filters) return records;
  const symLower = filters.symbol?.toLowerCase();
  return records.filter((r) => {
    if (filters.mode && r.mode !== filters.mode) return false;
    if (filters.status && r.status !== filters.status) return false;
    if (symLower) {
      if (r.fromSymbol.toLowerCase() !== symLower && r.toSymbol.toLowerCase() !== symLower) return false;
    }
    if (filters.from !== undefined && r.timestamp < filters.from) return false;
    if (filters.to !== undefined && r.timestamp > filters.to) return false;
    return true;
  });
}

/**
 * Reactive view onto the swap history for the currently-connected wallet.
 * Updates in real time when records are added/removed (same tab via custom
 * event, cross-tab via the standard storage event).
 */
export function useSwapHistory(filters?: SwapHistoryFilters): UseSwapHistoryResult {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setTick((t) => t + 1);
    window.addEventListener(PORTFOLIO_UPDATED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(PORTFOLIO_UPDATED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const allForWallet = useMemo(() => {
    if (!wallet) return [];
    const storage = loadStorage();
    return recordsForWallet(storage, wallet);
    // tick included so this recomputes on storage events
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, tick]);

  const filtered = useMemo(() => applyFilters(allForWallet, filters), [allForWallet, filters]);

  const deleteOne = useCallback((id: string) => {
    const storage = loadStorage();
    const next = removeRecord(storage, id);
    flushStorage(next);
  }, []);

  const clearAll = useCallback(() => {
    if (!wallet) return;
    const storage = loadStorage();
    const next = clearWallet(storage, wallet);
    flushStorage(next);
  }, [wallet]);

  return {
    records: filtered,
    total: allForWallet.length,
    refresh,
    deleteOne,
    clearAll,
  };
}
