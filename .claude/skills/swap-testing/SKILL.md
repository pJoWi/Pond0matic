---
name: swap-testing
description: Testing patterns for swap, transaction, and financial logic in this repo (Vitest). Use when writing tests for swap execution, quote handling, transaction validation, fee routing, or PnL math, or when adding any new swap feature.
---

# Swap testing (Vitest)

Tests live in `tests/**` (`vitest.config.ts`, `@/` alias = repo root). Run
with `npx vitest run`. This project uses **Vitest, not Jest** — `vi.fn()`,
`vi.mock()`.

## What must be tested (priority order)

1. **Pure financial logic first** — it's cheap and highest-stakes:
   `lib/transactionValidation.ts` (`validateSwapAmount`,
   `validateSwapTransaction`), `lib/referral.ts`
   (`buildJupiterSwapRequest` fee-account precedence: vault vs referral),
   amount/decimals math, `boostRandom`-style randomized-amount bounds,
   PnL (`lib/portfolio/pnl.ts` is the reference for thoroughness).
2. **Evaluators**: alert evaluators are pure — table-driven tests over
   snapshots (see `tests/alerts/*` for the established style).
3. **Imperative flows** (`useSwapExecution`): don't test the network — first
   extract pure sub-functions, then test those. If a function is hard to
   test, that's a design signal to extract, not to mock harder.

## Patterns

- **Mock at the boundary**: mock `fetch`/connection methods, not internal
  functions.

```typescript
import { describe, expect, it, vi } from "vitest";

const connection = {
  getLatestBlockhash: vi.fn().mockResolvedValue({
    blockhash: "mock", lastValidBlockHeight: 1_000_000,
  }),
  simulateTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
  sendRawTransaction: vi.fn().mockResolvedValue("sig"),
};
```

- **Always test the hostile cases**, not just the happy path:
  - simulation returns `{ value: { err: … } }` → swap must abort
  - transaction contains an instruction to an unknown program → must error
  - fee payer ≠ connected wallet → must error
  - amount > balance, amount > 90% of balance, amount = 0, negative
  - decimals lookup fails → abort (never a guessed fallback)
  - quote/swap endpoint returns 429/401/500/garbage JSON (zod rejects)
  - slippage failure mid auto-sequence → loop stops or skips correctly,
    never double-sends
- **Determinism**: randomized amounts (boost mode) tested via seeded/injected
  RNG or by asserting bounds over many draws — never flaky assertions on
  single random values.
- **Fixtures over fabrication** for transaction shapes: capture a real
  parsed Jupiter transaction once (e.g. via `tools/cli.ts solana tx <sig>`)
  and commit it as a fixture; `tests/tools-core.test.ts` shows the
  hand-rolled minimal-shape alternative.

## Definition of done for a swap-path change

New/changed branch in swap logic ⇒ new test case. `npx vitest run` green.
If you touched `lib/referral.ts` or `lib/transactionValidation.ts` without
adding a test, the change is not done.
