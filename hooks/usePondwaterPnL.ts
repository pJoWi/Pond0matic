"use client";
import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTokenPrices } from "./useTokenPrices";
import { useWalletBalances } from "./useWalletBalances";
import { useSwapHistory } from "./useSwapHistory";
import { computePondwaterPnL, type PnLBreakdown } from "@/lib/portfolio/pnl";

/**
 * Live pondwater PnL: joins swap history, current wPOND balance, and
 * current wPOND price into the PnL breakdown structure.
 *
 * Returns null when wallet is disconnected so the UI can render the
 * "Connect a wallet" message instead of empty zeros that look like data.
 */
export function usePondwaterPnL(): PnLBreakdown | null {
  const { publicKey, connected } = useWallet();
  const prices = useTokenPrices();
  const balances = useWalletBalances(publicKey, prices);
  const history = useSwapHistory();

  return useMemo(() => {
    if (!connected || !publicKey) return null;
    const wpondBalance =
      balances.tokens.find((t) => t.symbol === "wPOND")?.amount ?? 0;
    const confirmed = history.records.filter((r) => r.status === "confirmed");
    return computePondwaterPnL({
      records: confirmed,
      currentBalance: wpondBalance,
      currentPrice: prices.wpondPrice,
    });
  }, [connected, publicKey, balances.tokens, history.records, prices.wpondPrice]);
}
