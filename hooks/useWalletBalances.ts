"use client";
import { useCallback, useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import { LAMPORTS_PER_SOL, PublicKey as PublicKeyCtor } from "@solana/web3.js";
import { TOKENS } from "@/components/icons/tokens";
import { TOKEN_ICONS } from "@/lib/tokenIcons";
import type { TokenPrices } from "@/hooks/useTokenPrices";

const TOKEN_PROGRAM_ID = new PublicKeyCtor("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

export interface WalletTokenBalance {
  symbol: string;
  amount: number;
  usdValue: number;
  icon: string;
  mint: string;
}

export interface UseWalletBalancesResult {
  sol: number;
  solUsd: number;
  tokens: WalletTokenBalance[];
  totalUsd: number;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

const REFRESH_INTERVAL_MS = 60_000;

const EMPTY: Omit<UseWalletBalancesResult, "refresh"> = {
  sol: 0,
  solUsd: 0,
  tokens: [],
  totalUsd: 0,
  loading: false,
  error: null,
};

/**
 * Build a mint -> {symbol, decimals, icon} lookup for all known Solana tokens
 * we want to surface in the wallet bar. Drops Ethereum-only entries and any
 * Solana entries that lack a real mint (e.g. pondSOL placeholder).
 */
function buildSolanaMintLookup() {
  const lookup = new Map<string, { symbol: string; decimals: number; icon: string }>();
  for (const meta of Object.values(TOKENS)) {
    if (meta.chain !== "solana" || !meta.mint) continue;
    // Skip placeholder mints (any 32-byte base58 starting with the symbol literal)
    if (meta.mint.toLowerCase().startsWith(meta.symbol.toLowerCase().slice(0, 4)) && meta.mint.endsWith("1".repeat(10))) {
      continue;
    }
    const icon = TOKEN_ICONS[meta.symbol];
    if (!icon) continue;
    lookup.set(meta.mint, { symbol: meta.symbol, decimals: meta.decimals, icon });
  }
  return lookup;
}

const SOLANA_MINTS = buildSolanaMintLookup();

function priceForSymbol(symbol: string, prices: TokenPrices | null): number {
  if (!prices) return 0;
  switch (symbol) {
    case "SOL":
      return prices.solPrice;
    case "wPOND":
      return prices.wpondPrice;
    case "USDC":
    case "USDT":
      return 1;
    default:
      return 0;
  }
}

/**
 * Fetch SOL + filtered SPL token balances for a public key, joined with
 * USD prices from useTokenPrices(). Safe to call when publicKey is null
 * (returns empty disconnected state). Polls every 60s and exposes a
 * manual refresh trigger.
 */
export function useWalletBalances(
  publicKey: PublicKey | null,
  prices: TokenPrices | null
): UseWalletBalancesResult {
  const { connection } = useConnection();
  const [state, setState] = useState<Omit<UseWalletBalancesResult, "refresh">>(EMPTY);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!publicKey) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const fetchAll = async () => {
      try {
        const [lamports, parsed] = await Promise.all([
          connection.getBalance(publicKey),
          connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID }),
        ]);

        const sol = lamports / LAMPORTS_PER_SOL;
        const solUsd = sol * priceForSymbol("SOL", prices);

        const tokens: WalletTokenBalance[] = [];
        for (const { account } of parsed.value) {
          const info = account.data.parsed?.info;
          const mint: string | undefined = info?.mint;
          if (!mint) continue;
          const meta = SOLANA_MINTS.get(mint);
          if (!meta) continue;

          const amountStr: string = info.tokenAmount?.uiAmountString ?? "0";
          const amount = parseFloat(amountStr);
          if (!Number.isFinite(amount) || amount <= 0) continue;

          const usdValue = amount * priceForSymbol(meta.symbol, prices);
          tokens.push({
            symbol: meta.symbol,
            amount,
            usdValue,
            icon: meta.icon,
            mint,
          });
        }

        if (cancelled) return;
        const totalUsd = solUsd + tokens.reduce((sum, t) => sum + t.usdValue, 0);
        setState({ sol, solUsd, tokens, totalUsd, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        setState({
          ...EMPTY,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [connection, publicKey, prices, tick]);

  return { ...state, refresh };
}
