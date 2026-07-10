#!/usr/bin/env npx tsx
/**
 * Pond0matic exploration CLI — read-only Solana + Pond0x queries.
 *
 *   npx tsx tools/cli.ts solana account <address>
 *   npx tsx tools/cli.ts solana tokens  <owner>
 *   npx tsx tools/cli.ts solana txs     <address> [limit]
 *   npx tsx tools/cli.ts solana tx      <signature>
 *   npx tsx tools/cli.ts solana price   <mint|symbol>
 *   npx tsx tools/cli.ts pond0x manifest <wallet>
 *   npx tsx tools/cli.ts pond0x health   <wallet>
 *   npx tsx tools/cli.ts pond0x stats    [mint|symbol]   (default wPOND)
 *
 * Set SOLANA_RPC for a non-public RPC endpoint. This tool never signs or
 * sends transactions.
 */
import {
  getBalance,
  getSignatures,
  getTokenHoldings,
  getTransaction,
  summarizeTransaction,
} from "./core/solana";
import { getHealth, getManifest, getMarketStats, getPrice, assertBase58 } from "./core/pond0x";
import { formatSol, formatTime, formatTxSummary } from "./core/format";
import { labelForMint, resolveMint } from "./core/tokens";

const USAGE = `usage:
  solana account <address>        SOL balance
  solana tokens  <owner>          token holdings + delegate approvals
  solana txs     <address> [n]    recent transaction summaries (default 10)
  solana tx      <signature>      decode one transaction
  solana price   <mint|symbol>    Jupiter price in USD
  pond0x manifest <wallet>        cary0x mining manifest
  pond0x health   <wallet>        cary0x rig health
  pond0x stats    [mint|symbol]   DexScreener market stats (default wPOND)`;

async function main(): Promise<void> {
  const [ns, cmd, ...args] = process.argv.slice(2);

  if (ns === "solana" && cmd === "account" && args[0]) {
    assertBase58(args[0]);
    console.log(formatSol(await getBalance(args[0])));
  } else if (ns === "solana" && cmd === "tokens" && args[0]) {
    assertBase58(args[0]);
    const holdings = (await getTokenHoldings(args[0])).sort(
      (a, b) => b.uiAmount - a.uiAmount,
    );
    for (const h of holdings) {
      const delegateWarning = h.delegate
        ? `  ⚠ DELEGATE ${h.delegate} may move ${h.delegatedUiAmount ?? "?"}`
        : "";
      console.log(
        `${h.uiAmount.toString().padStart(18)}  ${labelForMint(h.mint).padEnd(12)} ${h.mint}${delegateWarning}`,
      );
    }
    const delegated = holdings.filter((h) => h.delegate);
    console.log(
      delegated.length
        ? `\n⚠ ${delegated.length} token account(s) have an active delegate — review above.`
        : `\nNo delegate approvals found (${holdings.length} token accounts).`,
    );
  } else if (ns === "solana" && cmd === "txs" && args[0]) {
    assertBase58(args[0]);
    const limit = args[1] ? Number(args[1]) : 10;
    const sigs = await getSignatures(args[0], limit);
    for (const s of sigs) {
      const status = s.err == null ? "ok    " : "FAILED";
      console.log(`${status} ${formatTime(s.blockTime)} ${s.signature}`);
    }
  } else if (ns === "solana" && cmd === "tx" && args[0]) {
    const tx = await getTransaction(args[0]);
    if (!tx) throw new Error("Transaction not found (or too old for this RPC).");
    console.log(formatTxSummary(summarizeTransaction(args[0], tx)));
  } else if (ns === "solana" && cmd === "price" && args[0]) {
    const mint = resolveMint(args[0]);
    const price = await getPrice(mint);
    console.log(price == null ? "No price available." : `$${price}`);
  } else if (ns === "pond0x" && cmd === "manifest" && args[0]) {
    console.log(JSON.stringify(await getManifest(args[0]), null, 2));
  } else if (ns === "pond0x" && cmd === "health" && args[0]) {
    console.log(JSON.stringify(await getHealth(args[0]), null, 2));
  } else if (ns === "pond0x" && cmd === "stats") {
    const mint = resolveMint(args[0] ?? "wPOND");
    console.log(JSON.stringify(await getMarketStats(mint), null, 2));
  } else {
    console.log(USAGE);
    process.exitCode = 2;
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
