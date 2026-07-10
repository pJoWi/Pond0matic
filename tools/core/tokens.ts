/** Known mints in the Pond0x ecosystem and common Solana tokens. */

export interface KnownToken {
  symbol: string;
  mint: string;
  decimals: number;
}

export const KNOWN_TOKENS: KnownToken[] = [
  { symbol: "SOL", mint: "So11111111111111111111111111111111111111112", decimals: 9 },
  { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
  { symbol: "USDT", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6 },
  { symbol: "wPOND", mint: "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq", decimals: 3 },
];

export function tokenBySymbol(symbol: string): KnownToken | undefined {
  return KNOWN_TOKENS.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase());
}

export function tokenByMint(mint: string): KnownToken | undefined {
  return KNOWN_TOKENS.find((t) => t.mint === mint);
}

/** Resolve a CLI arg that may be a symbol ("wPOND") or a raw mint address. */
export function resolveMint(symbolOrMint: string): string {
  return tokenBySymbol(symbolOrMint)?.mint ?? symbolOrMint;
}

export function labelForMint(mint: string): string {
  return tokenByMint(mint)?.symbol ?? `${mint.slice(0, 4)}…${mint.slice(-4)}`;
}
