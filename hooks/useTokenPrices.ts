"use client";
import { useEffect, useState } from "react";
import { useVisibilityPolling } from "./useVisibilityPolling";

export interface TokenPrices {
  wpondPrice: number;
  solPrice: number;
  loading: boolean;
}

const DEFAULT_PRICES: TokenPrices = {
  wpondPrice: 0,
  solPrice: 0,
  loading: true,
};

async function safeJson(res: Response): Promise<any | null> {
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches dashboard token prices.
 *
 * - wPOND comes from the internal /api/wpond-price route
 * - SOL comes from CoinGecko with a DexScreener fallback
 *
 * Refreshes every 30 seconds. Returns 0 for any price that cannot be resolved.
 */
export function useTokenPrices(): TokenPrices {
  const [prices, setPrices] = useState<TokenPrices>(DEFAULT_PRICES);
  const intervalMs = useVisibilityPolling();

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        const wpondRes = await fetch("/api/wpond-price");
        const wpondData = await safeJson(wpondRes);

        let solPrice = 0;

        try {
          const cryptoRes = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
          );
          const cryptoData = await safeJson(cryptoRes);
          solPrice = cryptoData?.solana?.usd || 0;
        } catch {
          // Fallback to DexScreener for SOL
          try {
            const dexRes = await fetch(
              "https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112"
            );
            const dexData = await safeJson(dexRes);
            solPrice = parseFloat(dexData?.pairs?.[0]?.priceUsd || "0");
          } catch {
            // Silent fail - SOL stays 0
          }
        }

        if (cancelled) return;

        setPrices({
          wpondPrice: wpondData?.price || 0,
          solPrice,
          loading: false,
        });
      } catch {
        if (cancelled) return;
        setPrices((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return prices;
}
