export interface TokenInfo {
  symbol: string;
  icon?: string;
  name?: string;
  address?: string;
  tags?: string[];
}

/**
 * Check if a token is unknown/unverified
 * Tokens without proper metadata or with unknown tags are flagged
 */
export function checkIsUnknownToken(info: TokenInfo): boolean {
  if (!info) return true;

  // Check if token has unknown tag
  if (info.tags?.includes('unknown')) return true;

  // Check if token lacks basic metadata
  if (!info.symbol || !info.name) return true;

  // Additional checks can be added here
  // e.g., checking against a whitelist, verified token registry, etc.

  return false;
}

/**
 * Common token whitelist (verified tokens)
 */
export const VERIFIED_TOKENS = new Set([
  'SOL',
  'USDC',
  'USDT',
  'wPOND',
  'pondSOL',
  'hSOL',
  'PNDC',
  'PORK',
  'ETH',
  'ZEC',
]);

/**
 * Check if token is in verified list
 */
export function isVerifiedToken(symbol: string): boolean {
  return VERIFIED_TOKENS.has(symbol);
}
