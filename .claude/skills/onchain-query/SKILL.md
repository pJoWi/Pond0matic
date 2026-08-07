---
name: onchain-query
description: How to answer on-chain questions with this repo's read-only toolkit (tools/cli.ts and the pond0matic-tools MCP server) - balances, token holdings, delegate approvals, transaction decoding, prices, Pond0x rig stats. Use whenever a question needs live Solana or Pond0x data.
---

# On-chain queries with the toolkit

Never answer on-chain questions from memory — query. The toolkit is
read-only by design (never signs/sends); keep it that way.

## MCP tools (preferred in-session)

`solana_balance`, `solana_tokens`, `solana_recent_txs`, `solana_decode_tx`,
`token_price`, `token_market_stats`, `pond0x_manifest`, `pond0x_health`
— from the `pond0matic-tools` server in `.mcp.json`.

## CLI equivalents (run from repo root)

```
npx tsx tools/cli.ts solana account <address>      # SOL balance
npx tsx tools/cli.ts solana tokens  <owner>        # holdings + delegate flags
npx tsx tools/cli.ts solana txs     <address> [n]  # recent signatures
npx tsx tools/cli.ts solana tx      <signature>    # decode one tx
npx tsx tools/cli.ts solana price   <mint|symbol>  # Jupiter price v3
npx tsx tools/cli.ts pond0x manifest <wallet>
npx tsx tools/cli.ts pond0x health   <wallet>
npx tsx tools/cli.ts pond0x stats    [mint|symbol] # DexScreener (default wPOND)
```

Symbols SOL/USDC/USDT/wPOND resolve automatically; anything else needs the
mint address.

## Interpretation rules

- **Delegate approvals**: `solana tokens` flags any token account with a
  non-null delegate — Solana's drain vector. "No delegate approvals" is the
  headline of any wallet safety check. Note the toolkit covers the classic
  token program; Token-2022 accounts (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`)
  need a direct RPC call.
- **Tx decode output**: programs are labeled when known (Jupiter v6, SPL
  Token, Compute Budget, Lighthouse = benign wallet guard). Token moves are
  ui-amount deltas from pre/post balances; a closed account shows as a full
  outflow.
- **Fees**: reported in lamports and SOL (1 SOL = 1e9 lamports). Jupiter
  custom error 6001 = slippage exceeded (fee burned, no swap).
- **Unverified token symbols are claims, not identity** — airdropped tokens
  with URLs/addresses in names are phishing bait; never interact.

## Configuration & extending

- `SOLANA_RPC` env overrides the default public mainnet RPC (rate-limited;
  pace calls ~1s when using it heavily).
- New capability? Add a function to `tools/core/`, then expose it in BOTH
  `tools/cli.ts` and `tools/mcp-server.ts`, with tests in
  `tests/tools-core.test.ts` for any pure logic.
- For anything the toolkit lacks, curl raw JSON-RPC (see `tools/core/rpc.ts`
  for the pattern) rather than adding heavyweight dependencies.
