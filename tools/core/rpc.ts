/**
 * Minimal Solana JSON-RPC client.
 *
 * Deliberately dependency-free (no @solana/web3.js): every call here maps
 * 1:1 to a documented JSON-RPC method, so reading this file teaches you the
 * actual wire protocol. See https://solana.com/docs/rpc
 */

const DEFAULT_ENDPOINT = "https://api.mainnet-beta.solana.com";

export function rpcEndpoint(): string {
  return (
    process.env.SOLANA_RPC ??
    process.env.NEXT_PUBLIC_DEFAULT_RPC ??
    DEFAULT_ENDPOINT
  );
}

export class RpcError extends Error {
  constructor(
    message: string,
    readonly code?: number,
  ) {
    super(message);
    this.name = "RpcError";
  }
}

let requestId = 0;

/**
 * Single JSON-RPC call with one retry on rate-limit or transient failure.
 */
export async function rpcCall<T>(method: string, params: unknown[]): Promise<T> {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: ++requestId,
    method,
    params,
  });

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(rpcEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (res.status === 429 || res.status >= 500) {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      throw new RpcError(
        `RPC ${method} failed with HTTP ${res.status} (endpoint: ${rpcEndpoint()}). ` +
          `Public RPC is rate-limited; set SOLANA_RPC to a Helius/QuickNode endpoint.`,
      );
    }
    if (!res.ok) {
      throw new RpcError(`RPC ${method} failed with HTTP ${res.status}`);
    }

    const json = (await res.json()) as {
      result?: T;
      error?: { code: number; message: string };
    };
    if (json.error) {
      throw new RpcError(`RPC ${method}: ${json.error.message}`, json.error.code);
    }
    return json.result as T;
  }
}
