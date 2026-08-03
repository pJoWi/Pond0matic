/**
 * Jupiter Swap API v2 order-and-execute: request builders and boundary
 * validation (Zod v4). Pure module — no fetch here; the engine and settings
 * validation own all I/O.
 *
 * Flow (https://developers.jup.ag/docs/swap/order-and-execute):
 *   GET /order   → quote + assembled unsigned tx + requestId (x-api-key required)
 *   POST /execute → Jupiter lands the signed tx and confirms it
 */
import { z } from "zod";

export const JUP_ORDER = "https://api.jup.ag/swap/v2/order";
export const JUP_EXECUTE = "https://api.jup.ag/swap/v2/execute";
export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export interface OrderParams {
  inputMint: string;
  outputMint: string;
  /** Raw integer amount in base units, as string */
  amountRaw: string;
  /** Signer wallet. Omit for a price-only order (transaction will be null). */
  taker?: string;
  /** Fee collection account (affiliate vault or referral address). */
  referralAccount?: string;
  /** Fee in bps — Jupiter accepts 50–255; pass through clampReferralFeeBps. */
  referralFee?: number;
  /** Custom slippage (switches the order to "manual" mode). */
  slippageBps?: number;
}

export function buildOrderUrl(p: OrderParams): string {
  const url = new URL(JUP_ORDER);
  url.searchParams.set("inputMint", p.inputMint);
  url.searchParams.set("outputMint", p.outputMint);
  url.searchParams.set("amount", p.amountRaw);
  if (p.taker) url.searchParams.set("taker", p.taker);
  if (p.referralAccount) {
    url.searchParams.set("referralAccount", p.referralAccount);
    if (p.referralFee !== undefined) {
      url.searchParams.set("referralFee", String(p.referralFee));
    }
  }
  if (p.slippageBps !== undefined) {
    url.searchParams.set("slippageBps", String(p.slippageBps));
  }
  return url.toString();
}

/** Jupiter accepts referral fees of 50–255 bps on /order. */
export function clampReferralFeeBps(bps: number): number {
  return Math.min(255, Math.max(50, Math.round(bps)));
}

export function jupiterHeaders(apiKey: string, json = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (apiKey) headers["x-api-key"] = apiKey;
  if (json) headers["content-type"] = "application/json";
  return headers;
}

export function jupiterErrorMessage(status: number): string {
  if (status === 429) {
    return "Jupiter rate limit exceeded. Add or upgrade your API key at portal.jup.ag.";
  }
  if (status === 401 || status === 403) {
    return "Jupiter API key rejected. Check the key in Settings.";
  }
  return `Jupiter request failed (${status}).`;
}

const OrderSchema = z.looseObject({
  requestId: z.string(),
  /** null = price-only (no taker); "" = router could not build a tx */
  transaction: z.string().nullable(),
  inAmount: z.string().optional(),
  outAmount: z.string(),
  mode: z.string().optional(),
  router: z.string().optional(),
  errorCode: z.union([z.number(), z.string()]).optional(),
  errorMessage: z.string().optional(),
});
export type JupiterOrder = z.infer<typeof OrderSchema>;

export function parseOrder(json: unknown): JupiterOrder {
  return OrderSchema.parse(json);
}

export function buildExecuteBody(signedTransactionB64: string, requestId: string): string {
  return JSON.stringify({ signedTransaction: signedTransactionB64, requestId });
}

const ExecuteResponseSchema = z.looseObject({
  status: z.enum(["Success", "Failed"]),
  signature: z.string().optional(),
  code: z.number().optional(),
  error: z.string().optional(),
  totalInputAmount: z.string().optional(),
  totalOutputAmount: z.string().optional(),
});
export type JupiterExecuteResult = z.infer<typeof ExecuteResponseSchema>;

export function parseExecuteResponse(json: unknown): JupiterExecuteResult {
  return ExecuteResponseSchema.parse(json);
}

/**
 * Fee collection account for an order: an explicit referral address wins,
 * otherwise the affiliate vault for the input mint. Mirrors the legacy
 * precedence in lib/referral.ts buildJupiterSwapRequest (referral > vault > none).
 */
export function selectFeeAccount(
  referralAddress: string | undefined,
  vaultMap: Record<string, string>,
  inputMint: string
): string | undefined {
  return referralAddress || vaultMap[inputMint] || undefined;
}

/**
 * Fee account for an order, honoring a configured fee of 0 as "no fee".
 *
 * The legacy quote+swap engine passed platformFeeBps straight through, so 0
 * meant a true 0% fee. Jupiter's v2 referral API rejects sub-50-bps fees
 * (hence clampReferralFeeBps), so the ONLY way to charge 0% is to omit the
 * fee account entirely — otherwise a configured 0 would be floored to 50 bps
 * (0.5%) whenever a vault exists. We honor 0 exactly; a configured 1–49 is
 * still floored to Jupiter's 50-bps minimum (an unavoidable API constraint,
 * a small divergence from legacy).
 */
export function feeAccountForOrder(
  platformFeeBps: number,
  referralAddress: string | undefined,
  vaultMap: Record<string, string>,
  inputMint: string
): string | undefined {
  if (platformFeeBps <= 0) return undefined;
  return selectFeeAccount(referralAddress, vaultMap, inputMint);
}

/** Base64-encode a signed transaction for /execute (btoa is available in
 *  browsers and Node 18+; chunked to stay under argument limits). */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
