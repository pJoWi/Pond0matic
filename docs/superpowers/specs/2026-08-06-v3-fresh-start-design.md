# Pond0matic v3 Fresh-Start — Design Spec

**Date:** 2026-08-06
**Branch:** `v3-fresh-start` (off `main` @ `60098d8`)
**Status:** Approved for implementation planning

## 1. Goal

Produce one clean, canonical branch that becomes the renewed Pond0matic codebase:

- Every dependency upgraded to its latest major version.
- Verified dead code, stale docs, and abandoned git branches removed.
- The affiliate-vault → RIG-boost swap mechanic investigated, confirmed, and (only if confirmed) wired up.

The branch merges into `main`; all other local branches and the outstanding stash are pruned afterward.

## 2. Starting state (facts, verified)

- `main` (`60098d8`) is the most advanced codebase: 162 tracked files — rig boost tracker, cary0x manifest/bubbles/luck, portfolio, settings, swap engine, autoclicker. It is the agreed foundation.
- `main` is **already on Tailwind 4** (`@tailwindcss/postcss` + `tailwindcss ^4.3.3`, `app/globals.css` uses `@import "tailwindcss"` and `@theme inline`) and **Zod 4**. There is no Tailwind 3→4 migration on main.
- `main` package.json majors needing upgrade: `react`/`react-dom` 18, `next` 15, `typescript` 5, `@solana/spl-token` 0.1.8, `@types/node` 20, `@types/react(-dom)` 18, `tailwind-merge` 2.
- `@solana/web3.js` is `^1.95.2`; its npm `latest` tag is still 1.x. The 2.0 "Solana Kit" rewrite is **out of scope**.
- `lib/vaults.ts` is **not** dead: `TOKEN_NAMES` and `DEFAULT_RPC` are imported across the app. Only the vault-specific exports (`TOKEN_VAULTS_AFFILIATE_1/2`, plus `vaultMap`/`currentVault` in `SwapConfigContext.tsx`) belong to the vault→boost sub-track.
- The swap path today routes fee-free: `lib/swap/orders.ts#feeAccountForOrder(platformFeeBps, referralAccount)` returns the referral account only, never the affiliate vault (Jupiter v2 400s on the legacy vault ATA as a `referralAccount`).
- Test suite on `main`: 14 vitest files / 121 tests.
- The autoclicker stack (`autoclicker/`, `lib/clicker`, `app/api/clicker`, `hooks/useClickerControl`, `components/swap/ClickerSection`) is wired into the app and is **kept**.

## 3. Branch strategy

- Work on `v3-fresh-start`, branched from `main`.
- Each phase is its own commit (or small set of commits) with a green test gate before advancing.
- On completion: merge `v3-fresh-start` → `main`; delete stale local branches (`Jupiter/API-key`, `Layout/NavigationBar-ConnBar-StatusBar`, `Mechanics/flywheel`, `Navigation/statusbar`, `Style/pond-water-background`, `Swapper/reward-mode`, `Design/lily-pond-style`); drop `stash@{0}` after a final confirmation it holds nothing wanted.
- Full commit history preserved (no squash/orphan).

## 4. Phase 1 — Dependency upgrades (upgrade-first, incremental, test-gated)

Executed one major at a time, ordered least→most risky, financial last. After **every** step: `vitest run` green + `next build` succeeds + dev server `GET / 200`.

1. **Type packages + `tailwind-merge` 2→3 + `@types/node` 20→26** — low risk. Confirm `tailwind-merge` v3 class-merge behavior against current usage.
2. **React 18→19** — bump `react`, `react-dom`, `@types/react`, `@types/react-dom`; run the official React 19 codemod; review ref-as-prop / JSX-transform / `useRef` and `forwardRef` changes; UI smoke test.
3. **Next 15→16** — update `next.config.ts`; review async request APIs (`cookies()`/`headers()`/`params`), caching default changes, and image/remotePatterns config; `next build` + dev smoke.
4. **TypeScript 5→7** — TS 7 is the new native compiler; fix surfaced type errors and watch for changed/edge-case diagnostics; `tsc --noEmit` clean.
5. **`@solana/spl-token` 0.1.8→0.4.15** *(financial)* — audit every import/usage, adapt the changed API surface, unit-test transaction/order building, run the `solana-code-reviewer` agent before the phase commit.

**Rollback:** each step is a discrete commit; a broken upgrade is reverted without losing the others.

## 5. Phase 2 — Cleanup

Performed after Phase 1 is green.

- **Dead code:** run an import-analysis sweep (zero-import modules/exports). Verify each candidate before deletion. Explicitly **keep** `lib/vaults.ts` and the autoclicker stack. Likely candidates to verify: unused parts of `lib/referral.ts`, orphaned exports/components/hooks.
- **Docs:** present a concrete delete/keep list to the user before removing anything. Candidates: stale `docs/superpowers/specs/*` and `plans/*` that no longer match the codebase, `docs/audit/2026-07-10-audit-report.md`, `docs/LEARNING_PATH.md`, `INSTALLATION_MANUAL.md`. Keep or update only what remains accurate.
- **Git hygiene:** delete stale local branches; drop `stash@{0}` (final confirm first).

**Gate:** deletions require an explicit user OK on the list; test suite green after cleanup.

## 6. Phase 3 — Vault → RIG-boost sub-track

Investigate → confirm → document → (conditionally) wire. Financial-critical; strictly gated.

1. **Audit** — map how `vaultMap`/`currentVault`/`settings.affiliate` flow (or fail to flow) into the swap path, centered on `lib/swap/orders.ts#feeAccountForOrder` and `hooks/useSwapEngine.ts`.
2. **Confirm (free, no paid swaps)** — run the `proSwapsSol`/`AZ7F` time-test: re-read `proSwapsSol` on the user's wallet (baseline 177069) and `AZ7F5ZfzdTG2bBCtkVaYZLsSWWyYBTb9wmAFnsaFtS7o` (baseline 25708) with no new swaps. AZ7F rising while the user's stays flat ⇒ the vault fee is the signal. Both rising ⇒ `L2TExMFK` moves it (vault not required).
3. **Document** the confirmed mechanic in `.claude/skills/pond0x-protocol/SKILL.md` and the project memory.
4. **Wire (only if confirmed)** — route the platform fee to the affiliate vault, solving the Jupiter v2 400 (the vault ATA is not a valid v2 `referralAccount`) — via Jupiter v1 `feeAccount` or a valid referral account. Unit-test order building; `solana-code-reviewer` pass.

**Hard gates:** no swap-path change ships unless the confirmation supports it. The assistant never signs or submits an on-chain transaction; the user runs all real swaps.

## 7. Testing & verification

- Keep the vitest suite green after every phase; add tests for the `spl-token` adaptation and any vault-fee logic.
- `next build` + dev smoke each phase.
- `solana-code-reviewer` security pass on the `spl-token` upgrade and on any swap-path change.

## 8. Risks & rollback

- Phase isolation via commits enables single-phase revert.
- Highest functional risk: `spl-token` 0.4 (financial). Highest build risk: TS 7 and Next 16.
- The financial swap-path change is gated on the free confirmation; the assistant never executes on-chain.

## 9. Out of scope (YAGNI)

- `@solana/web3.js` 1→2 (Solana Kit) rewrite.
- New features or redesign beyond what exists on `main`.
- Porting the `Design/lily-pond-style` visual theme (foundation is `main` as-is).
