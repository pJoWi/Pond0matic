"use client";
import { useEffect, useState } from "react";

export interface TokenPrices {
  wpondPrice: number;
  pndcPrice: number;
  porkPrice: number;
  solPrice: number;
  ethPrice: number;
  pondSolPrice: number;
  loading: boolean;
}

const DEFAULT_PRICES: TokenPrices = {
  wpondPrice: 0,
  pndcPrice: 0,
  porkPrice: 0,
  solPrice: 0,
  ethPrice: 0,
  pondSolPrice: 0,
  loading: true,
};

const REFRESH_INTERVAL_MS = 30_000;

// pondSOL mint placeholder - replace once a real mint is sourced
const PONDSOL_MINT = "pondSoL1111111111111111111111111111111111111";

async function safeJson(res: Response): Promise<any | null> {
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches dashboard token prices from a mix of internal and external sources.
 *
 * - wPOND, PNDC, PORK come from internal API routes
 * - SOL & ETH come from CoinGecko with a DexScreener fallback
 * - pondSOL comes from DexScreener (mint is currently a placeholder)
 *
 * Refreshes every 30 seconds. Returns 0 for any price that cannot be resolved.
 */
export function useTokenPrices(): TokenPrices {
  const [prices, setPrices] = useState<TokenPrices>(DEFAULT_PRICES);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        const [wpondRes, pndcRes, porkRes] = await Promise.all([
          fetch("/api/wpond-price"),
          fetch("/api/pndc-stats"),
          fetch("/api/pork-stats"),
        ]);

        const [wpondData, pndcData, porkData] = await Promise.all([
          safeJson(wpondRes),
          safeJson(pndcRes),
          safeJson(porkRes),
        ]);

        let solPrice = 0;
        let ethPrice = 0;

        try {
          const cryptoRes = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=solana,ethereum&vs_currencies=usd"
          );
          const cryptoData = await safeJson(cryptoRes);
          solPrice = cryptoData?.solana?.usd || 0;
          ethPrice = cryptoData?.ethereum?.usd || 0;
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
          // ETH fallback: try CoinGecko individual
          try {
            const ethRes = await fetch(
              "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
            );
            const ethData = await safeJson(ethRes);
            ethPrice = ethData?.ethereum?.usd || 0;
          } catch {
            // Silent fail - ETH stays 0
          }
        }

        let pondSolPrice = 0;
        try {
          const pondSolRes = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${PONDSOL_MINT}`
          );
          const pondSolData = await safeJson(pondSolRes);
          pondSolPrice = parseFloat(pondSolData?.pairs?.[0]?.priceUsd || "0");
        } catch {
          // pondSOL stays 0
        }

        if (cancelled) return;

        setPrices({
          wpondPrice: wpondData?.price || 0,
          pndcPrice: pndcData?.price || 0,
          porkPrice: porkData?.price || 0,
          solPrice,
          ethPrice,
          pondSolPrice,
          loading: false,
        });
      } catch {
        if (cancelled) return;
        setPrices((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return prices;
}
