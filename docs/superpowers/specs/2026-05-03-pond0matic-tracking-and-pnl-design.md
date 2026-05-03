# Pond0matic — Tracking & PnL (Phase 2, Spec 2 of 2)

**Date**: 2026-05-03
**Status**: Approved design, ready for implementation plan
**Scope**: Second of two Phase 2 specs. Covers swap/spawn performance tracking & history, and pondwater (wPOND) PnL tracking. Phase 2 Spec 1 (Monitoring & Alerts) is already implemented.

**Depends on Phase 1 + Spec 1**: real wallet (`useWallet`), live token prices (`useTokenPrices`), wallet balances (`useWalletBalances`), pond-water UI primitives, zod (already a dependency).

---

## 1. Goal

Two related but distinct features built on the same swap-record store:

1. **Swap History** — every swap the user executes through Pond0matic is captured to localStorage with full context (mode, tokens, amounts, USD prices at execution time, signature, status). The user can browse, filter, and export this history.

2. **Pondwater PnL** — for the wPOND token specifically, compute unrealized PnL using the running cost basis from swap history. Mined wPOND (the difference between current balance and net wPOND from swaps) is treated as cost-basis-zero, so its full current value counts as profit.

App-only tracking: only swaps executed through Pond0matic are recorded. Out-of-app swaps and historical on-chain activity are out of scope.

Out of scope: other-token PnL, realized PnL via FIFO, time-series charts, on-chain backfill, multi-wallet aggregation.

---

## 2. Data source

**App-only.** The recording happens inside the existing swap execution flow:

- `useSwapExecution` already produces transaction signatures via `connection.sendRawTransaction`.
- A new `useSwapRecorder()` hook hooks into the swap lifecycle and writes records to storage.
- Capture point: immediately after `sendRawTransaction` returns a signature → record `status: 'pending'`. After confirmation callback fires → update to `'confirmed'` or `'failed'`.

This means out-of-app swaps (Jupiter direct, other DEXs) are invisible to PnL. The cost-basis-zero handling for the unaccounted balance (mined or imported wPOND) absorbs this case without crashing.

---

## 3. Storage

`localStorage` keyed by `pond0matic.portfolio.v1`. Capped at 500 records (rolling, oldest dropped first). Export-to-JSON and export-to-CSV available so power users can archive data they care about beyond the cap.

### Schema (zod)

```ts
const STORAGE_KEY = "pond0matic.portfolio.v1";
const STORAGE_VERSION = 1;
const MAX_RECORDS = 500;

const SwapModeSchema = z.enum(["normal", "boost", "rewards"]);
const SwapStatusSchema = z.enum(["pending", "confirmed", "failed"]);

const SwapRecordSchema = z.object({
  id: z.string().min(1),
  signature: z.string().min(1),       // tx signature (or "pending-<id>" before send)
  mode: SwapModeSchema,
  fromMint: z.string(),
  fromSymbol: z.string(),
  fromAmount: z.number().nonnegative(),
  toMint: z.string(),
  toSymbol: z.string(),
  toAmount: z.number().nonnegative(),
  fromPriceUsd: z.number().nonnegative(), // captured at execution time
  toPriceUsd: z.number().nonnegative(),   // captured at execution time
  feesUsd: z.number().nonnegative().optional(),
  status: SwapStatusSchema,
  timestamp: z.number().int().nonnegative(),
  walletAddress: z.string().min(1),     // so we can scope per-wallet
});

const PortfolioStorageSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  records: z.array(SwapRecordSchema).max(MAX_RECORDS),
  updatedAt: z.number().int().nonnegative(),
});
```

### Operations (`lib/portfolio/storage.ts`)

- `loadStorage(): PortfolioStorage` — defaults to empty config when missing/corrupt
- `saveStorage(storage)` — debounced 250ms (same pattern as alerts)
- `flushStorage(storage)` — synchronous write (used at unload / import)
- `appendRecord(storage, record): PortfolioStorage` — adds + caps at 500, newest first
- `updateRecord(storage, id, patch): PortfolioStorage` — used to flip pending → confirmed/failed
- `clearWallet(storage, walletAddress): PortfolioStorage` — drops records for a wallet (UI delete-all option)

Records are always wallet-scoped at read time: `recordsForWallet(storage, walletAddress)`.

---

## 4. Recording swaps

### Hook: `hooks/useSwapRecorder.ts`

Wraps the existing swap-execution callbacks rather than replacing them. The simplest integration point is at the call site (`app/page.tsx`, `app/swapper/page.tsx`) — but to keep concerns local, we expose a small API that the existing pages can adopt with minimal change.

```ts
// hooks/useSwapRecorder.ts
export interface RecordSwapArgs {
  mode: "normal" | "boost" | "rewards";
  fromMint: string;
  fromSymbol: string;
  fromAmount: number;
  toMint: string;
  toSymbol: string;
  toAmount: number;
}
export function useSwapRecorder(): {
  beginSwap(args: RecordSwapArgs): { id: string; commit(signature: string): void; markFailed(): void; markConfirmed(): void };
};
```

Usage pattern (added to `useSwapExecution.ts` execution methods):

```ts
const recorder = useSwapRecorder();
const handle = recorder.beginSwap({ mode: 'normal', fromMint, fromSymbol, fromAmount, toMint, toSymbol, toAmount });
try {
  const sig = await connection.sendRawTransaction(...);
  handle.commit(sig);
  await connection.confirmTransaction(sig, 'confirmed');
  handle.markConfirmed();
} catch (e) {
  handle.markFailed();
  throw e;
}
```

The recorder captures `fromPriceUsd` and `toPriceUsd` at `beginSwap` time from the latest `useTokenPrices()` snapshot (passed in via context or hook composition — see "Wiring" below). It auto-fills `walletAddress` from `useWallet().publicKey`.

`useTokenPrices()` only knows 6 symbols (SOL, wPOND, pondSOL, ETH, PNDC, PORK). For tokens outside this set the recorder writes `0` as the price. Pondwater PnL (the only consumer of these prices today) only cares about the wPOND side of each record, which is always one of the known symbols, so this gap is acceptable. The `fromPriceUsd`/`toPriceUsd` fields on non-wPOND legs are still useful for future per-token PnL, but cannot be filled retroactively for unknown symbols.

### Wiring constraint

`useSwapRecorder` needs access to `useWallet()` and `useTokenPrices()`. Both are React hooks, so the recorder must be invoked from a React component or hook context. The integration:

1. `useSwapRecorder` itself calls `useWallet()` + `useTokenPrices()`.
2. The existing `useSwapExecution` accepts the recorder as an injected dependency (constructor option), keeping it pure-ish and testable.
3. Pages that call `useSwapExecution` first call `useSwapRecorder` and pass the result in.

Alternative considered: register a global event bus and dispatch swap events. Rejected because it adds an indirection layer for no win — the explicit dependency is clearer and just as small.

---

## 5. Reading history: `hooks/useSwapHistory.ts`

```ts
export interface SwapHistoryFilters {
  mode?: "normal" | "boost" | "rewards";
  status?: "pending" | "confirmed" | "failed";
  symbol?: string; // matches either fromSymbol or toSymbol
  from?: number;   // timestamp lower bound
  to?: number;     // timestamp upper bound
}

export function useSwapHistory(filters?: SwapHistoryFilters): {
  records: SwapRecord[];   // wallet-scoped, filtered, sorted newest-first
  total: number;           // count without pagination
  refresh(): void;
  deleteOne(id: string): void;
  clearAll(): void;
};
```

Implementation: subscribes to a custom `pond0matic:portfolio-updated` event (dispatched by storage on save) plus the standard `storage` event for cross-tab sync. Reactive but doesn't poll.

Pagination is handled in the UI layer with a simple slice (20 per page, "Load more" pattern). No infinite scroll for v1.

---

## 6. PnL computation: `lib/portfolio/pnl.ts`

Pure function with full unit-test coverage. No DOM, no localStorage, no React.

```ts
export interface PnLInputs {
  records: SwapRecord[];     // already wallet-scoped, confirmed-only
  currentBalance: number;    // current wPOND balance from useWalletBalances
  currentPrice: number;      // current wPOND USD price
}

export interface PnLBreakdown {
  // Quantities
  swappedInWpond: number;     // total wPOND received from swaps (toSymbol=wPOND)
  swappedOutWpond: number;    // total wPOND spent in swaps (fromSymbol=wPOND)
  netSwappedWpond: number;    // swappedIn - swappedOut
  minedWpond: number;         // max(0, currentBalance - netSwappedWpond)
  unaccountedNegative: number;// abs(min(0, currentBalance - netSwappedWpond)) — debug field

  // USD values
  swapCostBasis: number;      // sum over receive-wPOND records of toAmount * toPriceUsd at swap time
  swapDisposalProceeds: number;// sum over spend-wPOND records of fromAmount * fromPriceUsd at swap time
  swapNetCostBasis: number;   // swapCostBasis - swapDisposalProceeds (net invested in held wPOND)
  swapHoldingValue: number;   // netSwappedWpond * currentPrice
  swapUnrealizedPnL: number;  // swapHoldingValue - swapNetCostBasis
  minedValue: number;         // minedWpond * currentPrice (cost basis 0)
  totalPnL: number;           // swapUnrealizedPnL + minedValue
  totalValue: number;         // currentBalance * currentPrice

  // Meta
  recordCount: number;
  hasNegativeUnaccounted: boolean; // surfaces "we saw more out-of-app burns than balance"
}

export function computePondwaterPnL(inputs: PnLInputs): PnLBreakdown;
```

### Edge cases the function must handle

- Empty records → all-zero breakdown except `minedValue = currentBalance * currentPrice` and `totalPnL = minedValue`
- Current price 0 → `totalValue = 0`, `totalPnL = -swapNetCostBasis` (still meaningful: shows what you paid)
- `netSwappedWpond > currentBalance` → user disposed wPOND outside the app; `minedWpond = 0`, `unaccountedNegative` flagged so UI can show a hint
- Pending records are filtered out before this function is called — the function trusts its inputs

---

## 7. Export

### Module: `lib/portfolio/exporter.ts`

```ts
export function exportToJson(records: SwapRecord[]): string;
export function exportToCsv(records: SwapRecord[]): string;
```

CSV columns: `timestamp,date,mode,signature,from_symbol,from_amount,from_price_usd,to_symbol,to_amount,to_price_usd,fees_usd,status,wallet_address`. ISO date in addition to timestamp for human readability.

Both functions are pure (no DOM). The UI layer wraps `Blob + URL.createObjectURL + <a download>` around them, same pattern as the alerts export.

No import for portfolio data in v1: re-importing risks creating duplicate records, and there's no clear use case (user backups are read-only archives). Add later if requested.

---

## 8. UI

### Routes

- New: `app/portfolio/page.tsx` → `/portfolio` — Portfolio Page
- Updated: `components/layout/TopNavigation.tsx` — add nav link "Portfolio" (after Alerts), tone `wave`

### Page composition: `PortfolioPage.tsx`

```text
┌─────────────────────────────────────────────────────┐
│  Portfolio                                          │
├─────────────────────────────────────────────────────┤
│  Pondwater PnL                                      │
│  ─────────                                          │
│  ┌─────────────┬──────────────┬──────────────┐     │
│  │ Total Value │ Total PnL    │ Mined Value  │     │
│  │ $123.45     │ +$45.67      │ $30.00       │     │
│  └─────────────┴──────────────┴──────────────┘     │
│  Cost basis: $77.78 from N swaps                   │
│  Mined wPOND: 100,000 (cost basis 0)               │
│  Held: 250,000 wPOND × $0.00049 = $122.50          │
├─────────────────────────────────────────────────────┤
│  Swap History (143 records)        [JSON] [CSV]    │
│  ─────────                                          │
│  Filters: [Mode ▾] [Status ▾] [Symbol] [Clear]     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 14:22 boost   100 SOL → 1.2M wPOND  ✓ tx↗  │   │
│  │ 13:50 rewards 50 SOL  → 600k wPOND  ✓ tx↗  │   │
│  │ 11:30 normal  10 USDC → 9.99 USDC   ✗      │   │
│  └─────────────────────────────────────────────┘   │
│  [Load more]                                        │
└─────────────────────────────────────────────────────┘
```

### Components

- `PortfolioPage.tsx` (~100 lines) — composes the page, wires hooks
- `PondwaterPnLPanel.tsx` (~100 lines) — three big metric cards + breakdown
- `PnLBreakdown.tsx` (~50 lines) — cost basis details below the metric cards
- `SwapHistoryPanel.tsx` (~150 lines) — filters, list, pagination, export buttons
- `SwapHistoryRow.tsx` (~80 lines) — single record row with link to explorer
- `SwapHistoryFilters.tsx` (~60 lines) — mode/status/symbol/date dropdowns

All use existing pond-water primitives (`LilyPadCard` for metric cards, `WaterRipple`, `LiveIndicator`).

### Disconnected state

If wallet is not connected: render a single message in the page body — "Connect a wallet to view your portfolio." No empty PnL or history grid. The TopNavigation Portfolio link stays visible.

---

## 9. File map

```text
app/
  portfolio/page.tsx                     # NEW

components/
  portfolio/
    PortfolioPage.tsx                    # NEW
    PondwaterPnLPanel.tsx                # NEW
    PnLBreakdown.tsx                     # NEW
    SwapHistoryPanel.tsx                 # NEW
    SwapHistoryRow.tsx                   # NEW
    SwapHistoryFilters.tsx               # NEW
  layout/
    TopNavigation.tsx                    # MODIFIED — add /portfolio link

hooks/
  useSwapRecorder.ts                     # NEW
  useSwapHistory.ts                      # NEW
  usePondwaterPnL.ts                     # NEW
  useSwapExecution.ts                    # MODIFIED — accept recorder dep, capture lifecycle

lib/portfolio/
  types.ts                               # NEW — zod schemas
  storage.ts                             # NEW — load/save/append/update/clear, debounced
  pnl.ts                                 # NEW — computePondwaterPnL pure fn
  exporter.ts                            # NEW — JSON + CSV serializers

tests/portfolio/
  pnl.test.ts                            # NEW — ~10 cases
  storage.test.ts                        # NEW — load/save/append/cap/import-error
  exporter.test.ts                       # NEW — CSV/JSON format checks
```

Estimated 13 new files, 2 modified. Largest file ~150 lines (SwapHistoryPanel) — within the splitting discipline.

---

## 10. Testing

### Unit tests (required)

- `pnl.test.ts`:
  - empty records + 0 balance → all zeros
  - all mined (no records, balance > 0) → totalPnL = balance × currentPrice
  - all swapped, no mined → swapUnrealizedPnL only, minedValue 0
  - mixed mined + swapped → both contributions sum to totalPnL
  - negative net (out-of-app dispose) → minedWpond = 0, hasNegativeUnaccounted = true
  - currentPrice = 0 → totalValue = 0, totalPnL = -swapNetCostBasis
  - records that spend wPOND (fromSymbol=wPOND) reduce netSwapped correctly
  - rounding: tiny numbers don't NaN
- `storage.test.ts`:
  - load with empty storage returns defaults
  - load with corrupt JSON returns defaults
  - load with bad schema returns defaults
  - appendRecord caps at 500 (drop oldest)
  - updateRecord patches only matching id
  - clearWallet removes only that wallet's records
- `exporter.test.ts`:
  - JSON round-trips through JSON.parse
  - CSV escapes commas/quotes correctly
  - CSV header matches column order

### Component tests (light)

- `SwapHistoryFilters` calls onChange with the right shape on each filter change
- `PondwaterPnLPanel` renders connected state vs disconnected message
- (Skip recorder integration tests — too much swap-execution infra to mock; covered by manual smoke instead)

### Manual validation

1. Connect wallet, execute a swap via CompactSwapper → record appears in `/portfolio` after confirmation
2. Disconnect → portfolio shows "Connect a wallet" message
3. Reconnect → records reappear
4. Filter by mode "boost" → only boost records visible
5. Export JSON → file downloads, opens, contains records
6. Export CSV → file downloads, opens in Excel/Sheets cleanly
7. Force a failed swap (invalid params) → record shows status "failed"
8. With wPOND balance + zero swap records → PnL shows mined value = current value
9. After several wPOND-receiving swaps → cost basis appears, unrealized PnL computed
10. After 500+ swaps (or by editing storage manually): oldest records get dropped

---

## 11. Definition of Done

- [ ] `/portfolio` route renders, both panels load
- [ ] Swaps executed via CompactSwapper appear in history within ~15 seconds (after confirmation)
- [ ] Pending → confirmed/failed transitions work
- [ ] Pondwater PnL computes correctly for: all-mined, all-swapped, mixed, negative-unaccounted, current-price-0
- [ ] Filters narrow the history list as expected
- [ ] Pagination "Load more" reveals additional records
- [ ] JSON + CSV export download cleanly
- [ ] Records cap at 500 (oldest dropped); UI shows total count
- [ ] Wallet scoping works — switching wallet shows different records
- [ ] Disconnected state shows clear "Connect wallet" message instead of empty UI
- [ ] `npm run build`, `npm run test`, `npx tsc --noEmit` all pass
- [ ] No regression in existing dashboard, swapper, or alerts pages

---

## 12. Out of scope (future)

- Realized PnL via FIFO cost basis matching
- PnL for tokens other than wPOND
- Time-series charts (portfolio value over time, swap markers)
- On-chain backfill of historical swaps via signature scanning
- Multi-wallet aggregation
- Import portfolio JSON (re-importing risks duplicates)
- Profit/loss tax-report exports
