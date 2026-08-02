# Pond0matic UI Refactor — Design

**Date:** 2026-08-02
**Status:** Approved (brainstorm with mockup validation; user selected Cockpit layout, Deep Pond theme, guided connect flow, full decomposition)

## Goal

Rebuild the app shell and swap experience around the core purpose — boost
swapping to keep the Pond0x mining rig healthy — with:

- Sidebar navigation + dashboard subnav instead of three stacked header bars
- A professional swap panel that is always visible on the dashboard ("Cockpit")
- A guided connect flow requiring wallet + RPC + Jupiter API key
- A new Tailwind CSS v4 theme (dark + light) replacing all existing theming
- Removal of the alerts feature and all unused/dead code
- Full decomposition of `SwapperContext` and `useSwapExecution` into the
  pure-evaluator + orchestrator architecture (CLAUDE.md convention #2)

Swap mode functionality (Normal / Boost / Rewards) is preserved unchanged in
behavior. `lib/referral.ts` and `lib/transactionValidation.ts` are NOT touched.

## Information architecture

Three routes (was four):

| Route | Content |
|---|---|
| `/` | Dashboard cockpit: sidebar left, subnav content center, fixed swap panel right |
| `/portfolio` | Existing portfolio (history + PnL), restyled to the new theme |
| `/settings` | New: connection management (wallet/RPC/Jupiter API key), swap defaults (slippage, fees, affiliate), theme toggle |

Removed routes: `/alerts` (entire feature removed), `/swapper` (redundant —
swap panel is always visible on `/`).

**Sidebar** (`components/layout/Sidebar.tsx`): logo, nav items (Dashboard,
Portfolio, Settings), footer with three connection status LEDs (wallet, RPC,
Jupiter API) and the dark/light toggle. Collapses to an icon rail on small
screens.

**Dashboard subnav** (center column tabs):
- **Rig** — rig health, boosts, priority/luck, manifest status, session stats
- **Prices** — SOL / wPOND / USDC live prices (keyless `lite-api.jup.ag/price/v3`)
- **Activity** — full activity log (replaces `LiveActivityMonitor`)

**Mobile:** sidebar becomes an icon rail; swap panel becomes a bottom sheet
toggled by a persistent button.

## Connect flow

One "Connect" button opens `ConnectSetupModal` with three sequential steps.
Swapping is disabled until all three are valid (`setupComplete`).

1. **Wallet** — standard wallet-adapter modal (convention #1; no custom wallet
   code anywhere).
2. **RPC** — URL input + "Test" button performing a real health check
   (`getSlot` + latency display). Valid only after a passing test.
3. **Jupiter API key** — input + validation ping (cheap quote call with
   `x-api-key` header), link to portal.jup.ag to create a key.

Persistence: localStorage (`pond0matic:settings`), API key masked in UI.
Managed later on `/settings`. While setup is incomplete: swap panel shows a
disabled state with a single "Connect to swap" CTA; Prices tab always works
(keyless); Rig tab shows an empty state until a wallet is connected.

## State architecture (full decomposition)

`contexts/SwapperContext.tsx` (426 lines) is removed and replaced by:

| Context | Owns |
|---|---|
| `SettingsContext` | RPC, Jupiter API key, theme, swap defaults, `setupComplete` + validation status |
| `SwapConfigContext` | from/to mint, amount, mode, slippage, fee bps, affiliate (pond0x/aquavaults → vault mapping in `lib/vaults.ts`), boost params (swaps/round, rounds, delay), rewards params (count, amount) |
| `SessionContext` | running / paused / stopping, progress (swap i/n, round r/m), start/stop API |
| `RigContext` | rig health + manifest (wraps existing `useMiningRig`) |
| `ActivityContext` | activity log (wraps existing `useActivityLog`) |

Wallet state lives nowhere but `@solana/wallet-adapter-react` — components use
`useWallet()`/`useConnection()` directly. The RPC value from `SettingsContext`
feeds `ConnectionProvider` dynamically. Legacy `hooks/useWallet.ts` is deleted
(completes convention #1).

## Swap engine

`hooks/useSwapExecution.ts` (669 lines) is rebuilt as:

- `lib/swap/sessionPlanner.ts` — **pure**: `(mode, config) → next-step plan`
  (ordering, amounts incl. micro-randomization, delays, round boundaries,
  infinite-session stepping, stop conditions). Truth-table tested.
- `lib/swap/quotes.ts` — **pure**: Jupiter quote/swap request builders + Zod
  schemas validating responses at the boundary (convention #3). Endpoints:
  `api.jup.ag/swap/v1/quote|swap` with `x-api-key` header (key required via
  setup flow).
- `hooks/useSwapEngine.ts` — the single orchestrator owning side effects:
  quote → validate (`lib/transactionValidation`) → sign (wallet-adapter) →
  send → confirm → log/emit portfolio events.

Unchanged and untouched: `lib/referral.ts`, `lib/transactionValidation.ts`
(tested, financial-critical). The new engine calls them exactly as today.
Swap mode behavior (Normal / Boost / Rewards semantics, defaults, affiliate
vault routing) is preserved.

## Swap panel components

New `components/swap/` (replaces `components/CompactSwapper/`), one exported
component per file, ≤ ~200 lines each:

`SwapPanel` (shell) · `ModeTabs` · `AmountCard` · `ModeConfigRow` ·
`SessionButton` (start/stop) · `SessionProgress` · `MiniFeed` (last swaps) ·
`ClickerSection` (collapsible autoclicker controls, still
`CLICKER_ENABLED`-gated).

## Theme — Tailwind CSS v4 "Deep Pond"

- Upgrade `tailwindcss` 3.4 → 4.x with `@tailwindcss/postcss`;
  **`tailwind.config.ts` (305 lines) is deleted** — v4 is CSS-first.
- One `app/globals.css` with `@import "tailwindcss"` + `@theme` tokens:
  - Pond-tinted neutrals: bg `#0b1512`, surface `#101d18`, border `#1d312a`,
    text `#d7e5de`, muted `#7c9c8f`
  - Accent: emerald (`#34d399` → `#10b981`); amber/red for stop/warnings
  - Semantic tokens (`--color-surface`, `--color-accent`, …) — components
    never use raw hex values
  - Fonts: Inter via `next/font` for UI; `font-mono` + `tabular-nums` for ALL
    numbers, amounts, addresses, tx ids
  - Radius and subtle shadow tokens
- **Dark/light**: `@custom-variant dark` with `.dark` class on `<html>`;
  toggle in sidebar footer; default follows `prefers-color-scheme`; persisted
  in `SettingsContext`. Light variant: warm gray-green background, white cards.
- Motion: subtle transitions only. All neon/ripple/glow keyframes and the
  fire/ice/void mode themes are removed — modes differ by label and accent
  usage, not by wholesale color swaps.

## Removal list

Features:
- Alerts: `app/alerts/`, `components/alerts/`, `lib/alerts/`,
  `hooks/useAlertEngine.ts`, `hooks/useAlertsBadgeCount.ts`,
  `hooks/useNotificationPermission.ts`, `tests/alerts/`
- `/swapper` page; `LiveActivityMonitor` (superseded by Activity tab)

Shell/theming:
- `components/layout/TopNavigation.tsx` (1729), `StatusBar.tsx` (718),
  `SwapModeNavigation.tsx` (384); `LayoutClient` rebuilt minimal
- `PondWaterBackground`, `BubbleAnimation`, `WaterRipple`, `DewdropGlow`
- `styles/modern-effects.css` (724), `pond-water-background.css`,
  `pond-dashboard.css`, `tailwind.config.ts`
- Confetti: `lib/confetti.ts` + `canvas-confetti` dependency

Dead code:
- `hooks/useWallet.ts` (legacy wallet path)
- Unused assets: `public/leaf*.png`, `pond0x-bubble.png`, `pond0x-logo_.png`
- API routes `pndc-stats`, `pork-stats`, `vault-balance`, `wpond-price`,
  `wpond-stats` — each verified unused via grep before deletion
- `components/CompactSwapper/` after the new panel replaces it

Kept: portfolio (all of `lib/portfolio/`, `components/portfolio/`),
autoclicker (Python process, `app/api/clicker/*`, policy evaluator in
`lib/clicker/`), rig data hooks, `sonner` toasts, `tools/` (untouched).

## Testing & safety

- `sessionPlanner`: truth-table tests per mode (counts, delays, infinite
  behavior, stop conditions) following `swap-testing` patterns
- `quotes.ts`: Zod schema tests with fixture responses
- Existing tests stay green: portfolio, clicker policy, utils, tools-core;
  alerts tests are removed with the feature
- Phased migration — the app builds and works after every phase; each phase
  gates on `npm run build` + `npm run lint` + `npx vitest run`
- `solana-code-reviewer` review of the full swap path before merge

## Out of scope

- No changes to `tools/` (read-only toolkit), `lib/referral.ts`,
  `lib/transactionValidation.ts`, PnL math, or the Python clicker process
- No new swap features; behavior parity for all three modes
- No wallet adapters beyond Phantom (unchanged)
