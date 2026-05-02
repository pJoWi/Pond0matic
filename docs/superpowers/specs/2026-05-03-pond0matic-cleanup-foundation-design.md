# Pond0matic — Cleanup, Refactor & Wallet Foundation (Phase 1)

**Date**: 2026-05-03
**Status**: Approved design, ready for implementation plan
**Scope**: Phase 1 of a two-phase project. Phase 2 (features) follows in a separate spec after Phase 1 ships.

---

## 1. Goal

Make the Pond0matic codebase a healthy foundation for future feature work by:

1. Removing dead code and abandoned experiments (AI terminal module, backup files, unused routes, mock wallet docs).
2. Splitting the 1291-line `CompactPond0xDashboard.tsx` monolith into focused, single-purpose units.
3. Replacing the mock wallet bar with a real Phantom wallet integration via `@solana/wallet-adapter-*`.

Phase 2 (separate spec, separate plan) will then build the user-requested features on top of this foundation:

- Live rig health monitoring with alerts
- Spawn/swap performance tracking & history
- Pondwater balance tracker with PnL
- Price alerts (wPOND/PNDC movements)

Wallet adapter is in Phase 1 because all four Phase 2 features depend on a connected wallet.

---

## 2. Cleanup

### Files to delete

**AI Terminal module:**
- `app/ai-terminal/page.tsx` and the `app/ai-terminal/` directory
- `lib/pond0x/` directory (`aiResponseHandler.ts`, `calculators.ts`, `dataFetcher.ts`, `index.ts`, `knowledgeBase.ts`, `quickCommands.ts`)
- `AI_TERMINAL_QUICK_REFERENCE.md`
- `IMPLEMENTATION_SUMMARY.md`
- `POND0X_AI_INTEGRATION_OVERVIEW.md`
- `POND0X_AI_TERMINAL_INTEGRATION.md`

**Dead component files** (verified: zero imports found):
- `components/layout/TopNavigation.backup.tsx`
- `components/layout/TopNavigationRedesigned.tsx`

**Unused routes:**
- `app/compact/` directory
- `app/unified/` directory (logic ports to `app/page.tsx` first — see Section 4)

**Mock wallet bar docs** (replaced by real implementation):
- `WALLET_BAR_COMPONENT_STRUCTURE.md`
- `WALLET_BAR_STYLING_REFERENCE.md`
- `WALLET_BAR_VISUAL_MOCKUP.md`
- `WALLET_CONNECTION_BAR_IMPLEMENTATION.md`

### Files to investigate during implementation

Conditional on grep results — delete only if zero imports found:
- `lib/utils/tokenTags.ts`
- `components/icons/WarningIcon.tsx`
- `components/icons/tokens/TokenIcon.tsx`

### Files explicitly kept

- `QUICK_START.md`, `INSTALLATION_MANUAL.md`, `USER_MANUAL.md` (still relevant)
- All `app/api/*` endpoints (used by dashboard)
- `components/Dashboard.tsx`, `components/CompactSwapper/`, `components/swapper/MiningRigDashboard.tsx`
- `hooks/`, `contexts/`, `lib/vaults.ts`

---

## 3. Component split

### Current state

`components/swapper/CompactPond0xDashboard.tsx` is 1291 lines and contains:

- A mock wallet bar (`renderWalletBar`)
- Header rendering with logo, badges, pro tier
- Token price section (Solana + Ethereum)
- Mining stats (health bar, pro tier card, transaction metrics)
- Inline subcomponents (`WaterRipple`, `DewdropGlow`, `LiveIndicator`, `LilyPadCard`)
- Token icon URL constants and badge emoji map
- Direct `fetch()` calls to CoinGecko, DexScreener, and internal APIs
- A `<style jsx global>` block with seven `@keyframes` animations and a Google Fonts import

### Target structure

```
components/
  swapper/
    CompactPond0xDashboard.tsx      ~150 lines, composition only
    sections/
      DashboardHeader.tsx           ~120 lines — logo, badges, pro tier, live indicator
      TokenPricesPanel.tsx          ~150 lines — Solana + Ethereum chain sections
      MiningStatsPanel.tsx          ~200 lines — health bar, pro tier, transaction metrics
  wallet/
    WalletBar.tsx                   real wallet UI (see Section 5)
  ui/
    LilyPadCard.tsx                 reusable metric card
    WaterRipple.tsx                 ripple effect
    DewdropGlow.tsx                 glow accent
    LiveIndicator.tsx               pulsing live dot
hooks/
  useTokenPrices.ts                 all price fetching (CoinGecko, DexScreener, internal API)
  useWalletBalances.ts              SOL + filtered SPL token balances
lib/
  tokenIcons.ts                     TOKEN_ICONS const + getTokenIcon helper
  badges.ts                         BADGE_EMOJIS map + getBadgeEmoji helper
styles/
  globals.css                       all @keyframes (existing file, animations move here)
```

### Split rules

1. **No fetching in UI files.** Price fetching moves to `useTokenPrices`. UI components receive data via props or hooks.
2. **No subcomponents inside components.** `WaterRipple`, `LilyPadCard`, etc. each get their own file in `components/ui/`.
3. **No global styles in components.** All `<style jsx global>` keyframes move to `styles/globals.css`. The Google Fonts import moves to `app/layout.tsx`'s metadata or to `globals.css`.
4. **Centralized token data.** `TOKEN_ICONS` and `BADGE_EMOJIS` move to `lib/`.
5. **Focused props.** Each section panel takes only the props it needs, not the full 18-prop dashboard interface.

### Composer after split

```tsx
export function CompactPond0xDashboard(props: CompactPond0xDashboardProps) {
  const prices = useTokenPrices();
  return (
    <DashboardShell>
      {props.variant !== "stats" && <DashboardHeader badges={props.badges} isPro={props.isPro} />}
      {props.variant !== "stats" && <WalletBar />}
      {props.variant !== "stats" && <TokenPricesPanel prices={prices} />}
      {props.variant !== "tokens" && <MiningStatsPanel {...miningProps} />}
    </DashboardShell>
  );
}
```

Pure composition. Target: ~150 lines (down from 1291).

### Migration sequence

Each step is its own commit so layout regressions can be reverted in isolation.

1. Extract `useTokenPrices` hook (pure logic, easy to verify in isolation).
2. Move `TOKEN_ICONS` to `lib/tokenIcons.ts`, `BADGE_EMOJIS` to `lib/badges.ts`.
3. Move animations from `<style jsx global>` to `styles/globals.css`.
4. Extract UI subcomponents (`WaterRipple`, `DewdropGlow`, `LiveIndicator`, `LilyPadCard`) one at a time.
5. Extract `DashboardHeader` section.
6. Extract `TokenPricesPanel` section.
7. Extract `MiningStatsPanel` section.
8. Verify composer is now ~150 lines and contains only composition.

After each step: `npm run dev`, visual check, console clean, `/` and `/swapper` both load.

### Out of scope for this phase

- No restyle. Pond-water aesthetic stays 1:1 visually.
- No Tailwind config changes. Color tokens unchanged.
- No prop renaming on the public `CompactPond0xDashboard` interface (callers should not need to change).

---

## 4. Routes

### Final structure

```
app/
  page.tsx          /          dashboard with slide-in swapper drawer
  swapper/page.tsx  /swapper   standalone full-page swapper
  api/              unchanged
  layout.tsx        unchanged, with cleaned-up TopNavigation
```

### Changes to `app/page.tsx`

Currently pushes to `/swapper` on swapper open. Becomes a self-contained page with an inline drawer:

- Renders `<Dashboard>` (which composes `CompactPond0xDashboard`).
- Manages local `swapperOpen` state.
- Opens slide-in panel containing `<CompactSwapper>` when triggered.
- Escape key closes the drawer.
- Wraps `CompactSwapper` in `SwapperProvider` (ported from current `app/unified/page.tsx`).

### Changes to `app/swapper/page.tsx`

Currently lacks `SwapperProvider`, which means context-dependent features fail silently. Add `SwapperProvider` wrapping `CompactSwapper` with the same configuration (`SOL_MINT`, `WPOND_MINT`, vault constants, env-driven defaults) used in the unified page.

### Reuse from `/unified` before deletion

Port the following before deleting `app/unified/page.tsx`:

- Drawer Escape-key `useEffect`
- Drawer overlay/slide-in styling

If the drawer is needed on multiple pages later it can be extracted to `components/layout/SwapperDrawer.tsx`. For now, inline in `app/page.tsx` is sufficient.

### Navigation cleanup

- `components/layout/TopNavigation.tsx`: remove any links to `/compact` and `/unified`. Keep links to `/` and `/swapper`.
- `components/layout/SwapModeNavigation.tsx`: audit for dead-route references; remove if any.

### Migration sequence

1. Port `/unified` page logic into `app/page.tsx`.
2. Add `SwapperProvider` to `app/swapper/page.tsx`.
3. Clean dead links from `TopNavigation` and `SwapModeNavigation`.
4. Delete `app/compact/` and `app/unified/` directories.
5. Smoke test both routes.

### Out of scope

- No new routes (`/wallet`, `/history`, `/alerts` etc. — those belong to Phase 2).
- No URL state for drawer (`?swapper=open` not needed; local state is enough).

---

## 5. Wallet adapter integration

### Package selection

```
@solana/wallet-adapter-base
@solana/wallet-adapter-react
@solana/wallet-adapter-react-ui
@solana/wallet-adapter-phantom
```

Only Phantom adapter registered for now (single-wallet scope). The standard `WalletModalProvider` modal is used for connect/install UI; custom-styled modal can come later if it visually clashes with the pond-water theme.

### Provider tree

Mounted in `components/layout/ClientProviders.tsx` (existing client-only provider host):

```
ClientProviders
  └─ ConnectionProvider (endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC || mainnet-beta default)
       └─ WalletProvider (adapters: [PhantomWalletAdapter], autoConnect: true)
            └─ WalletModalProvider
                 └─ {children}
```

RPC endpoint: prefer `process.env.NEXT_PUBLIC_SOLANA_RPC`, fall back to `DEFAULT_RPC` from `lib/vaults`, then to mainnet-beta cluster URL. Document the env var in `QUICK_START.md`.

### `WalletBar.tsx`

Location: `components/wallet/WalletBar.tsx`. Replaces the inline `renderWalletBar()` and `mockWalletData` from `CompactPond0xDashboard.tsx`.

Two states:

**Disconnected:**
- Pond-themed "Connect Wallet" button.
- Click opens `WalletModalProvider` modal (Phantom-only adapter list).

**Connected:**
- Collapsed bar: green "Connected" pill, SOL balance (real), truncated address, expand chevron.
- Expanded: full address with copy button, token balance list with USD values, total portfolio value, real disconnect button.

### Hooks

**`useWallet()`** (from adapter): `publicKey`, `connected`, `disconnect`, `wallet`.

**`useConnection()`** (from adapter): the Solana RPC connection.

**`useWalletBalances(publicKey)`** (new, in `hooks/useWalletBalances.ts`):

- If `publicKey` is null: returns `{ sol: 0, tokens: [], loading: false, error: null }`.
- SOL balance via `connection.getBalance(publicKey)`.
- SPL tokens via `connection.getParsedTokenAccountsByOwner(publicKey, {programId: TOKEN_PROGRAM_ID})`.
- Filters returned tokens to those whose mint matches a key in `TOKEN_ICONS` (wPOND, pondSOL, USDC, USDT, etc.). Other tokens are dropped from the UI for now.
- Computes USD value per token by joining with prices from `useTokenPrices`.
- Refresh: manual trigger + 60-second polling. No more frequent polling (RPC rate limits).
- On RPC error: returns `{ sol: 0, tokens: [], loading: false, error: <Error> }`. Bar shows "Balances unavailable" subtext, does not crash.
- Hook must be safe to call when wallet is disconnected (returns empty disconnected state).

### Mint addresses

`TOKEN_ICONS` in `lib/tokenIcons.ts` is extended to a structured map keyed by symbol with `{ icon, mint }`:

```ts
export const TOKENS = {
  SOL: { mint: "So11111111111111111111111111111111111111112", icon: "..." },
  wPOND: { mint: "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq", icon: "..." },
  USDC: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", icon: "..." },
  USDT: { mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", icon: "..." },
  // pondSOL: TBD — current code has a placeholder mint (`pondSoL1111...`).
  //          Real mint must be sourced before pondSOL is included in the wallet balance lookup.
};
```

The placeholder pondSOL mint in the current code (`pondSoL1111111111111111111111111111111111111`) is removed and pondSOL is excluded from `useWalletBalances` until a real mint is sourced. Token price display can keep its current behavior (DexScreener call returns 0 silently).

### Address copy & disconnect

- Copy: `navigator.clipboard.writeText(publicKey.toBase58())` + existing `toast.success`.
- Disconnect: `disconnect()` from `useWallet()` (real, no more "coming soon" toast).

### Error paths

- Phantom not installed → standard adapter modal shows install link (no extra work).
- RPC failure → empty balance state, "Balances unavailable" subtext, no crash.
- User rejects connect → `toast.info("Connection cancelled")`, state stays disconnected.

### SSR

Wallet adapter components are client-only. `WalletBar.tsx` and `ClientProviders.tsx` carry `"use client"`.

### Migration sequence

1. Install the four packages.
2. Wrap `ClientProviders` with the three providers.
3. Build `WalletBar` with disconnected state only — verify connect/disconnect work.
4. Remove `mockWalletData` and inline `renderWalletBar()` from `CompactPond0xDashboard.tsx`. Mount `<WalletBar />` in its place.
5. Build `useWalletBalances` with SOL only — wire to expanded state.
6. Add SPL token enumeration + filter to `useWalletBalances`.
7. Wire USD values via `useTokenPrices` integration.

This work happens on a feature branch (`feature/wallet-adapter`) — wallet integration is the riskiest part of Phase 1 and must not land half-finished on `main`.

### Out of scope for this phase

- No transaction signing flow (belongs to swap integration work).
- No multi-wallet support (Phantom only; adapter list is trivially extensible later).
- No wallet name customization or avatars.
- No address-to-name resolving (Bonfida, ENS-style).

---

## 6. Testing & validation

### Existing state

- `vitest` installed; `test` and `test:watch` scripts present.
- `tests/` directory exists. Coverage of existing tests will be inventoried at the start of implementation.

### Unit tests — required

**`useTokenPrices`**: mock `fetch`, verify CoinGecko → DexScreener → 0 fallback cascade, verify 30s interval cleanup on unmount.

**`useWalletBalances`**: mock `connection`, verify
- empty state when `publicKey` is null
- SOL balance correctly parsed from lamports
- SPL tokens filtered to known mints from `TOKENS`
- graceful error handling when RPC throws (empty array + error field, no crash)

**`lib/tokenIcons.ts` and `lib/badges.ts`**: trivial input/output unit tests for the getters.

### Unit tests — minimal

**`LilyPadCard`**: renders title + value, shows skeleton when `loading`, color follows `status`.

**`WalletBar`**: renders "Connect" button when disconnected; renders balance list when connected (mock `useWallet` + `useWalletBalances`).

### Integration tests

- `/` smoke test: page renders, drawer opens on click.
- `/swapper` smoke test: page renders standalone CompactSwapper.

### Not tested

- Animations and styling (visual; snapshot tests rot quickly without a test budget).
- Wallet adapter internals (trust upstream tests).
- Real RPC calls (everything mocked).
- E2E browser flows (no Playwright/Cypress in scope; manual browser check is enough for Phase 1).

### Manual validation checklist (per migration step)

Each split or migration step ends with:

1. `npm run dev` — page loads, no console errors.
2. Visual check: dashboard looks identical to before the step.
3. Both `/` and `/swapper` work.
4. Wallet flow: connect Phantom, see balance, disconnect, refresh, reconnect.
5. `npm run build` — production build passes.
6. `npm run lint` — no new warnings or errors.

### Regression safety net

- Each extraction = its own commit. Layout breaks → `git revert` one commit.
- Wallet integration on its own branch (`feature/wallet-adapter`). Merges to `main` only after wallet flow is end-to-end verified.

---

## 7. Definition of Done — Phase 1

- [ ] All files in Section 2 cleanup list deleted.
- [ ] `CompactPond0xDashboard.tsx` is < 200 lines and contains only composition.
- [ ] `useTokenPrices` and `useWalletBalances` hooks exist with unit tests.
- [ ] All animations live in `styles/globals.css`, not in any component.
- [ ] `/` shows dashboard with drawer-swapper; `/swapper` standalone works.
- [ ] `TopNavigation` contains no links to deleted routes.
- [ ] Phantom connect/disconnect works end-to-end on a real wallet.
- [ ] `npm run build`, `npm run lint`, `npm run test` all pass.
- [ ] No visual regression vs. pre-refactor (manual check).

---

## 8. Phase 2 preview (not in scope here)

After Phase 1 ships, Phase 2 builds on the same foundation:

1. **Live rig health monitoring** — uses `publicKey` from `useWallet`, polls `/api/rig`, surfaces alerts when health drops below thresholds.
2. **Spawn/swap performance tracking & history** — queries transactions for `publicKey`, persists results, charts performance over time.
3. **Pondwater PnL tracker** — uses `useWalletBalances` for current wPOND holdings, persists historical cost basis, computes unrealized PnL.
4. **Price alerts** — user-configured thresholds on wPOND/PNDC, surfaces toasts (and optionally browser notifications).

Each gets its own design doc and implementation plan. The hook layer (`useWalletBalances`, `useTokenPrices`) and the cleaned route structure are the common dependency.
