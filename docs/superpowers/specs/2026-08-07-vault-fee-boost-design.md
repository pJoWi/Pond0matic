# Vault-Fee → RIG-Boost Wiring — Design Spec

**Date:** 2026-08-07
**Branch:** `feature/vault-fee-boost` (off `main`)
**Status:** Approved for implementation planning
**Depends on:** confirmed finding in `docs/superpowers/specs/2026-08-07-vault-boost-findings.md`

## 1. Goal

Make Pond0matic's own swaps count toward RIG boost by routing the swap platform
fee to the pond0x affiliate vault — the mechanism confirmed on 2026-08-07 (user
wallet `proSwapsSol` +88 from old-version v1 vault-fee swaps, no Ez Miner). The
vault fee is the **default**: every swap routes the fee to the vault and counts.
This is production financial code — the assistant never signs or submits a swap;
the user validates with real swaps.

## 2. Background (why the current build stopped counting)

The current engine speaks Jupiter **v2** (`/order` + `/execute`) and runs fee-free
because the legacy affiliate vault ATA is rejected as a v2 `referralAccount` (HTTP
400). The old, counted path used Jupiter **v1** (`/quote` + `/swap`) with
`feeAccount = referral || vault`. v1 is confirmed still working (the +88 test ran
on it on 2026-08-06). Full audit: `2026-08-07-vault-boost-findings.md`.

## 3. Approach

1. **Spike (timeboxed, ~30 min):** confirm there is no v2-native way to pass the
   pond0x vault as a valid `referralAccount` (e.g., via Jupiter's referral program).
   Document the finding. Expected outcome: no v2 route → proceed to v1.
2. **Restore the Jupiter v1 fee path:** replace the engine's v2 `/order`+`/execute`
   calls with v1 `/quote`+`/swap` (`feeAccount = referral || vault`) plus a
   self-managed send+confirm that replaces v2 `/execute`.

## 4. Architecture (small, independently testable units)

### `lib/swap/v1.ts` (new, pure — no I/O)
- `JUP_V1_QUOTE = "https://api.jup.ag/swap/v1/quote"`, `JUP_V1_SWAP = "https://api.jup.ag/swap/v1/swap"`.
- `buildV1QuoteUrl({ inputMint, outputMint, amountRaw, slippageBps, platformFeeBps })`.
- `buildV1SwapBody({ quoteResponse, userPublicKey, feeAccount })` → JSON body for `/swap`.
- `feeAccountForV1(platformFeeBps, referral, vault)` → precedence **referral → vault → none**
  (returns `undefined` only when both are absent or fee ≤ 0). Unlike the v2 helper,
  the vault IS returned here — that is the whole point.
- Zod parsers: `parseV1Quote`, `parseV1SwapResponse` (the `/swap` response carries the
  base64 `swapTransaction`).
- Mirrors the style of `lib/swap/orders.ts`; unit-tested like `tests/swap/orders.test.ts`.

### `lib/swap/send.ts` (new)
- `sendAndConfirm(connection, signedTx, { blockhashCtx }) → { signature }` — the
  self-managed landing that replaces v2 `/execute`: `sendRawTransaction`, confirm
  against the last-valid-block-height, retry on blockhash expiry, surface the
  signature. The removed `hooks/useSwapExecution.ts` (kept in `stash@{0}`) is the
  behavioral reference.
- Unit-tested with a mocked `Connection` (confirm success, blockhash-expiry retry,
  failure surfacing).

### `hooks/useSwapEngine.ts` (modify)
- Replace the v2 order/execute block with: `buildV1QuoteUrl` → fetch quote →
  `buildV1SwapBody` → fetch `/swap` → deserialize tx → `validateSwapTransaction`
  (unchanged, runs before signing) → `signTransaction` → `sendAndConfirm`.
- Resolve the fee account via `feeAccountForV1(settings.platformFeeBps, referralAddress, currentVault)`.
- **Preserve** the session planner, `dispatchSwapEvent` telemetry, logging, and the
  SwapPanel UI. Wire in `currentVault` from `SwapConfigContext` (already exposed).

## 5. Fee & vault configuration

- `feeAccount = referralAddress || currentVault` (vault is now used, not omitted).
- **Fee level:** slider-controlled `settings.platformFeeBps`, floor = the minimum
  fee Jupiter v1 accepts (confirmed in the spike), default parked at the floor for
  lowest cost, ceiling **255 bps (2.55%)**.
- **Affiliate:** pond0x (`TOKEN_VAULTS_AFFILIATE_1`) default (confirmed). The existing
  `settings.affiliate` toggle keeps the aquavaults (`AFFILIATE_2`) alternative available.

## 6. UI — fee & slippage sliders (new)

Two sliders in the swap controls (`SwapPanel`, near the amount config), bound to the
existing persisted settings the engine already reads:

- **Platform-fee slider** → `settings.platformFeeBps`. Range **[Jupiter-min … 255 bps]**,
  default at the floor, step 5 bps. Live label: `% (N bps)` plus a SOL/USD cost estimate
  for the current amount. The floor cannot go below "counts" (Jupiter's minimum), so
  every swap still routes to the vault.
- **Slippage slider** → `settings.slippageBps`. Range **[10 bps (0.1%) … 300 bps (3%)]**,
  default 50 bps (0.5%), step 10 bps. Live `%` label.

Both are thin controls over values the engine already consumes (`clampReferralFeeBps`
on fee, `slippageBps` on the quote), so no new engine plumbing beyond reading them.
A small reusable slider is preferred over two bespoke ones. Slider clamp/step math is
unit-tested.

## 7. Security (real funds flow here)

- `validateSwapTransaction` stays and runs on the v1-built tx before signing (signer +
  instruction checks) — unchanged from today.
- A security review runs before merge (via the `security-auditor` agent, since
  `solana-code-reviewer` is unavailable this session).
- The user validates with real swaps (watch `proSwapsSol` climb); the assistant never
  signs or submits an on-chain transaction.
- The known security-hardening backlog (pre-sign simulation, assembled-tx↔quote match,
  token allowlist as error) is **noted, out of scope** for this branch unless the user
  folds it in.

## 8. Testing

- Unit tests for `lib/swap/v1.ts` (URL/body builders, `feeAccountForV1` precedence,
  Zod parsers) — mirroring `tests/swap/orders.test.ts`.
- Unit tests for `lib/swap/send.ts` (mocked `Connection`: confirm, blockhash-expiry
  retry, failure surfacing).
- Unit tests for the slider clamp/step math.
- Engine wiring is integration — verified by `npm run build` + the user's real-swap
  validation. Full suite stays green; gates: `tsc --noEmit` clean, tests pass, clean build.

## 9. Rollout

- Spike first (documented). Implement units → wire engine → tests → security review → merge to `main`.
- After merge, the user runs real swaps and confirms `proSwapsSol` climbs; then
  `stash@{0}` (the v1 reference) may be dropped.

## 10. Risks

- **Self-managed send+confirm** is the primary risk (blockhash expiry, dropped or
  double-sent tx). Mitigated by careful confirm logic, the old code as reference, and
  unit tests.
- v1 API longevity (confirmed working 2026-08-06); per-swap real fee cost (accepted,
  minimized by the default-floor slider); correct per-mint vault ATA (from
  `TOKEN_VAULTS_AFFILIATE_1`).

## 11. Out of scope

- A fee-free swap mode (vault-fee is the chosen default).
- Changing *which* swaps count (all do).
- The broader security-hardening backlog (noted in §7).
- `@solana/web3.js` 2.0 migration.
