---
name: web3-security-review
description: Security review checklist for Web3/Solana code in this repo, calibrated by the 2026-07-10 audit. Use when reviewing changes to swap execution, transaction handling, wallet integration, or API routes, or when the user asks for a security check or audit.
---

# Web3 security review (Pond0matic)

Full audit + findings backlog: `docs/audit/2026-07-10-audit-report.md`.
The lesson of that audit: **safety code that exists but isn't wired in is the
main failure mode here** — verify controls are *called and blocking*, not
just present.

## The signing path (highest stakes)

Before any transaction is signed, all of these must hold — verify call
sites, not definitions:

1. **Simulated**: `simulateTransaction` runs and a failure *blocks* (audit
   H1: it existed but was never called).
2. **Program allowlist blocks**: an instruction to a program outside
   `SAFE_PROGRAM_IDS` is an *error*, not a warning (audit H2: it only
   warned — a drainer instruction would have sailed through).
3. **Tx matches quote**: decoded transaction's mints, min-out
   (`otherAmountThreshold`), and fee account match the quote the user saw
   (audit H3: Jupiter's returned bytes were trusted blindly).
4. **Fee-payer check**: first static account key == connected wallet.
5. **Amount guard**: `validateSwapAmount` (balance and 90% caps) wired in.
6. **Fee cap enforced**: a `maxFeeLamports`-style parameter must actually be
   read (audit M1: declared, never used).

## Wallet integrity

- Single identity via wallet-adapter; no `window.solana` (audit M2: two
  unsynchronized wallet subsystems meant safety math could check the wrong
  account's balance).
- `accountChanged` handled; cached balances invalidated on publicKey change.
- No secrets/keys in code, localStorage, or `NEXT_PUBLIC_*` env.

## Data boundaries

- Route params (`[wallet]`) validated as base58 + `encodeURIComponent`
  before upstream URL construction (audit M3).
- Upstream JSON parsed with zod/field-checks, never `as Type`.
- Token decimals: fetch failure aborts the swap — never fall back to a
  guessed value (audit M4: silent 6-decimals fallback = potential 1000×
  amount error).
- Error responses don't leak raw upstream/exception messages.

## Dependencies

- `npm audit --omit=dev` on any dependency change; no unused Solana packages
  (audit M5: `@solana/spl-token@0.1.8` was dead weight with advisories).

## Reporting format

Findings ordered Critical/High/Medium/Low, each with file:line, a concrete
failure scenario (inputs → funds lost/wrong), and a minimal fix. State
explicitly which controls you verified as present AND enforced. No
theoretical padding.
