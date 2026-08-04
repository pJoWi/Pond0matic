# Rig Tracker Pivot — manual boost + reliable auto stats

**Date:** 2026-08-05
**Status:** approved (in-conversation), implementing
**Supersedes the live-data path of:** `2026-08-03-rig-boost-tracker-design.md`

## Why

The live boost/unclaimed path (Supabase `blockengine` realtime) does not work — proven exhaustively:
- 4 node captures + a wildcard (`event:"*"`) listener → `blockengine` only ever broadcasts empty `mpool`, even during active mining.
- Browser inspection of pond0x.com/mining during a **live** mining session: the boost/unclaimed comes from a **REST** endpoint `GET /api/user/minesession/<base64(sessionId:wallet)>`, polled ~1/s. No WebSocket (0 frames tapped). That endpoint is gated behind the **ephemeral mining-session token** and only exists while actively mining — a read-only dashboard cannot obtain it without impersonating a mining session. Not feasible.

So: drop the unobtainable live data; keep everything real; make the boost an honest, optional manual input.

## Changes

**Remove (dead):**
- `lib/rig/realtime.ts` (Supabase wrapper) — deleted.
- `lib/rig/telemetry.ts`: `PoolRow`, `parsePoolRow`, `findWalletRow` (+ their tests).
- `hooks/useRigTelemetry.ts`: the `subscribeMpool` effect and `live` / `unclaimed` / `topBoost` state.
- Dependency `@supabase/realtime-js`; `scripts/capture-blockengine.mjs`; the `NEXT_PUBLIC_POND0X_SUPABASE_*` vars in `.env.example`.

**Add / change:**
- `lib/settings/storage.ts`: add `rigBoost: number` (default 0) — the user's manually-entered current boost, persisted.
- `hooks/useRigTelemetry.ts`: read `settings.rigBoost` (via `useSettings`); `boost = rigBoost > 0 ? rigBoost : null`; expose `setBoost(n)` (persists via settings `update`). `projection = boostProjection(boost ?? 0, sessionSwaps)`. New `RigTelemetry` shape: `{ connected, boost:number|null, setBoost, projection, sessionSwaps, health, manifest, luck, incrementSwap, refresh }`.
- `BoostHero`: left card = editable "Your boost" number input (progress bar to 615, "% to max"); when unset, a prompt to enter it. Right card = **Max-claim estimate** (`health.maxClaimUsd`, real cary0x $) replacing the unobtainable unclaimed wPOND.
- `BoostMomentum`: keep "To max 615 → ~X swaps" (only when boost set, else a hint to set it) + "This session +N swaps → +N/6" (always, real) + the "1 run (18×3)" chip. Remove the leaderboard chip (topBoost gone).
- `RigStats`, `RigProfile`: unchanged (cary0x health/manifest + luck, all real/auto).
- `RigTab`: drop the live/idle pill; simple header.

## Keeps working automatically
cary0x health / priority / drift-risk / sessions / max-claim($); luck (via the `/api/rig/luck` proxy); badges/PRO/𝕏; and the this-session swap-momentum (`incrementSwap` from the swap engine) — the direct feedback that boost-swapping is working.

## Tests
`lib/rig/boost.ts` truth-table unchanged; drop the `parsePoolRow`/`findWalletRow` tests; add a `storage` test that `rigBoost` defaults to 0 and round-trips. Gates: `npx vitest run` green, `npm run build` clean.
