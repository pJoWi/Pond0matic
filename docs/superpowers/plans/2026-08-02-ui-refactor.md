# Pond0matic UI Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the app shell around a sidebar-cockpit layout with a guided connect flow (wallet + RPC + Jupiter API key), decompose `SwapperContext`/`useSwapExecution` into pure planner + orchestrator, introduce a Tailwind CSS v4 "Deep Pond" theme (dark/light), and remove the alerts feature plus all dead code.

**Architecture:** New world is built alongside the old one (new files are not imported until the cutover phase), so the app builds and works after every phase. Pure logic (`lib/swap/`) lands first with truth-table tests, then contexts, then the engine, then UI, then a single-commit cutover, then deletion of the old world.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Tailwind CSS v4 (`@tailwindcss/postcss`), Zod v4, `@solana/wallet-adapter-react`, `@solana/web3.js` v1, sonner (toasts), Vitest.

**Spec:** `docs/superpowers/specs/2026-08-02-ui-refactor-design.md`

## Global Constraints

- **Production financial code**: every change on the swap path is real-money code. `lib/referral.ts` and `lib/transactionValidation.ts` are NOT modified — the new engine calls them with identical arguments as the old one.
- **Wallet identity**: only `@solana/wallet-adapter-react` (`useWallet()`/`useConnection()`). Never `window.solana`/`getPhantomProvider()`; never a raw `wallet: string` param in new code.
- **Pure evaluator + orchestrator**: business rules as pure functions in `lib/`, one hook per feature owning side effects.
- **Boundary validation**: Zod for all external API responses. Zod is v4 — use `z.looseObject({...})` for passthrough objects.
- **One exported component per file**, ≤ ~200 lines.
- **Polling** via `hooks/useVisibilityPolling.ts`, never bare `setInterval`.
- **Tests**: Vitest (`npx vitest run`), never Jest. Test env is `node` — no jsdom, no DOM in tests.
- **Behavior parity**: Normal/Boost/Rewards semantics identical to the legacy loops in `hooks/useSwapExecution.ts` (documented per-task below).
- **Jupiter endpoints**: Swap API v2 order-and-execute — `GET https://api.jup.ag/swap/v2/order` and `POST https://api.jup.ag/swap/v2/execute`, both REQUIRE the `x-api-key` header (docs: https://developers.jup.ag/docs/swap/order-and-execute). Jupiter lands the transaction after `/execute`; the client only signs. Keyless price feed stays on `https://lite-api.jup.ag/price/v3`.
- **New dependencies allowed**: `tailwindcss@^4`, `@tailwindcss/postcss` only. Removed at the end: `canvas-confetti`, `@types/canvas-confetti`, `autoprefixer`.
- **All numeric UI** (amounts, prices, addresses, tx ids, counters) uses the `font-num` utility class (mono + tabular-nums).
- **Semantic color tokens only** in new components: `bg-bg`, `bg-surface`, `bg-surface-2`, `border-edge`, `text-ink`, `text-ink-muted`, `text-accent`, `bg-accent`, `text-danger`, `text-warn` — never raw hex/palette classes.
- **Gates after every task**: `npm run build` passes, `npx vitest run` green. Phases end with a working app.
- Windows dev machine; shell commands below are Git-Bash compatible.

## File Structure (end state)

```
app/
  layout.tsx                       # rewritten: Inter font, theme init script, providers + AppShell
  globals.css                      # NEW: Tailwind v4 import + @theme tokens (only stylesheet)
  page.tsx                         # rewritten: cockpit (DashboardTabs + SwapPanel)
  portfolio/page.tsx               # kept, minor wrapper tweak
  settings/page.tsx                # NEW
  api/                             # clicker/*, rig/*, wpond-price kept; rest deleted
contexts/
  SettingsContext.tsx              # NEW  (RPC, API key, theme, defaults, setup state)
  SwapConfigContext.tsx            # NEW  (mints, amounts, mode, mode params, vault)
  SessionContext.tsx               # NEW  (running/paused/stopping/progress)
  ActivityContext.tsx              # NEW  (wraps useActivityLog)
  RigContext.tsx                   # NEW  (wraps useMiningRig)
lib/
  swap/sessionPlanner.ts           # NEW  pure: planRound/hasNextRound/randomAmount
  swap/orders.ts                   # NEW  pure: v2 order/execute builders, zod schemas
  settings/storage.ts              # NEW  pure: parse/serialize localStorage settings
  settings/validation.ts           # NEW  testRpcEndpoint / testJupiterApiKey
hooks/
  useSwapEngine.ts                 # NEW  orchestrator (replaces useSwapExecution)
components/
  layout/AppShell.tsx              # NEW
  layout/Sidebar.tsx               # NEW
  layout/ConnectionStatus.tsx      # NEW  (3 status LEDs)
  layout/ThemeToggle.tsx           # NEW
  connect/ConnectSetupModal.tsx    # NEW  (3-step guided setup)
  swap/SwapPanel.tsx               # NEW  + ModeTabs, AmountCard, ModeConfigRow,
  swap/...                         #       SessionButton, SessionProgress, MiniFeed, ClickerSection
  dashboard/DashboardTabs.tsx      # NEW  + RigTab, PricesTab, ActivityTab, StatCard
  settings/...                     # NEW  ConnectionSettings, SwapDefaultsSettings
  portfolio/*                      # kept, restyled to semantic tokens
DELETED at the end: contexts/SwapperContext.tsx, hooks/useSwapExecution.ts,
hooks/useWallet.ts, hooks/useToast.ts, components/CompactSwapper/*,
components/layout/{TopNavigation,StatusBar,SwapModeNavigation,LayoutClient}.tsx,
components/{Dashboard,LiveActivityMonitor}.tsx, components/swapper/*,
components/wallet/WalletBar.tsx, components/ui/Toast.tsx, lib/confetti.ts,
lib/jupiter.ts, lib/windowHelpers.ts, styles/*, tailwind.config.ts,
app/{alerts,swapper}/, components/alerts/*, lib/alerts/*, hooks/useAlertEngine.ts,
hooks/useAlertsBadgeCount.ts, hooks/useNotificationPermission.ts, tests/alerts/*,
app/api/{pndc-stats,pork-stats,wpond-stats,vault-balance}/
```

---

# Phase 1 — Cleanup (old app keeps working)

### Task 1: Remove the alerts feature

**Files:**
- Delete: `app/alerts/` (whole dir), `components/alerts/` (whole dir), `lib/alerts/` (whole dir), `hooks/useAlertEngine.ts`, `hooks/useAlertsBadgeCount.ts`, `hooks/useNotificationPermission.ts`, `tests/alerts/` (whole dir)
- Modify: `app/page.tsx` (remove `useAlertEngine` import + call), plus any other importer found in step 1

**Interfaces:**
- Consumes: nothing
- Produces: a tree with zero references to alerts; later tasks assume alerts do not exist

- [ ] **Step 1: Find every importer of the alerts modules**

Run:
```bash
grep -rln "useAlertEngine\|useAlertsBadgeCount\|useNotificationPermission\|lib/alerts\|components/alerts\|AlertsCenter" --include='*.ts' --include='*.tsx' app components hooks lib contexts | grep -v -E '^(app/alerts|components/alerts|lib/alerts|hooks/useAlert|hooks/useNotificationPermission|tests/alerts)'
```
Expected importers (fix each in step 3): `app/page.tsx` (calls `useAlertEngine()`), likely `components/layout/TopNavigation.tsx` (alerts nav link and/or badge count). Note every hit.

- [ ] **Step 2: Delete the alerts tree**

```bash
git rm -r app/alerts components/alerts lib/alerts tests/alerts
git rm hooks/useAlertEngine.ts hooks/useAlertsBadgeCount.ts hooks/useNotificationPermission.ts
```

- [ ] **Step 3: Fix the importers found in step 1**

In `app/page.tsx` remove the import line `import { useAlertEngine } from "@/hooks/useAlertEngine";` and the call `useAlertEngine(); // Mount once: orchestrates all rig + price alerts`.
In `components/layout/TopNavigation.tsx` (and any other hit): remove the alerts nav link/badge and its imports. Keep the surrounding nav intact — this file is deleted later, it only needs to compile.

- [ ] **Step 4: Verify build and tests**

Run: `npm run build && npx vitest run`
Expected: build succeeds; vitest green (alerts tests are gone, remaining suites pass: utils, portfolio, clicker, tools-core).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove alerts feature (spec: 2026-08-02 UI refactor)"
```

### Task 2: Remove dead files — `/swapper` route, LiveActivityMonitor, lib/jupiter.ts, unused assets

**Files:**
- Delete: `app/swapper/page.tsx`, `components/LiveActivityMonitor.tsx`, `lib/jupiter.ts`, `public/leaf1.png`, `public/leaf2.png`, `public/leaf3.png`, `public/pond0x-bubble.png`, `public/pond0x-logo_.png`
- Modify: `components/Dashboard.tsx` (drop LiveActivityMonitor usage)

**Interfaces:**
- Consumes: nothing
- Produces: nothing (pure deletion)

- [ ] **Step 1: Verify each target is genuinely unreferenced**

```bash
grep -rln "LiveActivityMonitor" --include='*.tsx' app components | grep -v LiveActivityMonitor.tsx
grep -rln "lib/jupiter" --include='*.ts' --include='*.tsx' app components hooks lib contexts tools
grep -rn "leaf1\|leaf2\|leaf3\|pond0x-bubble\|pond0x-logo_" --include='*.ts' --include='*.tsx' --include='*.css' app components styles lib
```
Expected: `LiveActivityMonitor` only in `components/Dashboard.tsx`; `lib/jupiter` zero hits; assets zero hits. If any unexpected hit appears, remove the reference there first (same pattern as Dashboard below) — do not skip the deletion.

- [ ] **Step 2: Remove LiveActivityMonitor from Dashboard.tsx**

In `components/Dashboard.tsx`: delete the import of `LiveActivityMonitor` and the JSX element rendering it (keep the rest of the layout unchanged).

- [ ] **Step 3: Delete the files**

```bash
git rm app/swapper/page.tsx components/LiveActivityMonitor.tsx lib/jupiter.ts
git rm public/leaf1.png public/leaf2.png public/leaf3.png public/pond0x-bubble.png public/pond0x-logo_.png
```

- [ ] **Step 4: Verify build and tests**

Run: `npm run build && npx vitest run`
Expected: both green. Navigating to `/swapper` now 404s — intended.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: remove /swapper route, LiveActivityMonitor, dead lib/jupiter and unused assets"
```

### Task 3: Slim token prices to SOL/wPOND and delete unused stats API routes

The new Prices tab shows SOL, wPOND, USDC only. `pndcPrice`/`porkPrice`/`ethPrice`/`pondSolPrice` and the `pndc-stats`/`pork-stats` routes exist only for Ethereum tokens that no longer fit the app; `wpond-stats` and `vault-balance` have zero client references.

**Files:**
- Modify: `hooks/useTokenPrices.ts`, `hooks/useSwapRecorder.ts`, `hooks/useWalletBalances.ts`, `components/swapper/sections/TokenPricesPanel.tsx`, plus any other consumer found in step 1
- Delete: `app/api/pndc-stats/`, `app/api/pork-stats/`, `app/api/wpond-stats/`, `app/api/vault-balance/`

**Interfaces:**
- Consumes: existing `useTokenPrices`
- Produces: `TokenPrices` interface is now exactly `{ wpondPrice: number; solPrice: number; loading: boolean }` — Task 14 (PricesTab) relies on this shape

- [ ] **Step 1: List consumers and route references**

```bash
grep -rln "useTokenPrices" --include='*.ts*' app components hooks contexts | grep -v useTokenPrices.ts
grep -rn "pndcPrice\|porkPrice\|ethPrice\|pondSolPrice" --include='*.ts*' app components hooks contexts
grep -rn "wpond-stats\|vault-balance" --include='*.ts*' app components hooks lib contexts | grep -v 'app/api'
```
Expected consumers: `components/swapper/CompactPond0xDashboard.tsx`, `components/swapper/sections/TokenPricesPanel.tsx`, `components/wallet/WalletBar.tsx`, `hooks/usePondwaterPnL.ts`, `hooks/useSwapRecorder.ts`, `hooks/useWalletBalances.ts`. Expected: zero non-api references to `wpond-stats`/`vault-balance`.

- [ ] **Step 2: Slim `hooks/useTokenPrices.ts`**

Reduce the interface and fetch logic to:

```ts
export interface TokenPrices {
  wpondPrice: number;
  solPrice: number;
  loading: boolean;
}
```

Keep the existing fetch for `/api/wpond-price` (wPOND) and the existing SOL price fetch exactly as implemented today, delete the fetches for `/api/pndc-stats`, `/api/pork-stats`, the ETH price call, the DexScreener fallback for PNDC/PORK, and the pondSOL block. Keep `useVisibilityPolling` usage unchanged.

- [ ] **Step 3: Fix consumers**

- `hooks/useSwapRecorder.ts`: in the symbol→price-key map keep only `SOL: "solPrice"`, `wPOND: "wpondPrice"` (drop pondSOL/ETH/PNDC/PORK entries). USDC handling stays as-is (hardcoded 1 or existing logic).
- `hooks/useWalletBalances.ts`: delete the `pondSolPrice` branch (return 0 for unknown mints, matching the existing unknown-token fallback).
- `components/swapper/sections/TokenPricesPanel.tsx`: destructure only `{ solPrice, wpondPrice, loading }`; keep only the SOL and wPOND rows in the `tokens` array (this old-world component just needs to compile; it is deleted in Task 18).
- `components/swapper/CompactPond0xDashboard.tsx`, `components/wallet/WalletBar.tsx`, `hooks/usePondwaterPnL.ts`: check with the step-1 grep which removed fields they touch and delete those usages the same way.

- [ ] **Step 4: Delete the routes**

```bash
git rm -r app/api/pndc-stats app/api/pork-stats app/api/wpond-stats app/api/vault-balance
```

- [ ] **Step 5: Verify build and tests**

Run: `npm run build && npx vitest run`
Expected: green. Manually confirm `npm run dev` dashboard still shows SOL + wPOND prices.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor: slim token prices to SOL/wPOND, drop unused stats API routes"
```

---

# Phase 2 — Pure swap logic (TDD, no UI change)

### Task 4: `lib/swap/sessionPlanner.ts` — pure session planner

Behavior parity source: the loops in `hooks/useSwapExecution.ts` (`executeNormalMode`, `executeBoostMode`, `executeRewardsMode`):
- **normal**: exactly one forward swap. No return swap, no delays.
- **boost**: per round: `max(1, swapsPerRound)` forward swaps with amount randomized in `[amount, maxAmount]`, `swapDelayMs` delay between swaps (NOT after the last), then one return-swap (manual `loopReturnAmount` if set, otherwise accumulated balance — resolved by the engine), then `autoDelayMs` if another round follows. `numberOfRounds === 0` ⇒ infinite.
- **rewards**: per round: one forward swap of fixed `amount`, `swapDelayMs` delay, one return-swap (always accumulated), then `autoDelayMs` if another round follows. `numberOfSwaps === 0` ⇒ infinite.

**Files:**
- Create: `lib/swap/sessionPlanner.ts`
- Test: `tests/swap/sessionPlanner.test.ts`

**Interfaces:**
- Consumes: `SwapMode` from `types/swapModes.ts`
- Produces (used by Task 9 `useSwapEngine` and Task 13 UI):
  - `interface SessionConfig { mode: SwapMode; amount: string; maxAmount: string; loopReturnAmount: string; swapsPerRound: number; numberOfRounds: number; numberOfSwaps: number; swapDelayMs: number; autoDelayMs: number }`
  - `type SessionStep = { kind: "swap"; amountUi: string; swapInRound: number; swapsInRound: number } | { kind: "return-swap"; manualAmountUi: string | null } | { kind: "delay"; ms: number }`
  - `planRound(config: SessionConfig, roundIndex: number, rng: () => number): SessionStep[]` (roundIndex is 1-based)
  - `hasNextRound(completedRounds: number, config: SessionConfig): boolean`
  - `totalRounds(config: SessionConfig): number` (returns `Infinity` for infinite)
  - `randomAmount(min: number, max: number, rng: () => number): string`

- [ ] **Step 1: Write the failing tests**

Create `tests/swap/sessionPlanner.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  planRound,
  hasNextRound,
  totalRounds,
  randomAmount,
  type SessionConfig,
} from "@/lib/swap/sessionPlanner";

const base: SessionConfig = {
  mode: "normal",
  amount: "0.01",
  maxAmount: "0.02",
  loopReturnAmount: "",
  swapsPerRound: 3,
  numberOfRounds: 2,
  numberOfSwaps: 2,
  swapDelayMs: 6000,
  autoDelayMs: 3000,
};
const rngLow = () => 0; // always picks min
const rngHigh = () => 0.9999999;

describe("randomAmount", () => {
  it("stays within [min, max]", () => {
    expect(Number(randomAmount(0.01, 0.02, rngLow))).toBeCloseTo(0.01, 10);
    expect(Number(randomAmount(0.01, 0.02, rngHigh))).toBeLessThanOrEqual(0.02);
    expect(Number(randomAmount(0.01, 0.02, rngHigh))).toBeGreaterThan(0.019);
  });
  it("clamps negative min to 0 and treats max<=min as min (legacy parity)", () => {
    expect(Number(randomAmount(-5, 0, rngLow))).toBe(0);
    expect(Number(randomAmount(0.05, 0, rngHigh))).toBeCloseTo(0.05, 6);
  });
});

describe("totalRounds / hasNextRound", () => {
  it("normal is always exactly 1 round", () => {
    const cfg = { ...base, mode: "normal" as const };
    expect(totalRounds(cfg)).toBe(1);
    expect(hasNextRound(0, cfg)).toBe(true);
    expect(hasNextRound(1, cfg)).toBe(false);
  });
  it("boost uses numberOfRounds, 0 = infinite", () => {
    expect(totalRounds({ ...base, mode: "boost" })).toBe(2);
    expect(totalRounds({ ...base, mode: "boost", numberOfRounds: 0 })).toBe(Infinity);
    expect(hasNextRound(999999, { ...base, mode: "boost", numberOfRounds: 0 })).toBe(true);
  });
  it("rewards uses numberOfSwaps, 0 = infinite", () => {
    expect(totalRounds({ ...base, mode: "rewards" })).toBe(2);
    expect(totalRounds({ ...base, mode: "rewards", numberOfSwaps: 0 })).toBe(Infinity);
  });
});

describe("planRound — normal", () => {
  it("is a single forward swap, nothing else", () => {
    const steps = planRound({ ...base, mode: "normal" }, 1, rngLow);
    expect(steps).toEqual([
      { kind: "swap", amountUi: "0.01", swapInRound: 1, swapsInRound: 1 },
    ]);
  });
});

describe("planRound — boost", () => {
  it("emits N swaps with delays between (not after last), then return-swap", () => {
    const steps = planRound({ ...base, mode: "boost", numberOfRounds: 1 }, 1, rngLow);
    const kinds = steps.map((s) => s.kind);
    expect(kinds).toEqual(["swap", "delay", "swap", "delay", "swap", "return-swap"]);
    expect(steps.filter((s) => s.kind === "delay").every((s: any) => s.ms === 6000)).toBe(true);
  });
  it("randomizes each swap amount within [amount, maxAmount]", () => {
    let call = 0;
    const rngSeq = () => [0, 0.5, 1][call++ % 3] * 0.9999;
    const steps = planRound({ ...base, mode: "boost", numberOfRounds: 1 }, 1, rngSeq);
    const amounts = steps.filter((s) => s.kind === "swap").map((s: any) => Number(s.amountUi));
    for (const a of amounts) {
      expect(a).toBeGreaterThanOrEqual(0.01);
      expect(a).toBeLessThanOrEqual(0.02);
    }
  });
  it("passes manual loopReturnAmount through, null when empty", () => {
    const manual = planRound({ ...base, mode: "boost", loopReturnAmount: "1.5" }, 2, rngLow)
      .find((s) => s.kind === "return-swap") as any;
    expect(manual.manualAmountUi).toBe("1.5");
    const auto = planRound({ ...base, mode: "boost" }, 2, rngLow)
      .find((s) => s.kind === "return-swap") as any;
    expect(auto.manualAmountUi).toBeNull();
  });
  it("appends round delay only when another round follows", () => {
    const withNext = planRound({ ...base, mode: "boost" }, 1, rngLow); // round 1 of 2
    expect(withNext[withNext.length - 1]).toEqual({ kind: "delay", ms: 3000 });
    const last = planRound({ ...base, mode: "boost" }, 2, rngLow); // round 2 of 2
    expect(last[last.length - 1].kind).toBe("return-swap");
  });
  it("clamps swapsPerRound to at least 1", () => {
    const steps = planRound({ ...base, mode: "boost", swapsPerRound: 0, numberOfRounds: 1 }, 1, rngLow);
    expect(steps.filter((s) => s.kind === "swap")).toHaveLength(1);
  });
});

describe("planRound — rewards", () => {
  it("is forward swap, delay, return-swap (+ round delay when more rounds follow)", () => {
    const steps = planRound({ ...base, mode: "rewards" }, 1, rngLow); // round 1 of 2
    expect(steps.map((s) => s.kind)).toEqual(["swap", "delay", "return-swap", "delay"]);
    expect((steps[0] as any).amountUi).toBe("0.01"); // fixed, not randomized
    expect((steps[1] as any).ms).toBe(6000);
    expect((steps[3] as any).ms).toBe(3000);
    expect((steps[2] as any).manualAmountUi).toBeNull(); // rewards always accumulated
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/swap/sessionPlanner.test.ts`
Expected: FAIL — `Cannot find module '@/lib/swap/sessionPlanner'`.

- [ ] **Step 3: Implement `lib/swap/sessionPlanner.ts`**

```ts
/**
 * Pure session planner for the swap engine.
 *
 * Behavior parity with the legacy loops in hooks/useSwapExecution.ts:
 * amounts, delays, ordering and infinite-session semantics are identical.
 * The engine (hooks/useSwapEngine.ts) executes the returned steps and owns
 * every side effect (balances, orders, signing, executing, pausing, stopping).
 */
import type { SwapMode } from "@/types/swapModes";

export interface SessionConfig {
  mode: SwapMode;
  /** UI amount for normal/rewards; minimum of the random range for boost */
  amount: string;
  /** Maximum of the random range for boost */
  maxAmount: string;
  /** Manual boost return-swap amount ("" = use accumulated balance) */
  loopReturnAmount: string;
  swapsPerRound: number;
  /** Boost rounds; 0 = infinite */
  numberOfRounds: number;
  /** Rewards rounds; 0 = infinite */
  numberOfSwaps: number;
  /** Delay between swaps within a round */
  swapDelayMs: number;
  /** Delay between rounds */
  autoDelayMs: number;
}

export type SessionStep =
  | { kind: "swap"; amountUi: string; swapInRound: number; swapsInRound: number }
  | { kind: "return-swap"; manualAmountUi: string | null }
  | { kind: "delay"; ms: number };

/** Legacy-parity randomizer (port of boostRandom in useSwapExecution.ts). */
export function randomAmount(min: number, max: number, rng: () => number): string {
  const minVal = Math.max(0, min);
  const maxVal = Math.max(minVal + Number.EPSILON, max || minVal);
  const v = rng() * (maxVal - minVal) + minVal;
  return String(Number(v.toFixed(12)));
}

export function totalRounds(config: SessionConfig): number {
  switch (config.mode) {
    case "normal":
      return 1;
    case "boost":
      return config.numberOfRounds === 0 ? Infinity : config.numberOfRounds;
    case "rewards":
      return config.numberOfSwaps === 0 ? Infinity : config.numberOfSwaps;
  }
}

export function hasNextRound(completedRounds: number, config: SessionConfig): boolean {
  return completedRounds < totalRounds(config);
}

export function planRound(
  config: SessionConfig,
  roundIndex: number,
  rng: () => number
): SessionStep[] {
  const steps: SessionStep[] = [];
  switch (config.mode) {
    case "normal":
      steps.push({ kind: "swap", amountUi: config.amount, swapInRound: 1, swapsInRound: 1 });
      return steps; // no return swap, no delays
    case "boost": {
      const swapsInRound = Math.max(1, config.swapsPerRound);
      for (let i = 1; i <= swapsInRound; i++) {
        steps.push({
          kind: "swap",
          amountUi: randomAmount(Number(config.amount), Number(config.maxAmount), rng),
          swapInRound: i,
          swapsInRound,
        });
        if (i < swapsInRound) steps.push({ kind: "delay", ms: config.swapDelayMs });
      }
      steps.push({ kind: "return-swap", manualAmountUi: config.loopReturnAmount || null });
      break;
    }
    case "rewards":
      steps.push({ kind: "swap", amountUi: config.amount, swapInRound: 1, swapsInRound: 1 });
      steps.push({ kind: "delay", ms: config.swapDelayMs });
      steps.push({ kind: "return-swap", manualAmountUi: null });
      break;
  }
  if (hasNextRound(roundIndex, config)) {
    steps.push({ kind: "delay", ms: config.autoDelayMs });
  }
  return steps;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/swap/sessionPlanner.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Full gates and commit**

```bash
npm run build && npx vitest run
git add lib/swap/sessionPlanner.ts tests/swap/sessionPlanner.test.ts
git commit -m "feat: add pure swap session planner with truth-table tests"
```

### Task 5: `lib/swap/orders.ts` — Jupiter order-and-execute builders + Zod boundary validation

The app uses Jupiter's **Swap API v2 order-and-execute flow**
(https://developers.jup.ag/docs/swap/order-and-execute), NOT the legacy
`/quote` + `/swap` flow: `GET https://api.jup.ag/swap/v2/order` returns the
quote AND an assembled unsigned transaction plus a `requestId`; after signing,
`POST https://api.jup.ag/swap/v2/execute` hands the signed transaction to
Jupiter, which lands it (managed slippage/priority fees/sending/confirmation)
and returns `status`/`signature`. Both endpoints REQUIRE the `x-api-key`
header. Fee routing rides on the order request via `referralAccount` +
`referralFee` (Jupiter accepts 50–255 bps). An order WITHOUT `taker` is
price-only (`transaction: null`) — used for USD estimates and API-key
validation.

**Files:**
- Create: `lib/swap/orders.ts`
- Test: `tests/swap/orders.test.ts`

**Interfaces:**
- Consumes: `zod` (v4)
- Produces (used by Task 9 engine and Task 6 validation helpers):
  - `JUP_ORDER`, `JUP_EXECUTE`, `SOL_MINT`, `USDC_MINT` string constants
  - `interface OrderParams { inputMint: string; outputMint: string; amountRaw: string; taker?: string; referralAccount?: string; referralFee?: number; slippageBps?: number }`
  - `buildOrderUrl(p: OrderParams): string`
  - `jupiterHeaders(apiKey: string, json?: boolean): HeadersInit`
  - `jupiterErrorMessage(status: number): string`
  - `clampReferralFeeBps(bps: number): number` — clamps into Jupiter's 50–255 range
  - `parseOrder(json: unknown): JupiterOrder` (throws ZodError on bad shape); `type JupiterOrder` with at least `requestId: string; transaction: string | null; outAmount: string; errorCode?: number | string; errorMessage?: string`
  - `buildExecuteBody(signedTransactionB64: string, requestId: string): string`
  - `parseExecuteResponse(json: unknown): JupiterExecuteResult` — `{ status: "Success" | "Failed"; signature?: string; code?: number; totalInputAmount?: string; totalOutputAmount?: string }`
  - `bytesToBase64(bytes: Uint8Array): string` — encodes the signed transaction for `/execute`

- [ ] **Step 1: Write the failing tests**

Create `tests/swap/orders.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  buildOrderUrl,
  buildExecuteBody,
  jupiterHeaders,
  jupiterErrorMessage,
  clampReferralFeeBps,
  parseOrder,
  parseExecuteResponse,
  bytesToBase64,
  JUP_ORDER,
  SOL_MINT,
  USDC_MINT,
} from "@/lib/swap/orders";

const orderFixture = {
  requestId: "req-123",
  transaction: "AQIDBA==",
  inAmount: "10000000",
  outAmount: "1500000",
  mode: "manual",
  router: "metis",
  swapType: "aggregator",
};

describe("buildOrderUrl", () => {
  it("encodes required params on the order endpoint", () => {
    const url = new URL(
      buildOrderUrl({ inputMint: SOL_MINT, outputMint: USDC_MINT, amountRaw: "12345" })
    );
    expect(url.origin + url.pathname).toBe(JUP_ORDER);
    expect(url.searchParams.get("inputMint")).toBe(SOL_MINT);
    expect(url.searchParams.get("outputMint")).toBe(USDC_MINT);
    expect(url.searchParams.get("amount")).toBe("12345");
    // price-only order: no taker, no fee params
    expect(url.searchParams.get("taker")).toBeNull();
    expect(url.searchParams.get("referralAccount")).toBeNull();
  });
  it("includes taker, referral and slippage params when provided", () => {
    const url = new URL(
      buildOrderUrl({
        inputMint: USDC_MINT,
        outputMint: SOL_MINT,
        amountRaw: "1000",
        taker: "Wallet1111111111111111111111111111111111111",
        referralAccount: "Vault111111111111111111111111111111111111111",
        referralFee: 100,
        slippageBps: 50,
      })
    );
    expect(url.searchParams.get("taker")).toBe("Wallet1111111111111111111111111111111111111");
    expect(url.searchParams.get("referralAccount")).toBe("Vault111111111111111111111111111111111111111");
    expect(url.searchParams.get("referralFee")).toBe("100");
    expect(url.searchParams.get("slippageBps")).toBe("50");
  });
});

describe("clampReferralFeeBps", () => {
  it("clamps into Jupiter's 50-255 range", () => {
    expect(clampReferralFeeBps(100)).toBe(100);
    expect(clampReferralFeeBps(10)).toBe(50);
    expect(clampReferralFeeBps(0)).toBe(50);
    expect(clampReferralFeeBps(9999)).toBe(255);
  });
});

describe("jupiterHeaders", () => {
  it("sets x-api-key when provided", () => {
    expect(jupiterHeaders("secret")).toEqual({ "x-api-key": "secret" });
    expect(jupiterHeaders("")).toEqual({});
  });
  it("adds content-type for JSON requests", () => {
    expect(jupiterHeaders("secret", true)).toEqual({
      "x-api-key": "secret",
      "content-type": "application/json",
    });
  });
});

describe("jupiterErrorMessage", () => {
  it("maps known statuses", () => {
    expect(jupiterErrorMessage(429)).toMatch(/rate limit/i);
    expect(jupiterErrorMessage(401)).toMatch(/api key/i);
    expect(jupiterErrorMessage(403)).toMatch(/api key/i);
    expect(jupiterErrorMessage(500)).toMatch(/500/);
  });
});

describe("parseOrder", () => {
  it("accepts a valid order and keeps unknown fields", () => {
    const o = parseOrder(orderFixture);
    expect(o.requestId).toBe("req-123");
    expect(o.transaction).toBe("AQIDBA==");
    expect(o.outAmount).toBe("1500000");
    expect((o as any).swapType).toBe("aggregator"); // loose passthrough
  });
  it("accepts a price-only order (transaction null) and a failed build (empty string)", () => {
    expect(parseOrder({ ...orderFixture, transaction: null }).transaction).toBeNull();
    const failed = parseOrder({
      ...orderFixture,
      transaction: "",
      errorCode: 1001,
      errorMessage: "no route",
    });
    expect(failed.transaction).toBe("");
    expect(failed.errorCode).toBe(1001);
  });
  it("rejects a response missing requestId or outAmount", () => {
    const { requestId: _r, ...noId } = orderFixture;
    expect(() => parseOrder(noId)).toThrow();
    const { outAmount: _o, ...noOut } = orderFixture;
    expect(() => parseOrder(noOut)).toThrow();
  });
  it("rejects non-object input", () => {
    expect(() => parseOrder("<html>rate limited</html>")).toThrow();
  });
});

describe("buildExecuteBody / parseExecuteResponse", () => {
  it("builds the execute body", () => {
    expect(JSON.parse(buildExecuteBody("c2lnbmVk", "req-123"))).toEqual({
      signedTransaction: "c2lnbmVk",
      requestId: "req-123",
    });
  });
  it("parses success and failure results", () => {
    const ok = parseExecuteResponse({
      status: "Success",
      signature: "5sig",
      code: 0,
      totalInputAmount: "1000",
      totalOutputAmount: "990",
    });
    expect(ok.status).toBe("Success");
    expect(ok.signature).toBe("5sig");
    const fail = parseExecuteResponse({ status: "Failed", code: -1, signature: "5sig" });
    expect(fail.status).toBe("Failed");
    expect(fail.code).toBe(-1);
  });
  it("rejects an unknown status", () => {
    expect(() => parseExecuteResponse({ status: "Maybe" })).toThrow();
  });
});

describe("bytesToBase64", () => {
  it("round-trips bytes to base64", () => {
    expect(bytesToBase64(new Uint8Array([1, 2, 3, 4]))).toBe("AQIDBA==");
    expect(bytesToBase64(new Uint8Array([]))).toBe("");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/swap/orders.test.ts`
Expected: FAIL — `Cannot find module '@/lib/swap/orders'`.

- [ ] **Step 3: Implement `lib/swap/orders.ts`**

```ts
/**
 * Jupiter Swap API v2 order-and-execute: request builders and boundary
 * validation (Zod v4). Pure module — no fetch here; the engine and settings
 * validation own all I/O.
 *
 * Flow (https://developers.jup.ag/docs/swap/order-and-execute):
 *   GET /order   → quote + assembled unsigned tx + requestId (x-api-key required)
 *   POST /execute → Jupiter lands the signed tx and confirms it
 */
import { z } from "zod";

export const JUP_ORDER = "https://api.jup.ag/swap/v2/order";
export const JUP_EXECUTE = "https://api.jup.ag/swap/v2/execute";
export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export interface OrderParams {
  inputMint: string;
  outputMint: string;
  /** Raw integer amount in base units, as string */
  amountRaw: string;
  /** Signer wallet. Omit for a price-only order (transaction will be null). */
  taker?: string;
  /** Fee collection account (affiliate vault or referral address). */
  referralAccount?: string;
  /** Fee in bps — Jupiter accepts 50–255; pass through clampReferralFeeBps. */
  referralFee?: number;
  /** Custom slippage (switches the order to "manual" mode). */
  slippageBps?: number;
}

export function buildOrderUrl(p: OrderParams): string {
  const url = new URL(JUP_ORDER);
  url.searchParams.set("inputMint", p.inputMint);
  url.searchParams.set("outputMint", p.outputMint);
  url.searchParams.set("amount", p.amountRaw);
  if (p.taker) url.searchParams.set("taker", p.taker);
  if (p.referralAccount) {
    url.searchParams.set("referralAccount", p.referralAccount);
    if (p.referralFee !== undefined) {
      url.searchParams.set("referralFee", String(p.referralFee));
    }
  }
  if (p.slippageBps !== undefined) {
    url.searchParams.set("slippageBps", String(p.slippageBps));
  }
  return url.toString();
}

/** Jupiter accepts referral fees of 50–255 bps on /order. */
export function clampReferralFeeBps(bps: number): number {
  return Math.min(255, Math.max(50, Math.round(bps)));
}

export function jupiterHeaders(apiKey: string, json = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (apiKey) headers["x-api-key"] = apiKey;
  if (json) headers["content-type"] = "application/json";
  return headers;
}

export function jupiterErrorMessage(status: number): string {
  if (status === 429) {
    return "Jupiter rate limit exceeded. Add or upgrade your API key at portal.jup.ag.";
  }
  if (status === 401 || status === 403) {
    return "Jupiter API key rejected. Check the key in Settings.";
  }
  return `Jupiter request failed (${status}).`;
}

const OrderSchema = z.looseObject({
  requestId: z.string(),
  /** null = price-only (no taker); "" = router could not build a tx */
  transaction: z.string().nullable(),
  inAmount: z.string().optional(),
  outAmount: z.string(),
  mode: z.string().optional(),
  router: z.string().optional(),
  errorCode: z.union([z.number(), z.string()]).optional(),
  errorMessage: z.string().optional(),
});
export type JupiterOrder = z.infer<typeof OrderSchema>;

export function parseOrder(json: unknown): JupiterOrder {
  return OrderSchema.parse(json);
}

export function buildExecuteBody(signedTransactionB64: string, requestId: string): string {
  return JSON.stringify({ signedTransaction: signedTransactionB64, requestId });
}

const ExecuteResponseSchema = z.looseObject({
  status: z.enum(["Success", "Failed"]),
  signature: z.string().optional(),
  code: z.number().optional(),
  error: z.string().optional(),
  totalInputAmount: z.string().optional(),
  totalOutputAmount: z.string().optional(),
});
export type JupiterExecuteResult = z.infer<typeof ExecuteResponseSchema>;

export function parseExecuteResponse(json: unknown): JupiterExecuteResult {
  return ExecuteResponseSchema.parse(json);
}

/** Base64-encode a signed transaction for /execute (btoa is available in
 *  browsers and Node 18+; chunked to stay under argument limits). */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/swap/orders.test.ts`
Expected: PASS.

- [ ] **Step 5: Full gates and commit**

```bash
npm run build && npx vitest run
git add lib/swap/orders.ts tests/swap/orders.test.ts
git commit -m "feat: add Jupiter v2 order-and-execute builders with zod boundary validation"
```

---

# Phase 3 — Settings & contexts (created, not yet wired into the app)

Nothing in this phase is imported by `app/` yet, so the running app is unchanged. Files must compile (`next build` type-checks the whole project).

### Task 6: Settings storage, validation helpers and `SettingsContext`

**Files:**
- Create: `lib/settings/storage.ts`, `lib/settings/validation.ts`, `contexts/SettingsContext.tsx`
- Test: `tests/settings/storage.test.ts`

**Interfaces:**
- Consumes: `buildOrderUrl`, `jupiterHeaders`, `jupiterErrorMessage`, `SOL_MINT`, `USDC_MINT` from `lib/swap/orders.ts` (Task 5); `DEFAULT_RPC` from `lib/vaults.ts`
- Produces (used by Tasks 7–16):
  - `type ThemeSetting = "dark" | "light" | "system"`
  - `interface StoredSettings { rpc: string; jupiterApiKey: string; rpcVerified: boolean; apiKeyVerified: boolean; theme: ThemeSetting; slippageBps: number; platformFeeBps: number; affiliate: "pond0x" | "aquavaults" }`
  - `parseStoredSettings(raw: string | null): StoredSettings`, `serializeSettings(s: StoredSettings): string`, `DEFAULT_SETTINGS`, `SETTINGS_STORAGE_KEY`
  - `testRpcEndpoint(url: string): Promise<RpcTestResult>` with `interface RpcTestResult { ok: boolean; slot?: number; latencyMs?: number; error?: string }`
  - `testJupiterApiKey(key: string): Promise<KeyTestResult>` with `interface KeyTestResult { ok: boolean; error?: string }`
  - `SettingsProvider`, `useSettings(): { settings: StoredSettings; update(patch: Partial<StoredSettings>): void; settingsReady: boolean; setupOpen: boolean; setSetupOpen(open: boolean): void }`
  - `settingsReady` = `rpc && jupiterApiKey && rpcVerified && apiKeyVerified` (wallet connectedness is checked separately at usage sites via `useWallet()`)

- [ ] **Step 1: Write the failing storage tests**

Create `tests/settings/storage.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  parseStoredSettings,
  serializeSettings,
  DEFAULT_SETTINGS,
} from "@/lib/settings/storage";

describe("parseStoredSettings", () => {
  it("returns defaults for null / invalid JSON / wrong shape", () => {
    expect(parseStoredSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseStoredSettings("not json{")).toEqual(DEFAULT_SETTINGS);
    expect(parseStoredSettings(JSON.stringify({ rpc: 42 }))).toEqual(DEFAULT_SETTINGS);
  });
  it("round-trips a valid settings object", () => {
    const s = {
      ...DEFAULT_SETTINGS,
      rpc: "https://mainnet.helius-rpc.com/?api-key=x",
      jupiterApiKey: "jup-key",
      rpcVerified: true,
      apiKeyVerified: true,
      theme: "light" as const,
      slippageBps: 75,
      affiliate: "aquavaults" as const,
    };
    expect(parseStoredSettings(serializeSettings(s))).toEqual(s);
  });
  it("rejects out-of-range bps by falling back to defaults", () => {
    const bad = { ...DEFAULT_SETTINGS, slippageBps: 99999 };
    expect(parseStoredSettings(JSON.stringify(bad))).toEqual(DEFAULT_SETTINGS);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/settings/storage.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/settings/storage.ts`**

```ts
/** Pure localStorage codec for app settings — safe against corrupt data. */
import { z } from "zod";

export const SETTINGS_STORAGE_KEY = "pond0matic:settings";

const SettingsSchema = z.object({
  rpc: z.string(),
  jupiterApiKey: z.string(),
  rpcVerified: z.boolean(),
  apiKeyVerified: z.boolean(),
  theme: z.enum(["dark", "light", "system"]),
  slippageBps: z.number().int().min(0).max(10000),
  platformFeeBps: z.number().int().min(0).max(10000),
  affiliate: z.enum(["pond0x", "aquavaults"]),
});
export type StoredSettings = z.infer<typeof SettingsSchema>;
export type ThemeSetting = StoredSettings["theme"];

export const DEFAULT_SETTINGS: StoredSettings = {
  rpc: "",
  jupiterApiKey: "",
  rpcVerified: false,
  apiKeyVerified: false,
  theme: "system",
  slippageBps: Number(process.env.NEXT_PUBLIC_DEFAULT_SLIPPAGE_BPS) || 50,
  platformFeeBps: Number(process.env.NEXT_PUBLIC_DEFAULT_PLATFORM_FEE_BPS) || 100,
  affiliate: "pond0x",
};

export function parseStoredSettings(raw: string | null): StoredSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const result = SettingsSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function serializeSettings(s: StoredSettings): string {
  return JSON.stringify(s);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/settings/storage.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `lib/settings/validation.ts`**

```ts
/** Connection health checks used by the setup modal and /settings page. */
import { Connection } from "@solana/web3.js";
import {
  buildOrderUrl,
  jupiterHeaders,
  jupiterErrorMessage,
  SOL_MINT,
  USDC_MINT,
} from "@/lib/swap/orders";

export interface RpcTestResult {
  ok: boolean;
  slot?: number;
  latencyMs?: number;
  error?: string;
}

export async function testRpcEndpoint(url: string): Promise<RpcTestResult> {
  if (!/^https:\/\/.+/.test(url.trim())) {
    return { ok: false, error: "Enter a valid https:// RPC URL" };
  }
  const started = Date.now();
  try {
    const connection = new Connection(url.trim(), { commitment: "confirmed" });
    const slot = await connection.getSlot();
    return { ok: true, slot, latencyMs: Date.now() - started };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `RPC unreachable: ${msg.slice(0, 120)}` };
  }
}

export interface KeyTestResult {
  ok: boolean;
  error?: string;
}

/** Validates a Jupiter API key with a price-only /order call (no taker). */
export async function testJupiterApiKey(key: string): Promise<KeyTestResult> {
  if (!key.trim()) return { ok: false, error: "Enter your Jupiter API key" };
  try {
    const url = buildOrderUrl({
      inputMint: SOL_MINT,
      outputMint: USDC_MINT,
      amountRaw: "1000000",
    });
    const res = await fetch(url, { headers: jupiterHeaders(key.trim()) });
    if (res.ok) return { ok: true };
    return { ok: false, error: jupiterErrorMessage(res.status) };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Jupiter unreachable: ${msg.slice(0, 120)}` };
  }
}
```

- [ ] **Step 6: Implement `contexts/SettingsContext.tsx`**

```tsx
"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  parseStoredSettings,
  serializeSettings,
  type StoredSettings,
} from "@/lib/settings/storage";

interface SettingsContextValue {
  settings: StoredSettings;
  update: (patch: Partial<StoredSettings>) => void;
  /** RPC + API key present and verified. Combine with useWallet().connected for the full gate. */
  settingsReady: boolean;
  setupOpen: boolean;
  setSetupOpen: (open: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoredSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    setSettings(parseStoredSettings(localStorage.getItem(SETTINGS_STORAGE_KEY)));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(SETTINGS_STORAGE_KEY, serializeSettings(settings));
  }, [settings, hydrated]);

  // Apply theme to <html> (the layout's inline script handles first paint)
  useEffect(() => {
    const dark =
      settings.theme === "dark" ||
      (settings.theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }, [settings.theme]);

  const value = useMemo<SettingsContextValue>(() => {
    const update = (patch: Partial<StoredSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        // Editing RPC or key invalidates its verification unless explicitly set
        if (patch.rpc !== undefined && patch.rpcVerified === undefined) next.rpcVerified = false;
        if (patch.jupiterApiKey !== undefined && patch.apiKeyVerified === undefined)
          next.apiKeyVerified = false;
        return next;
      });
    };
    const settingsReady = Boolean(
      settings.rpc && settings.jupiterApiKey && settings.rpcVerified && settings.apiKeyVerified
    );
    return { settings, update, settingsReady, setupOpen, setSetupOpen };
  }, [settings, setupOpen]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
```

- [ ] **Step 7: Full gates and commit**

```bash
npm run build && npx vitest run
git add lib/settings tests/settings contexts/SettingsContext.tsx
git commit -m "feat: settings storage codec, connection validators and SettingsContext"
```

### Task 7: `SwapConfigContext` and `SessionContext`

**Files:**
- Create: `contexts/SwapConfigContext.tsx`, `contexts/SessionContext.tsx`

**Interfaces:**
- Consumes: `useSettings` (Task 6) for `affiliate`; `TOKEN_VAULTS_AFFILIATE_1`, `TOKEN_VAULTS_AFFILIATE_2` from `lib/vaults.ts`; `SwapMode` from `types/swapModes.ts`
- Produces (used by Tasks 9, 13, 15):
  - `useSwapConfig(): SwapConfigValue` — see full shape in the code below; notable: `currentVault: string | null` computed from affiliate + fromMint
  - `useSession(): SessionValue` — `{ running, paused, stopping, currentSwapIndex, currentRound, setRunning, setPaused, setStopping, setCurrentSwapIndex, setCurrentRound, runRef, pauseRef }` (the two `MutableRefObject<boolean>` refs are the engine's shared run/pause flags)

- [ ] **Step 1: Implement `contexts/SwapConfigContext.tsx`**

```tsx
"use client";
import React, { createContext, useContext, useMemo, useState } from "react";
import type { SwapMode } from "@/types/swapModes";
import { TOKEN_VAULTS_AFFILIATE_1, TOKEN_VAULTS_AFFILIATE_2 } from "@/lib/vaults";
import { useSettings } from "@/contexts/SettingsContext";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const WPOND_MINT = "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq";

interface SwapConfigValue {
  fromMint: string;
  toMint: string;
  setFromMint: (m: string) => void;
  setToMint: (m: string) => void;
  flipMints: () => void;
  amount: string;
  setAmount: (v: string) => void;
  maxAmount: string;
  setMaxAmount: (v: string) => void;
  loopReturnAmount: string;
  setLoopReturnAmount: (v: string) => void;
  swapMode: SwapMode;
  setSwapMode: (m: SwapMode) => void;
  referralLink: string;
  setReferralLink: (v: string) => void;
  swapsPerRound: number;
  setSwapsPerRound: (n: number) => void;
  numberOfRounds: number;
  setNumberOfRounds: (n: number) => void;
  numberOfSwaps: number;
  setNumberOfSwaps: (n: number) => void;
  swapDelayMs: number;
  setSwapDelayMs: (n: number) => void;
  autoDelayMs: number;
  setAutoDelayMs: (n: number) => void;
  /** Fee vault for the current fromMint under the active affiliate, or null. */
  currentVault: string | null;
  /** Vault map for the active affiliate (needed for return swaps on toMint). */
  vaultMap: Record<string, string>;
}

const SwapConfigContext = createContext<SwapConfigValue | undefined>(undefined);

export function SwapConfigProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [fromMint, setFromMint] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_FROM_MINT || SOL_MINT
  );
  const [toMint, setToMint] = useState(process.env.NEXT_PUBLIC_DEFAULT_TO_MINT || WPOND_MINT);
  const [amount, setAmount] = useState(process.env.NEXT_PUBLIC_DEFAULT_MIN_AMOUNT || "0.01");
  const [maxAmount, setMaxAmount] = useState(process.env.NEXT_PUBLIC_DEFAULT_MAX_AMOUNT || "0.02");
  const [loopReturnAmount, setLoopReturnAmount] = useState("");
  const [swapMode, setSwapMode] = useState<SwapMode>("boost");
  const [referralLink, setReferralLink] = useState("");
  const [swapsPerRound, setSwapsPerRound] = useState(
    Number(process.env.NEXT_PUBLIC_DEFAULT_SWAPS_PER_ROUND) || 18
  );
  const [numberOfRounds, setNumberOfRounds] = useState(
    Number(process.env.NEXT_PUBLIC_DEFAULT_ROUNDS) || 3
  );
  const [numberOfSwaps, setNumberOfSwaps] = useState(
    Number(process.env.NEXT_PUBLIC_DEFAULT_REWARDS_SWAPS) || 5
  );
  const [swapDelayMs, setSwapDelayMs] = useState(
    Number(process.env.NEXT_PUBLIC_DEFAULT_SWAP_DELAY_MS) || 6000
  );
  const [autoDelayMs, setAutoDelayMs] = useState(3000);

  const vaultMap = useMemo(
    () => (settings.affiliate === "pond0x" ? TOKEN_VAULTS_AFFILIATE_1 : TOKEN_VAULTS_AFFILIATE_2),
    [settings.affiliate]
  );
  const currentVault = vaultMap[fromMint] ?? null;

  const value = useMemo<SwapConfigValue>(
    () => ({
      fromMint, toMint, setFromMint, setToMint,
      flipMints: () => { setFromMint(toMint); setToMint(fromMint); },
      amount, setAmount, maxAmount, setMaxAmount,
      loopReturnAmount, setLoopReturnAmount,
      swapMode, setSwapMode, referralLink, setReferralLink,
      swapsPerRound, setSwapsPerRound, numberOfRounds, setNumberOfRounds,
      numberOfSwaps, setNumberOfSwaps, swapDelayMs, setSwapDelayMs,
      autoDelayMs, setAutoDelayMs, currentVault, vaultMap,
    }),
    [fromMint, toMint, amount, maxAmount, loopReturnAmount, swapMode, referralLink,
     swapsPerRound, numberOfRounds, numberOfSwaps, swapDelayMs, autoDelayMs,
     currentVault, vaultMap]
  );

  return <SwapConfigContext.Provider value={value}>{children}</SwapConfigContext.Provider>;
}

export function useSwapConfig(): SwapConfigValue {
  const ctx = useContext(SwapConfigContext);
  if (!ctx) throw new Error("useSwapConfig must be used within SwapConfigProvider");
  return ctx;
}
```

- [ ] **Step 2: Implement `contexts/SessionContext.tsx`**

```tsx
"use client";
import React, { createContext, useContext, useMemo, useRef, useState } from "react";

interface SessionValue {
  running: boolean;
  paused: boolean;
  stopping: boolean;
  currentSwapIndex: number;
  currentRound: number;
  setRunning: (v: boolean) => void;
  setPaused: (v: boolean) => void;
  setStopping: (v: boolean) => void;
  setCurrentSwapIndex: (n: number) => void;
  setCurrentRound: (n: number) => void;
  /**
   * Shared run/pause flags for the engine. They live here (not inside
   * useSwapEngine) so every engine instance — the desktop SwapPanel and the
   * mobile sheet mount their own — controls the SAME session.
   */
  runRef: React.MutableRefObject<boolean>;
  pauseRef: React.MutableRefObject<boolean>;
}

const SessionContext = createContext<SessionValue | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [currentSwapIndex, setCurrentSwapIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const runRef = useRef(false);
  const pauseRef = useRef(false);

  const value = useMemo(
    () => ({ running, paused, stopping, currentSwapIndex, currentRound,
             setRunning, setPaused, setStopping, setCurrentSwapIndex, setCurrentRound,
             runRef, pauseRef }),
    [running, paused, stopping, currentSwapIndex, currentRound]
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
```

- [ ] **Step 3: Full gates and commit**

```bash
npm run build && npx vitest run
git add contexts/SwapConfigContext.tsx contexts/SessionContext.tsx
git commit -m "feat: add SwapConfigContext and SessionContext"
```

### Task 8: `ActivityContext` and `RigContext`

**Files:**
- Create: `contexts/ActivityContext.tsx`, `contexts/RigContext.tsx`

**Interfaces:**
- Consumes: `useActivityLog` from `hooks/useActivityLog.ts` (`{ activities: string[]; log(msg): void; clear(): void }`); `useMiningRig(wallet: string, onLog?)` from `hooks/useMiningRig.ts`; `useWallet` from `@solana/wallet-adapter-react`
- Produces (used by Tasks 9, 13, 15):
  - `useActivity(): { activities: string[]; log: (msg: string) => void; clear: () => void }`
  - `useRig(): ReturnType<typeof useMiningRig>` — the full rig stats object (rigHealth, totalBoosts, priority, isPro, badges, sent, failed, inMempool, maxClaimEstimateUsd, incrementBoosts, fetchRigData, isLoading, …)
- Provider nesting requirement (Task 16 wiring): `ActivityProvider` must wrap `RigProvider` (rig logs into the activity feed).

- [ ] **Step 1: Implement `contexts/ActivityContext.tsx`**

```tsx
"use client";
import React, { createContext, useContext } from "react";
import { useActivityLog } from "@/hooks/useActivityLog";

type ActivityValue = ReturnType<typeof useActivityLog>;

const ActivityContext = createContext<ActivityValue | undefined>(undefined);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const value = useActivityLog();
  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity(): ActivityValue {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error("useActivity must be used within ActivityProvider");
  return ctx;
}
```

- [ ] **Step 2: Implement `contexts/RigContext.tsx`**

```tsx
"use client";
import React, { createContext, useContext } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMiningRig } from "@/hooks/useMiningRig";
import { useActivity } from "@/contexts/ActivityContext";

type RigValue = ReturnType<typeof useMiningRig>;

const RigContext = createContext<RigValue | undefined>(undefined);

export function RigProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet();
  const { log } = useActivity();
  const value = useMiningRig(publicKey?.toBase58() ?? "", log);
  return <RigContext.Provider value={value}>{children}</RigContext.Provider>;
}

export function useRig(): RigValue {
  const ctx = useContext(RigContext);
  if (!ctx) throw new Error("useRig must be used within RigProvider");
  return ctx;
}
```

- [ ] **Step 3: Full gates and commit**

```bash
npm run build && npx vitest run
git add contexts/ActivityContext.tsx contexts/RigContext.tsx
git commit -m "feat: add ActivityContext and RigContext wrapping existing data hooks"
```

---

# Phase 4 — The swap engine

### Task 9: `hooks/useSwapEngine.ts` — orchestrator replacing `useSwapExecution`

This is the money path. It ports `jupExecute`/`swapOnce`/mode loops from `hooks/useSwapExecution.ts` onto: wallet-adapter (no `getPhantomProvider`), the pure planner (Task 4), Jupiter's v2 **order-and-execute** flow with zod-validated responses (Task 5), sonner toasts, and the new contexts. Key flow change vs legacy: the engine no longer sends or confirms transactions itself — `/order` returns an assembled unsigned transaction, the wallet signs it, and `/execute` hands it to Jupiter which lands and confirms it. `validateSwapTransaction` still gates signing. Read `hooks/useSwapExecution.ts` side by side while implementing — sequencing, validation gates and event dispatches have legacy counterparts. No confetti (removed feature).

**Files:**
- Create: `hooks/useSwapEngine.ts`

**Interfaces:**
- Consumes: `useSettings`, `useSwapConfig`, `useSession`, `useActivity`, `useRig` (Tasks 6–8); `planRound`, `hasNextRound`, `totalRounds`, type `SessionConfig` (Task 4); `buildOrderUrl`, `buildExecuteBody`, `jupiterHeaders`, `jupiterErrorMessage`, `parseOrder`, `parseExecuteResponse`, `clampReferralFeeBps`, `bytesToBase64`, `JUP_EXECUTE`, `USDC_MINT` (Task 5); UNCHANGED existing modules: `validateSwapTransaction(tx, pk)`, `validateSwapAmount(uiAmountStr, currentBalance, tokenSymbol)` from `lib/transactionValidation`; `extractReferralCode`, `getFeeRoutingDescription` from `lib/referral` (`buildJupiterSwapRequest` is NOT used — fee routing now rides on the order params); `fetchTokenBalance(wallet, mint, rpc)` from `lib/tokenBalance`; `b64ToUint8Array`, `getMintDecimals` from `lib/solana`; `short`, `solscanTx` from `lib/utils`; `dispatchSwapEvent`, `makeInternalSwapId` from `lib/portfolio/swapEventBus`; `TOKEN_NAMES` from `lib/vaults`; `useBalances` from `hooks/useBalances`; `useWallet` from `@solana/wallet-adapter-react`; `toast` from `sonner`
- Produces (used by Task 13 SwapPanel): `useSwapEngine(): { startSession(): Promise<void>; stopSession(): void; pauseSession(): void; resumeSession(): void; getUsdValue(mint: string, uiAmountStr: string): Promise<number> }`

- [ ] **Step 1: Implement `hooks/useSwapEngine.ts`**

```tsx
"use client";
/**
 * Swap session orchestrator. Owns every side effect on the swap path:
 * orders, transaction validation, signing, execution via Jupiter, balances,
 * event dispatch and progress state. All sequencing decisions come from the
 * pure planner in lib/swap/sessionPlanner.
 *
 * Uses Jupiter Swap API v2 order-and-execute: /order builds the transaction,
 * the wallet signs it, /execute lets Jupiter land and confirm it. The client
 * never submits to the network itself.
 *
 * Behavior parity target: hooks/useSwapExecution.ts (legacy engine).
 */
import { useCallback } from "react";
import { VersionedTransaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { useSwapConfig } from "@/contexts/SwapConfigContext";
import { useSession } from "@/contexts/SessionContext";
import { useActivity } from "@/contexts/ActivityContext";
import { useRig } from "@/contexts/RigContext";
import { useBalances } from "@/hooks/useBalances";
import {
  planRound,
  hasNextRound,
  totalRounds,
  type SessionConfig,
  type SessionStep,
} from "@/lib/swap/sessionPlanner";
import {
  buildOrderUrl,
  buildExecuteBody,
  jupiterHeaders,
  jupiterErrorMessage,
  parseOrder,
  parseExecuteResponse,
  clampReferralFeeBps,
  bytesToBase64,
  JUP_EXECUTE,
  USDC_MINT,
} from "@/lib/swap/orders";
import { validateSwapTransaction, validateSwapAmount } from "@/lib/transactionValidation";
import { extractReferralCode, getFeeRoutingDescription } from "@/lib/referral";
import { fetchTokenBalance, SOL_MINT } from "@/lib/tokenBalance";
import { b64ToUint8Array, getMintDecimals } from "@/lib/solana";
import { short, solscanTx } from "@/lib/utils";
import { dispatchSwapEvent, makeInternalSwapId } from "@/lib/portfolio/swapEventBus";
import { TOKEN_NAMES } from "@/lib/vaults";
import type { SwapMode } from "@/types/swapModes";

const VERY_SMALL_AMOUNT_THRESHOLD = 1000; // base units (legacy parity)
const MIN_DECIMALS_FOR_WARNING = 6;

function symbolFor(mint: string): string {
  return TOKEN_NAMES[mint] || mint.slice(0, 4);
}

export function useSwapEngine() {
  const { settings } = useSettings();
  const config = useSwapConfig();
  const session = useSession();
  const { log } = useActivity();
  const { incrementBoosts } = useRig();
  const { publicKey, signTransaction } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? "";
  const { solBalance, tokenBalance } = useBalances(walletAddress, settings.rpc, config.fromMint);

  // Shared across all engine instances (desktop panel + mobile sheet) so a
  // session started in one place can be stopped/paused from the other.
  const { runRef, pauseRef } = session;

  /** Interruptible sleep — wakes early when the session is stopped. */
  const sleep = useCallback(async (ms: number) => {
    const end = Date.now() + ms;
    while (runRef.current && Date.now() < end) {
      await new Promise((r) => setTimeout(r, Math.min(100, end - Date.now())));
    }
  }, []);

  const waitWhilePaused = useCallback(async () => {
    while (pauseRef.current && runRef.current) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }, []);

  /** USD value via a price-only /order to USDC (no taker → transaction null). */
  const getUsdValue = useCallback(
    async (mint: string, uiAmountStr: string): Promise<number> => {
      try {
        if (mint === USDC_MINT) return Number(uiAmountStr) || 0;
        const decimals = await getMintDecimals(mint);
        const raw = Math.floor((Number(uiAmountStr) || 0) * Math.pow(10, decimals));
        if (raw <= 0) return 0;
        const res = await fetch(
          buildOrderUrl({ inputMint: mint, outputMint: USDC_MINT, amountRaw: String(raw) }),
          { headers: jupiterHeaders(settings.jupiterApiKey) }
        );
        if (!res.ok) return 0;
        const order = parseOrder(await res.json());
        return Number(order.outAmount || 0) / 1_000_000;
      } catch {
        return 0;
      }
    },
    [settings.jupiterApiKey]
  );

  /**
   * One swap: quote → build → validate → sign → send → confirm.
   * Port of the legacy jupExecute. Errors are logged and swallowed so a
   * session continues after an individual failed swap (legacy parity).
   */
  const executeSwap = useCallback(
    async (
      pairFrom: string,
      pairTo: string,
      uiAmountStr: string,
      referralAddress: string | undefined,
      mode: SwapMode
    ): Promise<void> => {
      const internalId = makeInternalSwapId();
      let dispatchedStart = false;
      if (!publicKey) {
        log("Connect wallet first.");
        return;
      }
      const tokenSymbol = symbolFor(pairFrom);

      // Amount sanity check against live balance — only for the configured
      // fromMint (return swaps use freshly fetched balances).
      const isOriginalFromToken = pairFrom === config.fromMint;
      const currentBalance = pairFrom === SOL_MINT ? solBalance : tokenBalance;
      if (currentBalance > 0 && isOriginalFromToken) {
        const check = validateSwapAmount(uiAmountStr, currentBalance, tokenSymbol);
        if (!check.isValid) {
          log(`❌ ${check.error}`);
          toast.error(check.error || "Invalid swap amount");
          return;
        }
        if (check.requiresConfirmation) {
          log(`⚠️ Large swap detected. ${check.error}`);
          toast.warning(check.error || "Large swap requires confirmation");
          return;
        }
      }

      const decimals = await getMintDecimals(pairFrom);
      const raw = Math.floor((Number(uiAmountStr) || 0) * Math.pow(10, decimals));
      log(`💱 Swap: ${uiAmountStr} ${tokenSymbol} (${decimals} decimals) → ${raw} raw`);
      if (raw > 0 && raw < VERY_SMALL_AMOUNT_THRESHOLD && decimals >= MIN_DECIMALS_FOR_WARNING) {
        log(`⚠️ Very small amount (${raw} raw units). Check if intentional.`);
      }
      if (raw <= 0) {
        log("Enter a valid amount.");
        return;
      }

      try {
        // Fee routing: explicit referral-link address wins, else the affiliate
        // vault for the input mint. This mirrors the legacy precedence in
        // lib/referral.ts buildJupiterSwapRequest ("Priority: referral >
        // vault > none", lib/referral.ts:204-210).
        const feeAccount = referralAddress || config.vaultMap[pairFrom] || undefined;
        const orderRes = await fetch(
          buildOrderUrl({
            inputMint: pairFrom,
            outputMint: pairTo,
            amountRaw: String(raw),
            taker: publicKey.toBase58(),
            referralAccount: feeAccount,
            referralFee: feeAccount ? clampReferralFeeBps(settings.platformFeeBps) : undefined,
            slippageBps: settings.slippageBps,
          }),
          { headers: jupiterHeaders(settings.jupiterApiKey) }
        );
        if (!orderRes.ok) {
          const msg = jupiterErrorMessage(orderRes.status);
          log(`⚠️ ${msg}`);
          toast.error(msg);
          return;
        }
        const order = parseOrder(await orderRes.json());
        if (!order.transaction) {
          // "" = router could not build a tx; null should not happen (taker set)
          log(
            `❌ No swap transaction (router: ${order.router ?? "?"}, code: ${order.errorCode ?? "?"}): ${order.errorMessage ?? "unknown"}`
          );
          toast.error("Jupiter could not build the swap transaction");
          return;
        }
        log(`💰 ${getFeeRoutingDescription(config.vaultMap[pairFrom], referralAddress)}`);

        const tx = VersionedTransaction.deserialize(b64ToUint8Array(order.transaction));
        const validation = validateSwapTransaction(tx, publicKey);
        if (!validation.isValid) {
          log(`❌ Transaction validation failed: ${validation.errors.join(", ")}`);
          return;
        }
        if (validation.warnings.length > 0) {
          log(`⚠️ Transaction warnings: ${validation.warnings.join(", ")}`);
        }

        const outputDecimals = await getMintDecimals(pairTo);
        dispatchSwapEvent({
          type: "swap-started",
          internalId,
          mode,
          fromMint: pairFrom,
          fromSymbol: symbolFor(pairFrom),
          fromAmount: Number(uiAmountStr) || 0,
          toMint: pairTo,
          toSymbol: symbolFor(pairTo),
          toAmount: Number(order.outAmount ?? 0) / Math.pow(10, outputDecimals) || 0,
        });
        dispatchedStart = true;

        if (!signTransaction) {
          log("Wallet does not support signing.");
          dispatchSwapEvent({ type: "swap-failed", internalId, reason: "Wallet does not support signing" });
          return;
        }
        // Sign immediately — the order goes stale as on-chain prices move.
        const signed = await signTransaction(tx);

        const execRes = await fetch(JUP_EXECUTE, {
          method: "POST",
          headers: jupiterHeaders(settings.jupiterApiKey, true),
          body: buildExecuteBody(bytesToBase64(signed.serialize()), order.requestId),
        });
        if (!execRes.ok) {
          const msg = jupiterErrorMessage(execRes.status);
          log(`⚠️ ${msg}`);
          toast.error(msg);
          dispatchSwapEvent({ type: "swap-failed", internalId, reason: msg });
          return;
        }
        const result = parseExecuteResponse(await execRes.json());
        if (result.signature) {
          dispatchSwapEvent({ type: "swap-sent", internalId, signature: result.signature });
          log("Sent → " + short(result.signature, 6) + " | " + solscanTx(result.signature));
        }
        if (result.status === "Success") {
          log("Confirmed → " + (result.signature ? short(result.signature, 6) : "(no signature)"));
          dispatchSwapEvent({ type: "swap-confirmed", internalId });
          toast.success("Swap confirmed");
          incrementBoosts();
        } else {
          const reason = `Execute failed (code ${result.code ?? "?"})${result.error ? `: ${result.error.slice(0, 120)}` : ""}`;
          log(`❌ ${reason}${result.signature ? " — check " + solscanTx(result.signature) : ""}`);
          toast.error(reason.slice(0, 80));
          dispatchSwapEvent({ type: "swap-failed", internalId, reason });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        log("Execute error: " + msg);
        toast.error("Swap failed: " + msg.slice(0, 50));
        if (dispatchedStart) {
          dispatchSwapEvent({ type: "swap-failed", internalId, reason: msg });
        }
      }
    },
    [publicKey, signTransaction, settings, config.fromMint, config.vaultMap,
     solBalance, tokenBalance, log, incrementBoosts]
  );

  /** Run one planned step. Returns false when the session should stop. */
  const executeStep = useCallback(
    async (
      step: SessionStep,
      referralAddress: string | undefined,
      mode: SwapMode,
      roundStartBalance: number,
      swapCounter: { count: number }
    ): Promise<void> => {
      if (step.kind === "delay") {
        log(`⏳ Waiting ${step.ms}ms...`);
        await sleep(step.ms);
        return;
      }
      if (step.kind === "swap") {
        swapCounter.count++;
        session.setCurrentSwapIndex(swapCounter.count);
        log(`💱 Swap ${step.swapInRound}/${step.swapsInRound}: ${step.amountUi} ${symbolFor(config.fromMint)}`);
        await executeSwap(config.fromMint, config.toMint, step.amountUi, referralAddress, mode);
        return;
      }
      // return-swap: manual amount or accumulated toMint balance since round start
      const finalBalance = await fetchTokenBalance(walletAddress, config.toMint, settings.rpc);
      const finalAmount = finalBalance.uiAmount || 0;
      const accumulated = Math.max(0, finalAmount - roundStartBalance);
      const returnAmount = step.manualAmountUi ?? String(accumulated);
      if (Number(returnAmount) <= 0) {
        log(`⚠️ No accumulated ${symbolFor(config.toMint)} to return swap`);
        return;
      }
      log(
        step.manualAmountUi
          ? `↩️ Return swap: ${returnAmount} ${symbolFor(config.toMint)} (manual amount)`
          : `↩️ Return swap: ${returnAmount} ${symbolFor(config.toMint)} (accumulated: ${roundStartBalance.toFixed(6)} → ${finalAmount.toFixed(6)})`
      );
      await executeSwap(config.toMint, config.fromMint, returnAmount, referralAddress, mode);
    },
    [config.fromMint, config.toMint, executeSwap, log, session, settings.rpc, sleep, walletAddress]
  );

  const startSession = useCallback(async () => {
    if (!publicKey) {
      log("Connect wallet first.");
      return;
    }
    if (runRef.current) return;

    const cfg: SessionConfig = {
      mode: config.swapMode,
      amount: config.amount,
      maxAmount: config.maxAmount,
      loopReturnAmount: config.loopReturnAmount,
      swapsPerRound: config.swapsPerRound,
      numberOfRounds: config.numberOfRounds,
      numberOfSwaps: config.numberOfSwaps,
      swapDelayMs: config.swapDelayMs,
      autoDelayMs: config.autoDelayMs,
    };

    runRef.current = true;
    session.setRunning(true);

    const extraction = config.referralLink
      ? extractReferralCode(config.referralLink)
      : { hasReferral: false as const };
    const referralAddress = extraction.hasReferral ? extraction.referralAddress : undefined;
    if (config.referralLink && "error" in extraction && extraction.error) {
      log(`⚠️ Referral link error: ${extraction.error}`);
    }

    const rounds = totalRounds(cfg);
    const roundsLabel = rounds === Infinity ? "∞" : String(rounds);
    log(`🚀 Starting ${cfg.mode} session (${roundsLabel} round${rounds === 1 ? "" : "s"})`);

    const swapCounter = { count: 0 };
    let completedRounds = 0;
    try {
      while (runRef.current && hasNextRound(completedRounds, cfg)) {
        const round = completedRounds + 1;
        session.setCurrentRound(round);
        if (cfg.mode !== "normal") {
          log(`🔄 Round ${rounds === Infinity ? "∞" : `${round}/${roundsLabel}`}`);
        }
        // Snapshot toMint balance for accumulated return-swap math
        let roundStartBalance = 0;
        if (cfg.mode !== "normal") {
          const initial = await fetchTokenBalance(walletAddress, config.toMint, settings.rpc);
          roundStartBalance = initial.uiAmount || 0;
        }
        for (const step of planRound(cfg, round, Math.random)) {
          await waitWhilePaused();
          if (!runRef.current) break;
          await executeStep(step, referralAddress, cfg.mode, roundStartBalance, swapCounter);
        }
        completedRounds = round;
      }
      if (runRef.current && rounds !== Infinity) {
        log(`✅ ${cfg.mode} session complete: ${roundsLabel} round${rounds === 1 ? "" : "s"}`);
        toast.success(`Session complete — ${roundsLabel} round${rounds === 1 ? "" : "s"} finished`);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      log(`❌ Session error: ${msg}`);
      toast.error(`Session error: ${msg.slice(0, 50)}`);
    } finally {
      runRef.current = false;
      pauseRef.current = false;
      session.setRunning(false);
      session.setPaused(false);
      session.setStopping(false);
      session.setCurrentSwapIndex(0);
      session.setCurrentRound(0);
    }
  }, [publicKey, config, session, settings.rpc, log, executeStep, waitWhilePaused, walletAddress]);

  const stopSession = useCallback(() => {
    runRef.current = false;
    pauseRef.current = false;
    session.setStopping(true);
    log("⏹️ Stopping session...");
  }, [session, log]);

  const pauseSession = useCallback(() => {
    pauseRef.current = true;
    session.setPaused(true);
    log("⏸️ Pausing session...");
  }, [session, log]);

  const resumeSession = useCallback(() => {
    pauseRef.current = false;
    session.setPaused(false);
    log("▶️ Resuming session...");
  }, [session, log]);

  return { startSession, stopSession, pauseSession, resumeSession, getUsdValue };
}
```

- [ ] **Step 2: Line-by-line parity review against the legacy engine**

Open `hooks/useSwapExecution.ts` next to the new file and verify each item:
- amount validation gates (invalid / requiresConfirmation) — identical messages and early-returns
- raw amount computation `Math.floor(ui * 10^decimals)` and small-amount warning
- order params: `taker` = wallet, `slippageBps` from settings, `referralFee` = `clampReferralFeeBps(settings.platformFeeBps)`
- fee-account precedence: open `lib/referral.ts` → `buildJupiterSwapRequest` and confirm whether the referral-link address or the vault wins there; the engine's `feeAccount = referralAddress || vault` must mirror it exactly
- `validateSwapTransaction(tx, publicKey)` gate BEFORE signing (unchanged safety property)
- swap-started/sent/confirmed/failed event dispatch order and payloads
- `/execute` result handling: `Success` → confirmed + `incrementBoosts()`; `Failed` → swap-failed with `code`; HTTP error → swap-failed (Jupiter owns sending/confirmation now — there is deliberately no client-side confirm loop or 30s timeout)
- boost: randomized amounts, delay between swaps not after last, return swap per round (manual `loopReturnAmount` override), round delay between rounds
- rewards: fixed amount, forward + delay + accumulated return per round
- normal: single swap, no return
- stop is level-triggered (`runRef`), pause busy-waits at 100ms

Fix any deviation found. Differences that are intentional: order-and-execute flow instead of quote+swap+self-send (Jupiter lands the transaction), wallet-adapter signing instead of `getPhantomProvider`, sonner toasts instead of `useToast`, no confetti, `parseOrder`/`parseExecuteResponse` zod gates.

- [ ] **Step 3: Full gates and commit**

```bash
npm run build && npx vitest run
git add hooks/useSwapEngine.ts
git commit -m "feat: add useSwapEngine orchestrator on wallet-adapter + pure planner"
```

---

# Phase 5 — New UI (files created; nothing imported by `app/` until Task 16)

New components use the semantic token classes (`bg-surface`, `text-ink`, …) that only exist after the Task 16 Tailwind v4 cutover. Until then they are unrendered files — they must type-check, nothing more.

### Task 10: `app/globals.css` — Tailwind v4 "Deep Pond" theme

**Files:**
- Create: `app/globals.css` (NOT yet imported — `app/layout.tsx` still imports the old `styles/globals.css` until Task 16)

**Interfaces:**
- Produces: utility classes used by every new component — `bg-bg`, `bg-surface`, `bg-surface-2`, `border-edge`, `text-ink`, `text-ink-muted`, `text-accent`, `bg-accent`, `text-accent-deep`, `bg-danger`, `text-danger`, `bg-warn`, `text-warn`, `font-num`, plus the `dark:` variant driven by `.dark` on `<html>`.

- [ ] **Step 1: Write `app/globals.css`**

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

/* Deep Pond semantic tokens — light values on :root, dark overrides on .dark */
:root {
  --bg: #f4f7f5;
  --surface: #ffffff;
  --surface-2: #eef4f0;
  --edge: #dbe5df;
  --ink: #1c2a24;
  --ink-muted: #5d7266;
  --accent: #10b981;
  --accent-strong: #059669;
  --accent-deep: #06281c;
}
.dark {
  --bg: #0b1512;
  --surface: #101d18;
  --surface-2: #16261f;
  --edge: #1d312a;
  --ink: #d7e5de;
  --ink-muted: #7c9c8f;
  --accent: #34d399;
  --accent-strong: #10b981;
  --accent-deep: #06281c;
}

@theme inline {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, "Cascadia Code", "JetBrains Mono", Menlo, Consolas, monospace;

  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-edge: var(--edge);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-accent: var(--accent);
  --color-accent-strong: var(--accent-strong);
  --color-accent-deep: var(--accent-deep);
  --color-danger: #ef4444;
  --color-warn: #f59e0b;

  --radius-card: 0.75rem;
}

@layer base {
  * {
    box-sizing: border-box;
  }
  html {
    -webkit-font-smoothing: antialiased;
  }
  body {
    @apply bg-bg text-ink font-sans;
  }
}

@utility font-num {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 2: Verify build is unaffected**

Run: `npm run build`
Expected: passes — the file is not imported anywhere yet, and Tailwind v3 never sees it.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add Tailwind v4 Deep Pond theme stylesheet (unwired)"
```

### Task 11: App shell — `AppShell`, `Sidebar`, `ConnectionStatus`, `ThemeToggle`

**Files:**
- Create: `components/layout/AppShell.tsx`, `components/layout/Sidebar.tsx`, `components/layout/ConnectionStatus.tsx`, `components/layout/ThemeToggle.tsx`

**Interfaces:**
- Consumes: `useSettings` (Task 6), `useWallet` from wallet-adapter, `usePathname` from `next/navigation`, `cn` from `lib/utils`
- Produces: `AppShell({ children })` — used by Task 16 layout; `Sidebar` renders `ConnectionStatus` and `ThemeToggle` in its footer and a "Connect" button that calls `setSetupOpen(true)`

- [ ] **Step 1: Implement `components/layout/ConnectionStatus.tsx`**

```tsx
"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

function Led({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn("h-2 w-2 rounded-full", ok ? "bg-accent" : "bg-danger")}
        aria-hidden
      />
      <span className="text-ink-muted">{label}</span>
      {detail ? <span className="ml-auto font-num text-ink-muted">{detail}</span> : null}
    </div>
  );
}

export function ConnectionStatus() {
  const { connected, publicKey } = useWallet();
  const { settings } = useSettings();
  const address = publicKey?.toBase58();
  return (
    <div className="flex flex-col gap-1.5">
      <Led
        ok={connected}
        label="Wallet"
        detail={address ? `${address.slice(0, 4)}…${address.slice(-4)}` : undefined}
      />
      <Led ok={settings.rpcVerified} label="RPC" />
      <Led ok={settings.apiKeyVerified} label="Jupiter API" />
    </div>
  );
}
```

- [ ] **Step 2: Implement `components/layout/ThemeToggle.tsx`**

```tsx
"use client";
import { useSettings } from "@/contexts/SettingsContext";

export function ThemeToggle() {
  const { settings, update } = useSettings();
  const isDark =
    settings.theme === "dark" ||
    (settings.theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  return (
    <button
      type="button"
      onClick={() => update({ theme: isDark ? "light" : "dark" })}
      className="rounded-full border border-edge px-3 py-1 text-xs text-ink-muted hover:text-ink hover:border-accent transition-colors"
      aria-label="Toggle dark mode"
    >
      {isDark ? "☾ dark" : "☀ light"}
    </button>
  );
}
```

- [ ] **Step 3: Implement `components/layout/Sidebar.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSettings } from "@/contexts/SettingsContext";
import { ConnectionStatus } from "@/components/layout/ConnectionStatus";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "◧" },
  { href: "/portfolio", label: "Portfolio", icon: "◱" },
  { href: "/settings", label: "Settings", icon: "⚙" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { connected } = useWallet();
  const { settingsReady, setSetupOpen } = useSettings();
  const fullyConnected = connected && settingsReady;

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-edge bg-surface p-3 lg:w-56 lg:p-4">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-accent to-accent-strong" />
        <span className="hidden text-sm font-bold lg:inline">Pond0matic</span>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-accent/10 font-semibold text-accent"
                  : "text-ink-muted hover:bg-surface-2 hover:text-ink"
              )}
            >
              <span aria-hidden>{item.icon}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-3 border-t border-edge pt-4">
        {!fullyConnected ? (
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className="rounded-lg bg-gradient-to-br from-accent to-accent-strong px-3 py-2 text-xs font-bold text-accent-deep"
          >
            <span className="lg:hidden">⚡</span>
            <span className="hidden lg:inline">Connect</span>
          </button>
        ) : null}
        <div className="hidden lg:block">
          <ConnectionStatus />
        </div>
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Implement `components/layout/AppShell.tsx`**

```tsx
"use client";
import { Sidebar } from "@/components/layout/Sidebar";
import { ConnectSetupModal } from "@/components/connect/ConnectSetupModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      <ConnectSetupModal />
    </div>
  );
}
```

- [ ] **Step 5: Full gates and commit**

`ConnectSetupModal` does not exist yet — create it in the next task BEFORE building, or build after Task 12. To keep every commit green, commit Tasks 11 and 12 together only after both compile — OR create a temporary stub now:

```tsx
// components/connect/ConnectSetupModal.tsx (replaced in Task 12)
"use client";
export function ConnectSetupModal() {
  return null;
}
```

```bash
npm run build && npx vitest run
git add components/layout/AppShell.tsx components/layout/Sidebar.tsx components/layout/ConnectionStatus.tsx components/layout/ThemeToggle.tsx components/connect/ConnectSetupModal.tsx
git commit -m "feat: add sidebar app shell (unwired)"
```

### Task 12: `ConnectSetupModal` — 3-step guided setup

**Files:**
- Modify (replace stub): `components/connect/ConnectSetupModal.tsx`

**Interfaces:**
- Consumes: `useSettings` (open state, settings, update), `useWallet` + `useWalletModal` from wallet-adapter, `testRpcEndpoint`, `testJupiterApiKey` (Task 6)
- Produces: modal rendered by `AppShell`; opens when `setupOpen`, closes itself; on completion `settingsReady` becomes true

- [ ] **Step 1: Implement the modal**

```tsx
"use client";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useSettings } from "@/contexts/SettingsContext";
import { testRpcEndpoint, testJupiterApiKey } from "@/lib/settings/validation";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

export function ConnectSetupModal() {
  const { settings, update, setupOpen, setSetupOpen, settingsReady } = useSettings();
  const { connected, publicKey } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [step, setStep] = useState<Step>(1);
  const [rpcDraft, setRpcDraft] = useState(settings.rpc);
  const [keyDraft, setKeyDraft] = useState(settings.jupiterApiKey);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!setupOpen) return null;

  const address = publicKey?.toBase58();

  const testRpc = async () => {
    setTesting(true);
    setFeedback(null);
    const result = await testRpcEndpoint(rpcDraft);
    setTesting(false);
    if (result.ok) {
      update({ rpc: rpcDraft.trim(), rpcVerified: true });
      setFeedback(`✓ Connected — slot ${result.slot} · ${result.latencyMs} ms`);
    } else {
      update({ rpcVerified: false });
      setFeedback(`✗ ${result.error}`);
    }
  };

  const testKey = async () => {
    setTesting(true);
    setFeedback(null);
    const result = await testJupiterApiKey(keyDraft);
    setTesting(false);
    if (result.ok) {
      update({ jupiterApiKey: keyDraft.trim(), apiKeyVerified: true });
      setFeedback("✓ Key accepted");
    } else {
      update({ apiKeyVerified: false });
      setFeedback(`✗ ${result.error}`);
    }
  };

  const goTo = (next: Step) => {
    setStep(next);
    setFeedback(null);
  };

  const stepDone =
    step === 1 ? connected : step === 2 ? settings.rpcVerified : settings.apiKeyVerified;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-edge bg-surface p-6">
        <h2 className="text-base font-bold">Connect</h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          Wallet, RPC and Jupiter API key — all three are required to swap.
        </p>

        <ol className="my-5 flex items-center gap-2" aria-label="Setup progress">
          {([1, 2, 3] as const).map((n) => {
            const done =
              (n === 1 && connected) ||
              (n === 2 && settings.rpcVerified) ||
              (n === 3 && settings.apiKeyVerified);
            return (
              <li key={n} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    done
                      ? "bg-accent text-accent-deep"
                      : n === step
                        ? "border-2 border-accent text-accent"
                        : "border-2 border-edge text-ink-muted"
                  )}
                >
                  {done ? "✓" : n}
                </span>
                {n < 3 ? <span className="h-0.5 flex-1 bg-edge" /> : null}
              </li>
            );
          })}
        </ol>

        {step === 1 ? (
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold">1 · Connect your wallet</div>
            {connected && address ? (
              <div className="rounded-lg bg-surface-2 px-3 py-2 text-xs">
                ✓ Connected: <span className="font-num text-accent">{`${address.slice(0, 4)}…${address.slice(-4)}`}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setWalletModalVisible(true)}
                className="rounded-lg bg-gradient-to-br from-accent to-accent-strong px-3 py-2 text-sm font-bold text-accent-deep"
              >
                Select wallet
              </button>
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold">2 · RPC endpoint</div>
            <p className="text-xs text-ink-muted">
              Use a dedicated endpoint (Helius, QuickNode). Public RPC is rate-limited.
            </p>
            <div className="flex gap-2">
              <input
                value={rpcDraft}
                onChange={(e) => setRpcDraft(e.target.value)}
                placeholder="https://mainnet.helius-rpc.com/?api-key=…"
                className="min-w-0 flex-1 rounded-lg border border-edge bg-bg px-3 py-2 font-num text-xs"
              />
              <button
                type="button"
                onClick={testRpc}
                disabled={testing}
                className="rounded-lg bg-surface-2 px-4 py-2 text-xs font-semibold text-accent disabled:opacity-50"
              >
                {testing ? "…" : "Test"}
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold">3 · Jupiter API key</div>
            <p className="text-xs text-ink-muted">
              Create a free key at{" "}
              <a href="https://portal.jup.ag" target="_blank" rel="noreferrer" className="text-accent underline">
                portal.jup.ag
              </a>{" "}
              — required for quote/swap calls.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="API key"
                className="min-w-0 flex-1 rounded-lg border border-edge bg-bg px-3 py-2 font-num text-xs"
              />
              <button
                type="button"
                onClick={testKey}
                disabled={testing}
                className="rounded-lg bg-surface-2 px-4 py-2 text-xs font-semibold text-accent disabled:opacity-50"
              >
                {testing ? "…" : "Test"}
              </button>
            </div>
          </div>
        ) : null}

        {feedback ? (
          <p className={cn("mt-3 text-xs", feedback.startsWith("✓") ? "text-accent" : "text-danger")}>
            {feedback}
          </p>
        ) : null}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => (step === 1 ? setSetupOpen(false) : goTo((step - 1) as Step))}
            className="flex-1 rounded-lg border border-edge py-2 text-xs text-ink-muted"
          >
            {step === 1 ? "Close" : "Back"}
          </button>
          {step < 3 ? (
            <button
              type="button"
              disabled={!stepDone}
              onClick={() => goTo((step + 1) as Step)}
              className="flex-[2] rounded-lg bg-gradient-to-br from-accent to-accent-strong py-2 text-xs font-bold text-accent-deep disabled:opacity-40"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              disabled={!(connected && settingsReady)}
              onClick={() => setSetupOpen(false)}
              className="flex-[2] rounded-lg bg-gradient-to-br from-accent to-accent-strong py-2 text-xs font-bold text-accent-deep disabled:opacity-40"
            >
              Done — start swapping
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Full gates and commit**

```bash
npm run build && npx vitest run
git add components/connect/ConnectSetupModal.tsx
git commit -m "feat: add 3-step guided connect setup modal"
```

### Task 13: Swap panel suite (`components/swap/`)

**Files:**
- Create: `components/swap/SwapPanel.tsx`, `components/swap/ModeTabs.tsx`, `components/swap/AmountCard.tsx`, `components/swap/ModeConfigRow.tsx`, `components/swap/SessionButton.tsx`, `components/swap/SessionProgress.tsx`, `components/swap/MiniFeed.tsx`, `components/swap/ClickerSection.tsx`, `components/swap/MobileSwapSheet.tsx`

**Interfaces:**
- Consumes: `useSwapConfig`, `useSession`, `useSettings`, `useActivity` (Tasks 6–8); `useSwapEngine` (Task 9); `useBalances`; `TOKEN_NAMES` from `lib/vaults`; `totalRounds` from `lib/swap/sessionPlanner`; `useClickerControl` from `hooks/useClickerControl` (existing, unchanged); `useWallet`
- Produces: `SwapPanel` (right column) and `MobileSwapSheet` (bottom sheet < xl) — used by Task 16 `app/page.tsx`

- [ ] **Step 1: Implement `components/swap/ModeTabs.tsx`**

```tsx
"use client";
import { useSwapConfig } from "@/contexts/SwapConfigContext";
import { useSession } from "@/contexts/SessionContext";
import { cn } from "@/lib/utils";
import type { SwapMode } from "@/types/swapModes";

const MODES: { value: SwapMode; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "boost", label: "Boost" },
  { value: "rewards", label: "Rewards" },
];

export function ModeTabs() {
  const { swapMode, setSwapMode } = useSwapConfig();
  const { running } = useSession();
  return (
    <div className="flex gap-1 rounded-xl bg-bg p-1" role="tablist" aria-label="Swap mode">
      {MODES.map((m) => (
        <button
          key={m.value}
          role="tab"
          aria-selected={swapMode === m.value}
          disabled={running}
          onClick={() => setSwapMode(m.value)}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
            swapMode === m.value
              ? "bg-gradient-to-br from-accent to-accent-strong text-accent-deep"
              : "text-ink-muted hover:text-ink"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement `components/swap/AmountCard.tsx`**

```tsx
"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSwapConfig } from "@/contexts/SwapConfigContext";
import { useSession } from "@/contexts/SessionContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useBalances } from "@/hooks/useBalances";
import { TOKEN_NAMES } from "@/lib/vaults";
import { cn } from "@/lib/utils";

function TokenSelect({
  value,
  onChange,
  disabled,
  label,
}: {
  value: string;
  onChange: (mint: string) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-edge bg-surface px-2.5 py-1 text-xs font-semibold"
    >
      {Object.entries(TOKEN_NAMES).map(([mint, name]) => (
        <option key={mint} value={mint}>
          {name}
        </option>
      ))}
    </select>
  );
}

export function AmountCard() {
  const config = useSwapConfig();
  const { running } = useSession();
  const { settings } = useSettings();
  const { publicKey } = useWallet();
  const { solBalance, tokenBalance } = useBalances(
    publicKey?.toBase58() ?? "",
    settings.rpc,
    config.fromMint
  );
  const isBoost = config.swapMode === "boost";
  const fromIsSol = config.fromMint === "So11111111111111111111111111111111111111112";
  const fromBalance = fromIsSol ? solBalance : tokenBalance;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="rounded-xl border border-edge bg-bg p-3">
        <div className="flex items-center justify-between text-[11px] text-ink-muted">
          <span>{isBoost ? "You pay · randomized per swap" : "You pay"}</span>
          <span className="font-num">balance {fromBalance.toFixed(4)}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          {isBoost ? (
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <input
                value={config.amount}
                disabled={running}
                onChange={(e) => config.setAmount(e.target.value)}
                inputMode="decimal"
                aria-label="Minimum amount"
                className="w-full min-w-0 bg-transparent font-num text-base font-bold outline-none"
              />
              <span className="text-ink-muted">–</span>
              <input
                value={config.maxAmount}
                disabled={running}
                onChange={(e) => config.setMaxAmount(e.target.value)}
                inputMode="decimal"
                aria-label="Maximum amount"
                className="w-full min-w-0 bg-transparent font-num text-base font-bold outline-none"
              />
            </div>
          ) : (
            <input
              value={config.amount}
              disabled={running}
              onChange={(e) => config.setAmount(e.target.value)}
              inputMode="decimal"
              aria-label="Amount"
              className="min-w-0 flex-1 bg-transparent font-num text-base font-bold outline-none"
            />
          )}
          <TokenSelect
            label="From token"
            value={config.fromMint}
            disabled={running}
            onChange={config.setFromMint}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={config.flipMints}
        disabled={running}
        aria-label="Flip swap direction"
        className={cn(
          "mx-auto -my-2 z-10 flex h-7 w-7 items-center justify-center rounded-full",
          "border border-edge bg-surface text-accent hover:border-accent transition-colors disabled:opacity-50"
        )}
      >
        ⇅
      </button>

      <div className="rounded-xl border border-edge bg-bg p-3">
        <div className="text-[11px] text-ink-muted">You receive (return-swapped each round)</div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="font-num text-base font-bold text-ink-muted">~market rate</span>
          <TokenSelect
            label="To token"
            value={config.toMint}
            disabled={running}
            onChange={config.setToMint}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement `components/swap/ModeConfigRow.tsx`**

```tsx
"use client";
import { useSwapConfig } from "@/contexts/SwapConfigContext";
import { useSession } from "@/contexts/SessionContext";

function NumField({
  label, value, onChange, disabled, min, hint,
}: {
  label: string; value: number; onChange: (n: number) => void;
  disabled: boolean; min: number; hint?: string;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 rounded-lg border border-edge bg-bg p-2 text-center">
      <input
        type="number"
        min={min}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
        className="w-full bg-transparent text-center font-num text-sm font-bold outline-none"
      />
      <span className="text-[10px] text-ink-muted">{label}</span>
      {hint ? <span className="text-[9px] text-ink-muted">{hint}</span> : null}
    </label>
  );
}

export function ModeConfigRow() {
  const config = useSwapConfig();
  const { running } = useSession();

  if (config.swapMode === "normal") return null;

  if (config.swapMode === "boost") {
    return (
      <div className="flex gap-1.5">
        <NumField
          label="swaps / round" min={1} disabled={running}
          value={config.swapsPerRound} onChange={config.setSwapsPerRound}
        />
        <NumField
          label="rounds" min={0} hint="0 = ∞" disabled={running}
          value={config.numberOfRounds} onChange={config.setNumberOfRounds}
        />
        <NumField
          label="delay (ms)" min={0} disabled={running}
          value={config.swapDelayMs} onChange={config.setSwapDelayMs}
        />
      </div>
    );
  }

  return (
    <div className="flex gap-1.5">
      <NumField
        label="rounds" min={0} hint="0 = ∞" disabled={running}
        value={config.numberOfSwaps} onChange={config.setNumberOfSwaps}
      />
      <NumField
        label="delay (ms)" min={0} disabled={running}
        value={config.swapDelayMs} onChange={config.setSwapDelayMs}
      />
    </div>
  );
}
```

- [ ] **Step 4: Implement `components/swap/SessionButton.tsx`**

```tsx
"use client";
import { useSession } from "@/contexts/SessionContext";
import { useSwapConfig } from "@/contexts/SwapConfigContext";
import { useSwapEngine } from "@/hooks/useSwapEngine";
import { cn } from "@/lib/utils";

const START_LABEL: Record<string, string> = {
  normal: "Swap",
  boost: "▶ Start boost session",
  rewards: "▶ Start rewards session",
};

export function SessionButton({ disabled }: { disabled: boolean }) {
  const { running, paused, stopping } = useSession();
  const { swapMode } = useSwapConfig();
  const { startSession, stopSession, pauseSession, resumeSession } = useSwapEngine();

  if (!running) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => void startSession()}
        className={cn(
          "w-full rounded-xl bg-gradient-to-br from-accent to-accent-strong py-2.5",
          "text-sm font-bold text-accent-deep transition-opacity disabled:opacity-40"
        )}
      >
        {START_LABEL[swapMode]}
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      {swapMode !== "normal" ? (
        <button
          type="button"
          onClick={paused ? resumeSession : pauseSession}
          className="flex-1 rounded-xl border border-edge py-2.5 text-sm font-bold text-ink"
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
      ) : null}
      <button
        type="button"
        onClick={stopSession}
        disabled={stopping}
        className="flex-[2] rounded-xl bg-gradient-to-br from-warn to-danger py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {stopping ? "Stopping…" : "■ Stop session"}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Implement `components/swap/SessionProgress.tsx`**

```tsx
"use client";
import { useSession } from "@/contexts/SessionContext";
import { useSwapConfig } from "@/contexts/SwapConfigContext";
import { totalRounds, type SessionConfig } from "@/lib/swap/sessionPlanner";

export function SessionProgress() {
  const { running, currentSwapIndex, currentRound } = useSession();
  const config = useSwapConfig();
  if (!running) return null;

  const cfg: SessionConfig = {
    mode: config.swapMode,
    amount: config.amount,
    maxAmount: config.maxAmount,
    loopReturnAmount: config.loopReturnAmount,
    swapsPerRound: config.swapsPerRound,
    numberOfRounds: config.numberOfRounds,
    numberOfSwaps: config.numberOfSwaps,
    swapDelayMs: config.swapDelayMs,
    autoDelayMs: config.autoDelayMs,
  };
  const rounds = totalRounds(cfg);
  const roundsLabel = rounds === Infinity ? "∞" : String(rounds);
  const totalSwaps =
    cfg.mode === "boost" && rounds !== Infinity
      ? rounds * Math.max(1, cfg.swapsPerRound)
      : rounds !== Infinity
        ? rounds
        : Infinity;
  const pct =
    totalSwaps === Infinity ? null : Math.min(100, (currentSwapIndex / totalSwaps) * 100);

  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bg">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: pct === null ? "100%" : `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-muted">
        <span>
          swap <b className="font-num text-ink">{currentSwapIndex}{totalSwaps !== Infinity ? `/${totalSwaps}` : ""}</b>
        </span>
        {cfg.mode !== "normal" ? (
          <span>
            round <b className="font-num text-ink">{currentRound}/{roundsLabel}</b>
          </span>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Implement `components/swap/MiniFeed.tsx`**

```tsx
"use client";
import { useActivity } from "@/contexts/ActivityContext";

export function MiniFeed() {
  const { activities } = useActivity();
  const recent = activities.slice(-4).reverse();
  if (recent.length === 0) return null;
  return (
    <div className="border-t border-edge pt-2">
      <ul className="flex flex-col gap-0.5 text-[10px] leading-relaxed text-ink-muted">
        {recent.map((line, i) => (
          <li key={`${i}-${line.slice(0, 24)}`} className="truncate font-num">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 7: Port `components/swap/ClickerSection.tsx` from the legacy ClickerPanel**

Copy `components/CompactSwapper/components/ClickerPanel.tsx` to `components/swap/ClickerSection.tsx`, then:
1. Rename the exported component to `ClickerSection`.
2. Keep ALL `useClickerControl` logic, props, gating (`available`), and API calls exactly as-is — the clicker behavior is out of scope.
3. Replace styling classes with semantic tokens using this mapping (applies to every old-world class you encounter): `bg-black/*`, `bg-gray-9xx`, `bg-slate-*` → `bg-bg` or `bg-surface-2`; `border-gray-*`, `border-white/10` → `border-edge`; `text-white` → `text-ink`; `text-gray-400`/`text-gray-500`/`text-slate-*` → `text-ink-muted`; green/emerald accents → `text-accent`/`bg-accent`; red → `text-danger`/`bg-danger`; amber/yellow → `text-warn`; any `fire-*`/`ice-*`/`void-*`/`lily-*`/`mining-*`/`shadow-*-glow`/`glass-*`/`neomorph-*` class → delete (no replacement).
4. Wrap the whole section in `<details className="border-t border-edge pt-2"><summary className="cursor-pointer text-[11px] text-ink-muted">⚙ Autoclicker</summary>…</details>` so it is collapsed by default.
5. If the legacy panel consumed `useSwapperContext`, replace with the equivalent new hooks (`useSession` for running state, `useActivity` for log).

- [ ] **Step 8: Implement `components/swap/SwapPanel.tsx`**

```tsx
"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSettings } from "@/contexts/SettingsContext";
import { ModeTabs } from "@/components/swap/ModeTabs";
import { AmountCard } from "@/components/swap/AmountCard";
import { ModeConfigRow } from "@/components/swap/ModeConfigRow";
import { SessionButton } from "@/components/swap/SessionButton";
import { SessionProgress } from "@/components/swap/SessionProgress";
import { MiniFeed } from "@/components/swap/MiniFeed";
import { ClickerSection } from "@/components/swap/ClickerSection";

export function SwapPanel() {
  const { connected } = useWallet();
  const { settingsReady, setSetupOpen } = useSettings();
  const ready = connected && settingsReady;

  return (
    <section
      aria-label="Swap panel"
      className="relative flex flex-col gap-3 rounded-2xl border border-edge bg-surface p-4"
    >
      <ModeTabs />
      <AmountCard />
      <ModeConfigRow />
      <SessionButton disabled={!ready} />
      <SessionProgress />
      <MiniFeed />
      <ClickerSection />
      {!ready ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-surface/70 backdrop-blur-[2px]">
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className="rounded-xl bg-gradient-to-br from-accent to-accent-strong px-5 py-2.5 text-sm font-bold text-accent-deep"
          >
            ⚡ Connect to swap
          </button>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 9: Implement `components/swap/MobileSwapSheet.tsx`**

```tsx
"use client";
import { useState } from "react";
import { SwapPanel } from "@/components/swap/SwapPanel";
import { useSession } from "@/contexts/SessionContext";

export function MobileSwapSheet() {
  const [open, setOpen] = useState(false);
  const { running } = useSession();
  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-gradient-to-br from-accent to-accent-strong px-5 py-3 text-sm font-bold text-accent-deep shadow-lg"
      >
        {running ? "● Session running" : "⇅ Swap"}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={() => setOpen(false)}>
          <div
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-surface p-2 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-edge" />
            <SwapPanel />
          </div>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 10: Full gates and commit**

```bash
npm run build && npx vitest run
git add components/swap
git commit -m "feat: add swap panel suite (unwired)"
```

### Task 14: Dashboard tabs (`components/dashboard/`)

**Files:**
- Create: `components/dashboard/DashboardTabs.tsx`, `components/dashboard/StatCard.tsx`, `components/dashboard/RigTab.tsx`, `components/dashboard/PricesTab.tsx`, `components/dashboard/ActivityTab.tsx`

**Interfaces:**
- Consumes: `useRig`, `useActivity` (Task 8); slimmed `useTokenPrices` (Task 3: `{ wpondPrice, solPrice, loading }`); `useWallet`
- Produces: `DashboardTabs` — used by Task 16 `app/page.tsx`

- [ ] **Step 1: Implement `components/dashboard/StatCard.tsx`**

```tsx
"use client";
export function StatCard({
  label,
  value,
  suffix,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-4">
      <div className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</div>
      <div className={`mt-1 font-num text-2xl font-bold ${accent ? "text-accent" : "text-ink"}`}>
        {value}
        {suffix ? <span className="ml-1 text-sm text-ink-muted">{suffix}</span> : null}
      </div>
      {sub ? <div className="mt-1 text-[11px] text-ink-muted">{sub}</div> : null}
    </div>
  );
}
```

- [ ] **Step 2: Implement `components/dashboard/RigTab.tsx`**

```tsx
"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRig } from "@/contexts/RigContext";
import { StatCard } from "@/components/dashboard/StatCard";

export function RigTab() {
  const { connected } = useWallet();
  const rig = useRig();

  if (!connected) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-edge text-sm text-ink-muted">
        Connect a wallet to load your Pond0x rig stats.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Mining rig</h2>
        <button
          type="button"
          onClick={() => void rig.fetchRigData()}
          disabled={rig.isLoading}
          className="rounded-lg border border-edge px-3 py-1 text-xs text-ink-muted hover:text-ink disabled:opacity-50"
        >
          {rig.isLoading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Rig health" value={String(rig.rigHealth)} suffix="/100" accent />
        <StatCard label="Total boosts" value={String(rig.totalBoosts)} />
        <StatCard label="Priority" value={String(rig.priority)} sub={`luck ${rig.luckPoints}`} />
        <StatCard
          label="Health stats"
          value={String(rig.sent)}
          suffix="sent"
          sub={`${rig.inMempool} mempool · ${rig.failed} failed · ${rig.drifted} drifted`}
        />
        <StatCard
          label="Max claim est."
          value={`$${rig.maxClaimEstimateUsd.toFixed(2)}`}
          sub={`drifted $${rig.driftedUsd.toFixed(2)}`}
        />
        <StatCard
          label="Manifest"
          value={rig.isPro ? "PRO" : "standard"}
          sub={rig.badges || "no badges"}
          accent={rig.isPro}
        />
      </div>
      <div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-strong transition-all"
            style={{ width: `${Math.max(0, Math.min(100, rig.rigHealth))}%` }}
          />
        </div>
        <div className="mt-1 text-[10px] text-ink-muted">
          Keep the rig healthy with boost sessions — health drops when swapping stops.
        </div>
      </div>
    </div>
  );
}
```

Note: field names come from `hooks/useMiningRig.ts` (`rigHealth`, `totalBoosts`, `priority`, `luckPoints`, `sent`, `inMempool`, `failed`, `drifted`, `maxClaimEstimateUsd`, `driftedUsd`, `isPro`, `badges`, `isLoading`, `fetchRigData`). If a name mismatches at build time, check that hook's return object — do not guess.

- [ ] **Step 3: Implement `components/dashboard/PricesTab.tsx`**

```tsx
"use client";
import { useTokenPrices } from "@/hooks/useTokenPrices";

const rows = (solPrice: number, wpondPrice: number) => [
  { symbol: "SOL", price: solPrice, decimals: 2 },
  { symbol: "wPOND", price: wpondPrice, decimals: 6 },
  { symbol: "USDC", price: 1, decimals: 2 },
];

export function PricesTab() {
  const { solPrice, wpondPrice, loading } = useTokenPrices();
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Prices</h2>
      <div className="overflow-hidden rounded-xl border border-edge">
        {rows(solPrice, wpondPrice).map((row, i) => (
          <div
            key={row.symbol}
            className={`flex items-center justify-between bg-surface px-4 py-3 ${i > 0 ? "border-t border-edge" : ""}`}
          >
            <span className="text-sm font-semibold">{row.symbol}</span>
            <span className="font-num text-sm">
              {loading && row.price === 0 ? "…" : `$${row.price.toFixed(row.decimals)}`}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-ink-muted">
        Live via lite-api.jup.ag price v3 (keyless) — refreshes automatically while the tab is visible.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Implement `components/dashboard/ActivityTab.tsx`**

```tsx
"use client";
import { useActivity } from "@/contexts/ActivityContext";

export function ActivityTab() {
  const { activities, clear } = useActivity();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Activity</h2>
        <button
          type="button"
          onClick={clear}
          disabled={activities.length === 0}
          className="rounded-lg border border-edge px-3 py-1 text-xs text-ink-muted hover:text-ink disabled:opacity-50"
        >
          Clear
        </button>
      </div>
      {activities.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-edge text-sm text-ink-muted">
          Session events show up here.
        </div>
      ) : (
        <ul className="flex max-h-[60vh] flex-col-reverse gap-1 overflow-y-auto rounded-xl border border-edge bg-surface p-3 font-num text-xs leading-relaxed text-ink-muted">
          {activities.map((line, i) => (
            <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Implement `components/dashboard/DashboardTabs.tsx`**

```tsx
"use client";
import { useState } from "react";
import { RigTab } from "@/components/dashboard/RigTab";
import { PricesTab } from "@/components/dashboard/PricesTab";
import { ActivityTab } from "@/components/dashboard/ActivityTab";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "rig", label: "Rig" },
  { id: "prices", label: "Prices" },
  { id: "activity", label: "Activity" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function DashboardTabs() {
  const [tab, setTab] = useState<TabId>("rig");
  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="flex w-fit gap-1 rounded-xl border border-edge bg-surface p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors",
              tab === t.id ? "bg-bg text-accent" : "text-ink-muted hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "rig" ? <RigTab /> : tab === "prices" ? <PricesTab /> : <ActivityTab />}
    </div>
  );
}
```

- [ ] **Step 6: Full gates and commit**

```bash
npm run build && npx vitest run
git add components/dashboard
git commit -m "feat: add dashboard tab components (unwired)"
```

### Task 15: Settings page components

**Files:**
- Create: `components/settings/ConnectionSettings.tsx`, `components/settings/SwapDefaultsSettings.tsx`

**Interfaces:**
- Consumes: `useSettings`, `testRpcEndpoint`, `testJupiterApiKey` (Task 6); `useWallet` + `useWalletModal`
- Produces: two sections used by Task 16 `app/settings/page.tsx`

- [ ] **Step 1: Implement `components/settings/ConnectionSettings.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useSettings } from "@/contexts/SettingsContext";
import { testRpcEndpoint, testJupiterApiKey } from "@/lib/settings/validation";

export function ConnectionSettings() {
  const { settings, update } = useSettings();
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [rpcDraft, setRpcDraft] = useState(settings.rpc);
  const [keyDraft, setKeyDraft] = useState("");
  const [rpcMsg, setRpcMsg] = useState<string | null>(null);
  const [keyMsg, setKeyMsg] = useState<string | null>(null);

  const saveRpc = async () => {
    setRpcMsg("Testing…");
    const r = await testRpcEndpoint(rpcDraft);
    if (r.ok) {
      update({ rpc: rpcDraft.trim(), rpcVerified: true });
      setRpcMsg(`✓ slot ${r.slot} · ${r.latencyMs} ms`);
    } else {
      update({ rpcVerified: false });
      setRpcMsg(`✗ ${r.error}`);
    }
  };
  const saveKey = async () => {
    setKeyMsg("Testing…");
    const r = await testJupiterApiKey(keyDraft);
    if (r.ok) {
      update({ jupiterApiKey: keyDraft.trim(), apiKeyVerified: true });
      setKeyMsg("✓ Key accepted");
      setKeyDraft("");
    } else {
      setKeyMsg(`✗ ${r.error}`);
    }
  };
  const address = publicKey?.toBase58();

  return (
    <section className="rounded-2xl border border-edge bg-surface p-5">
      <h2 className="text-sm font-semibold">Connection</h2>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-ink-muted">
          Wallet{" "}
          {connected && address ? (
            <span className="font-num text-accent">{`${address.slice(0, 4)}…${address.slice(-4)}`}</span>
          ) : (
            <span className="text-danger">not connected</span>
          )}
        </div>
        {connected ? (
          <button type="button" onClick={() => void disconnect()} className="rounded-lg border border-edge px-3 py-1.5 text-xs text-ink-muted hover:text-danger">
            Disconnect
          </button>
        ) : (
          <button type="button" onClick={() => setVisible(true)} className="rounded-lg bg-gradient-to-br from-accent to-accent-strong px-3 py-1.5 text-xs font-bold text-accent-deep">
            Connect wallet
          </button>
        )}
      </div>

      <div className="mt-4">
        <label className="text-xs text-ink-muted" htmlFor="rpc-input">RPC endpoint</label>
        <div className="mt-1 flex gap-2">
          <input id="rpc-input" value={rpcDraft} onChange={(e) => setRpcDraft(e.target.value)}
            placeholder="https://mainnet.helius-rpc.com/?api-key=…"
            className="min-w-0 flex-1 rounded-lg border border-edge bg-bg px-3 py-2 font-num text-xs" />
          <button type="button" onClick={() => void saveRpc()} className="rounded-lg bg-surface-2 px-4 text-xs font-semibold text-accent">
            Test & save
          </button>
        </div>
        {rpcMsg ? <p className={`mt-1 text-xs ${rpcMsg.startsWith("✓") ? "text-accent" : "text-danger"}`}>{rpcMsg}</p> : null}
      </div>

      <div className="mt-4">
        <label className="text-xs text-ink-muted" htmlFor="jup-key-input">
          Jupiter API key {settings.apiKeyVerified ? <span className="text-accent">(saved ✓)</span> : null}
        </label>
        <div className="mt-1 flex gap-2">
          <input id="jup-key-input" type="password" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)}
            placeholder={settings.jupiterApiKey ? "••••••••  (enter new key to replace)" : "API key from portal.jup.ag"}
            className="min-w-0 flex-1 rounded-lg border border-edge bg-bg px-3 py-2 font-num text-xs" />
          <button type="button" onClick={() => void saveKey()} className="rounded-lg bg-surface-2 px-4 text-xs font-semibold text-accent">
            Test & save
          </button>
        </div>
        {keyMsg ? <p className={`mt-1 text-xs ${keyMsg.startsWith("✓") ? "text-accent" : "text-danger"}`}>{keyMsg}</p> : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Implement `components/settings/SwapDefaultsSettings.tsx`**

```tsx
"use client";
import { useSettings } from "@/contexts/SettingsContext";

export function SwapDefaultsSettings() {
  const { settings, update } = useSettings();
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5">
      <h2 className="text-sm font-semibold">Swap defaults</h2>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Slippage (bps)
          <input
            type="number" min={0} max={10000} value={settings.slippageBps}
            onChange={(e) => update({ slippageBps: Math.max(0, Math.min(10000, Number(e.target.value) || 0)) })}
            className="rounded-lg border border-edge bg-bg px-3 py-2 font-num text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Platform fee (bps)
          <input
            type="number" min={0} max={10000} value={settings.platformFeeBps}
            onChange={(e) => update({ platformFeeBps: Math.max(0, Math.min(10000, Number(e.target.value) || 0)) })}
            className="rounded-lg border border-edge bg-bg px-3 py-2 font-num text-sm text-ink"
          />
        </label>
      </div>
      <fieldset className="mt-4">
        <legend className="text-xs text-ink-muted">Affiliate (fee vault routing)</legend>
        <div className="mt-1 flex gap-2">
          {(["pond0x", "aquavaults"] as const).map((a) => (
            <button
              key={a} type="button" onClick={() => update({ affiliate: a })}
              className={`rounded-lg px-4 py-2 text-xs font-semibold ${settings.affiliate === a ? "bg-accent/10 text-accent border border-accent" : "border border-edge text-ink-muted"}`}
            >
              {a}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-4">
        <legend className="text-xs text-ink-muted">Theme</legend>
        <div className="mt-1 flex gap-2">
          {(["dark", "light", "system"] as const).map((t) => (
            <button
              key={t} type="button" onClick={() => update({ theme: t })}
              className={`rounded-lg px-4 py-2 text-xs font-semibold ${settings.theme === t ? "bg-accent/10 text-accent border border-accent" : "border border-edge text-ink-muted"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
```

- [ ] **Step 3: Full gates and commit**

```bash
npm run build && npx vitest run
git add components/settings
git commit -m "feat: add settings page components (unwired)"
```

---

# Phase 6 — Cutover (one commit switches the app to the new world)

### Task 16: Tailwind v4 upgrade + wire the new shell

After this task the app runs entirely on the new stack. Old-world files still exist but are no longer imported (deleted in Task 18) — they must still compile.

**Files:**
- Modify: `package.json` (deps), `postcss.config.js`, `app/layout.tsx`, `app/page.tsx`, `components/layout/ClientProviders.tsx`
- Create: `app/settings/page.tsx`
- Delete: `tailwind.config.ts`, `styles/globals.css`, `styles/modern-effects.css`, `styles/pond-water-background.css`, `styles/pond-dashboard.css`

**Interfaces:**
- Consumes: everything from Tasks 6–15
- Produces: the running app

- [ ] **Step 1: Upgrade Tailwind**

```bash
npm install tailwindcss@latest @tailwindcss/postcss@latest
```

Replace the full contents of `postcss.config.js`:

```js
module.exports = { plugins: { "@tailwindcss/postcss": {} } };
```

- [ ] **Step 2: Check for stray old-stylesheet imports**

```bash
grep -rn "styles/globals\|modern-effects\|pond-water-background\|pond-dashboard" --include='*.ts*' --include='*.css' app components
```
Expected: only `app/layout.tsx` (rewritten next step). Remove any other import found.

- [ ] **Step 3: Rewrite `components/layout/ClientProviders.tsx`**

```tsx
"use client";
import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { Toaster } from "sonner";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { SwapConfigProvider } from "@/contexts/SwapConfigContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { ActivityProvider } from "@/contexts/ActivityContext";
import { RigProvider } from "@/contexts/RigContext";
import { useSwapRecorder } from "@/hooks/useSwapRecorder";
import { DEFAULT_RPC } from "@/lib/vaults";
import "@solana/wallet-adapter-react-ui/styles.css";

/** Mounted once: captures swap lifecycle events into the portfolio store. */
function SwapRecorderMount() {
  useSwapRecorder();
  return null;
}

/** Solana providers need the user-configured RPC from SettingsContext. */
function SolanaProviders({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const endpoint = settings.rpc || DEFAULT_RPC;
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={endpoint} key={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <SolanaProviders>
        <SwapConfigProvider>
          <SessionProvider>
            <ActivityProvider>
              <RigProvider>
                <SwapRecorderMount />
                {children}
                <Toaster position="bottom-right" richColors />
              </RigProvider>
            </ActivityProvider>
          </SessionProvider>
        </SwapConfigProvider>
      </SolanaProviders>
    </SettingsProvider>
  );
}
```

- [ ] **Step 4: Rewrite `app/layout.tsx`**

```tsx
import "./globals.css";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { ClientProviders } from "@/components/layout/ClientProviders";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Pond0matic",
  description: "Pond0x mining cockpit — boost swapper, rig stats, portfolio.",
};

// Sets .dark before first paint to avoid a light-mode flash. Reads the same
// localStorage key SettingsContext uses; falls back to dark.
const themeInit = `(function(){try{var s=JSON.parse(localStorage.getItem("pond0matic:settings")||"{}");var t=s.theme||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){document.documentElement.classList.add("dark");}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <ClientProviders>
          <AppShell>{children}</AppShell>
        </ClientProviders>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Rewrite `app/page.tsx` (cockpit)**

```tsx
"use client";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { SwapPanel } from "@/components/swap/SwapPanel";
import { MobileSwapSheet } from "@/components/swap/MobileSwapSheet";

export default function DashboardPage() {
  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <DashboardTabs />
      </div>
      <div className="hidden w-[340px] shrink-0 xl:block">
        <div className="sticky top-6">
          <SwapPanel />
        </div>
      </div>
      <MobileSwapSheet />
    </div>
  );
}
```

- [ ] **Step 6: Create `app/settings/page.tsx`**

```tsx
"use client";
import { ConnectionSettings } from "@/components/settings/ConnectionSettings";
import { SwapDefaultsSettings } from "@/components/settings/SwapDefaultsSettings";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-lg font-bold">Settings</h1>
      <ConnectionSettings />
      <SwapDefaultsSettings />
    </div>
  );
}
```

- [ ] **Step 7: Delete the old styling stack**

```bash
git rm tailwind.config.ts styles/globals.css styles/modern-effects.css styles/pond-water-background.css styles/pond-dashboard.css
```

If `styles/` still contains other files, leave them for Task 18's zero-importer sweep.

- [ ] **Step 8: Fix any portfolio component importing old-world modules**

```bash
grep -rn "useSwapperContext\|useToast\|SwapperContext" --include='*.ts*' components/portfolio hooks/usePondwaterPnL.ts hooks/useSwapHistory.ts hooks/useSwapRecorder.ts
```
For each hit: replace `useToast()` calls with `toast.success/error/info` from `sonner`; replace any `useSwapperContext()` field with the equivalent new hook (`useSettings`, `useSwapConfig`, `useActivity`). Expected: few or zero hits.

- [ ] **Step 9: Build, test, smoke-test**

```bash
npm run build && npx vitest run
```
Then `npm run dev` and verify manually:
1. App loads dark, sidebar shows Dashboard/Portfolio/Settings, no old header bars.
2. "Connect" opens the 3-step modal; RPC test and key test give live feedback; swap panel unlocks only after wallet + RPC ✓ + key ✓.
3. Dashboard subnav switches Rig / Prices / Activity; Prices shows SOL + wPOND.
4. Theme toggle flips light/dark; reload keeps the choice.
5. `/portfolio` and `/settings` render inside the shell.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat!: cut over to sidebar cockpit shell on Tailwind v4 Deep Pond theme"
```

### Task 17: Restyle portfolio components to semantic tokens

**Files:**
- Modify: every file in `components/portfolio/` (PortfolioPage, SwapHistoryPanel, SwapHistoryRow, SwapHistoryFilters, PondwaterPnLPanel, PnLBreakdown, and siblings)

**Interfaces:**
- Consumes: Task 10 token classes
- Produces: visually consistent portfolio; NO logic changes (PnL math and storage are untouched)

- [ ] **Step 1: Sweep classNames using the standard mapping**

Apply to every portfolio component, changing ONLY `className` strings:

| Old pattern | New |
|---|---|
| `bg-black`, `bg-black/40`, `bg-gray-900`, `bg-slate-900`, `bg-[#…]` dark bg | `bg-surface` (cards) or `bg-bg` (insets) |
| `bg-gray-800`, `bg-white/5`, `bg-white/10` | `bg-surface-2` |
| `border-gray-*`, `border-white/10`, `border-slate-*` | `border-edge` |
| `text-white`, `text-gray-100` | `text-ink` |
| `text-gray-400/500`, `text-slate-400`, `text-muted` | `text-ink-muted` |
| green/emerald/lily text or bg (positive PnL, accents) | `text-accent` / `bg-accent` |
| red text or bg (negative PnL, errors) | `text-danger` / `bg-danger` |
| amber/yellow | `text-warn` |
| any `fire-*`, `ice-*`, `void-*`, `lily-*`, `mining-*`, `glass-*`, `neomorph-*`, `shadow-*-glow`, `animate-(neon|ripple|glow|float|shimmer)*` | delete the class |
| numeric spans (amounts, dates, tx ids) | add `font-num` |

- [ ] **Step 2: Verify no old-theme classes remain in portfolio**

```bash
grep -rn "fire-\|ice-\|void-\|lily-\|mining-\|glass-\|neomorph-" components/portfolio
```
Expected: zero hits.

- [ ] **Step 3: Build, visual check, commit**

```bash
npm run build && npx vitest run
```
`npm run dev` → `/portfolio`: history rows, filters, PnL cards legible in dark AND light.

```bash
git add components/portfolio
git commit -m "refactor: restyle portfolio to Deep Pond semantic tokens"
```

---

# Phase 7 — Delete the old world, docs, final verification

### Task 18: Delete legacy shell, swapper, contexts and dead dependencies

**Files:**
- Delete: `contexts/SwapperContext.tsx`, `hooks/useSwapExecution.ts`, `hooks/useWallet.ts`, `hooks/useToast.ts`, `components/CompactSwapper/` (dir), `components/layout/TopNavigation.tsx`, `components/layout/StatusBar.tsx`, `components/layout/SwapModeNavigation.tsx`, `components/layout/LayoutClient.tsx`, `components/Dashboard.tsx`, `components/swapper/` (dir), `components/wallet/WalletBar.tsx`, `components/ui/Toast.tsx`, `lib/confetti.ts`, `lib/windowHelpers.ts`, plus every zero-importer file found in step 2 (water/animation components, PondWaterBackground, unused ui components, unused icons)
- Modify: `package.json` (remove deps)

**Interfaces:**
- Consumes/Produces: nothing — pure deletion

- [ ] **Step 1: Delete the known legacy set**

```bash
git rm contexts/SwapperContext.tsx hooks/useSwapExecution.ts hooks/useWallet.ts hooks/useToast.ts
git rm -r components/CompactSwapper components/swapper
git rm components/layout/TopNavigation.tsx components/layout/StatusBar.tsx components/layout/SwapModeNavigation.tsx components/layout/LayoutClient.tsx
git rm components/Dashboard.tsx components/wallet/WalletBar.tsx components/ui/Toast.tsx lib/confetti.ts lib/windowHelpers.ts
```

If a `git rm` fails because something still imports the file, that importer is legacy too — trace it (`grep -rln "<name>"`), delete or fix the importer first. `lib/windowHelpers.ts`: confirm first that only deleted files imported `getPhantomProvider` (`grep -rn "windowHelpers\|getPhantomProvider" --include='*.ts*' app components hooks lib contexts`).

- [ ] **Step 2: Zero-importer sweep for remaining orphans**

For each file under `components/` and `hooks/` and `lib/` and `styles/`, check whether anything imports it:

```bash
for f in $(git ls-files 'components/**/*.tsx' 'components/*.tsx' 'hooks/*.ts' 'lib/*.ts' 'styles/*'); do
  name=$(basename "$f" | sed 's/\.[^.]*$//');
  hits=$(grep -rl "$name" --include='*.ts' --include='*.tsx' --include='*.css' app components hooks lib contexts tests tools | grep -v "^$f$" | wc -l);
  [ "$hits" -eq 0 ] && echo "ORPHAN: $f";
done
```

Review the ORPHAN list by hand (name-based grep has false negatives for index re-exports — check `components/icons/index.ts` exports specifically). Expected orphans include: `components/ui/TokenPriceSkeleton.tsx`, `components/ui/LiveIndicator.tsx`, `components/ui/LilyPadCard.tsx`, water/animation components (`BubbleAnimation`, `WaterRipple`, `DewdropGlow`, `PondWaterBackground`), most of `components/icons/card/*`. Delete every confirmed orphan with `git rm`. Do NOT delete: anything under `lib/portfolio`, `lib/clicker`, `lib/alerts` (already gone), `tools/`, `autoclicker/`, or hooks used by the engine (`useBalances`, `useActivityLog`, `useMiningRig`, `useVisibilityPolling`, `useTokenPrices`, `useClickerControl`, `useSwapRecorder`, `useSwapHistory`, `usePondwaterPnL`, `useWalletBalances`).

- [ ] **Step 3: Remove dead dependencies**

```bash
npm uninstall canvas-confetti @types/canvas-confetti autoprefixer
```

Then verify nothing references them: `grep -rn "canvas-confetti\|autoprefixer" --include='*.ts*' --include='*.js' app components hooks lib contexts postcss.config.js`
Expected: zero hits.

- [ ] **Step 4: Full gates**

```bash
npm run build && npm run lint && npx vitest run
```
Expected: all green. Run `npm run dev` once more and click through all three pages.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: delete legacy shell, SwapperContext, useSwapExecution and dead deps"
```

### Task 19: Documentation, CLAUDE.md and final review

**Files:**
- Modify: `CLAUDE.md`, `QUICK_START.md`, `USER_MANUAL.md`, `INSTALLATION_MANUAL.md`

**Interfaces:** none

- [ ] **Step 1: Update `CLAUDE.md`**

Apply these content changes (keep everything else):
- Commands: replace the vitest single-file example if the path changed; add `Tailwind CSS v4 — CSS-first config in app/globals.css, no tailwind.config.ts`.
- Architecture map: replace the `contexts/SwapperContext.tsx` and `hooks/useSwapExecution.ts` bullets with: `contexts/` (SettingsContext, SwapConfigContext, SessionContext, ActivityContext, RigContext — one concern each), `lib/swap/` (pure sessionPlanner + orders with zod), `hooks/useSwapEngine.ts` (the orchestrator), `components/swap/`, `components/dashboard/`, `components/layout/` (AppShell/Sidebar), `components/connect/`.
- Remove the `lib/alerts` bullet; convention #2's model example becomes `lib/swap/sessionPlanner.ts` + `useSwapEngine`.
- Convention #1: drop the parenthetical about the legacy path (it is removed now).
- Key external facts: add `Swaps use Jupiter Swap API v2 order-and-execute (api.jup.ag/swap/v2/order + /execute; docs: developers.jup.ag/docs/swap/order-and-execute) — API key required (portal.jup.ag), collected in the connect flow; Jupiter lands the transaction after /execute. Price feed lite-api.jup.ag stays keyless.`
- Docs section: note alerts feature removed as of this refactor spec.

- [ ] **Step 2: Sync the user manuals**

- `QUICK_START.md`: fix `cp .env.local.example .env.local` → `cp .env.example .env.local`; replace the "First Use" section with the new flow (Connect button → wallet → RPC → Jupiter API key); swap modes table stays.
- `USER_MANUAL.md` / `INSTALLATION_MANUAL.md`: remove alerts sections; update navigation description (sidebar: Dashboard/Portfolio/Settings; dashboard tabs Rig/Prices/Activity; swap panel on the right); mention the required Jupiter API key with portal.jup.ag link.

- [ ] **Step 3: Full gates**

```bash
npm run build && npm run lint && npx vitest run
```

- [ ] **Step 4: Security review of the swap path**

Dispatch the `solana-code-reviewer` agent over the final diff with focus files: `hooks/useSwapEngine.ts`, `lib/swap/orders.ts`, `lib/swap/sessionPlanner.ts`, `contexts/SettingsContext.tsx`, `lib/settings/validation.ts`, `components/connect/ConnectSetupModal.tsx`, `components/swap/*`. Fix every finding rated important or higher before finishing; re-run gates after fixes.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: update CLAUDE.md and user manuals for the cockpit refactor"
```

---

## Execution order summary

| Phase | Tasks | App state after |
|---|---|---|
| 1 Cleanup | 1–3 | Old UI, minus alerts/dead code |
| 2 Pure logic | 4–5 | Unchanged UI; planner+orders tested |
| 3 Contexts | 6–8 | Unchanged UI; new contexts compiled |
| 4 Engine | 9 | Unchanged UI; engine compiled |
| 5 New UI | 10–15 | Unchanged UI; new components compiled |
| 6 Cutover | 16–17 | New app live on Tailwind v4 |
| 7 Cleanup | 18–19 | Legacy gone, docs current, reviewed |






