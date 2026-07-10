# Pond0matic

Unified dashboard for the Pond0x protocol: Jupiter auto-swapper (swap-to-mine),
mining rig stats, portfolio/PnL, alerts. **Executes real swaps with a real
wallet — treat every change on the swap path as production financial code.**

## Commands

- `npm run dev` — dev server
- `npm run build` / `npm run lint`
- `npx vitest run` — tests (config: `vitest.config.ts`, tests in `tests/**`)
- `npx tsx tools/cli.ts` — read-only Solana/Pond0x exploration CLI (see `.claude/skills/onchain-query`)

## Architecture map

- `app/` — Next.js App Router: `/` (dashboard + swap drawer), `/swapper`, `/portfolio`, `/alerts`, `app/api/*` (proxies to cary0x.com, DexScreener, Jupiter)
- `contexts/SwapperContext.tsx` — central swap state (large; being decomposed)
- `hooks/useSwapExecution.ts` — the swap/boost/rewards execution engine
- `lib/referral.ts` — Jupiter fee-account routing (financial-critical)
- `lib/transactionValidation.ts` — pre-signing safety checks
- `lib/alerts/` + `hooks/useAlertEngine.ts` — reference-quality architecture: pure evaluators + one orchestrator hook
- `lib/portfolio/` — PnL math (well tested)
- `tools/` — read-only exploration toolkit (CLI + MCP server, registered in `.mcp.json`); never add signing/sending here

## Conventions (enforced in review)

1. **One wallet identity.** All wallet/publicKey access goes through
   `@solana/wallet-adapter-react` (`useWallet()`/`useConnection()`). Never
   call `window.solana` / `getPhantomProvider()` directly; never accept a raw
   `wallet: string` in new code. (Legacy path in `hooks/useWallet.ts` is being
   removed.)
2. **Pure evaluator + orchestrator hook** for feature logic: business rules as
   pure functions (data in → result out, no React/DOM/storage), one hook per
   feature owning side effects. Model: `lib/alerts/*Evaluator.ts` + `useAlertEngine`.
3. **Validate external data at the boundary.** Zod (or `parseSnapshot`-style
   field checks) for API responses and route params — never `as ApiResponse`.
   Validate `[wallet]` params as base58 before building upstream URLs.
4. **One exported component per file.** Extract when a file passes ~200 lines
   or grows a third sibling subcomponent. No `Compact*` duplicate components —
   one responsive component with a prop.
5. **Polling** goes through `hooks/useVisibilityPolling.ts`, never a bare
   `setInterval`.
6. **No hardcoded prices** — live feeds exist (`useTokenPrices`, `getUsdValue`).
7. **Financial-critical code ships with tests** (`lib/referral.ts`,
   `lib/transactionValidation.ts`, PnL math). Vitest, not Jest.

## Key external facts

- wPOND mint: `3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq` (decimals 3).
  PNDC/PORK are Ethereum ERC-20s, not SPL tokens.
- Jupiter free price API is `https://lite-api.jup.ag/price/v3` — the old
  `api.jup.ag/price/v2` is dead (404).
- Community rig stats: `https://www.cary0x.com/api/{manifest,health}/<wallet>`.
- Public RPC is rate-limited; prefer `SOLANA_RPC` / `NEXT_PUBLIC_DEFAULT_RPC`
  set to a Helius/QuickNode endpoint.

## Audit & learning docs

- `docs/audit/2026-07-10-audit-report.md` — consolidated security /
  architecture / on-chain audit and remediation backlog.
- `docs/LEARNING_PATH.md` — Solana skill-building milestones tied to real fixes.
