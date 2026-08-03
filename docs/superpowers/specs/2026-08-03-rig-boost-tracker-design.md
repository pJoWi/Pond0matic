# Rig Boost Tracker — design

**Date:** 2026-08-03
**Status:** approved (brainstorm), pending implementation plan
**Author:** Jowi + Claude

## Goal

Replace the current Mining-rig tab — which mixes real cary0x data with
fabricated fields (a 68 °C rig temperature, a fake power bar, phantom
luck/permanent-boost actions) and a broken `currentBoost` formula — with a
**real boost tracker**: the miner's live boost, unclaimed wPOND, and the
swap→boost dynamics that connect Pond0matic's swapper to the Pond0x rig.
Visually it is a polished, animated Deep-Pond panel, not a grid of stat cards.

Primary purpose of the app is unchanged: boost-swapping to keep the rig
healthy. This feature makes the effect of that swapping **visible and
actionable**.

## Background: the boost economy (operator-provided, verified)

```
current boost = Initial Rig Boost
              + Teleported Badge Boost
              + Purchased Boost
              + Swap Boost            (+1/6 per swap)
              - Mining Session Boost  (-3 per mining session)
```

- Max attainable boost **615** → miner starts at **373.6M claimable wPOND**.
- **6 swaps = 1 boost; 18 swaps = 3 boost = one mining session's cost.** This
  is why boost-mode's default is 18 swaps/round.
- **We do NOT compute the absolute boost from this formula** — cary0x's
  `mining_sessions` (9403 for the test wallet) is not the same "session" as the
  −3 term, and Initial/Badge/Purchased are unknown as numbers. The absolute
  boost comes only from the live feed (below). The formula is used for
  **projection relative to the live boost** (swaps-to-max, session buffer,
  "this session +N swaps → +N/6").

## Data architecture

```
useRigTelemetry (new orchestrator hook, replaces useMiningRig)
├─ Live boost + unclaimed → Supabase Realtime `blockengine` / `mpool`,
│                            filtered to the connected wallet
├─ Rig stats             → cary0x health + manifest (existing proxies)
├─ Luck / referrals      → GET pond0x.com/api/solana/luck/<wallet> (new, public)
└─ Fallback boost        → boost.ts projection from last-known live boost +
                            local session swap count, when the wallet is not
                            currently in the live pool
```

### Live source — Supabase Realtime (found 2026-08-03, see pond0x-protocol skill)

- Project `https://vkqjvwxzsxilnsmpngmc.supabase.co`, **public anon key** from
  the pond0x.com bundle (read-only; full value recorded in the
  `pond0x-protocol` skill's "Live xMiner data source" section).
- Channel **`blockengine`**, `{config:{broadcast:{ack:true}}}`. Events:
  - `mpool` → `payload.pool` = the **global** list of currently-mining wallets,
    each row ≈ `{ boost/multiplier, wallet, unclaimed }`. **Filter client-side
    to our wallet** to get its live boost + unclaimed.
  - `cycle` → the *connected-to-pond0x* wallet's header; not ours (we are not
    the pond0x /mining session), so we rely on `mpool`.
- **Anon subscribe needs no signature and no running miner** (verified). But a
  wallet only appears in `mpool` **while it is actively mining** on pond0x.com.
  So: live data shows during active mining; otherwise we fall back.
- **Schema is inferred, not yet observed populated** (capture window was idle).
  → **Build step 1 (blocking the live-UI): subscribe and capture one populated
  `mpool` payload to lock the exact field names.** Until confirmed, the UI runs
  on the fallback path and the live panel shows "waiting for live data".

### Boundary validation

Every external payload is parsed with Zod (convention #3): cary0x
health/manifest, the Supabase `mpool` row, and the luck API. No `as` casts.
Wallet address comes only from `useWallet()` (convention #1).

## What the tracker shows

**Primary**
1. **Current boost** — live decimal (e.g. 174.6) with a progress bar to max 615
   and mining status (⛏ MINING · H/s). Offline → last-known, dimmed, `~`.
2. **Unclaimed wPOND** — live (e.g. 109.3M) + USD value (via `useTokenPrices`)
   + cary0x `max_claim_estimate_usd` as "potential".
3. **Boost momentum** — the formula as action, not arithmetic:
   - "Naar max 615: ~X swaps" · "Deze sessie +N swaps → +N/6 boost"
   - "1 run (18×3) = +9 boost = +3 sessies buffer"
   - Leaderboard line: "🏆 jij 174.6 · top-miner 615" (from the global `mpool`).

**Supporting (existing data, cleaned up)**
4. **Rig health & priority** (cary0x) — health, priority, and a **drift-risk
   warning** when claims may drift.
5. **Mining throughput** (cary0x) — sessions, sent/failed/drifted/mempool.
6. **Badges & profile** — badges (pork/chef/points/swap), PRO, 𝕏-linked
   (manifest) + luck/referrals (luck API), plus one `ai_beta` coaching hint.

Boost component breakdown (Initial/Badge/Purchased) is shown **only if** the
live payload exposes it; otherwise total boost + the swap-driven session delta.

## Visual design (approved: "B + badges + naar-max callout")

Single Deep-Pond panel, monospace tabular numerics:
- **Twin hero** cards: Boost (big number, fill bar to 615, "+0,167/swap") and
  Unclaimed wPOND (big number, USD, "$244k potentieel").
- **"Naar max" callout** row: swaps-to-max on the left, "deze sessie +N → +boost"
  on the right.
- **Momentum + leaderboard** chips.
- **Stats grid**: health / priority / drift-risk (drift uses the warn token).
- **Throughput** strip: sessions/sent/failed/drifted/mempool.
- **Badges & profile** row (prominent).
- **Coaching hint** from `ai_beta`, quoted.

### Subtle animation (respects `prefers-reduced-motion`)
- **Count-up** tween on boost & unclaimed when values change (~300 ms ease-out).
- **Bar fill** via CSS width transition.
- **Mining-status dot** gentle pulse.
- **Live-update flash**: brief highlight when a new Supabase value arrives.
- All motion disabled under `prefers-reduced-motion: reduce`.

## File structure (cleanup)

Delete from the old hook: `rigTemp`, fake `rigPower`, `permanentBoostTotal`,
fake `luckPoints`/`boostBotActive`, `addPermanentBoost`, `addLuckPoints`, and
the incorrect `currentBoost` derivation.

```
lib/rig/
  boost.ts        — PURE evaluator: boostProjection({currentBoost, sessionSwaps, maxBoost=615})
                    → {pctToMax, swapsToMax, sessionBoostAdded, sessionsBuffer}. Unit-tested.
  telemetry.ts    — types + PURE Zod parsers: cary0x health/manifest,
                    Supabase mpool row, luck API. Unit-tested.
  realtime.ts     — thin @supabase/realtime-js wrapper: subscribe(walletFilter, onRow).
hooks/
  useRigTelemetry.ts — orchestrator: realtime subscribe + cary0x/luck via
                       useVisibilityPolling (no bare setInterval); composition +
                       fallback. Replaces useMiningRig.
components/dashboard/rig/
  BoostHero.tsx · BoostMomentum.tsx · RigStats.tsx · RigProfile.tsx
components/dashboard/RigTab.tsx — thin composition
```

`RigContext` provides `useRigTelemetry`. `incrementBoosts` (local per-swap
counter) stays and feeds "deze sessie +N swaps".

## New dependency

**`@supabase/realtime-js`** — the light official Realtime client (Phoenix
protocol, reconnection, heartbeat). Chosen over a hand-rolled raw WebSocket
(more code, more fragile). Added to `package.json`.

## Testing

- `boost.ts` — truth-table unit tests (swaps-to-max, session buffer, delta,
  clamps at 0 and 615). Financial-adjacent → tested (convention #7).
- `telemetry.ts` parsers — valid/invalid payloads, missing fields, corrupt
  JSON → safe fallback, never throw into the hook.
- No live-network tests; the schema-lock (build step 1) is a manual capture.

## Risks / open items

- **Schema not yet observed populated** → build step 1 locks it; fallback keeps
  the feature usable meanwhile. If `mpool` lacks per-wallet `unclaimed`, we show
  boost only and label unclaimed as unavailable (never fabricate it).
- **Live only while actively mining** — accepted; that is exactly when the user
  is swap-boosting. Idle → last-known + `~`.
- **Anon key / channel could change** on pond0x's side — isolated in
  `realtime.ts`; failure degrades to the fallback, never breaks the tab.

## Out of scope (YAGNI)

- No writing/claiming (read-only tracker).
- No historical charts / time-series storage.
- No re-enabling platform fees (separate, orthogonal).
- No boost component breakdown UI unless the payload provides it.
