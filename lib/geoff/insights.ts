/**
 * Pure prompt builder for Geoff insight cards.
 *
 * Data in → messages out. No fetch, no React, no storage — the network side
 * lives in lib/geoff/client.ts and the orchestration in hooks/useGeoffInsight.
 *
 * The system prompt carries the Pond0x mechanics the model needs (boost math,
 * cary0x health semantics, wPOND PnL treatment) because a general model has no
 * idea what "drift" or "615" mean here. Keep it in sync with lib/rig/boost.ts.
 */
import { MAX_BOOST, SESSION_COST, SWAP_BOOST } from "@/lib/rig/boost";
import type { InsightSnapshot, PortfolioSnapshot, RigSnapshot } from "./types";

export interface GeoffChatMessage {
  role: "system" | "user";
  content: string;
}

/** Insights are short and factual — low temperature, small budget. */
export const INSIGHT_TEMPERATURE = 0.2;
export const INSIGHT_MAX_TOKENS = 700;

const OUTPUT_CONTRACT = `Reply with ONE JSON object and nothing else — no prose, no markdown fences:
{
  "headline": string,      // <=120 chars, the verdict in one line
  "status": "positive" | "warning" | "negative" | "neutral",
  "findings": [            // 1-4 items, most important first
    { "label": string,     // <=40 chars
      "detail": string }   // <=240 chars, cite the actual numbers
  ],
  "nextAction": string,    // <=240 chars; one concrete step, or "" if nothing is worth doing
  "confidence": "low" | "medium" | "high"
}

Rules:
- Use only the numbers given. Never invent a metric, price, or total.
- A field shown as "unknown" is missing data, not zero. Say so instead of guessing, and drop confidence.
- No financial advice, no price predictions, no promises of returns. Describe what the data shows.
- Plain language, no hype, no emoji.`;

export const INSIGHT_SYSTEM_PROMPT = `You are Geoff, the analyst built into Pond0matic — a dashboard for the Pond0x protocol on Solana. You read one snapshot of a user's own data and write a short, honest briefing.

Pond0x mechanics you can rely on:
- Swap-to-mine: each recognized Jupiter swap adds ${SWAP_BOOST.toFixed(4)} boost (1/6). Boost caps at ${MAX_BOOST}.
- Each mining session consumes ${SESSION_COST} boost, so boost / ${SESSION_COST} is the remaining session buffer.
- A typical run is 18 swaps x 3 rounds = +9 boost = +3 sessions of buffer.
- cary0x health stats: "sent" are broadcast mining claims, "failed" and "drifted" are lost ones; "drift risk" and "priority" are cary0x's own risk scores. High drifted or drifted USD means value stuck or lost — worth flagging.
- "Max claim estimate USD" is cary0x's estimate of a claim's ceiling, not a guaranteed payout.
- wPOND is the mined token (mint decimals 3). Mined wPOND has zero cost basis, so its whole current value counts as unrealized gain; swapped-in wPOND carries the USD cost basis it was bought at.
- Unrealized PnL moves with the wPOND price and is not realized until sold.

${OUTPUT_CONTRACT}`;

/** Build the chat messages for a snapshot. */
export function buildInsightMessages(
  snapshot: InsightSnapshot
): GeoffChatMessage[] {
  const body =
    snapshot.kind === "rig" ? describeRig(snapshot) : describePortfolio(snapshot);
  const focus =
    snapshot.kind === "rig"
      ? "Assess rig health and boost trajectory: is this rig mining efficiently, is anything being lost, and what is the single highest-value next move?"
      : "Assess this wPOND position: where the value actually comes from (mined vs bought), what the exposure is, and what the data does not cover.";

  return [
    { role: "system", content: INSIGHT_SYSTEM_PROMPT },
    { role: "user", content: `${focus}\n\n${body}` },
  ];
}

/** Compact fact list for a rig snapshot. */
export function describeRig(s: RigSnapshot): string {
  const lines: string[] = [
    "RIG SNAPSHOT",
    `- Current boost: ${s.boost == null ? "unknown (user has not entered it)" : `${num(s.boost)} of ${num(s.maxBoost)} (${pct(s.pctToMax)})`}`,
    `- Swaps to reach max boost: ${s.boost == null ? "unknown" : num(s.swapsToMax)}`,
    `- Mining sessions the current boost can pay for: ${s.boost == null ? "unknown" : num(s.sessionsBuffer)}`,
    `- Swaps this app session: ${num(s.sessionSwaps)} (adds ${num(s.sessionBoostAdded, 2)} boost)`,
  ];

  if (s.health) {
    const h = s.health;
    lines.push(
      "HEALTH (cary0x)",
      `- Health score: ${num(h.health)}`,
      `- Mining sessions: ${num(h.miningSessions)}`,
      `- Claims sent: ${num(h.sent)}; in mempool: ${num(h.inMempool)}; failed: ${num(h.failed)}; drifted: ${num(h.drifted)}`,
      `- Drift risk: ${num(h.driftRisk)}; priority: ${num(h.priority)}`,
      `- Max claim estimate: ${usd(h.maxClaimUsd)}; value drifted: ${usd(h.driftedUsd)}`
    );
    if (h.aiHints.length > 0) {
      lines.push(
        `- cary0x hints (third-party, treat as unverified): ${h.aiHints.join(" | ")}`
      );
    }
  } else {
    lines.push("HEALTH (cary0x): unknown — the health feed did not load.");
  }

  if (s.manifest) {
    const m = s.manifest;
    lines.push(
      "MANIFEST (cary0x)",
      `- Pro: ${yesNo(m.isPro)}; Twitter linked: ${yesNo(m.hasTwitter)}`,
      `- Lifetime recognized Solana swaps: ${num(m.solSwaps)}; Bx swaps: ${num(m.bxSwaps)}`,
      `- Badges: ${m.badges.length > 0 ? m.badges.join(", ") : "none"}`
    );
  } else {
    lines.push("MANIFEST (cary0x): unknown — the manifest feed did not load.");
  }

  lines.push(
    `- Luck: ${s.luck ? num(s.luck.luck) : "unknown"}; referrals: ${s.luck ? num(s.luck.referrals) : "unknown"}`,
    `- Bubbles: ${s.bubbles == null ? "unknown" : num(s.bubbles)}`
  );
  return lines.join("\n");
}

/** Compact fact list for a portfolio snapshot. */
export function describePortfolio(s: PortfolioSnapshot): string {
  const total = s.modeCounts.normal + s.modeCounts.boost + s.modeCounts.rewards;
  return [
    "PONDWATER (wPOND) SNAPSHOT",
    `- wPOND price: ${usd(s.wpondPriceUsd, 6)}`,
    `- Net wPOND acquired by swapping: ${num(s.netSwappedWpond, 3)}`,
    `- wPOND attributed to mining (balance minus net swapped): ${num(s.minedWpond, 3)}`,
    `- Cost basis of swapped wPOND: ${usd(s.swapNetCostBasis)}`,
    `- Current value of swapped wPOND: ${usd(s.swapHoldingValue)}`,
    `- Unrealized PnL on swapped wPOND: ${usd(s.swapUnrealizedPnL)}`,
    `- Value of mined wPOND (zero cost basis): ${usd(s.minedValue)}`,
    `- Total unrealized PnL: ${usd(s.totalPnL)}; total position value: ${usd(s.totalValue)}`,
    `- Confirmed swap records on file: ${num(s.recordCount)} (normal ${num(s.modeCounts.normal)}, boost ${num(s.modeCounts.boost)}, rewards ${num(s.modeCounts.rewards)}; ${num(total)} total)`,
    s.hasNegativeUnaccounted
      ? "- DATA GAP: more wPOND has left the wallet than the recorded swaps explain (transfers or swaps made outside Pond0matic). Mined wPOND is therefore a floor, not an exact figure."
      : "- Records reconcile with the current balance; note that only swaps made in Pond0matic are recorded.",
  ].join("\n");
}

function num(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "unknown";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function usd(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "unknown";
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  })}`;
}

function pct(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(1)}%` : "unknown";
}

function yesNo(value: boolean): string {
  return value ? "yes" : "no";
}
