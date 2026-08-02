/** Connection health checks used by the setup modal and /settings page. */
import { Connection } from "@solana/web3.js";
import {
  buildOrderUrl,
  jupiterHeaders,
  jupiterErrorMessage,
  SOL_MINT,
  USDC_MINT,
} from "@/lib/swap/orders";

export interface RpcTestResult {
  ok: boolean;
  slot?: number;
  latencyMs?: number;
  error?: string;
}

export async function testRpcEndpoint(url: string): Promise<RpcTestResult> {
  if (!/^https:\/\/.+/.test(url.trim())) {
    return { ok: false, error: "Enter a valid https:// RPC URL" };
  }
  const started = Date.now();
  try {
    const connection = new Connection(url.trim(), { commitment: "confirmed" });
    const slot = await connection.getSlot();
    return { ok: true, slot, latencyMs: Date.now() - started };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `RPC unreachable: ${msg.slice(0, 120)}` };
  }
}

export interface KeyTestResult {
  ok: boolean;
  error?: string;
}

/** Validates a Jupiter API key with a price-only /order call (no taker). */
export async function testJupiterApiKey(key: string): Promise<KeyTestResult> {
  if (!key.trim()) return { ok: false, error: "Enter your Jupiter API key" };
  try {
    const url = buildOrderUrl({
      inputMint: SOL_MINT,
      outputMint: USDC_MINT,
      amountRaw: "1000000",
    });
    const res = await fetch(url, { headers: jupiterHeaders(key.trim()) });
    if (res.ok) return { ok: true };
    return { ok: false, error: jupiterErrorMessage(res.status) };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Jupiter unreachable: ${msg.slice(0, 120)}` };
  }
}
