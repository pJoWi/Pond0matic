# Pond0matic Audit Report — 2026-07-10

Three parallel reviews: code security, architecture/quality, and a read-only
on-chain audit of wallet `GM8Qz8gmp9N3Rm94q9iTJeHobGBXoCYMhwZYY8zji3LA`.
No files or on-chain state were modified.

**Verdict:** No critical vulnerabilities and a clean on-chain safety check
(zero delegate approvals). But the two client-side controls built to defend
the signing path against a malicious/tampered transaction payload exist in
code and are **not enforced** (H1, H2), and the wallet-adapter migration is
incomplete, leaving two unsynchronized wallet identities (A1/M2). Fix those
before trusting the app with larger balances.

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 3 (security) + 1 (architecture, same root cause as M2) |
| Medium | 5 |
| Low | 3 |

---

## Part 1 — Security findings

### High

**H1. `simulateTransaction` is implemented but never called.**
`lib/transactionValidation.ts:87-114` defines a correct pre-flight simulation
helper; repo-wide grep confirms nothing imports it — the signing flow in
`hooks/useSwapExecution.ts:239-289` deserializes and signs with no simulation.
Doomed transactions (stale route, drained pool, expired blockhash) reach the
wallet and burn fees. *Fix:* call it after `validateSwapTransaction`, before
signing; abort on failure.

**H2. Program-ID allowlist is advisory-only.**
Unknown programs in a swap transaction only add a `warning`
(`lib/transactionValidation.ts:47-56`); `isValid` is computed from `errors`
only (`useSwapExecution.ts:244-253`). A tampered swap-build response with an
appended drain instruction (SPL `Approve`, transfer to attacker) passes
`isValid: true`. This control was built for exactly that case and doesn't
fire. *Fix:* unknown program ⇒ hard error, or a blocking confirmation modal.

**H3. Signed transaction never verified against the quote.**
The bytes returned by Jupiter's `/swap` are trusted blindly — no decode-and-
compare of input/output mints, `otherAmountThreshold` (min-out), or fee
account vs the quote the user saw. *Fix:* decode the Jupiter swap
instruction's accounts and assert they match the requested quote.

### Medium

**M1. Dead fee cap.** `maxFeeLamports` param of `validateSwapTransaction`
(`lib/transactionValidation.ts:24,30`) is never read. Compute the actual fee
(or `getFeeForMessage`) and enforce it.

**M2. Two unsynchronized wallet subsystems; no `accountChanged` listener.**
Swap engine uses hand-rolled `hooks/useWallet.ts` + `window.solana`
(`contexts/SwapperContext.tsx:230`, `lib/windowHelpers.ts:17-20`), while
WalletBar/Portfolio/Alerts use `@solana/wallet-adapter-react`
(`components/layout/ClientProviders.tsx:19-23`). Switching accounts inside
Phantom leaves the 90%-of-balance safety math checking the wrong account,
and swaps can be recorded under a different identity than signed them.
*Fix:* consolidate on wallet-adapter (see Part 2, A1 — same root cause).

**M3. `[wallet]` route params unvalidated.**
`app/api/rig/{health,manifest}/[wallet]/route.ts:14` interpolate the raw
param into the cary0x URL (no base58 check, no `encodeURIComponent`); enables
path-shaped garbage upstream and fetch-cache pollution. *Fix:* validate with
the existing `isValidSolanaAddress()` → 400, and encode.

**M4. Silent decimals fallback.**
`lib/solana.ts:37-64` falls back to 6 decimals when a mint lookup fails;
feeds `raw = floor(uiAmount * 10^dec)` (`useSwapExecution.ts:157-158`). A
9-decimal token under a transient failure = 1000× amount error. Currently
masked by the static token list. *Fix:* abort on unknown decimals.

**M5. Dependencies: 23 advisories (1 critical, 4 high, 17 moderate) via
`npm audit --omit=dev`.** `@solana/spl-token@0.1.8` is imported nowhere —
remove it. `shell-quote` critical arrives via
`@solana-mobile/wallet-adapter-mobile → react-native → react-devtools-core`
(likely excludable for this web-only Phantom flow). `@solana/web3.js` 1.x
`jayson` advisory has no fixed 1.x — track upstream / consider the 2.x (Kit)
migration.

### Low

- **L1.** Boost mode fires up to 54 signature prompts (18×3 defaults) with
  no pre-flight summary — approval-fatigue risk; per-tx wallet consent
  remains.
- **L2.** Deprecated single-arg `confirmTransaction(sig, "confirmed")`
  (`useSwapExecution.ts:299`) despite having `lastValidBlockHeight`
  available (`lib/jupiter.ts:49`); use the blockhash strategy.
- **L3.** `app/api/**` returns raw `error?.message` upstream/exception text.

### Secrets & config — clean

`.gitignore` covers all `.env*`; `.env.example` holds only public defaults;
`JUPITER_API_KEY` correctly server-side (not `NEXT_PUBLIC_`); the
user-entered Jupiter key lives in React state only (not persisted); no
secret-shaped literals in source.

### Done well

No private-key handling anywhere (signing fully delegated to the wallet);
fee-payer verification correct and wired; `validateSwapAmount`
(balance / 90% caps) real and enforced; slippage & platform fee UI-bounded
(10–200 bps); explicit 429/401/403 handling on Jupiter calls; no sensitive
localStorage data; referral addresses validated via `new PublicKey(...)`.

---

## Part 2 — Architecture findings (top items)

**A1. Incomplete wallet-adapter migration** — the root cause behind M2 and
the duplicate-hook pairs `useBalances`/`useWalletBalances` and
`useMiningRig`/`useRigHealth` (each pair = legacy-wallet vs adapter
pipelines for the same data). *Fix:* SwapperContext + useSwapExecution onto
`useWallet()`/`useConnection()`; delete `hooks/useWallet.ts` and
`getPhantomProvider()`; collapse each hook pair into one.

**A2. God-files:** `components/layout/TopNavigation.tsx` (~1729 lines, ~20
inline components incl. four near-duplicate `Compact*` variants) and
`StatusBar.tsx` (718). Split per-component; merge `Compact*` into responsive
props.

**A3. `lib/referral.ts` fee routing is `any`-typed and untested** — it
decides who receives swap fees. Type the quote shape; add
`tests/referral.test.ts` for vault/referral precedence.

**A4. Inconsistent upstream trust:** `useMiningRig.ts:148,179` blind
`as ApiResponse` vs `useRigHealth.ts:22-34` defensive `parseSnapshot` — same
endpoint. Extract a shared zod schema / parser.

**A5. Hardcoded SOL price ($180) gates the $10 rewards-mode minimum**
(`components/CompactSwapper/index.tsx:32-36`) while two live price
mechanisms exist (`useTokenPrices`, `getUsdValue`). Wire the live feed;
delete `PRICE_ESTIMATES`.

**A6. Test coverage inverted vs risk:** pure alert/PnL logic well tested;
`useSwapExecution` (669 lines), `referral.ts`, and
`transactionValidation.ts` untested. Start with the pure validation
functions — cheapest, highest leverage.

**A7. `SwapperContext` god-context:** ~80-field memo value, any state change
re-renders every consumer. Split into config/runtime slices as part of A1.

**A8. Stale docs:** INSTALLATION_MANUAL appendix describes routes that don't
exist; **USER_MANUAL.md:648-650 recommends a PyAutoGUI autoclicker to
auto-approve wallet prompts — delete this line**; it contradicts the
manual's own security guidance.

> **Superseded (2026-07-19):** the autoclicker half of A8 is superseded by the
> guard-railed autoclicker tool
> (`docs/superpowers/specs/2026-07-19-autoclicker-tool-design.md`): the
> USER_MANUAL line now documents the official, opt-in, guard-railed tool
> instead of an unguarded script. The INSTALLATION_MANUAL half of A8 remains
> open.

Strengths to preserve: `lib/alerts` + `lib/portfolio` pure-evaluator +
orchestrator-hook architecture, zod persistence schemas, visibility-aware
polling, thorough PnL tests. (Refuted: there is only one swap UI/engine —
`CompactSwapper` + `useSwapExecution`; no duplicate swapper.)

---

## Part 3 — On-chain audit (wallet GM8Q…i3LA)

- **Delegate approvals: NONE** across all 18 token accounts (13 SPL +
  5 Token-2022) — the cleanest possible result for the #1 drain vector.
  Nothing to revoke.
- **Balance:** 0.868 SOL; holdings led by 16.32B wPOND, 7.52 USDC, plus
  pondSOL, Pauly, mSOL, jlUSDC and memecoin dust.
- **Activity:** high-frequency auto-swapper — ~757 txs on 07-09; USDC→SOL
  micro-swaps (~0.022–0.024 USDC) every ~8s via Jupiter v6 + Lighthouse
  (benign wallet guard); fees ~105k lamports/tx ⇒ **~0.07–0.08 SOL/day
  (~2.2–2.4 SOL/month) fee burn**; **4.3% failure rate** (43/1000, Jupiter
  error 6001 slippage) = pure fee waste.
- **Spam watchlist — never interact / never visit URLs in token names:**
  `EW1a…JxXai` "YAWN" (embeds an ETH address — address-poisoning bait,
  highest suspicion), `Fjba…uVjz` (nameless Token-2022 airdrop),
  `8d3N…fij9`, dust "ZEC" `A7bd…QXaS`; treat `Fs9G…pump` (Garden) and
  `ELwD…pump` (CASHisDEAD) as untrusted.
- **Recommendations:** keep this as a low-balance hot wallet; move long-term
  wPOND to a wallet the swapper never touches; widen slippage or reduce
  cadence to cut the 4.3% failure burn; ~0.006 SOL reclaimable by closing 3
  empty token accounts (via a trusted wallet UI only); re-run the delegate
  check periodically (`npx tsx tools/cli.ts solana tokens <wallet>`).

---

## Remediation backlog (suggested order)

1. H1 — wire `simulateTransaction` into `jupExecute` (small, huge value)
2. H2 — make the program allowlist blocking
3. M3 — validate `[wallet]` route params (two-line fix, reuse
   `isValidSolanaAddress`)
4. A6/A3 — tests for `transactionValidation.ts` + `referral.ts`, typed quote
5. A1/M2 — complete the wallet-adapter migration, delete legacy path,
   collapse duplicate hooks
6. M5 — remove `@solana/spl-token`, `npm audit fix`, evaluate dropping the
   mobile adapter chain
7. H3 — quote-vs-transaction verification
8. M1, M4, A5 — fee cap, decimals abort, live price for the rewards gate
9. A2/A7 — dismantle TopNavigation/StatusBar god-files, split SwapperContext
10. A8/L1 — docs cleanup (delete the autoclicker line), boost-mode pre-flight
    summary

Several of these are milestones in `docs/LEARNING_PATH.md`.
