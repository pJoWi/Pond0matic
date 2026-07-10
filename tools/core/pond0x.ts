/**
 * Pond0x ecosystem API client — same upstreams the app's API routes use:
 * cary0x.com (community rig stats), DexScreener, Jupiter price API.
 * Responses are validated with zod so upstream changes fail loudly.
 */
import { z } from "zod";

const USER_AGENT = "Pond0matic-tools/1.0";

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`GET ${url} failed with HTTP ${res.status}`);
  }
  return res.json();
}

// cary0x manifest/health payloads evolve; keep schemas permissive but typed.
const ManifestSchema = z.record(z.string(), z.unknown());
const HealthSchema = z.record(z.string(), z.unknown());

export async function getManifest(wallet: string): Promise<Record<string, unknown>> {
  assertBase58(wallet);
  return ManifestSchema.parse(
    await fetchJson(`https://www.cary0x.com/api/manifest/${wallet}`),
  );
}

export async function getHealth(wallet: string): Promise<Record<string, unknown>> {
  assertBase58(wallet);
  return HealthSchema.parse(
    await fetchJson(`https://www.cary0x.com/api/health/${wallet}`),
  );
}

// Jupiter Price API v3 (the free tier lives on lite-api.jup.ag; the old
// api.jup.ag/price/v2 endpoint is dead and returns 404).
const JupPriceSchema = z.record(
  z.string(),
  z.object({ usdPrice: z.number(), priceChange24h: z.number().optional() }).nullable(),
);

export async function getPrice(mint: string): Promise<number | null> {
  assertBase58(mint);
  const json = JupPriceSchema.parse(
    await fetchJson(`https://lite-api.jup.ag/price/v3?ids=${mint}`),
  );
  return json[mint]?.usdPrice ?? null;
}

const DexScreenerSchema = z.object({
  pairs: z
    .array(
      z.object({
        dexId: z.string(),
        priceUsd: z.string().optional(),
        liquidity: z.object({ usd: z.number() }).optional(),
        volume: z.object({ h24: z.number() }).optional(),
        priceChange: z.object({ h24: z.number().optional() }).optional().nullable(),
      }),
    )
    .nullable(),
});

export interface MarketStats {
  priceUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  change24hPct: number | null;
  pairCount: number;
}

export async function getMarketStats(mint: string): Promise<MarketStats> {
  assertBase58(mint);
  const json = DexScreenerSchema.parse(
    await fetchJson(`https://api.dexscreener.com/latest/dex/tokens/${mint}`),
  );
  const pairs = json.pairs ?? [];
  const best = pairs
    .slice()
    .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
  return {
    priceUsd: best?.priceUsd ? Number(best.priceUsd) : null,
    liquidityUsd: best?.liquidity?.usd ?? null,
    volume24hUsd: pairs.reduce((s, p) => s + (p.volume?.h24 ?? 0), 0) || null,
    change24hPct: best?.priceChange?.h24 ?? null,
    pairCount: pairs.length,
  };
}

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Reject anything that isn't a plausible base58 pubkey before it reaches a URL. */
export function assertBase58(value: string): void {
  if (!BASE58_RE.test(value)) {
    throw new Error(`Not a valid base58 Solana address: "${value}"`);
  }
}
