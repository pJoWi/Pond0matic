# Vault → RIG-Boost Mechanic — Audit & Findings

**Date:** 2026-08-07
**Task:** Phase 3, Task 9 (audit) + Task 10 (confirmation test)
**Status:** Audit complete; confirmation test pending live read (see §5)

## 1. Goal

Determine whether routing the swap platform fee to the pond0x affiliate vault
is what makes Pond0matic's own swaps count toward RIG boost (and toward the
cary0x `proSwapsSol` count) — and only if confirmed, wire it into the swap path.
This is financial-critical code; the assistant never signs or submits a swap.

## 2. Current swap-path behavior (as built)

- `contexts/SwapConfigContext.tsx` computes `vaultMap` (from `TOKEN_VAULTS_AFFILIATE_1/2`
  in `lib/vaults.ts`, keyed by the `settings.affiliate` choice) and `currentVault`
  (`vaultMap[fromMint]`). Both are exposed on the context.
- `hooks/useSwapEngine.ts` builds each order via `feeAccountForOrder(settings.platformFeeBps, referralAddress)`
  in `lib/swap/orders.ts`.
- `feeAccountForOrder` returns `undefined` when `platformFeeBps <= 0`, otherwise
  the explicit `referralAccount` — **it never references the affiliate vault.**
- Net: `currentVault`/`vaultMap` are computed but **not used** for fee routing.
  With no referral link configured, swaps run **fee-free**.

## 3. Why the vault is not routed (the Jupiter v1 vs v2 constraint)

- The current engine uses Jupiter's **v2 `/order`** API, whose `referralAccount`
  must be a referral account created under Jupiter's referral program
  (`REFER4Zg…`, project `DkiqsTrw1u1bYFumumC7sCG2S8K25qc2vemJFHyW2wJc`).
- The legacy per-mint affiliate vault ATAs are **not** valid v2 referral accounts:
  passing one makes Jupiter reject the whole order with HTTP 400. So the v2 path
  cannot send the vault as-is.
- The **previous** swapper (`hooks/useSwapExecution.ts`, since removed) used
  Jupiter **v1 `/swap`** with `feeAccount = referralAddress || vaultAddress` — i.e.
  the platform fee went to the affiliate vault (`45ru…`, a pond0x-owned fee
  account) when no referral link was set. The v2 migration dropped that path
  because the vault ATA 400s as a v2 `referralAccount`.

## 4. The two attribution hypotheses (from prior investigation)

Pond0x appears to attribute a swap as "mining" via one of two independent markers,
confirmed by decoding real on-chain swaps:

1. **Fee to the pond0x affiliate vault (`45ru…`)** — the old Pond0matic path.
   Vault-fee wallets carry real `proSwapsSol` counts (e.g. `AZ7F…` 25,708; `5tJb…` 42,673).
2. **The `L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95` instruction** — present on every
   pond0x.com / Ez Miner swap, absent on all bare Jupiter (Pond0matic) swaps.

The user's own Ez Miner swaps carry `L2TExMFK` and **no** vault fee, and still earn
boost — so `L2TExMFK` alone is sufficient for boost. The open question is whether the
**vault fee** is what moves the cary0x `proSwapsSol` count (and possibly boost) for a
bare-Jupiter swapper that lacks `L2TExMFK`. Current Pond0matic swaps carry **neither**
marker → they are the case in question.

## 5. Decision criterion for the confirmation test (Task 10)

Free, read-only, no new swaps. Re-read cary0x `proSwapsSol` for two wallets and compare
to baselines taken 2026-08-06:

- User wallet — baseline `proSwapsSol` **177,069**.
- `AZ7F5ZfzdTG2bBCtkVaYZLsSWWyYBTb9wmAFnsaFtS7o` (vault-fee, no `L2TExMFK`) — baseline **25,708**.

Outcomes:
- **AZ7F rises AND user's stays flat** ⇒ the vault fee is the `proSwapsSol` signal → proceed to wire (Task 11).
- **Both rise** ⇒ `L2TExMFK` (not the vault) moves it → do NOT wire; the vault fee would not achieve the goal.
- **Neither moves** ⇒ inconclusive → do not wire; recommend another timed re-check.

### Confirmation test result (2026-08-07)

- `AZ7F…` — `proSwapsSol` **25,708** (unchanged from the 2026-08-06 baseline of 25,708).
- User wallet — **not read**: the address is runtime-only (from the connected Phantom
  wallet), not stored in the repo. Needed to complete the comparison.

**Interpretation so far:** `AZ7F` being flat is **inconclusive** — it is a third-party
wallet, so a flat count over 24h more likely means it simply is not swapping right now
than that the vault-fee mechanism is inactive. A wallet snapshot cannot show "rising"
unless the wallet is actively swapping in the window. The decisive datapoint is the
user's own `proSwapsSol` movement, which requires the user's wallet address.

**Deeper limitation of the passive test:** even with the user's wallet, the signal is
confounded — the user's wallet receives BOTH Ez Miner swaps (which carry `L2TExMFK` and
would move boost/attribution) and any Pond0matic swaps (which carry neither marker). A
rise on the user's wallet cannot be cleanly attributed to the vault mechanism vs Ez Miner.
The only clean test is prospective: wire the vault fee, run ONLY Pond0matic swaps (no Ez
Miner) for a window, and watch `proSwapsSol` — but that requires wiring first (Task 11),
which the plan gates on confirmation. Passive confirmation may therefore be unreachable;
this is a decision point for the user (see plan Task 10 → Task 11 gate).
