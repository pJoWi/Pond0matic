# Pond0matic v3 Fresh-Start Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one clean `v3-fresh-start` branch with all dependencies on their latest majors, verified dead code/docs/branches removed, and the affiliate-vault → RIG-boost swap mechanic investigated and conditionally wired — then merged to `main`.

**Architecture:** Work proceeds in three phases on the `v3-fresh-start` branch (already created off `main` @ `60098d8`, with the design spec committed as `44ce954`). Phase 1 upgrades dependencies one major at a time, each behind a green test+build+smoke gate. Phase 2 removes verified-dead code and stale docs. Phase 3 audits and (only on confirmation) wires the financial swap-path change. Each task is a discrete commit so any single phase can be reverted.

**Tech Stack:** Next.js (App Router) + React + TypeScript + Tailwind 4 (`@tailwindcss/postcss`, CSS-first) + Zod 4 + Vitest + `@solana/web3.js` 1.x + `@solana/wallet-adapter-*`. Package manager: npm 11. Node v24.11.1. Platform: Windows (PowerShell + Git Bash).

## Global Constraints

- Work only on branch `v3-fresh-start`. Never commit to `main` until the final merge task.
- After **every** upgrade task: `npm run test` green, `npm run build` succeeds, dev server returns `GET / 200`. Do not advance on a red gate.
- `@solana/web3.js` stays on `^1.95.2` (its npm `latest` is 1.x; the 2.0 "Solana Kit" rewrite is out of scope).
- `@types/node` is pinned to `^24` to match the Node v24 runtime — NOT the npm-`latest` 26. Types ahead of the runtime produce false diagnostics.
- Keep `lib/vaults.ts` (`TOKEN_NAMES`, `DEFAULT_RPC` are imported app-wide) and the entire autoclicker stack (`autoclicker/`, `lib/clicker`, `app/api/clicker`, `hooks/useClickerControl`, `components/swap/ClickerSection`).
- Never delete a file/export/doc without first confirming zero usage (dead-code tasks) or presenting the list to the user (docs task).
- Financial swap-path changes (Phase 3) ship only if the free confirmation test supports them. The implementer NEVER signs or submits an on-chain transaction; the user runs all real swaps.
- Commit `package.json` + `package-lock.json` together on every dependency change.
- Latest version targets (npm `latest` at plan time): `next@16.3.0`, `react@19.2.8`, `react-dom@19.2.8`, `@types/react@19.2.18`, `@types/react-dom@19.2.4`, `typescript@7.0.2`, `tailwind-merge@3.6.0`, `@types/node@^24` (runtime-matched). `vitest` is already `4.1.10`.

---

## Phase 1 — Dependency upgrades

### Task 1: Establish green baseline on the branch

**Files:**
- Modify: none (verification only)

- [ ] **Step 1: Confirm branch and clean tree**

Run: `git branch --show-current && git status --porcelain`
Expected: prints `v3-fresh-start` and no uncommitted changes (spec already committed).

- [ ] **Step 2: Install and run the test suite**

Run: `npm install && npm run test`
Expected: `Test Files 14 passed (14)`, `Tests 121 passed (121)`.

- [ ] **Step 3: Verify production build**

Run: `npm run build`
Expected: build completes without error (Next.js "Compiled successfully").

- [ ] **Step 4: Smoke-test the dev server**

Run the dev server in the background, then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`.
Expected: `200`. Stop the dev server afterward.

- [ ] **Step 5: Record the baseline (no commit — nothing changed)**

If any of Steps 2–4 fail, STOP and report — the baseline must be green before upgrading.

---

### Task 2: Low-risk bumps — `tailwind-merge` 3, `@types/node` 24

**Files:**
- Modify: `package.json`, `package-lock.json`
- Check: any file importing `tailwind-merge` (via `lib/utils.ts` `cn()` helper)

**Interfaces:**
- Produces: upgraded dev/runtime type baseline consumed by all later tasks.

- [ ] **Step 1: Inspect current `tailwind-merge` usage**

Run: `grep -rn "tailwind-merge\|twMerge\|\bcn(" lib/utils.ts $(git ls-files '*.ts' '*.tsx') | grep -i "tailwind-merge\|twMerge" `
Expected: shows `lib/utils.ts` using `twMerge`. Note the usage — v3 changed some class-conflict resolution internals but the `twMerge(...)` API is unchanged.

- [ ] **Step 2: Install the bumps**

Run: `npm install tailwind-merge@^3.6.0 @types/node@^24`
Expected: installs without peer-dependency errors.

- [ ] **Step 3: Type-check and test**

Run: `npx tsc --noEmit && npm run test`
Expected: `tsc` clean; `121 passed`.

- [ ] **Step 4: Build + dev smoke**

Run: `npm run build` then dev-server `GET / 200`.
Expected: build OK, `200`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): tailwind-merge 3 + @types/node 24 (runtime-matched)"
```

---

### Task 3: React 18 → 19 (+ React type packages)

**Files:**
- Modify: `package.json`, `package-lock.json`
- Potentially modify: any component using `forwardRef`, `useRef` without initial value, `ReactDOM.render`, string refs, or `propTypes` (React 19 codemod targets)

**Interfaces:**
- Produces: React 19 runtime; consumed by Next 16 task (Next 16 expects React 19).

- [ ] **Step 1: Find React patterns the codemod will touch**

Run: `grep -rn "forwardRef\|useRef(\s*)\|ReactDOM.render\|propTypes\|defaultProps" $(git ls-files '*.ts' '*.tsx')`
Expected: a (possibly empty) list. Note each site so you can review the codemod's edits.

- [ ] **Step 2: Install React 19 + types**

Run: `npm install react@^19.2.8 react-dom@^19.2.8 && npm install -D @types/react@^19.2.18 @types/react-dom@^19.2.4`
Expected: installs cleanly.

- [ ] **Step 3: Run the official React 19 codemod**

Run: `npx codemod@latest react/19/migration-recipe`
Expected: applies automated migrations. Review `git diff` — confirm each edit matches a site from Step 1 and nothing unrelated changed.

- [ ] **Step 4: Type-check and fix any React 19 type errors**

Run: `npx tsc --noEmit`
Expected: clean. If errors appear (commonly `useRef()` now requires an argument, or `ref` typing), fix them minimally at the reported sites and re-run until clean.

- [ ] **Step 5: Test + build + dev smoke**

Run: `npm run test && npm run build`, then dev `GET / 200`. Manually load `/`, `/portfolio`, `/settings` in the dev server and confirm no console errors (`read_console_messages` if using the browser tool).
Expected: `121 passed`, build OK, `200`, no hydration/console errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(deps): upgrade React 18 -> 19 (+ @types/react 19)"
```

---

### Task 4: Next.js 15 → 16

**Files:**
- Modify: `package.json`, `package-lock.json`, `next.config.ts`
- Review: `app/api/**/route.ts` (async request APIs), `app/**/page.tsx` (any use of `params`/`searchParams`/`cookies()`/`headers()`)

**Interfaces:**
- Consumes: React 19 (from Task 3).
- Produces: Next 16 build; consumed by all subsequent smoke/build gates.

- [ ] **Step 1: Note the current config and dynamic-API usage**

Current `next.config.ts` is `{ reactStrictMode: true, experimental: { optimizeCss: true } }`.
Run: `grep -rn "cookies()\|headers()\|params\|searchParams\|draftMode" app` and note async-API call sites (Next 16 makes several request APIs async-only).

- [ ] **Step 2: Run the Next upgrade codemod**

Run: `npx @next/codemod@latest upgrade latest`
Expected: bumps `next` to 16.x and applies automated migrations. Review `git diff`.

- [ ] **Step 3: Verify `next.config.ts` still valid**

Confirm `experimental.optimizeCss` is still supported in Next 16 (it depends on `critters`/`beasties`). If Next 16 warns or errors on it, either move it to its new location per the build warning or remove it if it is now on by default. Keep `reactStrictMode: true`.

- [ ] **Step 4: Type-check, test, build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: clean, `121 passed`, build succeeds. Fix any async-request-API errors at the sites from Step 1.

- [ ] **Step 5: Dev smoke across routes + API**

Dev server, then:
Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ ; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/wpond-price`
Expected: `200` and a valid (non-500) status from the API route.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(deps): upgrade Next.js 15 -> 16"
```

---

### Task 5: TypeScript 5 → 7

**Files:**
- Modify: `package.json`, `package-lock.json`, possibly `tsconfig.json`

**Interfaces:**
- Produces: TS 7 type-check baseline.

- [ ] **Step 1: Install TypeScript 7**

Run: `npm install -D typescript@^7.0.2`
Expected: installs cleanly. (TS 7 is the new native compiler.)

- [ ] **Step 2: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: clean. If TS 7 surfaces new/stricter diagnostics, fix them minimally at the reported sites. Do NOT loosen `tsconfig.json` `strict` settings to silence errors — fix the code.

- [ ] **Step 3: Confirm `tsconfig.json` compatibility**

Review `tsconfig.json` for any options removed/renamed in TS 7 (the compiler will warn). Adjust only if the compiler flags them.

- [ ] **Step 4: Test + build**

Run: `npm run test && npm run build`
Expected: `121 passed`, build OK.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(deps): upgrade TypeScript 5 -> 7"
```

---

### Task 6: Remove dead `@solana/spl-token` dependency

**Files:**
- Modify: `package.json`, `package-lock.json`

**Rationale:** `@solana/spl-token` (0.1.8) is a top-level dependency with zero imports in tracked source and nothing depending on it. "Upgrade to latest" on an unused library adds surface for no benefit; removing it is the correct cleanup. It can be re-added at `@latest` in Phase 3 only if the vault-fee wiring needs ATA helpers.

- [ ] **Step 1: Re-confirm zero usage**

Run: `grep -rln "spl-token" $(git ls-files '*.ts' '*.tsx')`
Expected: no output (no references). If anything appears, STOP — treat it as a real dependency and upgrade to `@solana/spl-token@^0.4.15` instead of removing.

- [ ] **Step 2: Remove the dependency**

Run: `npm uninstall @solana/spl-token`
Expected: removed from `package.json` dependencies.

- [ ] **Step 3: Test + build**

Run: `npm run test && npm run build`
Expected: `121 passed`, build OK (nothing imported it, so nothing breaks).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): drop unused @solana/spl-token dependency"
```

- [ ] **Step 5: Final Phase 1 audit**

Run: `npm outdated`
Expected: remaining entries are only the intentionally-held ones (`@solana/web3.js` on 1.x by design; `@types/node` on 24 by design). Confirm no accidental majors were missed. Run `npm audit` and record the residual vulnerability count in the commit body of the next doc update.

---

## Phase 2 — Cleanup

### Task 7: Remove verified dead code

**Files:**
- Delete/modify: determined by import analysis (candidates: unused exports in `lib/referral.ts`, orphaned components/hooks)
- Keep (do NOT remove): `lib/vaults.ts`, autoclicker stack

- [ ] **Step 1: Build the dead-export/orphan-module report**

For each source module, check whether anything imports it. Run per candidate, e.g.:
Run: `for f in $(git ls-files 'lib/*.ts' 'hooks/*.ts' 'components/**/*.tsx'); do base=$(basename "$f" | sed 's/\.[jt]sx\?$//'); n=$(grep -rl "$base" $(git ls-files '*.ts' '*.tsx') | grep -v "$f" | wc -l); if [ "$n" -eq 0 ]; then echo "ORPHAN: $f"; fi; done`
Expected: a list of zero-import modules. Manually verify each is truly unused (not referenced dynamically or by route convention) before deleting.

- [ ] **Step 2: Check `lib/referral.ts` export usage**

Run: `grep -rn "extractReferralCode\|getFeeRoutingDescription\|buildJupiterSwapRequest\|from ['\"].*referral" $(git ls-files '*.ts' '*.tsx') | grep -v "lib/referral.ts"`
Expected: shows which exports are used. Remove only exports/functions with zero external references. If Phase 3 will need `buildJupiterSwapRequest`, leave it.

- [ ] **Step 3: Delete confirmed-dead files/exports**

Delete only files/exports proven unused in Steps 1–2. For partial-file cleanups, remove the specific unused exports.

- [ ] **Step 4: Type-check + test + build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: clean, `121 passed`, build OK (removing truly-dead code breaks nothing).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove verified dead code"
```

---

### Task 8: Prune stale docs (user-approved list)

**Files:**
- Delete: subset of `docs/` presented to and approved by the user

- [ ] **Step 1: Assemble the candidate delete/keep list**

Candidates to delete (stale, superseded by the current codebase): `docs/superpowers/specs/2026-05-03-*` (three cleanup/monitoring/pnl specs), `docs/superpowers/plans/2026-07-19-autoclicker-tool.md` and its spec if implemented, `docs/audit/2026-07-10-audit-report.md`, `docs/LEARNING_PATH.md`, `INSTALLATION_MANUAL.md`.
Keep: the v3 spec/plan (this work), and any doc that still accurately describes shipped behavior.

- [ ] **Step 2: Present the list to the user and get explicit approval**

Show the exact file list (delete vs keep) and wait for a yes. Do NOT delete before approval.

- [ ] **Step 3: Delete approved files**

Remove only the files the user approved.

- [ ] **Step 4: Verify build unaffected + commit**

Run: `npm run build`
Expected: OK (docs are not part of the build).

```bash
git add -A
git commit -m "docs: remove stale specs/plans/manuals"
```

---

## Phase 3 — Vault → RIG-boost sub-track

### Task 9: Audit the vault → swap-path flow (documentation only)

**Files:**
- Read: `contexts/SwapConfigContext.tsx`, `lib/swap/orders.ts`, `hooks/useSwapEngine.ts`, `lib/vaults.ts`, `lib/referral.ts`
- Create: `docs/superpowers/specs/2026-08-06-vault-boost-findings.md` (audit notes)

- [ ] **Step 1: Trace the fee path**

Document how `settings.affiliate` → `vaultMap` → `currentVault` are computed in `SwapConfigContext.tsx`, and how `useSwapEngine.ts` calls `feeAccountForOrder(settings.platformFeeBps, referralAddress)` in `lib/swap/orders.ts` — confirming the affiliate vault is currently never used as the fee account (fee-free path) and why (Jupiter v2 400 on the vault ATA).

- [ ] **Step 2: Write the audit findings doc**

Record: current behavior, the two attribution hypotheses (vault-fee vs `L2TExMFK`), and the exact decision criterion for the confirmation test.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-08-06-vault-boost-findings.md
git commit -m "docs: audit vault -> RIG-boost swap-path flow"
```

---

### Task 10: Run the free confirmation test

**Files:**
- Modify: `docs/superpowers/specs/2026-08-06-vault-boost-findings.md` (append results), project memory

**No paid swaps. No on-chain execution.**

- [ ] **Step 1: Re-read `proSwapsSol` for both wallets with no new swaps**

Query the cary0x manifest for the user's wallet (baseline `proSwapsSol` 177069) and for `AZ7F5ZfzdTG2bBCtkVaYZLsSWWyYBTb9wmAFnsaFtS7o` (baseline 25708). Use the app's `/api/rig/manifest/<wallet>` proxy or a direct read.

- [ ] **Step 2: Apply the decision criterion**

- AZ7F rises AND user's stays flat ⇒ the vault fee is the signal → proceed to Task 11 (wire it).
- Both rise ⇒ `L2TExMFK` moves it, vault not required → STOP the sub-track; document that wiring the vault fee will not achieve the goal, and surface alternatives to the user.
- Neither moves ⇒ inconclusive → do NOT wire; recommend another timed re-check.

- [ ] **Step 3: Record the result and decide**

Append the readings, timestamp (pass in via the session, not `Date.now()`), and the resulting decision to the findings doc and memory. Commit.

```bash
git add -A
git commit -m "docs: record vault-boost confirmation-test result"
```

---

### Task 11: Wire vault-fee routing — CONDITIONAL on Task 10 confirming

**Only execute if Task 10 concluded "vault fee is the signal." Otherwise skip and report.**

**Files:**
- Modify: `lib/swap/orders.ts` (fee-account resolution), `hooks/useSwapEngine.ts` (pass the vault), possibly re-add `@solana/spl-token@latest` if ATA derivation is needed
- Test: `tests/swap/orders.test.ts`

**Interfaces:**
- Consumes: `currentVault` from `SwapConfigContext`, `settings.platformFeeBps`.
- Produces: a fee-account resolver that returns the affiliate vault when appropriate and passes Jupiter's order API without a 400.

- [ ] **Step 1: Write the failing test for vault-fee resolution**

Add to `tests/swap/orders.test.ts` a test asserting that, given `platformFeeBps > 0`, no referral account, and a valid affiliate vault, the resolver returns the vault (via whichever Jupiter mechanism avoids the v2 400 — e.g. Jupiter v1 `feeAccount`).

```ts
it("routes the platform fee to the affiliate vault when no referral is set", () => {
  const account = resolveFeeAccount({ platformFeeBps: 50, referralAccount: undefined, affiliateVault: "6NqvoPpSYCPEtLEukQaSNs7mS3yK6k285saH9o3vgC96" });
  expect(account).toBe("6NqvoPpSYCPEtLEukQaSNs7mS3yK6k285saH9o3vgC96");
});
```

- [ ] **Step 2: Run the test — verify it fails**

Run: `npx vitest run tests/swap/orders.test.ts`
Expected: FAIL (resolver/signature not yet present).

- [ ] **Step 3: Implement the resolver and wire it**

Update `lib/swap/orders.ts` to resolve referral → vault → none, using the Jupiter request shape that accepts the vault ATA (Jupiter v1 `feeAccount`, since the v2 `referralAccount` rejects legacy vault ATAs — documented in the code comments and memory). Pass `currentVault` from `useSwapEngine.ts`.

- [ ] **Step 4: Run the test — verify it passes**

Run: `npx vitest run tests/swap/orders.test.ts`
Expected: PASS.

- [ ] **Step 5: Full suite + build + security review**

Run: `npm run test && npm run build`. Then dispatch the `solana-code-reviewer` agent on the swap-path diff.
Expected: `121+ passed`, build OK, security review with no blocking findings.

- [ ] **Step 6: Commit (code only — user validates on-chain separately)**

```bash
git add -A
git commit -m "feat(swap): route platform fee to affiliate vault for RIG-boost attribution"
```

- [ ] **Step 7: Hand off for real-swap validation**

Report to the user that the code path is ready. The USER runs real swaps and watches `proSwapsSol`/boost; the implementer does not execute on-chain.

---

## Finalization

### Task 12: Merge to main and prune

**Files:**
- git refs only

- [ ] **Step 1: Final full green gate on the branch**

Run: `npm run test && npm run build`
Expected: all green.

- [ ] **Step 2: Merge to main**

```bash
git switch main
git merge --no-ff v3-fresh-start -m "merge: v3 fresh-start (upgrades, cleanup, vault-boost)"
```
Expected: fast, no conflicts (main unchanged since branch point).

- [ ] **Step 3: Confirm the stash holds nothing wanted, then drop it**

Run: `git stash show -p stash@{0} | head -40`
Confirm with the user it is the obsolete old-architecture work, then: `git stash drop stash@{0}`.

- [ ] **Step 4: Delete stale local branches (after user OK)**

```bash
git branch -D Design/lily-pond-style Jupiter/API-key Layout/NavigationBar-ConnBar-StatusBar Mechanics/flywheel Navigation/statusbar Style/pond-water-background Swapper/reward-mode v3-fresh-start
```
Expected: only `main` remains locally. (Remote branches are left unless the user asks to prune them too.)

- [ ] **Step 5: Report final state**

Summarize: versions upgraded, files/docs removed, vault-boost outcome, residual `npm audit` count, and that `main` is the single canonical branch.

---

## Self-Review

**Spec coverage:** §3 branch strategy → Task 1 + Task 12. §4 upgrades (React/Next/TS/spl-token/types/tailwind-merge) → Tasks 2–6. §5 cleanup (dead code, docs, git hygiene) → Tasks 7, 8, 12. §6 vault→boost (audit/confirm/document/wire) → Tasks 9–11. §7 testing → gate in every task. §8 risks/rollback → per-task commits. §9 out-of-scope (web3.js 1→2, redesign) → honored (no tasks touch them).

**Deviations from spec, intentional and noted:** (a) `@solana/spl-token` is removed, not upgraded, because it is unused (spec §4 said "upgrade to 0.4.15"; audit found zero usage — removal is the better cleanup and the version is re-addable in Task 11). (b) `@types/node` pinned to 24, not npm-latest 26, to match the Node 24 runtime. Both are called out in Global Constraints.

**Placeholder scan:** no TBD/TODO; each code step shows commands/code; conditional Task 11 has an explicit skip condition.

**Type consistency:** the Task 11 resolver is introduced with its test and signature together; `currentVault`/`platformFeeBps`/`referralAccount` names match `SwapConfigContext.tsx` and `lib/swap/orders.ts` as verified during exploration.
