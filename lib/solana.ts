/**
 * Solana utility functions for transaction handling and token operations
 */

// Token decimals for each supported token
export const TOKEN_DECIMALS: Record<string, number> = {
  "So11111111111111111111111111111111111111112": 9,  // SOL
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": 6,  // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": 6,  // USDT
  "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq": 3,  // wPOND
  "he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A": 9,   // hSOL
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": 9,    // mSoL
  "B5WTLaRwaUQpKk7ir1wniNB6m5o8GgMrimhKMYan2R6B": 6,    // PepeOnSOL
};

/**
 * Convert base64 string to Uint8Array for transaction deserialization
 */
export function b64ToUint8Array(b64: string): Uint8Array {
  const bin = typeof atob !== 'undefined'
    ? atob(b64)
    : Buffer.from(b64, 'base64').toString('binary');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

// Cache for token decimals fetched from Jupiter API
const decimalsCache = new Map<string, number>();

/**
 * Get token decimals with fallback to Jupiter API
 * Caches results to minimize API calls
 */
export async function getMintDecimals(mint: string): Promise<number> {
  // Check static decimals first
  if (TOKEN_DECIMALS[mint] !== undefined) {
    return TOKEN_DECIMALS[mint];
  }

  // Check cache
  if (decimalsCache.has(mint)) {
    return decimalsCache.get(mint)!;
  }

  // Fetch from Jupiter token list
  try {
    const res = await fetch("https://token.jup.ag/all");
    const list = await res.json();
    const found = Array.isArray(list)
      ? list.find((t: any) => t.address === mint)
      : null;
    const decimals = found?.decimals ?? 6;
    decimalsCache.set(mint, decimals);
    return decimals;
  } catch (error) {
    // Fallback to 6 decimals (common for SPL tokens)
    const fallback = 6;
    decimalsCache.set(mint, fallback);
    return fallback;
  }
}

/**
 * Clear the decimals cache (useful for testing)
 */
export function clearDecimalsCache(): void {
  decimalsCache.clear();
}
