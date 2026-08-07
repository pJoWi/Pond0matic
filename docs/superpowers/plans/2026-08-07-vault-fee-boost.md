# Vault-Fee → RIG-Boost Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route the swap platform fee to the pond0x affiliate vault via the Jupiter v1 `feeAccount` path so Pond0matic's own swaps count toward RIG boost, and add user-facing fee + slippage sliders.

**Architecture:** A timeboxed spike first rules out a v2-native vault route. Then two new pure modules — `lib/swap/v1.ts` (Jupiter v1 quote/swap request builders + Zod parsers) and `lib/swap/send.ts` (self-managed send+confirm replacing v2 `/execute`) — are unit-tested in isolation and wired into `hooks/useSwapEngine.ts`, replacing the v2 order/execute block while preserving validation, the session planner, and telemetry. A reusable slider drives the existing `platformFeeBps`/`slippageBps` settings.

**Tech Stack:** Next 16 / React 19 / TypeScript 7 / Tailwind 4 / Vitest / Zod 4 / `@solana/web3.js` 1.x / `@solana/wallet-adapter-react`.

## Global Constraints

- Work only on branch `feature/vault-fee-boost` (off `main`, spec committed as `8e86067`).
- **Financial code — real funds.** The implementer NEVER signs or submits an on-chain transaction; the user validates with real swaps. `validateSwapTransaction(tx, publicKey)` MUST run before signing, unchanged.
- After every task: `npx tsc --noEmit` clean, `npm run test` all passing, `npm run build` succeeds. **Do NOT start a dev server** (`next dev` collides with `next build` on `.next`); ensure nothing listens on ports 3000–3010 and `rm -rf .next` before a build.
- Jupiter v1 endpoints: `https://api.jup.ag/swap/v1/quote` and `https://api.jup.ag/swap/v1/swap`, called with `jupiterHeaders(settings.jupiterApiKey)` (from `lib/swap/orders.ts`).
- Fee-account precedence is **referral → vault → none** (reuse `buildJupiterSwapRequest` from `lib/referral.ts`, which already implements exactly this).
- Fee slider: floor = `JUPITER_MIN_FEE_BPS` (set from the Task 1 spike), ceiling **255 bps**, step **5**. Slippage slider: **10–300 bps**, step **10**, default **50**.
- `@solana/web3.js` stays 1.x. Dependency ranges use `^`.
- Preserve existing behavior of `useSwapEngine`: session planner sequencing, `dispatchSwapEvent` telemetry, `incrementSwap`, activity logging, and the price-only `getUsdValue` (which may keep using the v2 `buildOrderUrl` — it is fee-free pricing only).

---

## Task 1: Spike — rule out a v2 vault route; pin the Jupiter v1 fee floor

**Files:**
- Create: `docs/superpowers/specs/2026-08-07-vault-fee-spike.md`
- Modify: `lib/swap/v1.ts` is NOT created here — this task only produces the documented finding + the `JUPITER_MIN_FEE_BPS` value used by later tasks.

- [ ] **Step 1: Test whether the vault ATA is accepted by v2 `/order`**

Run a read-only `GET` against `https://api.jup.ag/swap/v2/order` with `referralAccount` set to the pond0x USDC vault `6NqvoPpSYCPEtLEukQaSNs7mS3yK6k285saH9o3vgC96` and a tiny amount, e.g.:
`curl -s "https://api.jup.ag/swap/v2/order?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=1000000&referralAccount=6NqvoPpSYCPEtLEukQaSNs7mS3yK6k285saH9o3vgC96&referralFee=100"`
Expected: HTTP 400 with a Jupiter `{"error": ...}` about an invalid/uninitialised referral account — confirming no v2 route. If it unexpectedly returns 200 with a transaction, STOP and report: a v2 route exists and the plan should be revised.

- [ ] **Step 2: Determine the minimum accepted v1 fee**

Query `https://api.jup.ag/swap/v1/quote` with `platformFeeBps` values (e.g. 10, 25, 50, 100) and confirm the quote returns `200` and echoes a `platformFee`/fee field. Record the lowest `platformFeeBps` Jupiter accepts on a v1 quote.
`curl -s "https://api.jup.ag/swap/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=1000000&slippageBps=50&platformFeeBps=10"`

- [ ] **Step 3: Write the spike finding**

In `docs/superpowers/specs/2026-08-07-vault-fee-spike.md` record: (a) the v2 result (no route, with the exact error), (b) the minimum accepted v1 `platformFeeBps` → this becomes `JUPITER_MIN_FEE_BPS`. Note the caveat that "Jupiter accepts the fee" ≠ "cary0x counts the swap" — the only fee value CONFIRMED to count is **100 bps** (the old version's default that produced +88). Recommend `JUPITER_MIN_FEE_BPS` = the lowest Jupiter accepts for the slider floor, and default `platformFeeBps` = **100** (confirmed-counting) — see Task 6.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-08-07-vault-fee-spike.md
git commit -m "docs: vault-fee spike — no v2 route; v1 fee floor"
```

---

## Task 2: `lib/swap/v1.ts` — Jupiter v1 request builders + parsers

**Files:**
- Create: `lib/swap/v1.ts`
- Test: `tests/swap/v1.test.ts`

**Interfaces:**
- Consumes: `buildJupiterSwapRequest` from `@/lib/referral` (already returns `{ ...body, feeAccount: referral || vault }`).
- Produces:
  - `JUP_V1_QUOTE: string`, `JUP_V1_SWAP: string`
  - `buildV1QuoteUrl(p: V1QuoteParams): string` where `V1QuoteParams = { inputMint: string; outputMint: string; amountRaw: string; slippageBps: number; platformFeeBps: number }`
  - `buildV1SwapBody(p: { quoteResponse: unknown; userPublicKey: string; referralAddress?: string; vaultAddress?: string }): Record<string, unknown>`
  - `parseV1Quote(json: unknown): V1Quote` where `V1Quote` has at least `{ outAmount: string }`
  - `parseV1SwapResponse(json: unknown): { swapTransaction: string }`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/swap/v1.test.ts
import { describe, it, expect } from "vitest";
import { buildV1QuoteUrl, buildV1SwapBody, parseV1Quote, parseV1SwapResponse, JUP_V1_QUOTE } from "@/lib/swap/v1";

describe("v1 quote url", () => {
  it("encodes all params including platformFeeBps", () => {
    const url = buildV1QuoteUrl({ inputMint: "IN", outputMint: "OUT", amountRaw: "1000", slippageBps: 50, platformFeeBps: 100 });
    expect(url.startsWith(JUP_V1_QUOTE)).toBe(true);
    expect(url).toContain("inputMint=IN");
    expect(url).toContain("outputMint=OUT");
    expect(url).toContain("amount=1000");
    expect(url).toContain("slippageBps=50");
    expect(url).toContain("platformFeeBps=100");
  });
});

describe("v1 swap body fee precedence", () => {
  const quote = { outAmount: "5" };
  it("routes fee to the vault when no referral", () => {
    const body = buildV1SwapBody({ quoteResponse: quote, userPublicKey: "PK", vaultAddress: "VAULT" });
    expect(body.feeAccount).toBe("VAULT");
    expect(body.userPublicKey).toBe("PK");
  });
  it("prefers the referral address over the vault", () => {
    const body = buildV1SwapBody({ quoteResponse: quote, userPublicKey: "PK", referralAddress: "REF", vaultAddress: "VAULT" });
    expect(body.feeAccount).toBe("REF");
  });
  it("omits feeAccount when neither is set", () => {
    const body = buildV1SwapBody({ quoteResponse: quote, userPublicKey: "PK" });
    expect(body.feeAccount).toBeUndefined();
  });
});

describe("v1 parsers", () => {
  it("parses a quote", () => {
    expect(parseV1Quote({ outAmount: "42", inAmount: "1000" }).outAmount).toBe("42");
  });
  it("parses a swap response", () => {
    expect(parseV1SwapResponse({ swapTransaction: "b64tx" }).swapTransaction).toBe("b64tx");
  });
  it("rejects a swap response missing the transaction", () => {
    expect(() => parseV1SwapResponse({})).toThrow();
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npx vitest run tests/swap/v1.test.ts`
Expected: FAIL (module `@/lib/swap/v1` not found).

- [ ] **Step 3: Implement `lib/swap/v1.ts`**

```ts
/**
 * Jupiter Swap API v1 request builders + boundary parsing (Zod v4). Pure —
 * no fetch here. Unlike v2 /order, v1 /swap accepts the legacy affiliate vault
 * ATA as `feeAccount`, which is what makes swaps count toward RIG boost.
 */
import { z } from "zod";
import { buildJupiterSwapRequest } from "@/lib/referral";

export const JUP_V1_QUOTE = "https://api.jup.ag/swap/v1/quote";
export const JUP_V1_SWAP = "https://api.jup.ag/swap/v1/swap";

export interface V1QuoteParams {
  inputMint: string;
  outputMint: string;
  amountRaw: string;
  slippageBps: number;
  platformFeeBps: number;
}

export function buildV1QuoteUrl(p: V1QuoteParams): string {
  const url = new URL(JUP_V1_QUOTE);
  url.searchParams.set("inputMint", p.inputMint);
  url.searchParams.set("outputMint", p.outputMint);
  url.searchParams.set("amount", p.amountRaw);
  url.searchParams.set("slippageBps", String(p.slippageBps));
  url.searchParams.set("platformFeeBps", String(p.platformFeeBps));
  return url.toString();
}

export function buildV1SwapBody(p: {
  quoteResponse: unknown;
  userPublicKey: string;
  referralAddress?: string;
  vaultAddress?: string;
}): Record<string, unknown> {
  // Reuse the existing precedence helper (referral → vault → none).
  return buildJupiterSwapRequest({
    quoteResponse: p.quoteResponse,
    userPublicKey: p.userPublicKey,
    referralAddress: p.referralAddress,
    vaultAddress: p.vaultAddress,
  });
}

const V1QuoteSchema = z.looseObject({
  outAmount: z.string(),
  inAmount: z.string().optional(),
  priceImpactPct: z.union([z.string(), z.number()]).optional(),
});
export type V1Quote = z.infer<typeof V1QuoteSchema>;
export function parseV1Quote(json: unknown): V1Quote {
  return V1QuoteSchema.parse(json);
}

const V1SwapResponseSchema = z.looseObject({ swapTransaction: z.string() });
export function parseV1SwapResponse(json: unknown): { swapTransaction: string } {
  return V1SwapResponseSchema.parse(json);
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx vitest run tests/swap/v1.test.ts`
Expected: PASS (all assertions).

- [ ] **Step 5: Commit**

```bash
git add lib/swap/v1.ts tests/swap/v1.test.ts
git commit -m "feat(swap): Jupiter v1 request builders + parsers (feeAccount->vault)"
```

---

## Task 3: `lib/swap/send.ts` — self-managed send + confirm

**Files:**
- Create: `lib/swap/send.ts`
- Test: `tests/swap/send.test.ts`

**Interfaces:**
- Produces: `sendAndConfirm(connection: SendConfirmConnection, rawTx: Uint8Array, opts?: { timeoutMs?: number; pollMs?: number; sleep?: (ms: number) => Promise<void> }): Promise<{ signature: string }>` where
  `SendConfirmConnection = { sendRawTransaction(raw: Uint8Array, opts?: unknown): Promise<string>; getSignatureStatuses(sigs: string[]): Promise<{ value: Array<{ confirmationStatus?: string; err: unknown } | null> }> }`
  (a structural subset of `@solana/web3.js` `Connection`, so the real `Connection` satisfies it and tests can mock it). Throws on on-chain error or timeout.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/swap/send.test.ts
import { describe, it, expect } from "vitest";
import { sendAndConfirm } from "@/lib/swap/send";

const noSleep = async () => {};
function conn(statuses: Array<{ confirmationStatus?: string; err: unknown } | null>) {
  let i = 0;
  return {
    sent: [] as Uint8Array[],
    async sendRawTransaction(raw: Uint8Array) { this.sent.push(raw); return "SIG123"; },
    async getSignatureStatuses() { return { value: [statuses[Math.min(i++, statuses.length - 1)]] }; },
  };
}

describe("sendAndConfirm", () => {
  it("returns the signature once confirmed", async () => {
    const c = conn([null, { confirmationStatus: "confirmed", err: null }]);
    const { signature } = await sendAndConfirm(c, new Uint8Array([1]), { pollMs: 0, timeoutMs: 1000, sleep: noSleep });
    expect(signature).toBe("SIG123");
    expect(c.sent.length).toBe(1);
  });

  it("throws when the transaction lands with an error", async () => {
    const c = conn([{ confirmationStatus: "confirmed", err: { InstructionError: [0, "Custom"] } }]);
    await expect(sendAndConfirm(c, new Uint8Array([1]), { pollMs: 0, timeoutMs: 1000, sleep: noSleep })).rejects.toThrow();
  });

  it("throws on confirmation timeout", async () => {
    const c = conn([null]);
    await expect(sendAndConfirm(c, new Uint8Array([1]), { pollMs: 0, timeoutMs: 0, sleep: noSleep })).rejects.toThrow(/timeout|not confirmed/i);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npx vitest run tests/swap/send.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/swap/send.ts`**

```ts
/**
 * Self-managed submit + confirm for a signed swap transaction. Replaces the
 * Jupiter v2 /execute step (v1 /swap only returns an unsigned tx). Sends the
 * raw tx, then polls signature status to a "confirmed" commitment, throwing on
 * an on-chain error or a confirmation timeout.
 */
export interface SendConfirmConnection {
  sendRawTransaction(raw: Uint8Array, opts?: unknown): Promise<string>;
  getSignatureStatuses(
    sigs: string[]
  ): Promise<{ value: Array<{ confirmationStatus?: string; err: unknown } | null> }>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function sendAndConfirm(
  connection: SendConfirmConnection,
  rawTx: Uint8Array,
  opts: { timeoutMs?: number; pollMs?: number; sleep?: (ms: number) => Promise<void> } = {}
): Promise<{ signature: string }> {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const pollMs = opts.pollMs ?? 2_000;
  const sleep = opts.sleep ?? defaultSleep;

  const signature = await connection.sendRawTransaction(rawTx, { skipPreflight: false, maxRetries: 3 });

  const deadline = Date.now() + timeoutMs;
  // Poll at least once even when timeoutMs is 0.
  do {
    const { value } = await connection.getSignatureStatuses([signature]);
    const status = value[0];
    if (status) {
      if (status.err) {
        throw new Error(`Swap transaction failed on-chain: ${JSON.stringify(status.err)}`);
      }
      if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") {
        return { signature };
      }
    }
    if (Date.now() >= deadline) break;
    await sleep(pollMs);
  } while (Date.now() < deadline);

  throw new Error(`Swap not confirmed within ${timeoutMs}ms (signature ${signature})`);
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx vitest run tests/swap/send.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/swap/send.ts tests/swap/send.test.ts
git commit -m "feat(swap): self-managed send+confirm (replaces v2 /execute)"
```

---

## Task 4: Wire `useSwapEngine` to the v1 fee-to-vault path

**Files:**
- Modify: `hooks/useSwapEngine.ts` (the `executeSwap` order/sign/execute block — currently ~lines 160–260)
- Test: manual gate (integration; covered by build + user real-swap validation)

**Interfaces:**
- Consumes: `buildV1QuoteUrl`, `buildV1SwapBody`, `parseV1Quote`, `parseV1SwapResponse` (Task 2); `sendAndConfirm` (Task 3); `config.currentVault` (already exposed by `SwapConfigContext`, `string | null`); `settings.platformFeeBps`, `settings.slippageBps`, `settings.rpc`, `settings.jupiterApiKey`.

- [ ] **Step 1: Add imports**

Add near the other imports in `hooks/useSwapEngine.ts`:

```ts
import { Connection, VersionedTransaction } from "@solana/web3.js";
import { buildV1QuoteUrl, buildV1SwapBody, parseV1Quote, parseV1SwapResponse, JUP_V1_SWAP } from "@/lib/swap/v1";
import { sendAndConfirm } from "@/lib/swap/send";
```

(Keep the existing `jupiterHeaders`, `jupiterErrorMessage`, `extractJupiterError`, `b64ToUint8Array`, `validateSwapTransaction`, `getFeeRoutingDescription` imports. `VersionedTransaction` is already imported — do not duplicate.)

- [ ] **Step 2: Replace the v2 order/execute block with the v1 flow**

In `executeSwap`, replace the block that currently builds the v2 order (`feeAccountForOrder` → `buildOrderUrl` → `/order` → `parseOrder` → sign → `JUP_EXECUTE`) with:

```ts
// Fee routing: referral → affiliate vault → none. The vault ATA is a valid
// v1 feeAccount (unlike v2 referralAccount), and routing the fee to the pond0x
// vault is what makes the swap count toward RIG boost.
const vaultAddress = config.currentVault ?? undefined;

const quoteRes = await fetch(
  buildV1QuoteUrl({
    inputMint: pairFrom,
    outputMint: pairTo,
    amountRaw: String(raw),
    slippageBps: settings.slippageBps,
    platformFeeBps: settings.platformFeeBps,
  }),
  { headers: jupiterHeaders(settings.jupiterApiKey) }
);
if (!quoteRes.ok) {
  const detail = extractJupiterError(await quoteRes.json().catch(() => null));
  const msg = jupiterErrorMessage(quoteRes.status, detail);
  log(`⚠️ ${msg}`);
  toast.error(msg.slice(0, 120));
  return;
}
const quote = parseV1Quote(await quoteRes.json());

const swapRes = await fetch(JUP_V1_SWAP, {
  method: "POST",
  headers: jupiterHeaders(settings.jupiterApiKey, true),
  body: JSON.stringify(
    buildV1SwapBody({
      quoteResponse: quote,
      userPublicKey: publicKey.toBase58(),
      referralAddress,
      vaultAddress,
    })
  ),
});
if (!swapRes.ok) {
  const detail = extractJupiterError(await swapRes.json().catch(() => null));
  const msg = jupiterErrorMessage(swapRes.status, detail);
  log(`⚠️ ${msg}`);
  toast.error(msg.slice(0, 120));
  return;
}
const { swapTransaction } = parseV1SwapResponse(await swapRes.json());

log(referralAddress || vaultAddress ? `💰 ${getFeeRoutingDescription(vaultAddress, referralAddress)}` : "💰 No platform fee");

const tx = VersionedTransaction.deserialize(b64ToUint8Array(swapTransaction));
const validation = validateSwapTransaction(tx, publicKey);
if (!validation.isValid) {
  log(`❌ Transaction validation failed: ${validation.errors.join(", ")}`);
  return;
}
if (validation.warnings.length > 0) {
  log(`⚠️ Transaction warnings: ${validation.warnings.join(", ")}`);
}

// (dispatch swap-started event here — keep the existing dispatchSwapEvent block
//  that follows in the current code; it is unchanged.)

if (!signTransaction) {
  log("Wallet does not support signing.");
  dispatchSwapEvent({ type: "swap-failed", internalId, reason: "Wallet does not support signing" });
  return;
}
const signed = await signTransaction(tx);

const connection = new Connection(settings.rpc, { commitment: "confirmed" });
const { signature } = await sendAndConfirm(connection, signed.serialize());
```

Keep the existing post-execute handling that follows (deriving the landed signature, `incrementSwap`, `dispatchSwapEvent({ type: "swap-landed", ... })`, `log(solscanTx(signature))`), but source the signature from `sendAndConfirm`'s return instead of the `/execute` response. Remove now-unused v2-only imports (`buildOrderUrl`, `buildExecuteBody`, `parseExecuteResponse`, `feeAccountForOrder`, `clampReferralFeeBps`, `bytesToBase64`, `JUP_EXECUTE`) **only if** `getUsdValue` no longer references them — `getUsdValue` uses `buildOrderUrl`/`parseOrder`/`jupiterHeaders` for price-only quoting, so KEEP those three; remove the rest.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: clean. Fix any unused-import or type errors surfaced.

- [ ] **Step 4: Run the full suite + clean build**

Run: `npm run test` then (no dev server running) `rm -rf .next && npm run build`
Expected: all existing tests pass; build succeeds (13 routes). No swap is executed here — this only proves the code compiles and the app builds.

- [ ] **Step 5: Commit**

```bash
git add hooks/useSwapEngine.ts
git commit -m "feat(swap): route fee to affiliate vault via Jupiter v1 (boost-counting)"
```

---

## Task 5: Reusable range-slider primitive

**Files:**
- Create: `components/ui/RangeSlider.tsx`
- Create: `lib/ui/slider.ts` (pure clamp/step + bps↔% helpers)
- Test: `tests/ui/slider.test.ts`

**Interfaces:**
- Produces:
  - `clampToStep(value: number, min: number, max: number, step: number): number`
  - `bpsToPct(bps: number): string` (e.g. `100 → "1.00"`, `50 → "0.50"`, `10 → "0.10"`)
  - `RangeSlider(props: { label: string; valueBps: number; minBps: number; maxBps: number; stepBps: number; onChangeBps: (bps: number) => void; hint?: string }): JSX.Element`

- [ ] **Step 1: Write the failing tests (pure helpers only)**

```ts
// tests/ui/slider.test.ts
import { describe, it, expect } from "vitest";
import { clampToStep, bpsToPct } from "@/lib/ui/slider";

describe("clampToStep", () => {
  it("clamps below min and above max", () => {
    expect(clampToStep(5, 10, 300, 10)).toBe(10);
    expect(clampToStep(999, 10, 300, 10)).toBe(300);
  });
  it("snaps to the nearest step within range", () => {
    expect(clampToStep(53, 10, 300, 10)).toBe(50);
    expect(clampToStep(57, 10, 300, 10)).toBe(60);
  });
});

describe("bpsToPct", () => {
  it("formats bps as a percent string", () => {
    expect(bpsToPct(100)).toBe("1.00");
    expect(bpsToPct(50)).toBe("0.50");
    expect(bpsToPct(10)).toBe("0.10");
    expect(bpsToPct(255)).toBe("2.55");
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npx vitest run tests/ui/slider.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/ui/slider.ts` and `components/ui/RangeSlider.tsx`**

```ts
// lib/ui/slider.ts
export function clampToStep(value: number, min: number, max: number, step: number): number {
  const clamped = Math.min(max, Math.max(min, value));
  const snapped = min + Math.round((clamped - min) / step) * step;
  return Math.min(max, Math.max(min, snapped));
}

export function bpsToPct(bps: number): string {
  return (bps / 100).toFixed(2);
}
```

```tsx
// components/ui/RangeSlider.tsx
"use client";
import { clampToStep, bpsToPct } from "@/lib/ui/slider";

export function RangeSlider(props: {
  label: string;
  valueBps: number;
  minBps: number;
  maxBps: number;
  stepBps: number;
  onChangeBps: (bps: number) => void;
  hint?: string;
}) {
  const { label, valueBps, minBps, maxBps, stepBps, onChangeBps, hint } = props;
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex items-center justify-between">
        <span className="text-ink-muted">{label}</span>
        <span className="font-semibold text-ink">{bpsToPct(valueBps)}%</span>
      </span>
      <input
        type="range"
        min={minBps}
        max={maxBps}
        step={stepBps}
        value={valueBps}
        onChange={(e) => onChangeBps(clampToStep(Number(e.target.value), minBps, maxBps, stepBps))}
        className="w-full accent-accent"
        aria-label={label}
      />
      {hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
    </label>
  );
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx vitest run tests/ui/slider.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ui/slider.ts components/ui/RangeSlider.tsx tests/ui/slider.test.ts
git commit -m "feat(ui): reusable RangeSlider + bps/step helpers"
```

---

## Task 6: Fee + slippage sliders wired to settings

**Files:**
- Create: `components/swap/SwapTuningCard.tsx`
- Modify: `components/swap/SwapPanel.tsx` (insert the card after `<AmountCard />`)
- Modify: `lib/settings/storage.ts` (set the fee floor constant + confirm defaults)

**Interfaces:**
- Consumes: `RangeSlider` (Task 5); `useSettings()` → `{ settings, update }` where `update(patch: Partial<StoredSettings>)`; `JUPITER_MIN_FEE_BPS` from the Task 1 spike.

- [ ] **Step 1: Add the fee-floor constant and confirm defaults in `lib/settings/storage.ts`**

Add an exported constant (value from the Task 1 spike; use `50` as a safe placeholder ONLY if the spike is not yet done, and update it):

```ts
/** Lowest platform-fee bps Jupiter v1 accepts (from the vault-fee spike). */
export const JUPITER_MIN_FEE_BPS = 50;
```

Keep `platformFeeBps` default at **100** (the value confirmed to count toward boost — see note in Task 1) and `slippageBps` default at **50**. Do not change the Zod bounds.

- [ ] **Step 2: Create `components/swap/SwapTuningCard.tsx`**

```tsx
"use client";
import { useSettings } from "@/contexts/SettingsContext";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { JUPITER_MIN_FEE_BPS } from "@/lib/settings/storage";

const FEE_MAX_BPS = 255;
const FEE_STEP_BPS = 5;
const SLIP_MIN_BPS = 10;
const SLIP_MAX_BPS = 300;
const SLIP_STEP_BPS = 10;

export function SwapTuningCard() {
  const { settings, update } = useSettings();
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-edge bg-surface-2 p-3">
      <RangeSlider
        label="Platform fee → boost"
        valueBps={settings.platformFeeBps}
        minBps={JUPITER_MIN_FEE_BPS}
        maxBps={FEE_MAX_BPS}
        stepBps={FEE_STEP_BPS}
        onChangeBps={(bps) => update({ platformFeeBps: bps })}
        hint="Fee routes to the pond0x vault so swaps count toward boost. Only ≥1.00% is confirmed to count."
      />
      <RangeSlider
        label="Slippage"
        valueBps={settings.slippageBps}
        minBps={SLIP_MIN_BPS}
        maxBps={SLIP_MAX_BPS}
        stepBps={SLIP_STEP_BPS}
        onChangeBps={(bps) => update({ slippageBps: bps })}
        hint="Lower = better price, more failed fills. Higher = more fills, worse price."
      />
    </div>
  );
}
```

- [ ] **Step 3: Insert the card into `components/swap/SwapPanel.tsx`**

Add the import and render `<SwapTuningCard />` immediately after `<AmountCard />`:

```tsx
import { SwapTuningCard } from "@/components/swap/SwapTuningCard";
// ...
<AmountCard />
<SwapTuningCard />
<ModeConfigRow />
```

- [ ] **Step 4: Type-check, test, clean build**

Run: `npx tsc --noEmit && npm run test` then (no dev server) `rm -rf .next && npm run build`
Expected: clean, all tests pass, build succeeds (13 routes).

- [ ] **Step 5: Commit**

```bash
git add components/swap/SwapTuningCard.tsx components/swap/SwapPanel.tsx lib/settings/storage.ts
git commit -m "feat(ui): fee + slippage sliders in the swap panel"
```

---

## Task 7: Security review + final gates

**Files:**
- Review only (no code unless findings require fixes)

- [ ] **Step 1: Dispatch the security review**

Run the `security-auditor` agent over the swap-path diff (`git diff main..HEAD -- lib/swap/ hooks/useSwapEngine.ts`), focused on: fee-account resolution correctness (referral→vault→none), that `validateSwapTransaction` still runs before signing, `sendAndConfirm` cannot silently mark a failed/expired tx as landed, no secret/logging leakage, and no unvalidated instruction path.

- [ ] **Step 2: Fix any Critical/Important findings**

Address findings with focused edits + tests; re-run the covering tests. Record accepted/deferred findings.

- [ ] **Step 3: Final gates**

Run: `npx tsc --noEmit && npm run test` then (no dev server) `rm -rf .next && npm run build`
Expected: clean, all tests pass, build succeeds.

- [ ] **Step 4: Hand off for real-swap validation**

Report that the path is ready. The USER runs real swaps on the built app and watches `proSwapsSol` climb; the implementer does not execute on-chain. Only after the user confirms counting should `stash@{0}` be dropped.

---

## Self-Review

**Spec coverage:** §3 approach (spike + v1) → Tasks 1, 2, 3, 4. §4 architecture (`v1.ts`, `send.ts`, engine wiring, `currentVault`) → Tasks 2, 3, 4. §5 fee/vault config (referral→vault→none, floor, ceiling 255, pond0x) → Tasks 2, 6. §6 UI sliders (fee [floor…255], slippage [10…300] default 50) → Tasks 5, 6. §7 security (validate preserved, security review, user validates) → Tasks 4, 7. §8 testing → per-task tests. §9 rollout → Tasks 1→7 order. §10 risks (send/confirm) → Task 3. §11 out-of-scope honored (no fee-free mode, no web3.js 2.0).

**Flagged deviation (needs user OK at execution):** the spec says the fee slider default "sits at the floor for lowest cost," but only **100 bps is confirmed to count** toward boost (the +88 value). Defaulting to an unconfirmed lower floor would ship a feature that may not achieve its purpose out of the box. This plan keeps the **default at 100 bps** (feature works immediately) while the slider **floor** is Jupiter's minimum (user can reduce cost, warned by the hint that only ≥1.00% is confirmed). Confirm this is acceptable, or override to default-at-floor.

**Placeholder scan:** no TBD/TODO; every code step has complete code; `JUPITER_MIN_FEE_BPS` has a concrete safe placeholder (50) updated by the Task 1 spike.

**Type consistency:** `buildV1QuoteUrl`/`buildV1SwapBody`/`parseV1Quote`/`parseV1SwapResponse` names and signatures match between Tasks 2 and 4; `sendAndConfirm(connection, rawTx)` signature matches between Tasks 3 and 4; `RangeSlider` prop names (`valueBps`/`minBps`/`maxBps`/`stepBps`/`onChangeBps`) match between Tasks 5 and 6; `clampToStep`/`bpsToPct` match between Tasks 5 and 6.
