# Pond0matic: Audit, Claude Tooling Redesign & Solana Exploration Toolkit — Design

**Date:** 2026-07-10
**Status:** Approved (Approach A: audit-first, shared-core tooling)

## Goal

Audit Pond0matic (a real-money Pond0x dashboard: Jupiter auto-swapper, rig
stats, portfolio, alerts), rebuild the `.claude` agent/skill setup from
scratch, and create reusable tools for exploring Solana and pond0x.com —
structured so the owner levels up their Solana client-side and on-chain
analysis skills along the way.

## Scope decisions (from brainstorming)

- **Audit:** code security + architecture/quality + on-chain wallet activity.
  Dependency findings folded into the security review (spl-token 0.1.8 and
  web3.js 1.x are known-stale). Wallet under review:
  `GM8Qz8gmp9N3Rm94q9iTJeHobGBXoCYMhwZYY8zji3LA`.
- **Tools:** CLI toolkit **and** MCP server, both consuming one shared core.
- **Learning:** deepen dApp/client skills + on-chain data analysis (no
  Rust/Anchor for now).
- **Existing `.claude`:** fresh redesign; the current 9 agents / 3 skills are
  replaced, with anything still valuable carried into the new set.

## Phases

### Phase 1 — Audit (analysis only, no code changes)

Three parallel reviews, one consolidated prioritized report saved to
`docs/audit/2026-07-10-audit-report.md`:

1. **Security:** swap execution path (`lib/jupiter.ts`,
   `lib/transactionValidation.ts`, `components/CompactSwapper`,
   `components/swapper`), wallet integration, `app/api/*` routes (SSRF, input
   validation, upstream trust), env/secret handling, dependency risk.
2. **Architecture/quality:** module boundaries, state management, test
   coverage gaps, dead code, patterns worth standardizing.
3. **On-chain:** the wallet's token accounts, delegate approvals, recent
   Pond0x-related transaction history, fee spend — via public RPC/explorer
   APIs. Read-only; no keys involved.

### Phase 2 — `.claude` fresh redesign

- **Agents (4):**
  - `solana-code-reviewer` — security-first reviewer for swap/tx/wallet code.
  - `onchain-analyst` — drives the CLI/MCP tools to answer on-chain questions.
  - `pond0x-researcher` — protocol reverse-engineering: pond0x.com endpoints,
    manifest semantics, mining mechanics.
  - `ui-specialist` — merged dashboard-designer + css-animation-specialist.
- **Skills (5):**
  - `solana-dev` — client patterns reference (versioned txs, priority fees,
    Jupiter v6, RPC hygiene, wallet-adapter pitfalls).
  - `pond0x-protocol` — protocol knowledge base (mining, wPOND, vaults,
    manifest/health API semantics) — carries over the good parts of
    `solana-pond0x-expert` and `solana-opportunity-scanner`.
  - `onchain-query` — how to use the toolkit (CLI + MCP) to answer questions.
  - `swap-testing` — refreshed from existing.
  - `web3-security-review` — refreshed from existing + audit learnings.
- **`CLAUDE.md`** — project conventions, commands, architecture map.
- Old agent/skill files deleted in the same commit that adds the new set.

### Phase 3 — CLI toolkit (`tools/` workspace in the repo)

- `tools/core/` — shared TypeScript library: RPC client (env-configurable
  endpoint), account/token queries, transaction fetch + human-readable
  decode, price lookup, Pond0x API client (manifest, health, stats — same
  upstreams the app's API routes use).
- `tools/cli.ts` — one entrypoint, subcommands:
  `solana account|tokens|tx|price` and `pond0x manifest|health|stats`.
  Run via `npx tsx tools/cli.ts …`; no new build system.
- Read-only by design: the toolkit never signs or sends transactions.

### Phase 4 — MCP server

- `tools/mcp-server.ts` wrapping the same core functions as MCP tools
  (`solana_account`, `solana_tokens`, `solana_tx`, `token_price`,
  `pond0x_manifest`, `pond0x_health`, `pond0x_stats`).
- Registered in project `.mcp.json` (stdio, `npx tsx`).

### Phase 5 — Learning path

`docs/LEARNING_PATH.md`: milestone exercises tied to real repo improvements —
e.g. migrate `@solana/spl-token` off 0.1.8, adopt versioned transactions +
priority fees in the swapper, hand-decode a Pond0x swap transaction with the
CLI, build a mini activity indexer. Each milestone lists the concept, the
exercise, and the tool/skill that supports it.

## Error handling & testing

- Toolkit: graceful RPC failures (retry once, clear error messages), zod
  validation on Pond0x API responses (zod is already a dependency).
- Vitest unit tests for core decode/format logic (pure functions); network
  calls exercised manually via CLI.

## Non-goals

- No changes to swap execution behavior in this effort (audit findings are
  reported, fixes are separate follow-ups the owner approves individually).
- No Rust/Anchor program development.
- No automated trading/signing in the toolkit.
