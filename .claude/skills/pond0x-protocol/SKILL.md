---
name: pond0x-protocol
description: Knowledge base for the Pond0x protocol - tokens and mints, swap-to-mine mechanics, cary0x community API semantics, market data sources. Use when working on any Pond0x-specific feature (rig stats, manifest, mining, wPOND pricing) or answering questions about how Pond0x works.
---

# Pond0x protocol knowledge base

Pond0x (pond0x.com, founder Pauly0x) is a largely undocumented
"swap-to-mine" protocol. Community APIs and on-chain observation are ground
truth; treat reward claims as estimates. Update this file when observed
behavior changes.

## Tokens

| Token | Chain | Address | Notes |
|---|---|---|---|
| wPOND | Solana | `3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq` | decimals **3**; the main Solana token; low liquidity (~$34k, thin — big swaps move price) |
| pondSOL | Solana | `Ep83qXdvJbofEgpPqphGRq4eMnpjBVUGPYz32QyrWaaC` | LST-style, unverified |
| Pauly | Solana | `5RyeWfbjVw6Ktj6j8SmTiAnVXWvmV8YxGtTebNsU2dBo` | community token |
| PNDC | Ethereum | `0x423f4e6138e475d85cf7ea071ac92097ed631eea` | ERC-20, not SPL |
| PORK | Ethereum | `0xb9f599ce614Feb2e1BBe58F180F370D05b39344E` | ERC-20, not SPL |

## Mechanics (observed)

- **Swap-to-mine**: a mining wallet earns boost credit by *executing swaps*,
  routed through Jupiter v6. The app fires micro-swap sequences (boost mode:
  rounds × swaps with randomized amounts) and reward-window swaps ("You
  boosted 3x,4x & 5x from swapping during the reward window" per the health
  API).
- **Attribution does NOT require a Pond0x referral/fee** (observed on-chain
  2026-08-03, high confidence). Credit is attributed off-chain by cary0x/Pond0x
  from the *wallet's swap activity itself* — wallet identity × swap execution ×
  timing — not from any fee transfer to a Pond0x account.
  - Evidence: three cary0x-confirmed credited miners
    (`B1kWrDazi…X7wN` 473 sessions/health 7; `E2LzFCMZ…MKd5` 384/6;
    `4Xuo2mgF…mHH1` 719/7) — the large majority of their swaps are **vanilla
    Jupiter v6 with no Jupiter Referral program and no fee to any Pond0x
    account**. Only ~1 in ~19 sampled credited-miner swaps carried a Pond0x
    fee (e.g. `5GSQvRr…` = 410 lamports WSOL to `45ruCyfd…`), applied
    inconsistently → that fee is Pond0x's own referral monetization, not a
    credit gate. The "fee-free" swaps were re-checked against BOTH the current
    referral account (`9VjBWxGn`/program `REFER4Zg…`) and the legacy accounts
    and are genuinely fee-free (e.g. `HKNc9zX…`, `4maRm2H…`).
  - **Neither the wPOND mint nor Jupiter is the gate either.** Credited miners
    also earn on non-wPOND swaps (E2LzFCMZ swaps token `393hv…`; 4Xuo2mgF swaps
    `E5xt4…`). And `B1kW…` (credited) also runs swaps via the **OKX
    aggregator** (`proVF4pM…`, not Jupiter) — correlational, not proof the OKX
    swap itself credited, but consistent with "any swap execution," not "any
    Jupiter swap" or "must touch wPOND."
  - Implication: swapping fee-free (no `referralAccount`) still earns boost.
    The Pond0matic v2 fee-free fix does NOT defeat mining.
- **Rig boost economy** (per the operator, 2026-08-03 — the numeric ledger
  behind "swap-to-mine"):

  ```
  current boost =
      Initial Rig Boost
    + Teleported Badge Boost
    + Purchased Boost
    + Swap Boost            (+1/6 per swap)
    - Mining Session Boost  (-3 per mining session)
  ```
  - Max boost currently attainable: **615**. At 615 boost the miner starts at
    **373.6M claimable wPOND**.
  - Each mining session **consumes 3 boost**; each swap **adds 1/6 boost**.
  - Therefore **6 swaps = 1 boost**, and **18 swaps = 3 boost = exactly one
    mining session's cost**. This is why Pond0matic's boost-mode default is
    **18 swaps/round** (`NEXT_PUBLIC_DEFAULT_SWAPS_PER_ROUND || 18`,
    `contexts/SwapConfigContext.tsx`): one round nets one session.
  - The app does not yet surface this boost number — it shows cary0x health
    (0–10) plus a local per-confirmed-swap `incrementBoosts` counter. Current
    boost / badge / purchased-boost values are **not** exposed by the cary0x
    health API the app proxies. The live source was found 2026-08-03: the
    xMiner terminal's BOOST/UNCLAIMED/queue-list ride a **Supabase Realtime
    broadcast**, not cary0x and not a per-wallet on-chain account read. See
    "Live xMiner data source" below.
- **Referral accounts (Jupiter Referral program `REFER4Zg…`), reconciled:**
  - Pond0x's *current* live swap UI (pond0x.com/swap/solana) uses Jupiter's
    **Ultra API** (`ultra-api.jup.ag/order`), attaching
    `referralAccount=9VjBWxGn…JMzD` (name "proxvault"), `referralFee=91` bps.
    That account is a real Jupiter referral account (owner program
    `REFER4Zg…`) tied to project
    **`DkiqsTrw1u1bYFumumC7sCG2S8K25qc2vemJFHyW2wJc`** (from a hand-parse of
    the account data at byte offset 40 — lower confidence, but corroborated by
    the app's own code comment naming DkiqsTrw as the v2 project and by the
    live Ultra call returning 200), admin wallet `1orFCnFf…Hh4iWWL`.
  - **Reconciliation for fee monetization (if ever wanted under the app's
    `/swap/v2/order` path):** the correct current account is `9VjBWxGn…`
    (project `DkiqsTrw…`), NOT the vault ATAs. Whether an Ultra-registered
    referral account behaves identically on `/swap/v2/order` (vs Ultra
    `ultra-api.jup.ag/order`) is UNVERIFIED — test before relying on it.
  - The legacy per-mint "vault" ATAs in `lib/vaults.ts` (e.g. wPOND
    `GKHmDYWP…`) are plain SPL token accounts owned by authority
    `45ruCyfd…`. `45ruCyfd…` is itself an *old* Jupiter referral account
    (name "Limit Order") under a **different** project `AfQ1oaud…`. Passing a
    vault ATA as a v2 `referralAccount` is therefore invalid → the 400 the
    app's fix removed.
  - These referral accounts are pure fee sinks (Pauly0x claims accumulated
    fees via Referral-program `Claim` txs, e.g. `4vrrpXk8…`). They are
    monetization, not the mining-attribution signal.
- Typical bot cadence observed: ~1 tx / 8s during sessions, fee ~105k
  lamports/tx, ~4% failures from slippage (error 6001) on the thin wPOND
  routes.
- Mining "sessions" accumulate; claims are estimated by the community API
  (`max_claim_estimate_usd`) — an estimate, not a promise.

## cary0x community API (no auth; schema drifts — verify before relying)

- `GET https://www.cary0x.com/api/health/<wallet>`:
  `stats.{mining_sessions, in_mempool, sent, failed, drifted, drift_risk,
  priority, health (0-10)}`, `stats.estimates.{sol_usd, wpond_usd,
  max_claim_estimate_usd, drifted_usd}`, `ai_beta` (text hints).
  "Drifted" ≈ mining sessions that lost sync / may not credit. Health `stats`
  recompute every **60–90s** (per doc). Payload may carry
  `data.msg:"Individual stats require signed request and PRO"` — that gates a
  deeper per-session stats layer only; the visible `stats` block is public.
  Doc source map: `cary0x.github.io/docs/info/{manifest,health,swaps,data,bubbles}`.
- `GET https://www.cary0x.com/api/manifest/<wallet>`: mining manifest. Full
  payload (verified live 2026-08-05, wallet `GM8Qz8…`):
  `{isPro, proAgo, proExpiry, proSwapsSol, proSwapsBx, badges, hasTwitter, cope}`.
  - **`proSwapsSol`** (int) = the wallet's **Pond0x-recognized Solana swap
    count** — a lifetime total, present even when `isPro:false` (the `pro`
    prefix is a naming artifact, NOT a gate — do not gate swap display on
    `isPro`). This is the authoritative "total swaps"; the boost calculator's
    "Swaps" input comes from here.
    - **NOT a raw swap count — two documented filters.** The manifest doc
      (`cary0x.github.io/docs/info/manifest`) states verbatim it counts only
      swaps "Pond0x recognizes … additional filters, such as **minimum amount
      or swap pairs**, so it will not be perfectly aligned to your on-chain
      transaction history." ⇒ **micro-swaps below the (undocumented) minimum do
      NOT increment it.** Confirmed empirically 2026-08-05: a wallet doing
      ~0.01–0.015 USDC swaps ran a 54-swap session and `proSwapsSol` stayed
      byte-flat (177069) across 30–60 min, while `bubbles` (+1) and
      `mining_sessions` (+1) ticked up. So `proSwapsSol` is a poor live-activity
      indicator for micro-swappers.
    - **Refresh latency 3–5 min** (per doc) — but flatness over 30–60 min is the
      *filter*, not lag. `proSwapsSol` is **NOT** PRO/signature-gated (it's in
      the unsigned manifest); the health `data.msg` "Individual stats require
      signed request and PRO" gates a *different*, deeper health-stats layer.
    - **Recognized-swap count ≠ boost/mining attribution** — different counters,
      different rules. A swap can earn mining credit (on-chain fee-free
      credited pattern) yet fall below the `proSwapsSol` recognition minimum.
      OPEN QUESTION: whether the boost `+1/6 per swap` uses the SAME minimum
      (i.e. do micro-swaps earn boost?) — unverified; test with larger swaps.
  - `proSwapsBx` (int) = a second swap counter; "Bx" meaning is undocumented.
  - `badges` is a **comma+space-separated string** (`"pork, chef, points, swap"`).
  - `proAgo`/`proExpiry` are the literal string `"undefined"` when absent.
- `GET https://www.cary0x.com/api/bubbles/<wallet>` (no auth): `{bubbles:int,
  boosts:[]}`. `bubbles` is a distinct, larger quantity than swaps
  (186,953 vs 179,596 for `GM8Qz8…`) — **not** a swap count; semantics
  undocumented. `boosts[]` element shape unobserved (empty live).
  **Rate-limit gotcha:** when throttled this endpoint returns **HTTP 200 with
  body `{"error":"Too many requests."}`** — a boundary parser must reject the
  `error` key, since the status code alone won't flag it (`lib/rig/telemetry.ts`
  `parseBubbles` does exactly this).
- The app proxies these at `app/api/rig/{health,manifest,luck,bubbles}/[wallet]`
  (base58-validated); `lib/rig/telemetry.ts` holds the Zod boundary parsers.

## Live xMiner data source — pond0x.com/mining

> **CORRECTION 2026-08-05 (supersedes the Supabase theory below):** the live
> boost/unclaimed does **NOT** ride the Supabase `blockengine` broadcast — that
> only ever emits an empty `mpool` (verified 4 node captures + a wildcard
> `event:"*"` listener, incl. during active mining). Browser inspection of a
> LIVE session showed it comes from a REST endpoint
> **`GET /api/user/minesession/<base64(sessionId:wallet)>`**, polled ~1/s, **no
> WebSocket** (0 frames). It is gated behind the ephemeral mining-session token
> and only exists while actively mining → **not passively fetchable** by an
> outside app. Pond0matic's rig tab uses a manual boost input as a result. The
> Supabase notes below are kept for the record but are NOT the boost source.

### (superseded) Original Supabase theory — found 2026-08-03

The xMiner v2.7 terminal (per-wallet BOOST decimal, UNCLAIMED, HASHRATE, and
the global MINING/QUEUE list `multiplier × wallet × unclaimed`) is fed by a
**Supabase Realtime broadcast channel**, not cary0x. Found by static analysis
of the pond0x.com Next.js bundle (chunk `2670-*.js`) + live probing.

- **Supabase project**: `https://vkqjvwxzsxilnsmpngmc.supabase.co`
  - anon key (public, embedded in the client bundle — safe for reads):
    JWT `role:"anon"`, `ref:"vkqjvwxzsxilnsmpngmc"`, `exp` 2044. Begins
    `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWp2d3h6c3hpbG5zbXBuZ21jIi…`
    (full value in the bundle / this session's notes).
- **Channel**: `blockengine`, `{config:{broadcast:{ack:true}}}`,
  `realtime.params.eventsPerSecond` 5–10. Two broadcast events:
  - `cycle` → stored as `livestate` — carries the terminal header/live block
    state (this is where the connected wallet's decimal BOOST e.g. 174.6 and
    growing UNCLAIMED bind, per the store wiring). **UNOBSERVED payload**:
    fires only during active mining; a 6-min idle capture caught **zero**
    cycles. Whether the 174.6 decimal is delivered in-payload or recomputed
    client-side from the operator boost formula is **OPEN**.
  - `mpool` → stored as `mempool = payload.pool` — the live MINING/QUEUE list
    (array of miner rows, the `615x → 373.6m` entries). **OBSERVED transport,
    empty payload**: received `{"pool":[]}` every ~10s during an idle window;
    populated row shape not yet captured (needs active mining).
- **Access verdict (HIGH confidence, reproducible)**: anon subscribe to
  `blockengine` **SUCCEEDS with the anon key and NO wallet signature**
  (`SUB_STATUS: SUBSCRIBED`). Recipe to replicate from our app:
  `createClient(url, anonKey,{realtime:{params:{eventsPerSecond:5}}})
  .channel("blockengine",{config:{broadcast:{ack:true}}})
  .on("broadcast",{event:"cycle"|"mpool"}, …).subscribe()`. The list is
  **global** (all miners) → filter client-side to our wallet.
- **Payload verdict (HIGH-confidence-but-UNOBSERVED)**: that a populated
  `cycle`/`mpool` carries per-wallet boost + unclaimed is inferred from the
  bundle store wiring + the screenshots' row shape, **not yet seen live**.
  One active-mining sample converts this to confirmed. To capture: subscribe
  while a mining session is running (real swaps — user's call), or read the
  websocket frames on an open /mining tab.

### First-party pond0x.com APIs (public, no auth, wallet-in-URL GET)

- `GET https://www.pond0x.com/api/solana/mining/session/<wallet>` → returns an
  **ephemeral session keypair secret** (87-char base58 = 64 bytes), rotated
  every call, used client-side (`Keypair.fromSecretKey` → `sign.detached`) to
  sign hash submissions. This is the **submit-hash / run-the-miner path — it
  is NOT a read gate** for boost/unclaimed. Returns 200 for any address
  (even the system program), unauthenticated.
- `GET https://www.pond0x.com/api/solana/luck/<wallet>` → public, no auth,
  per-wallet JSON: `{luck, impact:["luck.boost.sol"], referrals, referralTxns,
  associates, associateTxns, generated, history:[…]}`. This is the
  **luck/referral-bonus** subsystem (one input to boost), **not** the live
  BOOST decimal or UNCLAIMED. Bonus source, not the target field.
- Other bundle-referenced first-party paths (unprobed): `/api/broadcast`,
  `/api/user/checkin`, `/api/chat/*`, `/api/ai/*`. No `/api/.../claim` or
  `/api/.../boost` REST endpoint exists — reinforcing that live boost/unclaimed
  comes over the `blockengine` broadcast, not REST.

### What is NOT the source (ruled out 2026-08-03)

- **Not cary0x** — health/manifest do not expose boost or unclaimed (see above).
- **Not a per-wallet on-chain rig account.** The wallet's mining txs are pure
  swap aggregation via **DFlow** (`DF1ow4tspfHX9JwWJsAb9epbkA8hmpSEAtxXy1V27QBH`,
  instr `Swap`/`UnwrapSol`, routing Raydium CAMM `CAMMCzo5…` / `HpNfyc2Saw…`)
  plus a tiny post-swap program `L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95`
  (1 account, likely attribution memo). **No boost/unclaimed state is written
  on-chain by the swaps** — consistent with off-chain attribution. The
  terminal does no `getAccountInfo` on a mining PDA in its read path.
- **Not the Supabase REST tables.** Tables `mining`, `leaderboard`, `wallets`
  (`address` col), `accounts`, `events` exist and are anon-readable but
  **RLS-locked** (`Content-Range: */0`, empty rows); `sessions` → 401. The
  live data flows through Realtime broadcast, not queryable tables — the
  empty REST is **not** the blocker.
- `GSMBLYht4JGmm1ZofyTFTGykYCwsenNQpRmiJ5fMnHpD` is the **Metavault** program
  (`createMetavaultWithTemplate`, PDA seeds `["template-vault", user, …]`,
  global config PDA seed `["config"]`), a separate feature — not the rig.

## Market data

- wPOND price: `lite-api.jup.ag/price/v3` or DexScreener
  (`api.dexscreener.com/latest/dex/tokens/<mint>`; pick the highest-liquidity
  pair). PNDC/PORK stats come from DexScreener with their ETH addresses.

## Tooling

Query all of the above live via `npx tsx tools/cli.ts pond0x …` or the
`pond0x_*` MCP tools. For deeper protocol questions, dispatch the
`pond0x-researcher` agent.
