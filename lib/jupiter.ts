/**
 * Jupiter aggregator API utilities for token swaps and quotes
 */

import { getMintDecimals } from "./solana";

// Jupiter API endpoints
export const JUP_QUOTE = "https://api.jup.ag/swap/v1/quote";
export const JUP_SWAP = "https://api.jup.ag/swap/v1/swap";

export interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string; // Raw amount (with decimals)
  slippageBps: number;
  platformFeeBps?: number;
  feeAccount?: string;
}

export interface QuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: any[];
  contextSlot?: number;
  timeTaken?: number;
}

export interface SwapParams {
  quoteResponse: QuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  feeAccount?: string;
  computeUnitPriceMicroLamports?: number;
  prioritizationFeeLamports?: number;
}

export interface SwapResponse {
  swapTransaction: string; // Base64 encoded transaction
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
}

/**
 * Get Jupiter API headers with optional authentication
 */
function getJupiterHeaders(apiKey?: string): HeadersInit {
  const headers: HeadersInit = {};

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  return headers;
}

/**
 * Fetch a swap quote from Jupiter
 * @param params - Quote parameters
 * @param apiKey - Optional Jupiter API key for authentication
 */
export async function getJupiterQuote(
  params: QuoteParams,
  apiKey?: string
): Promise<QuoteResponse> {
  const url = new URL(JUP_QUOTE);
  url.searchParams.set("inputMint", params.inputMint);
  url.searchParams.set("outputMint", params.outputMint);
  url.searchParams.set("amount", params.amount);
  url.searchParams.set("slippageBps", String(params.slippageBps));

  if (params.platformFeeBps !== undefined) {
    url.searchParams.set("platformFeeBps", String(params.platformFeeBps));
  }

  const response = await fetch(url.toString(), {
    headers: getJupiterHeaders(apiKey)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jupiter quote failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Execute a swap transaction via Jupiter
 * @param params - Swap parameters
 * @param apiKey - Optional Jupiter API key for authentication
 */
export async function executeJupiterSwap(
  params: SwapParams,
  apiKey?: string
): Promise<SwapResponse> {
  const body: any = {
    quoteResponse: params.quoteResponse,
    userPublicKey: params.userPublicKey,
    wrapAndUnwrapSol: params.wrapAndUnwrapSol ?? true,
  };

  if (params.feeAccount) {
    body.feeAccount = params.feeAccount;
  }

  if (params.computeUnitPriceMicroLamports !== undefined) {
    body.computeUnitPriceMicroLamports = params.computeUnitPriceMicroLamports;
  }

  if (params.prioritizationFeeLamports !== undefined) {
    body.prioritizationFeeLamports = params.prioritizationFeeLamports;
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...getJupiterHeaders(apiKey)
  };

  const response = await fetch(JUP_SWAP, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jupiter swap failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Get USD value of a token amount by converting to USDC
 * @param mint - Token mint address
 * @param uiAmountStr - UI amount as string
 * @param apiKey - Optional Jupiter API key for authentication
 */
export async function getUsdValue(
  mint: string,
  uiAmountStr: string,
  apiKey?: string
): Promise<number> {
  try {
    const usdc = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    // If already USDC, return the amount directly
    if (mint === usdc) {
      return Number(uiAmountStr) || 0;
    }

    // Get decimals and convert to raw amount
    const decimals = await getMintDecimals(mint);
    const rawAmount = Math.floor((Number(uiAmountStr) || 0) * Math.pow(10, decimals));

    if (rawAmount <= 0) {
      return 0;
    }

    // Get quote for conversion to USDC
    const quote = await getJupiterQuote({
      inputMint: mint,
      outputMint: usdc,
      amount: String(rawAmount),
      slippageBps: 0, // No slippage for estimation
    }, apiKey);

    // USDC has 6 decimals
    const usdValue = Number(quote.outAmount) / 1e6;
    return usdValue;
  } catch (error) {
    console.error("USD value calculation error:", error);
    return 0;
  }
}

/**
 * Prefetch a quote to warm up Jupiter's cache (improves swap speed)
 * @param inputMint - Input token mint address
 * @param outputMint - Output token mint address
 * @param slippageBps - Slippage in basis points
 * @param platformFeeBps - Platform fee in basis points
 * @param apiKey - Optional Jupiter API key for authentication
 * @param signal - Optional abort signal
 */
export async function prefetchQuote(
  inputMint: string,
  outputMint: string,
  slippageBps: number,
  platformFeeBps: number,
  apiKey?: string,
  signal?: AbortSignal
): Promise<void> {
  try {
    const url = new URL(JUP_QUOTE);
    url.searchParams.set("inputMint", inputMint);
    url.searchParams.set("outputMint", outputMint);
    url.searchParams.set("amount", "1000000"); // 1 USDC equivalent
    url.searchParams.set("slippageBps", String(slippageBps));
    url.searchParams.set("platformFeeBps", String(platformFeeBps));

    await fetch(url.toString(), {
      headers: getJupiterHeaders(apiKey),
      signal
    });
  } catch (error) {
    // Silently fail - this is just for cache warming
  }
}
