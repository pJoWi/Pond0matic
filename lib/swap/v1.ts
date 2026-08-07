/**
 * Jupiter Swap API v1 request builders + boundary parsing (Zod v4). Pure —
 * no fetch here. Unlike v2 /order, v1 /swap accepts the legacy affiliate vault
 * ATA as `feeAccount`, which is what makes swaps count toward RIG boost.
 */
import { z } from "zod";
import { buildJupiterSwapRequest } from "@/lib/referral";

export const JUP_V1_QUOTE = "https://api.jup.ag/swap/v1/quote";
export const JUP_V1_SWAP = "https://api.jup.ag/swap/v1/swap";

export interface V1QuoteParams {
  inputMint: string;
  outputMint: string;
  amountRaw: string;
  slippageBps: number;
  platformFeeBps: number;
}

export function buildV1QuoteUrl(p: V1QuoteParams): string {
  const url = new URL(JUP_V1_QUOTE);
  url.searchParams.set("inputMint", p.inputMint);
  url.searchParams.set("outputMint", p.outputMint);
  url.searchParams.set("amount", p.amountRaw);
  url.searchParams.set("slippageBps", String(p.slippageBps));
  url.searchParams.set("platformFeeBps", String(p.platformFeeBps));
  return url.toString();
}

export function buildV1SwapBody(p: {
  quoteResponse: unknown;
  userPublicKey: string;
  referralAddress?: string;
  vaultAddress?: string;
}): Record<string, unknown> {
  // Reuse the existing precedence helper (referral → vault → none).
  return buildJupiterSwapRequest({
    quoteResponse: p.quoteResponse,
    userPublicKey: p.userPublicKey,
    referralAddress: p.referralAddress,
    vaultAddress: p.vaultAddress,
  });
}

const V1QuoteSchema = z.looseObject({
  outAmount: z.string(),
  inAmount: z.string().optional(),
  priceImpactPct: z.union([z.string(), z.number()]).optional(),
});
export type V1Quote = z.infer<typeof V1QuoteSchema>;
export function parseV1Quote(json: unknown): V1Quote {
  return V1QuoteSchema.parse(json);
}

const V1SwapResponseSchema = z.looseObject({ swapTransaction: z.string() });
export function parseV1SwapResponse(json: unknown): { swapTransaction: string } {
  return V1SwapResponseSchema.parse(json);
}
