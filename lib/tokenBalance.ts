/**
 * Token balance fetching utility
 *
 * Provides functions to query real-time token balances for SOL and SPL tokens.
 * Includes safety measures like reserving SOL for transaction fees.
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { getMintDecimals } from "./solana";

/**
 * SOL mint address (native SOL)
 */
export const SOL_MINT = "So11111111111111111111111111111111111111112";

/**
 * Minimum SOL to reserve for transaction fees (0.01 SOL)
 */
export const SOL_FEE_RESERVE = 0.01;

/**
 * Result of a balance fetch operation
 */
export interface BalanceResult {
  /** The balance in UI amount (human-readable format) */
  uiAmount: number;

  /** The balance in raw lamports/smallest unit */
  rawAmount: number;

  /** Number of decimals for this token */
  decimals: number;

  /** Whether this is SOL (native) or an SPL token */
  isNative: boolean;

  /** Error message if balance fetch failed */
  error?: string;
}

/**
 * Fetch the real-time balance of a token for a given wallet
 *
 * @param walletAddress - The wallet public key as a string
 * @param tokenMint - The token mint address
 * @param rpcUrl - RPC endpoint URL
 * @param reserveSolFees - Whether to reserve SOL for transaction fees (default: true)
 * @returns BalanceResult with balance information or error
 *
 * @example
 * ```typescript
 * // Fetch SOL balance
 * const solBalance = await fetchTokenBalance(
 *   "YourWalletAddress",
 *   SOL_MINT,
 *   "https://api.mainnet-beta.solana.com"
 * );
 * console.log(`Available SOL: ${solBalance.uiAmount}`);
 *
 * // Fetch SPL token balance
 * const usdcBalance = await fetchTokenBalance(
 *   "YourWalletAddress",
 *   "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
 *   "https://api.mainnet-beta.solana.com"
 * );
 * console.log(`Available USDC: ${usdcBalance.uiAmount}`);
 * ```
 */
export async function fetchTokenBalance(
  walletAddress: string,
  tokenMint: string,
  rpcUrl: string,
  reserveSolFees: boolean = true
): Promise<BalanceResult> {
  try {
    if (!rpcUrl) {
      return {
        uiAmount: 0,
        rawAmount: 0,
        decimals: 0,
        isNative: tokenMint === SOL_MINT,
        error: "RPC URL is missing",
      };
    }

    const connection = new Connection(rpcUrl, {
      commitment: "confirmed",
      wsEndpoint: undefined, // Disable WebSocket to prevent connection errors
    });

    const publicKey = new PublicKey(walletAddress);
    const isNative = tokenMint === SOL_MINT;
    const decimals = await getMintDecimals(tokenMint);

    if (isNative) {
      try {
        // Fetch SOL balance
        const balance = await connection.getBalance(publicKey);
        const uiAmount = balance / Math.pow(10, decimals);

        // Reserve SOL for transaction fees if requested
        const availableAmount = reserveSolFees
          ? Math.max(0, uiAmount - SOL_FEE_RESERVE)
          : uiAmount;

        const availableRaw = Math.floor(availableAmount * Math.pow(10, decimals));

        return {
          uiAmount: availableAmount,
          rawAmount: availableRaw,
          decimals,
          isNative: true,
        };
      } catch (err: any) {
        console.error("Error fetching SOL balance:", err);
        return {
          uiAmount: 0,
          rawAmount: 0,
          decimals,
          isNative: true,
          error: err?.message || "Failed to fetch SOL balance",
        };
      }
    } else {
      try {
        // Fetch SPL token balance
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          mint: new PublicKey(tokenMint),
        });

        if (tokenAccounts.value.length === 0) {
          return {
            uiAmount: 0,
            rawAmount: 0,
            decimals,
            isNative: false,
            error: "No token account found for this mint",
          };
        }

        // Get the first token account (usually there's only one per mint)
        const tokenAccount = tokenAccounts.value[0];
        const balance = tokenAccount.account.data.parsed.info.tokenAmount;

        return {
          uiAmount: parseFloat(balance.uiAmountString || "0"),
          rawAmount: parseInt(balance.amount, 10),
          decimals: balance.decimals,
          isNative: false,
        };
      } catch (err: any) {
        console.error("Error fetching SPL token balance:", err);
        return {
          uiAmount: 0,
          rawAmount: 0,
          decimals,
          isNative: false,
          error: err?.message || "Failed to fetch token balance",
        };
      }
    }
  } catch (error: any) {
    console.error("Error fetching token balance:", error);

    // Return error result
    return {
      uiAmount: 0,
      rawAmount: 0,
      decimals: 0,
      isNative: tokenMint === SOL_MINT,
      error: error?.message || "Failed to fetch balance",
    };
  }
}

/**
 * Fetch balances for multiple tokens at once
 *
 * @param walletAddress - The wallet public key as a string
 * @param tokenMints - Array of token mint addresses
 * @param rpcUrl - RPC endpoint URL
 * @param reserveSolFees - Whether to reserve SOL for transaction fees
 * @returns Map of token mint to BalanceResult
 *
 * @example
 * ```typescript
 * const balances = await fetchMultipleTokenBalances(
 *   "YourWalletAddress",
 *   [SOL_MINT, "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"],
 *   "https://api.mainnet-beta.solana.com"
 * );
 * console.log(`SOL: ${balances.get(SOL_MINT)?.uiAmount}`);
 * ```
 */
export async function fetchMultipleTokenBalances(
  walletAddress: string,
  tokenMints: string[],
  rpcUrl: string,
  reserveSolFees: boolean = true
): Promise<Map<string, BalanceResult>> {
  const results = new Map<string, BalanceResult>();

  // Fetch all balances in parallel
  const balancePromises = tokenMints.map(async (mint) => {
    const balance = await fetchTokenBalance(walletAddress, mint, rpcUrl, reserveSolFees);
    return { mint, balance };
  });

  const balances = await Promise.all(balancePromises);

  // Build result map
  for (const { mint, balance } of balances) {
    results.set(mint, balance);
  }

  return results;
}

/**
 * Check if a wallet has sufficient balance for a swap
 *
 * @param walletAddress - The wallet public key as a string
 * @param tokenMint - The token mint address
 * @param requiredAmount - Required amount in UI format
 * @param rpcUrl - RPC endpoint URL
 * @returns Object with sufficient flag and available balance
 *
 * @example
 * ```typescript
 * const check = await checkSufficientBalance(
 *   "YourWalletAddress",
 *   SOL_MINT,
 *   "0.5",
 *   "https://api.mainnet-beta.solana.com"
 * );
 * if (!check.sufficient) {
 *   console.log(`Insufficient balance. Need ${check.required}, have ${check.available}`);
 * }
 * ```
 */
export async function checkSufficientBalance(
  walletAddress: string,
  tokenMint: string,
  requiredAmount: string,
  rpcUrl: string
): Promise<{
  sufficient: boolean;
  required: number;
  available: number;
  decimals: number;
}> {
  const balance = await fetchTokenBalance(walletAddress, tokenMint, rpcUrl);
  const required = parseFloat(requiredAmount);

  return {
    sufficient: balance.uiAmount >= required,
    required,
    available: balance.uiAmount,
    decimals: balance.decimals,
  };
}
