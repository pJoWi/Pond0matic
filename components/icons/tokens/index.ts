export { TokenLogo } from './TokenLogo';

export interface TokenMetadata {
  symbol: string;
  name: string;
  mint?: string;
  address?: string;
  chain: 'solana' | 'ethereum';
  decimals: number;
}

export const TOKENS: Record<string, TokenMetadata> = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    mint: 'So11111111111111111111111111111111111111112',
    chain: 'solana',
    decimals: 9,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    chain: 'solana',
    decimals: 6,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    chain: 'solana',
    decimals: 6,
  },
  wPOND: {
    symbol: 'wPOND',
    name: 'POND COIN - WARPED',
    mint: '3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq',
    chain: 'solana',
    decimals: 9,
  },
  hSOL: {
    symbol: 'hSOL',
    name: 'Helio Staked SOL',
    mint: 'he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A',
    chain: 'solana',
    decimals: 9,
  },
  mSOL: {
    symbol: 'mSOL',
    name: 'Marinade Staked SOL',
    mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZ7ytfqcJm7So',
    chain: 'solana',
    decimals: 9,
  },
  PepeOnSOL: {
    symbol: 'PepeOnSOL',
    name: 'Pepe On Solana',
    mint: 'B5WTLaRwaUQpKk7ir1wniNB6m5o8GgMrimhKMYan2R6B',
    chain: 'solana',
    decimals: 6,
  },
  PNDC: {
    symbol: 'PNDC',
    name: 'Pond Coin',
    address: '0x423f4e6138e475d85cf7ea071ac92097ed631eea',
    chain: 'ethereum',
    decimals: 18,
  },
  PORK: {
    symbol: 'PORK',
    name: 'Pork Token',
    address: '0xb9f599ce614Feb2e1BBe58F180F370D05b39344E',
    chain: 'ethereum',
    decimals: 18,
  },
};
