/**
 * Portfolio (swap history + PnL) type definitions and zod schemas.
 *
 * Records are wallet-scoped at read time. Pending records exist between
 * sendRawTransaction and confirmation; only confirmed records feed PnL.
 */
import { z } from "zod";

export const STORAGE_KEY = "pond0matic.portfolio.v1";
export const STORAGE_VERSION = 1 as const;
export const MAX_RECORDS = 500;
export const PORTFOLIO_UPDATED_EVENT = "pond0matic:portfolio-updated";

export const SwapModeSchema = z.enum(["normal", "boost", "rewards"]);
export type SwapMode = z.infer<typeof SwapModeSchema>;

export const SwapStatusSchema = z.enum(["pending", "confirmed", "failed"]);
export type SwapStatus = z.infer<typeof SwapStatusSchema>;

export const SwapRecordSchema = z.object({
  id: z.string().min(1),
  signature: z.string().min(1),
  mode: SwapModeSchema,
  fromMint: z.string(),
  fromSymbol: z.string(),
  fromAmount: z.number().nonnegative(),
  toMint: z.string(),
  toSymbol: z.string(),
  toAmount: z.number().nonnegative(),
  fromPriceUsd: z.number().nonnegative(),
  toPriceUsd: z.number().nonnegative(),
  feesUsd: z.number().nonnegative().optional(),
  status: SwapStatusSchema,
  timestamp: z.number().int().nonnegative(),
  walletAddress: z.string().min(1),
});
export type SwapRecord = z.infer<typeof SwapRecordSchema>;

export const PortfolioStorageSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  records: z.array(SwapRecordSchema).max(MAX_RECORDS),
  updatedAt: z.number().int().nonnegative(),
});
export type PortfolioStorage = z.infer<typeof PortfolioStorageSchema>;

export function emptyStorage(): PortfolioStorage {
  return { version: STORAGE_VERSION, records: [], updatedAt: 0 };
}
