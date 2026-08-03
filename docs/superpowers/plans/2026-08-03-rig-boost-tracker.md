# Rig Boost Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fabricated-data Mining-rig tab with a real boost tracker — live boost + unclaimed wPOND from pond0x's public Supabase Realtime feed, cary0x rig stats, luck data, and a pure boost-projection evaluator — in an animated Deep-Pond panel.

**Architecture:** Pure evaluators (`lib/rig/boost.ts`, `lib/rig/telemetry.ts`) + a thin realtime wrapper (`lib/rig/realtime.ts`) feed one orchestrator hook (`hooks/useRigTelemetry.ts`) that composes three sources with a formula fallback. Presentational components under `components/dashboard/rig/` render it. The old `useMiningRig` hook is deleted at cutover.

**Tech Stack:** Next.js App Router (client components), `@solana/wallet-adapter-react`, Zod v4, `@supabase/realtime-js`, Tailwind CSS v4 (Deep Pond theme), Vitest (node env — pure logic only).

## Global Constraints

- **Wallet identity only via `useWallet()`** from `@solana/wallet-adapter-react` — never `window.solana`, never a raw `wallet: string` prop in new code.
- **Validate all external data at the boundary with Zod** — cary0x health/manifest, the Supabase `mpool` payload, the luck API. No `as` casts on external data. Use `z.looseObject` for tolerance (mirror `lib/swap/orders.ts`).
- **Polling goes through `hooks/useVisibilityPolling.ts`** — never a bare `setInterval`.
- **No hardcoded prices** — USD values use `useTokenPrices` / `getUsdValue`.
- **No fabricated data** — every displayed number has a real source or is explicitly labelled an estimate (`~`).
- **Deep Pond theme tokens only** (`bg`, `surface`, `surface-2`, `edge`, `ink`, `ink-muted`, `accent`, `accent-strong`, `danger`, `warn`, `font-num`) — no ad-hoc hex. Numerics use `font-num`.
- **All motion respects `prefers-reduced-motion: reduce`** (disabled under it).
- **Tests cover pure logic only** (node env, no jsdom): `lib/rig/boost.ts` and `lib/rig/telemetry.ts`. Hooks/components are verified by `npm run build` (typecheck) + manual/visual.
- **Boost constants:** MAX_BOOST = 615, SWAP_BOOST = 1/6 (per swap), SESSION_COST = 3 (per mining session). 18 swaps = 3 boost = one session.
- **Pond0x Supabase (public, read-only):** project `https://vkqjvwxzsxilnsmpngmc.supabase.co`, channel `blockengine` (`{config:{broadcast:{ack:true}}}`), events `mpool` (`payload.pool` = global miner list) and `cycle`. Config via env: `NEXT_PUBLIC_POND0X_SUPABASE_URL`, `NEXT_PUBLIC_POND0X_SUPABASE_ANON_KEY`.
- Test wallet for manual checks: `GM8Qz8gmp9N3Rm94q9iTJeHobGBXoCYMhwZYY8zji3LA`.
- Gates: `npx vitest run` green and `npm run build` clean at the end of every task.

---

### Task 1: Add `@supabase/realtime-js` + lock the live `mpool` schema (spike)

Environment-dependent discovery task. Installs the dependency, wires the pond0x Supabase config into env, and captures one populated `mpool` payload to confirm the per-miner row field names that Task 3's parser depends on.

**Files:**
- Modify: `package.json` (add dependency)
- Create: `scripts/capture-blockengine.mjs` (throwaway spike script)
- Modify: `.env.example` (document the pond0x Supabase vars)
- Modify: `.env.local` (add the real values — gitignored, do not commit)
- Modify: `docs/superpowers/plans/2026-08-03-rig-boost-tracker.md` (record the confirmed row shape in Task 3's parser note)

**Interfaces:**
- Produces: confirmed `mpool` row field names (wallet, boost, unclaimed) → consumed by Task 3 `parsePoolRow`.

- [ ] **Step 1: Install the realtime client**

Run: `npm install @supabase/realtime-js`
Expected: added to `package.json` dependencies, no peer-dep errors.

- [ ] **Step 2: Extract the pond0x Supabase anon key and add env vars**

The anon key is embedded (public) in the pond0x.com client bundle. Extract it:
```bash
# find the chunk and the anon JWT (role:"anon", ref:"vkqjvwxzsxilnsmpngmc")
curl -s https://www.pond0x.com/mining | grep -oE '/_next/static/chunks/[^" ]+2670[^" ]+\.js' | head -1
# then fetch that chunk and grep for the eyJ... JWT beginning eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```
Add to `.env.example` (values illustrative):
```
# Pond0x public Supabase Realtime (read-only boost/unclaimed feed)
NEXT_PUBLIC_POND0X_SUPABASE_URL=https://vkqjvwxzsxilnsmpngmc.supabase.co
NEXT_PUBLIC_POND0X_SUPABASE_ANON_KEY=eyJhbGci...   # public anon JWT from pond0x.com bundle
```
Add the real key to `.env.local` (gitignored). If the key cannot be extracted, STOP and report — the feature depends on it.

- [ ] **Step 3: Write the capture script**

Create `scripts/capture-blockengine.mjs`:
```js
// Throwaway spike: subscribe to pond0x's blockengine channel and print payloads.
// Run during active mining to capture a populated mpool row shape.
import { RealtimeClient } from "@supabase/realtime-js";

const URL = process.env.NEXT_PUBLIC_POND0X_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_POND0X_SUPABASE_ANON_KEY;
if (!URL || !KEY) { console.error("Set NEXT_PUBLIC_POND0X_SUPABASE_URL/ANON_KEY"); process.exit(1); }

const client = new RealtimeClient(`${URL.replace("https", "wss")}/realtime/v1`, {
  params: { apikey: KEY, eventsPerSecond: 5 },
});
const ch = client.channel("blockengine", { config: { broadcast: { ack: true } } });
ch.on("broadcast", { event: "mpool" }, (m) => {
  const pool = m?.payload?.pool ?? [];
  console.log(`mpool: ${pool.length} rows`, pool[0] ? JSON.stringify(pool[0]) : "(empty)");
})
  .on("broadcast", { event: "cycle" }, (m) => console.log("cycle:", JSON.stringify(m?.payload)?.slice(0, 400)))
  .subscribe((status) => console.log("SUB_STATUS:", status));

setTimeout(() => { console.log("done"); process.exit(0); }, 120000);
```

- [ ] **Step 4: Run the capture (ideally during active mining)**

Run: `node -r dotenv/config scripts/capture-blockengine.mjs dotenv_config_path=.env.local`
Expected: `SUB_STATUS: SUBSCRIBED`, then `mpool` lines. **If a populated row appears**, record its exact keys. **If only `(empty)` appears** (idle network), proceed with the inferred shape below and mark it UNVERIFIED.

- [ ] **Step 5: Record the confirmed row shape**

Update the note in Task 3 with the real field names. Inferred default (each miner row): `{ address|wallet: string, boost|multiplier: number, unclaimed: number|string }`. Note whether `cycle` also carried the connected wallet's boost/unclaimed.

- [ ] **Step 6: Commit (dependency + env docs + script; NOT .env.local)**

```bash
git add package.json package-lock.json .env.example scripts/capture-blockengine.mjs docs/superpowers/plans/2026-08-03-rig-boost-tracker.md
git commit -m "chore: add @supabase/realtime-js + pond0x blockengine capture spike"
```

---

### Task 2: `lib/rig/boost.ts` — pure boost-projection evaluator (TDD)

**Files:**
- Create: `lib/rig/boost.ts`
- Test: `tests/rig/boost.test.ts`

**Interfaces:**
- Produces: `boostProjection(currentBoost: number, sessionSwaps: number, maxBoost?: number): BoostProjection` where `BoostProjection = { pctToMax: number; swapsToMax: number; sessionBoostAdded: number; sessionsBuffer: number }`; constants `MAX_BOOST=615`, `SWAP_BOOST=1/6`, `SESSION_COST=3`. Consumed by Task 5 (hook) and Task 6 (BoostHero/BoostMomentum).

- [ ] **Step 1: Write the failing test**

Create `tests/rig/boost.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { boostProjection, MAX_BOOST, SWAP_BOOST, SESSION_COST } from "@/lib/rig/boost";

describe("boostProjection", () => {
  it("projects from a live boost (matches the tracker mockup)", () => {
    const p = boostProjection(174.6, 54);
    expect(p.pctToMax).toBeCloseTo(28.39, 1);        // 174.6 / 615
    expect(p.swapsToMax).toBe(2643);                  // ceil((615-174.6)/(1/6))
    expect(p.sessionBoostAdded).toBeCloseTo(9, 5);    // 54 * 1/6
    expect(p.sessionsBuffer).toBe(58);                // floor(174.6 / 3)
  });
  it("clamps at max: no swaps needed, 100%", () => {
    const p = boostProjection(700, 0);
    expect(p.pctToMax).toBe(100);
    expect(p.swapsToMax).toBe(0);
  });
  it("floors at zero and ignores negative session swaps", () => {
    const p = boostProjection(0, -10);
    expect(p.pctToMax).toBe(0);
    expect(p.swapsToMax).toBe(MAX_BOOST / SWAP_BOOST);
    expect(p.sessionBoostAdded).toBe(0);
    expect(p.sessionsBuffer).toBe(0);
  });
  it("exposes the economy constants", () => {
    expect(MAX_BOOST).toBe(615);
    expect(SWAP_BOOST).toBeCloseTo(1 / 6, 10);
    expect(SESSION_COST).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/rig/boost.test.ts`
Expected: FAIL — cannot resolve `@/lib/rig/boost`.

- [ ] **Step 3: Write the implementation**

Create `lib/rig/boost.ts`:
```ts
/**
 * Pure boost-projection evaluator for the Pond0x rig.
 *
 * The absolute boost is read live (Supabase feed) — NOT computed here.
 * This projects, relative to a known live boost: progress to max, swaps
 * needed to reach max, boost added this session, and the session runway.
 */
export const MAX_BOOST = 615;
export const SWAP_BOOST = 1 / 6; // boost gained per swap
export const SESSION_COST = 3; // boost consumed per mining session

export interface BoostProjection {
  /** 0..100 — current boost as a percentage of MAX_BOOST */
  pctToMax: number;
  /** swaps needed to climb from current boost to MAX_BOOST */
  swapsToMax: number;
  /** boost gained from this session's swaps (sessionSwaps * SWAP_BOOST) */
  sessionBoostAdded: number;
  /** how many mining sessions the current boost can still pay for */
  sessionsBuffer: number;
}

export function boostProjection(
  currentBoost: number,
  sessionSwaps: number,
  maxBoost = MAX_BOOST
): BoostProjection {
  const boost = Math.max(0, Math.min(maxBoost, currentBoost || 0));
  const remaining = Math.max(0, maxBoost - boost);
  return {
    pctToMax: maxBoost > 0 ? (boost / maxBoost) * 100 : 0,
    swapsToMax: Math.ceil(remaining / SWAP_BOOST),
    sessionBoostAdded: Math.max(0, sessionSwaps || 0) * SWAP_BOOST,
    sessionsBuffer: Math.floor(boost / SESSION_COST),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/rig/boost.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/rig/boost.ts tests/rig/boost.test.ts
git commit -m "feat: pure boost-projection evaluator (lib/rig/boost)"
```

---

### Task 3: `lib/rig/telemetry.ts` — types + Zod parsers (TDD)

**Files:**
- Create: `lib/rig/telemetry.ts`
- Test: `tests/rig/telemetry.test.ts`

**Interfaces:**
- Produces:
  - types `CaryHealth`, `CaryManifest`, `PoolRow`, `Luck`
  - `parseHealth(json: unknown): CaryHealth` / `parseManifest(json: unknown): CaryManifest` / `parseLuck(json: unknown): Luck` — throw on invalid (boundary validation)
  - `parsePoolRow(raw: unknown): PoolRow | null` — returns null on unusable row (never throws)
  - `findWalletRow(pool: unknown, wallet: string): PoolRow | null`
- Consumed by Task 4 (realtime) and Task 5 (hook).

> **Schema note (from Task 1):** the `mpool` row field names are `{ address|wallet, boost|multiplier, unclaimed }`. `parsePoolRow` reads both candidate names so it survives whichever pond0x uses. Update to the confirmed single names once Task 1 captured a populated row.

- [ ] **Step 1: Write the failing test**

Create `tests/rig/telemetry.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseHealth, parseManifest, parseLuck, parsePoolRow, findWalletRow } from "@/lib/rig/telemetry";

const health = {
  account: "GM8Qz8", stats: {
    mining_sessions: 9403, in_mempool: 9310, sent: 11, failed: 20, drifted: 61,
    drift_risk: 0, priority: 44, health: 7,
    estimates: { sol_usd: 73.9, wpond_usd: 5.4e-8, max_claim_estimate_usd: 244072.4, drifted_usd: 779 },
  }, ai_beta: ["Your Rig is 💪. gg."],
};

describe("parseHealth", () => {
  it("parses and normalizes cary0x health", () => {
    const h = parseHealth(health);
    expect(h.health).toBe(7);
    expect(h.miningSessions).toBe(9403);
    expect(h.priority).toBe(44);
    expect(h.maxClaimUsd).toBeCloseTo(244072.4, 1);
    expect(h.aiHints[0]).toMatch(/gg/);
  });
  it("throws on a non-object / missing stats", () => {
    expect(() => parseHealth("<html>")).toThrow();
    expect(() => parseHealth({ account: "x" })).toThrow();
  });
});

describe("parseManifest", () => {
  it("parses badges and pro flags", () => {
    const m = parseManifest({ isPro: false, badges: "pork, chef", hasTwitter: true, proSwapsSol: 1, proSwapsBx: 2, cope: false });
    expect(m.isPro).toBe(false);
    expect(m.badges).toEqual(["pork", "chef"]);
    expect(m.hasTwitter).toBe(true);
  });
  it("tolerates missing badges", () => {
    expect(parseManifest({ isPro: true }).badges).toEqual([]);
  });
});

describe("parseLuck", () => {
  it("parses luck + referrals, tolerates absence", () => {
    expect(parseLuck({ luck: 12, referrals: 3 }).luck).toBe(12);
    expect(parseLuck({}).luck).toBe(0);
  });
});

describe("parsePoolRow / findWalletRow", () => {
  it("normalizes a miner row under either field-name convention", () => {
    expect(parsePoolRow({ address: "GM8Qz8", boost: 174.6, unclaimed: 109300000 }))
      .toEqual({ wallet: "GM8Qz8", boost: 174.6, unclaimed: 109300000 });
    expect(parsePoolRow({ wallet: "AA", multiplier: 615, unclaimed: "373600000" }))
      .toEqual({ wallet: "AA", boost: 615, unclaimed: 373600000 });
  });
  it("returns null for unusable rows", () => {
    expect(parsePoolRow({ boost: 5 })).toBeNull();      // no wallet
    expect(parsePoolRow(null)).toBeNull();
  });
  it("finds our wallet in a pool array", () => {
    const pool = [{ address: "AA", boost: 615, unclaimed: 1 }, { address: "GM8Qz8", boost: 174.6, unclaimed: 2 }];
    expect(findWalletRow(pool, "GM8Qz8")?.boost).toBe(174.6);
    expect(findWalletRow(pool, "ZZ")).toBeNull();
    expect(findWalletRow("not-an-array", "GM8Qz8")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/rig/telemetry.test.ts`
Expected: FAIL — cannot resolve `@/lib/rig/telemetry`.

- [ ] **Step 3: Write the implementation**

Create `lib/rig/telemetry.ts`:
```ts
/**
 * Boundary parsers + types for rig telemetry sources. Zod-validated
 * (convention #3). Cary0x/luck parsers throw on invalid input; the pool-row
 * parser is lenient (returns null) because it runs inside a realtime callback.
 */
import { z } from "zod";

export interface CaryHealth {
  health: number; miningSessions: number; inMempool: number; sent: number;
  failed: number; drifted: number; driftRisk: number; priority: number;
  maxClaimUsd: number; driftedUsd: number; aiHints: string[];
}
export interface CaryManifest { isPro: boolean; badges: string[]; hasTwitter: boolean; }
export interface PoolRow { wallet: string; boost: number; unclaimed: number; }
export interface Luck { luck: number; referrals: number; }

const HealthSchema = z.looseObject({
  stats: z.looseObject({
    mining_sessions: z.number(), in_mempool: z.number(), sent: z.number(),
    failed: z.number(), drifted: z.number(), drift_risk: z.number(),
    priority: z.number(), health: z.number(),
    estimates: z.looseObject({
      max_claim_estimate_usd: z.number().optional(),
      drifted_usd: z.number().optional(),
    }).optional(),
  }),
  ai_beta: z.array(z.string()).optional(),
});

export function parseHealth(json: unknown): CaryHealth {
  const d = HealthSchema.parse(json);
  const s = d.stats;
  return {
    health: s.health, miningSessions: s.mining_sessions, inMempool: s.in_mempool,
    sent: s.sent, failed: s.failed, drifted: s.drifted, driftRisk: s.drift_risk,
    priority: s.priority, maxClaimUsd: s.estimates?.max_claim_estimate_usd ?? 0,
    driftedUsd: s.estimates?.drifted_usd ?? 0, aiHints: d.ai_beta ?? [],
  };
}

const ManifestSchema = z.looseObject({
  isPro: z.boolean().optional(),
  badges: z.string().optional(),
  hasTwitter: z.boolean().optional(),
});
export function parseManifest(json: unknown): CaryManifest {
  const d = ManifestSchema.parse(json);
  return {
    isPro: d.isPro ?? false,
    hasTwitter: d.hasTwitter ?? false,
    badges: (d.badges ?? "").split(",").map((b) => b.trim()).filter(Boolean),
  };
}

const LuckSchema = z.looseObject({ luck: z.number().optional(), referrals: z.number().optional() });
export function parseLuck(json: unknown): Luck {
  const d = LuckSchema.parse(json);
  return { luck: d.luck ?? 0, referrals: d.referrals ?? 0 };
}

const PoolRowSchema = z.looseObject({
  address: z.string().optional(), wallet: z.string().optional(),
  boost: z.number().optional(), multiplier: z.number().optional(),
  unclaimed: z.union([z.number(), z.string()]).optional(),
});
export function parsePoolRow(raw: unknown): PoolRow | null {
  const r = PoolRowSchema.safeParse(raw);
  if (!r.success) return null;
  const d = r.data;
  const wallet = d.address ?? d.wallet;
  const boost = d.boost ?? d.multiplier;
  if (!wallet || boost == null) return null;
  const unclaimed = typeof d.unclaimed === "string" ? Number(d.unclaimed) : d.unclaimed ?? 0;
  return { wallet, boost, unclaimed: Number.isFinite(unclaimed) ? unclaimed : 0 };
}

export function findWalletRow(pool: unknown, wallet: string): PoolRow | null {
  if (!Array.isArray(pool)) return null;
  for (const raw of pool) {
    const row = parsePoolRow(raw);
    if (row && row.wallet === wallet) return row;
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/rig/telemetry.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add lib/rig/telemetry.ts tests/rig/telemetry.test.ts
git commit -m "feat: rig telemetry parsers with Zod boundary validation"
```

---

### Task 4: `lib/rig/realtime.ts` — Supabase Realtime wrapper

**Files:**
- Create: `lib/rig/realtime.ts`

**Interfaces:**
- Produces: `subscribeMpool(wallet: string, onRow: (row: PoolRow | null) => void, onPool?: (rows: PoolRow[]) => void): () => void` — subscribes to `blockengine`, calls `onRow` with the wallet's row (or null) on each `mpool`, `onPool` with the full parsed list; returns an unsubscribe function. Consumed by Task 5.

- [ ] **Step 1: Write the wrapper**

Create `lib/rig/realtime.ts`:
```ts
/**
 * Thin wrapper over pond0x's public Supabase Realtime `blockengine` channel.
 * Read-only, anon key, no signature (verified 2026-08-03). Isolated here so a
 * schema/endpoint change is one file, and any failure degrades to the hook's
 * fallback rather than breaking the tab.
 */
import { RealtimeClient } from "@supabase/realtime-js";
import { findWalletRow, parsePoolRow, type PoolRow } from "@/lib/rig/telemetry";

const URL = process.env.NEXT_PUBLIC_POND0X_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_POND0X_SUPABASE_ANON_KEY;

export function subscribeMpool(
  wallet: string,
  onRow: (row: PoolRow | null) => void,
  onPool?: (rows: PoolRow[]) => void
): () => void {
  if (!URL || !KEY || !wallet) return () => {};

  const client = new RealtimeClient(`${URL.replace("https", "wss")}/realtime/v1`, {
    params: { apikey: KEY, eventsPerSecond: 5 },
  });
  const channel = client.channel("blockengine", { config: { broadcast: { ack: true } } });

  channel
    .on("broadcast", { event: "mpool" }, (msg: { payload?: { pool?: unknown } }) => {
      const pool = msg?.payload?.pool;
      onRow(findWalletRow(pool, wallet));
      if (onPool && Array.isArray(pool)) {
        onPool(pool.map(parsePoolRow).filter((r): r is PoolRow => r !== null));
      }
    })
    .subscribe();

  return () => {
    try { channel.unsubscribe(); client.disconnect(); } catch { /* ignore */ }
  };
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npm run build`
Expected: Compiled successfully (no type errors from the new file).

- [ ] **Step 3: Commit**

```bash
git add lib/rig/realtime.ts
git commit -m "feat: thin Supabase Realtime wrapper for pond0x blockengine"
```

---

### Task 5: `hooks/useRigTelemetry.ts` — orchestrator hook

Composes the three sources + fallback into one state object. Not yet wired into `RigContext` (the old rig tab keeps building until the Task 8 cutover).

**Files:**
- Create: `hooks/useRigTelemetry.ts`

**Interfaces:**
- Consumes: `boostProjection` (Task 2), `parseHealth/parseManifest/parseLuck` (Task 3), `subscribeMpool` (Task 4), `useVisibilityPolling`, `useWallet`.
- Produces: `useRigTelemetry(): RigTelemetry` where
  `RigTelemetry = { connected: boolean; live: boolean; boost: number | null; unclaimed: number | null; projection: BoostProjection; sessionSwaps: number; health: CaryHealth | null; manifest: CaryManifest | null; luck: Luck | null; topBoost: number | null; incrementSwap(): void; refresh(): void; }`. Consumed by Tasks 6–8.

- [ ] **Step 1: Write the hook**

Create `hooks/useRigTelemetry.ts`:
```ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { boostProjection, type BoostProjection } from "@/lib/rig/boost";
import {
  parseHealth, parseManifest, parseLuck,
  type CaryHealth, type CaryManifest, type Luck, type PoolRow,
} from "@/lib/rig/telemetry";
import { subscribeMpool } from "@/lib/rig/realtime";

export interface RigTelemetry {
  connected: boolean;
  live: boolean;               // true when our wallet is in the live pool
  boost: number | null;        // live, else last-known
  unclaimed: number | null;
  projection: BoostProjection;
  sessionSwaps: number;        // confirmed swaps this app session
  health: CaryHealth | null;
  manifest: CaryManifest | null;
  luck: Luck | null;
  topBoost: number | null;     // highest boost in the live pool (leaderboard)
  incrementSwap: () => void;
  refresh: () => void;
}

export function useRigTelemetry(): RigTelemetry {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";
  const intervalMs = useVisibilityPolling();

  const [boost, setBoost] = useState<number | null>(null);
  const [unclaimed, setUnclaimed] = useState<number | null>(null);
  const [live, setLive] = useState(false);
  const [topBoost, setTopBoost] = useState<number | null>(null);
  const [health, setHealth] = useState<CaryHealth | null>(null);
  const [manifest, setManifest] = useState<CaryManifest | null>(null);
  const [luck, setLuck] = useState<Luck | null>(null);
  const [sessionSwaps, setSessionSwaps] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);

  // Live boost/unclaimed via Supabase Realtime (present only while mining)
  useEffect(() => {
    if (!wallet) return;
    const unsub = subscribeMpool(
      wallet,
      (row: PoolRow | null) => {
        if (row) { setBoost(row.boost); setUnclaimed(row.unclaimed); setLive(true); }
        else setLive(false);
      },
      (rows: PoolRow[]) => setTopBoost(rows.reduce((m, r) => Math.max(m, r.boost), 0) || null)
    );
    return unsub;
  }, [wallet]);

  // cary0x health + manifest + luck via visibility-aware polling
  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    const load = async () => {
      const [h, m, l] = await Promise.all([
        fetch(`/api/rig/health/${wallet}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`/api/rig/manifest/${wallet}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`https://www.pond0x.com/api/solana/luck/${wallet}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      if (cancelled) return;
      try { setHealth(h ? parseHealth(h) : null); } catch { setHealth(null); }
      try { setManifest(m ? parseManifest(m) : null); } catch { setManifest(null); }
      try { setLuck(l ? parseLuck(l) : null); } catch { setLuck(null); }
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [wallet, intervalMs, refreshTick]);

  const incrementSwap = useCallback(() => setSessionSwaps((n) => n + 1), []);
  const refresh = useCallback(() => setRefreshTick((n) => n + 1), []);

  return {
    connected: Boolean(wallet),
    live, boost, unclaimed,
    projection: boostProjection(boost ?? 0, sessionSwaps),
    sessionSwaps, health, manifest, luck, topBoost,
    incrementSwap, refresh,
  };
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npm run build`
Expected: Compiled successfully.

- [ ] **Step 3: Commit**

```bash
git add hooks/useRigTelemetry.ts
git commit -m "feat: useRigTelemetry orchestrator hook (live + cary0x + luck + fallback)"
```

---

### Task 6: Animation primitives + `BoostHero`

**Files:**
- Create: `hooks/useCountUp.ts`
- Create: `components/dashboard/rig/BoostHero.tsx`
- Modify: `app/globals.css` (add rig keyframes + reduced-motion guard)

**Interfaces:**
- Consumes: `RigTelemetry` (Task 5), `useTokenPrices` (existing).
- Produces: `useCountUp(value: number, ms?: number): number`; `<BoostHero rig={RigTelemetry} />`. Consumed by Task 8.

- [ ] **Step 1: Write the count-up hook (respects reduced motion)**

Create `hooks/useCountUp.ts`:
```ts
"use client";
import { useEffect, useRef, useState } from "react";

/** Tween a number toward `value` over `ms`. Snaps instantly under
 *  prefers-reduced-motion. */
export function useCountUp(value: number, ms = 300): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduce = typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || ms <= 0) { setDisplay(value); return; }
    fromRef.current = display;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / ms);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(fromRef.current + (value - fromRef.current) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ms]);

  return display;
}
```

- [ ] **Step 2: Add keyframes to `app/globals.css`**

Append:
```css
@keyframes rig-pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
@keyframes rig-flash { 0% { background-color: color-mix(in oklab, var(--color-accent) 22%, transparent); } 100% { background-color: transparent; } }
.rig-pulse { animation: rig-pulse 1.6s ease-in-out infinite; }
.rig-flash { animation: rig-flash .6s ease-out; }
@media (prefers-reduced-motion: reduce) {
  .rig-pulse, .rig-flash { animation: none; }
}
```

- [ ] **Step 3: Write `BoostHero`**

Create `components/dashboard/rig/BoostHero.tsx`:
```tsx
"use client";
import { useRigTelemetry } from "@/hooks/useRigTelemetry";
import { useCountUp } from "@/hooks/useCountUp";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { MAX_BOOST } from "@/lib/rig/boost";

function compact(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return n.toFixed(0);
}

export function BoostHero({ rig }: { rig: ReturnType<typeof useRigTelemetry> }) {
  const { wpondPrice } = useTokenPrices();
  const boost = useCountUp(rig.boost ?? 0);
  const unclaimed = useCountUp(rig.unclaimed ?? 0);
  const pct = Math.max(0, Math.min(100, rig.projection.pctToMax));
  const usd = (rig.unclaimed ?? 0) * (wpondPrice || 0);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-edge bg-surface p-4">
        <div className="text-[10px] uppercase tracking-wider text-ink-muted">Huidige boost</div>
        <div className="font-num text-3xl text-ink">
          {rig.boost == null ? "—" : boost.toFixed(1)}
          {!rig.live && rig.boost != null && <span className="text-ink-muted"> ~</span>}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-gradient-to-r from-accent to-accent-strong transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 font-num text-[11px] text-ink-muted">{pct.toFixed(0)}% naar max {MAX_BOOST} · +0,167/swap</div>
      </div>
      <div className="rounded-xl border border-edge bg-surface p-4">
        <div className="text-[10px] uppercase tracking-wider text-ink-muted">Unclaimed wPOND</div>
        <div className="font-num text-3xl text-accent">{rig.unclaimed == null ? "—" : compact(unclaimed)}</div>
        <div className="mt-2 font-num text-xs text-ink-muted">≈ ${usd.toFixed(2)}</div>
        {rig.health && <div className="font-num text-[11px] text-ink-muted">max-claim potentieel ${compact(rig.health.maxClaimUsd)}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Compiled successfully.

- [ ] **Step 5: Commit**

```bash
git add hooks/useCountUp.ts components/dashboard/rig/BoostHero.tsx app/globals.css
git commit -m "feat: BoostHero + count-up animation + rig keyframes"
```

---

### Task 7: `BoostMomentum`, `RigStats`, `RigProfile`

**Files:**
- Create: `components/dashboard/rig/BoostMomentum.tsx`
- Create: `components/dashboard/rig/RigStats.tsx`
- Create: `components/dashboard/rig/RigProfile.tsx`

**Interfaces:**
- Consumes: `RigTelemetry` (Task 5). Produces the three components, consumed by Task 8.

- [ ] **Step 1: Write `BoostMomentum`**

Create `components/dashboard/rig/BoostMomentum.tsx`:
```tsx
"use client";
import type { useRigTelemetry } from "@/hooks/useRigTelemetry";

const chip = "rounded-md bg-surface-2 px-2 py-1 text-[11px] text-ink-muted";

export function BoostMomentum({ rig }: { rig: ReturnType<typeof useRigTelemetry> }) {
  const p = rig.projection;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-xl border border-edge bg-surface p-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">Naar max 615</div>
          <div className="font-num text-lg text-accent">nog ~{p.swapsToMax.toLocaleString("nl-NL")} swaps</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">Deze sessie</div>
          <div className="font-num text-lg text-ink">+{rig.sessionSwaps} swaps → <span className="text-accent">+{p.sessionBoostAdded.toFixed(1)}</span></div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={chip}>1 run (18×3) = +9 boost = +3 sessies buffer</span>
        {rig.topBoost != null && (
          <span className={chip}>🏆 jij <b className="font-num">{(rig.boost ?? 0).toFixed(1)}</b> · top <b className="font-num">{rig.topBoost.toFixed(0)}</b></span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `RigStats`**

Create `components/dashboard/rig/RigStats.tsx`:
```tsx
"use client";
import type { useRigTelemetry } from "@/hooks/useRigTelemetry";

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${warn ? "border-warn/40 bg-warn/10" : "border-edge bg-surface"}`}>
      <div className={`text-[10px] uppercase tracking-wider ${warn ? "text-warn" : "text-ink-muted"}`}>{label}</div>
      <div className="font-num text-xl text-ink">{value}</div>
    </div>
  );
}

export function RigStats({ rig }: { rig: ReturnType<typeof useRigTelemetry> }) {
  const h = rig.health;
  if (!h) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Health" value={`${h.health}/10`} />
        <Stat label="Priority" value={String(h.priority)} />
        <Stat label="Drift risk ⚠" value={String(h.drifted)} warn={h.drifted > 0} />
      </div>
      <div className="flex flex-wrap justify-between gap-2 rounded-xl border border-edge bg-surface p-4">
        {[["Sessies", h.miningSessions], ["Sent", h.sent], ["Failed", h.failed], ["Drifted", h.drifted], ["Mempool", h.inMempool]].map(([l, v]) => (
          <div key={String(l)}>
            <div className="text-[10px] uppercase tracking-wider text-ink-muted">{l}</div>
            <div className="font-num text-sm text-ink">{Number(v).toLocaleString("nl-NL")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `RigProfile`**

Create `components/dashboard/rig/RigProfile.tsx`:
```tsx
"use client";
import type { useRigTelemetry } from "@/hooks/useRigTelemetry";

export function RigProfile({ rig }: { rig: ReturnType<typeof useRigTelemetry> }) {
  const m = rig.manifest;
  const hint = rig.health?.aiHints?.[0];
  return (
    <div className="flex flex-col gap-3">
      {m && (
        <div>
          <div className="mb-1.5 text-[10px] uppercase tracking-wider text-ink-muted">Badges &amp; profiel</div>
          <div className="flex flex-wrap gap-1.5">
            {m.badges.map((b) => (
              <span key={b} className="rounded-md border border-accent-strong/40 bg-accent/10 px-2 py-1 text-[11px] text-accent">🏅 {b}</span>
            ))}
            {m.hasTwitter && <span className="rounded-md bg-surface-2 px-2 py-1 text-[11px] text-ink-muted">𝕏 linked</span>}
            {rig.luck && <span className="rounded-md bg-surface-2 px-2 py-1 text-[11px] text-ink-muted">luck {rig.luck.luck}</span>}
            <span className="rounded-md bg-surface-2 px-2 py-1 text-[11px] text-ink-muted">{m.isPro ? "PRO" : "standard"}</span>
          </div>
        </div>
      )}
      {hint && (
        <div className="border-l-2 border-accent-strong/40 pl-3 text-xs text-ink-muted">💬 {hint}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Compiled successfully.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/rig/BoostMomentum.tsx components/dashboard/rig/RigStats.tsx components/dashboard/rig/RigProfile.tsx
git commit -m "feat: BoostMomentum, RigStats, RigProfile rig components"
```

---

### Task 8: Cutover — `RigTab` rewrite + `RigContext` + delete `useMiningRig`

Wires the new hook into context, rewrites the tab to compose the new components, connects the swap engine's confirmed-swap event to `incrementSwap`, and deletes the old fabricated-data hook.

**Files:**
- Modify: `contexts/RigContext.tsx`
- Rewrite: `components/dashboard/RigTab.tsx`
- Modify: `hooks/useSwapEngine.ts` (call `incrementSwap` on confirmed swap — see note)
- Delete: `hooks/useMiningRig.ts`

**Interfaces:**
- Consumes: `useRigTelemetry` (Task 5), `BoostHero`/`BoostMomentum`/`RigStats`/`RigProfile` (Tasks 6–7).

> **Swap-counter note:** `useSwapEngine.incrementBoosts()` currently lives on the old rig context. After cutover, the swap engine should call `useRigTelemetry`'s `incrementSwap` via the context. Keep the existing `incrementBoosts` call site in `useSwapEngine` (the confirmed-swap branch) but point the context method at `incrementSwap`. If the engine reads `useRig()`, no engine change is needed beyond the method name; verify the call site and rename if required.

- [ ] **Step 1: Point `RigContext` at the new hook**

Rewrite `contexts/RigContext.tsx`:
```tsx
"use client";
import React, { createContext, useContext } from "react";
import { useRigTelemetry, type RigTelemetry } from "@/hooks/useRigTelemetry";

const RigContext = createContext<RigTelemetry | undefined>(undefined);

export function RigProvider({ children }: { children: React.ReactNode }) {
  return <RigContext.Provider value={useRigTelemetry()}>{children}</RigContext.Provider>;
}

export function useRig(): RigTelemetry {
  const ctx = useContext(RigContext);
  if (!ctx) throw new Error("useRig must be used within RigProvider");
  return ctx;
}
```

- [ ] **Step 2: Update the swap engine's boost-increment call**

In `hooks/useSwapEngine.ts`, the confirmed-swap branch calls `incrementBoosts()` from `useRig()`. Rename to `incrementSwap()`:
```ts
// was: const { incrementBoosts } = useRig();  →
const { incrementSwap } = useRig();
// ...in the result.status === "Success" branch:
incrementSwap();
```
Update the `useCallback` dependency array entry `incrementBoosts` → `incrementSwap`.

- [ ] **Step 3: Rewrite `RigTab`**

Rewrite `components/dashboard/RigTab.tsx`:
```tsx
"use client";
import { useRig } from "@/contexts/RigContext";
import { BoostHero } from "@/components/dashboard/rig/BoostHero";
import { BoostMomentum } from "@/components/dashboard/rig/BoostMomentum";
import { RigStats } from "@/components/dashboard/rig/RigStats";
import { RigProfile } from "@/components/dashboard/rig/RigProfile";

export function RigTab() {
  const rig = useRig();

  if (!rig.connected) {
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
        <span className={`flex items-center gap-1.5 rounded-full border border-edge px-3 py-1 text-xs ${rig.live ? "text-accent" : "text-ink-muted"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${rig.live ? "bg-accent rig-pulse" : "bg-edge"}`} />
          {rig.live ? "MINING (live)" : "idle · ~schatting"}
        </span>
      </div>
      <BoostHero rig={rig} />
      <BoostMomentum rig={rig} />
      <RigStats rig={rig} />
      <RigProfile rig={rig} />
    </div>
  );
}
```

- [ ] **Step 4: Delete the old hook**

Run: `git rm hooks/useMiningRig.ts`
Then grep for stragglers:
Run: `grep -rn "useMiningRig\|rigTemp\|rigPower\|addPermanentBoost\|incrementBoosts" --include=*.ts --include=*.tsx .`
Expected: no matches (all references removed).

- [ ] **Step 5: Verify build + tests**

Run: `npm run build`
Expected: Compiled successfully.
Run: `npx vitest run`
Expected: all tests pass (including the new `tests/rig/*`).

- [ ] **Step 6: Manual verification (documented, user-attended)**

With `.env.local` set and `npm run dev`, connect wallet `GM8Qz8…`, open the dashboard Rig tab: cary0x stats render; while actively mining on pond0x.com the boost/unclaimed go live (green MINING) and animate; when idle they show last-known with `~`. No 68 °C temp, no fake bars.

- [ ] **Step 7: Commit**

```bash
git add contexts/RigContext.tsx components/dashboard/RigTab.tsx hooks/useSwapEngine.ts
git commit -m "feat: cut over rig tab to live boost tracker; remove fabricated useMiningRig"
```

---

## Self-Review

**Spec coverage:** data architecture (Tasks 4–5), boost economy/formula (Task 2), live Supabase source + schema lock (Tasks 1,4), cary0x + luck (Tasks 3,5), what-it-shows metrics (Tasks 6–8), visual "B + badges + naar-max" (Tasks 6–8), animation + reduced-motion (Task 6), cleanup/structure + delete fabricated fields (Task 8), new dependency (Task 1), tests on pure logic (Tasks 2–3), fallback (Task 5). All covered.

**Placeholder scan:** concrete code in every code step; the one runtime-dependent item (exact `mpool` field names) is handled by a lenient dual-name parser (Task 3) confirmed by the Task 1 capture — not a placeholder.

**Type consistency:** `RigTelemetry`/`PoolRow`/`CaryHealth`/`BoostProjection` names and shapes are defined once (Tasks 2,3,5) and consumed consistently (Tasks 6–8). `incrementSwap` replaces `incrementBoosts` at both the context and the swap-engine call site (Task 8).
