/**
 * Pond0matic MCP server — exposes the read-only Solana/Pond0x toolkit as
 * first-class tools in Claude sessions. Same core as tools/cli.ts.
 *
 * Registered in .mcp.json; runs over stdio via `npx tsx tools/mcp-server.ts`.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  getBalance,
  getSignatures,
  getTokenHoldings,
  getTransaction,
  summarizeTransaction,
} from "./core/solana";
import { getHealth, getManifest, getMarketStats, getPrice } from "./core/pond0x";
import { formatSol, formatTime, formatTxSummary } from "./core/format";
import { labelForMint, resolveMint } from "./core/tokens";

const server = new McpServer({ name: "pond0matic-tools", version: "1.0.0" });

const address = z.string().describe("Base58 Solana address");

function text(value: string) {
  return { content: [{ type: "text" as const, text: value }] };
}

server.tool(
  "solana_balance",
  "Get the SOL balance of a wallet",
  { address },
  async ({ address }) => text(formatSol(await getBalance(address))),
);

server.tool(
  "solana_tokens",
  "List a wallet's SPL token holdings, including any delegate approvals (drain-risk indicator)",
  { address },
  async ({ address }) => {
    const holdings = (await getTokenHoldings(address)).sort((a, b) => b.uiAmount - a.uiAmount);
    return text(
      JSON.stringify(
        holdings.map((h) => ({ ...h, symbol: labelForMint(h.mint) })),
        null,
        2,
      ),
    );
  },
);

server.tool(
  "solana_recent_txs",
  "List recent transaction signatures for an address with status and time",
  { address, limit: z.number().int().min(1).max(50).default(10) },
  async ({ address, limit }) => {
    const sigs = await getSignatures(address, limit);
    return text(
      sigs
        .map((s) => `${s.err == null ? "ok" : "FAILED"} ${formatTime(s.blockTime)} ${s.signature}`)
        .join("\n") || "No transactions found.",
    );
  },
);

server.tool(
  "solana_decode_tx",
  "Fetch and summarize one transaction: programs invoked, token movements, fee, status",
  { signature: z.string().describe("Transaction signature") },
  async ({ signature }) => {
    const tx = await getTransaction(signature);
    if (!tx) return text("Transaction not found (or too old for this RPC).");
    return text(formatTxSummary(summarizeTransaction(signature, tx)));
  },
);

server.tool(
  "token_price",
  "Get a token's USD price from Jupiter (accepts symbol like wPOND/USDC or a mint address)",
  { token: z.string().describe("Token symbol or mint address") },
  async ({ token }) => {
    const price = await getPrice(resolveMint(token));
    return text(price == null ? "No price available." : `$${price}`);
  },
);

server.tool(
  "token_market_stats",
  "Get DexScreener market stats (price, liquidity, 24h volume/change) for a token",
  { token: z.string().describe("Token symbol or mint address") },
  async ({ token }) =>
    text(JSON.stringify(await getMarketStats(resolveMint(token)), null, 2)),
);

server.tool(
  "pond0x_manifest",
  "Get a wallet's Pond0x mining manifest from the cary0x community API",
  { wallet: address },
  async ({ wallet }) => text(JSON.stringify(await getManifest(wallet), null, 2)),
);

server.tool(
  "pond0x_health",
  "Get a wallet's Pond0x rig health/stats from the cary0x community API",
  { wallet: address },
  async ({ wallet }) => text(JSON.stringify(await getHealth(wallet), null, 2)),
);

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
