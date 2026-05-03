"use client";
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTokenPrices, type TokenPrices } from "./useTokenPrices";
import {
  appendRecord,
  loadStorage,
  saveStorage,
  updateRecord,
} from "@/lib/portfolio/storage";
import {
  subscribeSwapEvents,
  type SwapStartedEvent,
} from "@/lib/portfolio/swapEventBus";
import type { SwapRecord } from "@/lib/portfolio/types";

const PRICE_LOOKUP_BY_SYMBOL: Record<string, keyof TokenPrices> = {
  SOL: "solPrice",
  wPOND: "wpondPrice",
  pondSOL: "pondSolPrice",
  ETH: "ethPrice",
  PNDC: "pndcPrice",
  PORK: "porkPrice",
};

function priceForSymbol(symbol: string, prices: TokenPrices): number {
  const key = PRICE_LOOKUP_BY_SYMBOL[symbol];
  if (!key) return 0;
  const value = prices[key];
  return typeof value === "number" ? value : 0;
}

function recordFromStartEvent(
  event: SwapStartedEvent,
  walletAddress: string,
  prices: TokenPrices
): SwapRecord {
  return {
    id: event.internalId,
    signature: `pending-${event.internalId}`,
    mode: event.mode,
    fromMint: event.fromMint,
    fromSymbol: event.fromSymbol,
    fromAmount: event.fromAmount,
    toMint: event.toMint,
    toSymbol: event.toSymbol,
    toAmount: event.toAmount,
    fromPriceUsd: priceForSymbol(event.fromSymbol, prices),
    toPriceUsd: priceForSymbol(event.toSymbol, prices),
    status: "pending",
    timestamp: Date.now(),
    walletAddress,
  };
}

/**
 * Subscribes to the swap event bus and writes records to localStorage.
 *
 * Mount this hook ONCE per app — typically in app/page.tsx alongside
 * useAlertEngine. Mounting it twice would create duplicate records for
 * each swap event.
 *
 * The hook is purely a side-effect; it returns void.
 */
export function useSwapRecorder(): void {
  const { publicKey } = useWallet();
  const prices = useTokenPrices();

  useEffect(() => {
    const wallet = publicKey?.toBase58() ?? "";
    if (!wallet) return; // No wallet: nothing to record

    const unsubscribe = subscribeSwapEvents((event) => {
      switch (event.type) {
        case "swap-started": {
          const record = recordFromStartEvent(event, wallet, prices);
          const storage = appendRecord(loadStorage(), record);
          saveStorage(storage);
          break;
        }
        case "swap-sent": {
          const storage = updateRecord(loadStorage(), event.internalId, {
            signature: event.signature,
          });
          saveStorage(storage);
          break;
        }
        case "swap-confirmed": {
          const storage = updateRecord(loadStorage(), event.internalId, {
            status: "confirmed",
          });
          saveStorage(storage);
          break;
        }
        case "swap-failed": {
          const storage = updateRecord(loadStorage(), event.internalId, {
            status: "failed",
          });
          saveStorage(storage);
          break;
        }
      }
    });
    return unsubscribe;
  }, [publicKey, prices]);
}
