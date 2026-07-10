# Solana Builder Learning Path

Milestones that level up your Solana client-side and on-chain analysis
skills by fixing real audit findings in this repo. Each one: the concept,
the exercise, and what supports you. Do them in order — they build on each
other. Findings reference `docs/audit/2026-07-10-audit-report.md`.

## 1. Transaction anatomy — decode by hand

**Concept:** what's actually inside a Solana transaction: message, account
keys, fee payer, instructions, compute budget, signatures.
**Exercise:** pick one of your own swap signatures
(`npx tsx tools/cli.ts solana txs <your-wallet> 5`) and explain every
program in the decode output (`solana tx <sig>`). Then read
`tools/core/solana.ts` — `summarizeTransaction` — and extend it to also
report the compute-unit price/limit from the Compute Budget instructions.
**Supports:** `onchain-query` + `solana-dev` skills; `onchain-analyst` agent.
**Done when:** you can say what Lighthouse is, why every swap has Compute
Budget instructions, and what error 6001 means — without looking it up.

## 2. Simulation before signing — fix H1

**Concept:** pre-flight `simulateTransaction`; why a signed-but-doomed tx
still costs a fee.
**Exercise:** wire the existing `simulateTransaction` helper into
`jupExecute` (after `validateSwapTransaction`, before signing), blocking on
failure with a clear toast. Write the Vitest cases first (simulation err ⇒
abort).
**Supports:** `swap-testing` + `web3-security-review` skills;
`solana-code-reviewer` agent to review your diff.
**Done when:** a simulated failure blocks the wallet prompt and a test
proves it.

## 3. Trust boundaries — fix H2 + M3

**Concept:** every byte from an external service is untrusted input; a
program allowlist that only warns is not a control.
**Exercise:** make unknown-program instructions a hard error; validate the
`[wallet]` route params base58-first (reuse `isValidSolanaAddress`).
**Done when:** a hand-crafted transaction with a rogue instruction is
rejected in a test, and `/api/rig/health/not-a-wallet` returns 400.

## 4. One wallet identity — fix A1/M2

**Concept:** wallet-adapter as the single connection state machine;
`accountChanged`; why two sources of truth mean the safety math can check
the wrong account.
**Exercise:** migrate `SwapperContext`/`useSwapExecution` off
`window.solana` onto `useWallet()`/`useConnection()`; delete
`hooks/useWallet.ts` + `getPhantomProvider()`; collapse
`useBalances`/`useWalletBalances` into one hook.
**Supports:** `solana-dev` skill (wallet section); this is the biggest
refactor — plan it with the Plan agent first.
**Done when:** grep finds no `window.solana` outside wallet-adapter
internals, and switching accounts in Phantom updates the whole app.

## 5. Amount math & decimals — fix M4 (+ typed fee routing, A3)

**Concept:** raw vs ui amounts, decimals as a 1000× footgun, why financial
functions must be typed and tested.
**Exercise:** make unknown-decimals abort the swap; type
`buildJupiterSwapRequest`'s quote input and write
`tests/referral.test.ts` covering vault/referral fee-account precedence.
**Done when:** `lib/referral.ts` has no `any` and its precedence rules are
locked in by tests.

## 6. Quote-vs-transaction verification — fix H3 (advanced)

**Concept:** decoding instruction data; verifying the tx you sign matches
the quote you requested (mints, min-out, fee account).
**Exercise:** decode the Jupiter swap instruction's accounts in the returned
transaction and assert them against the quote before signing. Use fixture
transactions captured with the CLI.
**Done when:** a fixture with a swapped-out fee account fails verification
in a test.

## 7. On-chain analysis — build a mini-indexer

**Concept:** signatures → transactions → structured data; sampling honestly;
cost/failure analytics.
**Exercise:** add `tools/cli.ts solana feestats <wallet> [days]`: page
`getSignaturesForAddress`, compute txs/day, average fee, failure rate, and
estimated SOL/day burn — the numbers the audit produced by hand (0.07–0.08
SOL/day, 4.3% failures). Then use it to tune the swapper's slippage/cadence
and measure the improvement.
**Supports:** `onchain-query` skill; extend core + CLI + MCP together.
**Done when:** you can quote your own fee burn and failure rate from your
own tool, and it went down after your tuning.

## 8. Stretch: web3.js 2.x (Kit) spike

**Concept:** the modern Solana JS stack (tree-shakeable, no class-based
Connection), and what M5's `jayson` advisory means for 1.x.
**Exercise:** re-implement `tools/core/solana.ts` against `@solana/kit` in a
branch; compare ergonomics. No production migration — just the spike.

---

**Habits along the way**
- Run `/security-review`-style checks (the `solana-code-reviewer` agent) on
  every swap-path diff.
- Re-run the delegate check on your wallet monthly:
  `npx tsx tools/cli.ts solana tokens <wallet>`.
- When you learn a durable Pond0x fact, record it in
  `.claude/skills/pond0x-protocol/SKILL.md`.
