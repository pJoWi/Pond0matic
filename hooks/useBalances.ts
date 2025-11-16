/**
 * Balance tracking hook for SOL and SPL tokens
 */

import { useCallback, useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";

export interface BalanceState {
  solBalance: number;
  tokenBalance: number;
  fetching: boolean;
  networkStatus: "online" | "offline";
}

export function useBalances(
  wallet: string,
  rpc: string,
  tokenMint: string,
  onLog?: (message: string) => void
) {
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [fetching, setFetching] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">("online");

  const fetchBalances = useCallback(async () => {
    if (!wallet) return;

    try {
      setFetching(true);
      const connection = new Connection(rpc, {
        commitment: "confirmed",
        wsEndpoint: undefined, // Disable WebSocket to prevent connection errors
      });
      const publicKey = new PublicKey(wallet);

      // Fetch SOL balance
      const solBal = await connection.getBalance(publicKey);
      setSolBalance(solBal / 1e9);

      // Fetch token balance
      if (tokenMint === "So11111111111111111111111111111111111111112") {
        // SOL is the token
        setTokenBalance(solBal / 1e9);
      } else {
        try {
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { mint: new PublicKey(tokenMint) }
          );

          if (tokenAccounts.value.length > 0) {
            const balance =
              tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
            setTokenBalance(balance || 0);
          } else {
            setTokenBalance(0);
          }
        } catch (error) {
          onLog?.(`Token balance fetch error: ${error}`);
          setTokenBalance(0);
        }
      }

      setNetworkStatus("online");
    } catch (error: any) {
      onLog?.(`Balance fetch error: ${error?.message || String(error)}`);
      setNetworkStatus("offline");
    } finally {
      setFetching(false);
    }
  }, [wallet, rpc, tokenMint, onLog]);

  // Auto-fetch balances every 15 seconds
  useEffect(() => {
    if (wallet) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 15000);
      return () => clearInterval(interval);
    }
  }, [wallet, fetchBalances]);

  return {
    solBalance,
    tokenBalance,
    fetching,
    networkStatus,
    refetch: fetchBalances,
  };
}
