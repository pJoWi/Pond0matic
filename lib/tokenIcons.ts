/**
 * Token icon URLs (CDN-optimized via wsrv.nl) keyed by symbol.
 *
 * NOTE: token mint addresses + chain metadata live in
 * `components/icons/tokens/index.ts` (TOKENS map). This file contains
 * only the icon URLs used by the dashboard UI. Keep them in sync.
 */
export const TOKEN_ICONS: Record<string, string> = {
  // Solana tokens
  SOL: "https://wsrv.nl/?w=48&h=48&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2FSo11111111111111111111111111111111111111112%2Flogo.png",
  wPOND: "/tokens/solana/wpond.png", // TODO: replace with Arweave URL
  pondSOL: "https://wsrv.nl/?w=48&h=48&url=https%3A%2F%2Futfs.io%2Ff%2FVWaBLnv7vdzqTQiuedZgiubmqRneVQZ0h4klCYXtA1KaocwD",
  hSOL: "https://wsrv.nl/?w=48&h=48&url=https%3A%2F%2Fraw.githubusercontent.com%2Figneous-labs%2Flst-offchain-metadata%2Fmaster%2FhSOL%2FhSOL.png",
  USDT: "https://wsrv.nl/?w=48&h=48&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2FEs9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB%2Flogo.svg",
  USDC: "https://wsrv.nl/?w=48&h=48&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2FEPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v%2Flogo.png",
  ZEC: "https://wsrv.nl/?w=48&h=48&url=https%3A%2F%2Farweave.net%2FQSYqnmB7NYlB7n1R6rz935Y07dlRK0tIuKe2mof5Sho",
  // Ethereum tokens
  ETH: "/tokens/ethereum/eth.png", // TODO: replace with Arweave URL
  PNDC: "https://wsrv.nl/?w=48&h=48&url=https%3A%2F%2Ftokens.debridge.finance%2F0xa1ce54b7a0543a9d569676a3ebf988f4704d8f7cd30206d078848ee5a4dfc29d.png",
  PORK: "/tokens/ethereum/pork.png", // TODO: replace with Arweave URL
};

export function getTokenIcon(symbol: string): string | undefined {
  return TOKEN_ICONS[symbol];
}
