import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, ParsedTransactionWithMeta } from "@solana/web3.js";

// Pond0x Hashrate Booster Vault (receives SOL, forwards to Treasury)
const HASHRATE_BOOSTER_VAULT = "4ngqDt821wV2CjxoZLCLcTAPZNt6ZqpswoqyQEztsU36";

// Pond0x Treasury (receives SOL from Hashrate Booster)
const POND0X_TREASURY = "cPUtmyb7RZhCaTusCb4qnPJjVTbwpJ6SpXUCvnBDU4a";

// RPC endpoints with fallbacks
const RPC_ENDPOINTS = [
  process.env.NEXT_PUBLIC_DEFAULT_RPC,
  "https://api.mainnet-beta.solana.com",
  "https://solana-api.projectserum.com",
].filter(Boolean) as string[];

interface VaultStats {
  totalSolSent: number;
  transactionCount: number;
  error?: string;
}

async function fetchVaultStatsWithRpc(
  wallet: string,
  rpcUrl: string
): Promise<VaultStats | null> {
  try {
    const connection = new Connection(rpcUrl, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 30000, // 30 seconds
    });

    const walletPubkey = new PublicKey(wallet);

    // Fetch transaction signatures for this wallet with timeout
    const signatures = await Promise.race([
      connection.getSignaturesForAddress(walletPubkey, { limit: 1000 }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout fetching signatures")), 20000)
      ),
    ]);

    let totalSolSent = 0;
    let transactionCount = 0;

    // Process transactions in batches to avoid rate limits
    const batchSize = 50;
    for (let i = 0; i < signatures.length; i += batchSize) {
      const batch = signatures.slice(i, i + batchSize);

      const txs = await Promise.race([
        connection.getParsedTransactions(
          batch.map((sig) => sig.signature),
          { maxSupportedTransactionVersion: 0 }
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout fetching transactions")), 15000)
        ),
      ]);

      for (const tx of txs) {
        if (!tx || !tx.meta || tx.meta.err) continue;

        const message = tx.transaction.message;
        const accountKeys = message.accountKeys.map((key) => key.pubkey.toString());

        // Check if this transaction involves the vault
        if (!accountKeys.includes(HASHRATE_BOOSTER_VAULT)) continue;

        // Count this transaction
        transactionCount++;

        // Check for SOL transfers to vault
        const preBalances = tx.meta.preBalances;
        const postBalances = tx.meta.postBalances;

        const walletIndex = accountKeys.indexOf(wallet);
        const vaultIndex = accountKeys.indexOf(HASHRATE_BOOSTER_VAULT);

        if (walletIndex !== -1 && vaultIndex !== -1) {
          const walletBalanceChange = postBalances[walletIndex] - preBalances[walletIndex];
          const vaultBalanceChange = postBalances[vaultIndex] - preBalances[vaultIndex];

          // If wallet balance decreased and vault balance increased, it's a transfer to vault
          if (walletBalanceChange < 0 && vaultBalanceChange > 0) {
            totalSolSent += Math.abs(vaultBalanceChange) / 1e9; // Convert lamports to SOL
          }
        }
      }
    }

    return {
      totalSolSent: Number(totalSolSent.toFixed(4)),
      transactionCount,
    };
  } catch (error) {
    console.error(`RPC ${rpcUrl} failed:`, error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;

  if (!wallet) {
    return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
  }

  // Try each RPC endpoint until one succeeds
  let lastError: string = "No RPC endpoints available";

  for (const rpcUrl of RPC_ENDPOINTS) {
    console.log(`Trying RPC: ${rpcUrl}`);
    const stats = await fetchVaultStatsWithRpc(wallet, rpcUrl);

    if (stats !== null) {
      console.log(`Successfully fetched vault stats from ${rpcUrl}`);
      return NextResponse.json(stats, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    }

    lastError = `All RPC endpoints failed`;
  }

  // If all RPCs fail, return empty stats instead of error
  console.warn(`Vault stats fetch failed for ${wallet}: ${lastError}`);

  return NextResponse.json(
    {
      totalSolSent: 0,
      transactionCount: 0,
      error: "Unable to fetch vault stats - RPC unavailable",
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
