# Pond0matic

Unified dashboard for the Pond0x protocol: Jupiter auto-swapper (swap-to-mine),
mining rig stats, portfolio/PnL. **Executes real swaps with a real
wallet — treat every change on the swap path as production financial code.**

## Commands

- `npm run dev` — dev server (copy `.env.example` → `.env.local` first; set
  `NEXT_PUBLIC_DEFAULT_RPC` to a real RPC endpoint)
- `npm run build` / `npm run lint`
- `npx vitest run` — all tests; single file: `npx vitest run tests/portfolio/pnl.test.ts`;
  watch: `npm run test:watch`. Node environment, no jsdom — tests cover pure
  logic, which is why business rules must live in pure evaluators.
- `npx tsx tools/cli.ts` — read-only Solana/Pond0x exploration CLI (see `.claude/skills/onchain-query`)
- Tailwind CSS v4 — CSS-first config in `app/globals.css`, no `tailwind.config.ts`

## Architecture map

- `app/` — Next.js App Router: `/` (dashboard + swap panel), `/portfolio`, `/settings`, `app/api/*` (proxies to cary0x.com, DexScreener, Jupiter)
- `contexts/` — SettingsContext, SwapConfigContext, SessionContext, ActivityContext, RigContext — one concern each
- `lib/swap/` — pure `sessionPlanner` + `orders` with Zod boundary validation
- `hooks/useSwapEngine.ts` — the swap session orchestrator (all side effects)
- `components/swap/` — swap panel suite
- `components/dashboard/` — dashboard tabs (Rig/Prices/Activity)
- `components/layout/` — AppShell, Sidebar
- `components/connect/` — ConnectSetupModal (3-step guided connect flow)
- `lib/referral.ts` — Jupiter fee-account routing (financial-critical)
- `lib/transactionValidation.ts` — pre-signing safety checks
- `lib/portfolio/` — PnL math (well tested)
- `lib/geoff/` + `app/api/geoff/insight` + `components/geoff/` — optional
  Geoff (geoff.ai) AI insight cards. `insights.ts`/`parse.ts` are pure
  (prompt building, model-reply parsing); `client.ts` is **server-only** — it
  reads `GEOFF_API_KEY`, so never import it from a `"use client"` module.
  Snapshots carry derived numbers only: no wallet address, no signatures.
  Feature is inert without the key — the cards do not render.
- `tools/` — read-only exploration toolkit (CLI + MCP server, registered in `.mcp.json`); never add signing/sending here
- `autoclicker/` — opt-in, guard-railed local wallet-popup clicker: Python
  process + `app/api/clicker/*` + `ClickerPanel`, gated by `CLICKER_ENABLED=1`
  (dev only). Guardrails are enforced in the Python process (timer, click
  budget, heartbeat); the TypeScript-side policy is a pure evaluator in
  `lib/clicker/`. It lives here, NOT in `tools/`, so the "tools/ is
  read-only" rule stays absolute. Setup/usage: `autoclicker/README.md`.

## Conventions (enforced in review)

1. **One wallet identity.** All wallet/publicKey access goes through
   `@solana/wallet-adapter-react` (`useWallet()`/`useConnection()`). Never
   call `window.solana` / `getPhantomProvider()` directly; never accept a raw
   `wallet: string` in new code.
2. **Pure evaluator + orchestrator hook** for feature logic: business rules as
   pure functions (data in → result out, no React/DOM/storage), one hook per
   feature owning side effects. Model: `lib/swap/sessionPlanner.ts` + `useSwapEngine`.
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
- Swaps use Jupiter Swap API v2 order-and-execute (`api.jup.ag/swap/v2/order` +
  `/execute`; docs: `developers.jup.ag/docs/swap/order-and-execute`) — API key
  required (portal.jup.ag), collected in the connect flow; Jupiter lands the
  transaction after `/execute`. Price feed `lite-api.jup.ag` stays keyless.
- Community rig stats: `https://www.cary0x.com/api/{manifest,health}/<wallet>`.
- Geoff AI gateway: `POST https://geoff.ai/api/v1/text/chat`, `Authorization:
  Bearer $GEOFF_API_KEY`, responses wrapped in `{ data, trace_id, extra_info }`.
  Models: `preview` (fast/cheap, our default), `duce`, `magma` (1M ctx).
  Optional — unset key just disables the insight cards.
- Public RPC is rate-limited; prefer `SOLANA_RPC` / `NEXT_PUBLIC_DEFAULT_RPC`
  set to a Helius/QuickNode endpoint.

## Docs & skills

- `.claude/skills/` — project skills: `onchain-query`, `pond0x-protocol`,
  `solana-dev`, `swap-testing`, `web3-security-review`. Use them whenever
  their domain applies.
- `docs/superpowers/specs/2026-08-07-vault-boost-findings.md` — reference for
  the confirmed swap→boost mechanic (fee→pond0x vault via Jupiter v1; why v2
  fails; proSwapsSol validation).
- `QUICK_START.md` / `USER_MANUAL.md` / `INSTALLATION_MANUAL.md` — end-user
  docs (root); keep in sync when changing user-facing swap behavior.
- Alerts feature removed as of the cockpit refactor (tasks 1–19, 2026-08).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
