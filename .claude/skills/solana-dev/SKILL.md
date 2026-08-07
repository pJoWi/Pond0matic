---
name: solana-dev
description: Solana client-side development patterns for this codebase - wallet-adapter usage, transaction anatomy, versioned transactions, priority fees, Jupiter API integration, RPC hygiene. Use when writing or modifying any code that touches @solana/web3.js, wallet connections, transaction building/sending, or Jupiter endpoints.
---

# Solana client development (Pond0matic)

## Wallet: one identity, always wallet-adapter

- `useWallet()` / `useConnection()` from `@solana/wallet-adapter-react` are the
  only wallet access points. Never `window.solana`, never `getPhantomProvider()`,
  never a `wallet: string` param.
- Handle `accountChanged`: the user can switch accounts inside Phantom without
  disconnecting. Any cached balance/identity must be invalidated on
  `publicKey` change.
- Sign via the adapter's `signTransaction`/`sendTransaction`; the wallet's own
  prompt is the last line of defense, not the first.

## Transaction anatomy (what you must know to review/build one)

- A `VersionedTransaction` = message (account keys, recent blockhash,
  instructions, optional address-lookup tables) + signatures. Fee payer =
  first static account key.
- **Compute budget**: `ComputeBudgetProgram.setComputeUnitLimit` +
  `setComputeUnitPrice` (micro-lamports/CU) are how priority fees work.
  Priority fee ≈ CU limit × CU price. Cap it client-side; "auto" under
  congestion can spike.
- **Confirmation**: use the `{ signature, blockhash, lastValidBlockHeight }`
  strategy — the single-arg `confirmTransaction(sig, "confirmed")` overload is
  deprecated and this repo's Jupiter response already provides
  `lastValidBlockHeight`. A tx is expired (safe to retry) once the current
  block height passes `lastValidBlockHeight`; before that, resending risks
  duplicates.
- **Simulate before signing.** `connection.simulateTransaction` catches doomed
  txs (bad blockhash, insufficient funds, program errors) before the user
  pays a fee. Simulation failure blocks; it is not a warning.

## Jupiter integration facts (current, verified)

- Quote/swap: `https://api.jup.ag` (lite tier: `https://lite-api.jup.ag`),
  optional user API key sent as `x-api-key` header from the client (rate-limit
  key, not a secret).
- Price: `https://lite-api.jup.ag/price/v3?ids=<mint>` →
  `{ [mint]: { usdPrice, priceChange24h, decimals, liquidity } }`.
  **`api.jup.ag/price/v2` is dead (404)** — this bug shipped once already.
- Slippage error = custom program error `6001` (0x1771).
- The `/swap` endpoint returns transaction bytes you did not build — decode
  and verify mints/min-out/fee-account against your quote before signing
  (see `web3-security-review`).

## Amount math

- Always integer raw amounts: `BigInt(Math.round(uiAmount * 10 ** decimals))`.
  Never trust a fallback decimals guess — if a mint's decimals can't be
  fetched, abort; a 6-vs-9 decimals mistake is a 1000× amount error.

## RPC hygiene

- Endpoint from env (`SOLANA_RPC` / `NEXT_PUBLIC_DEFAULT_RPC`); public
  mainnet RPC is rate-limited and for light exploration only.
- Reuse the wallet-adapter `useConnection()` connection; don't construct
  ad-hoc `new Connection(...)` per hook.
- Poll through `useVisibilityPolling`, and prefer `getMultipleAccounts` over
  N single fetches.

## Reference implementation

`tools/core/` in this repo implements balance/token/tx queries against raw
JSON-RPC — read it to understand what web3.js does under the hood.
