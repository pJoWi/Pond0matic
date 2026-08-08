/**
 * POST /api/geoff/insight — turn a dashboard snapshot into a Geoff briefing.
 *
 * The Geoff API key stays server-side; the browser only ever posts derived
 * numbers (no wallet address, no signatures) and gets a validated insight
 * back. Both directions are Zod-checked: the request body before it reaches
 * Geoff, the model reply before it reaches the UI.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  GeoffApiError,
  GeoffNotConfiguredError,
  geoffChat,
  isGeoffConfigured,
} from "@/lib/geoff/client";
import {
  INSIGHT_MAX_TOKENS,
  INSIGHT_TEMPERATURE,
  buildInsightMessages,
} from "@/lib/geoff/insights";
import { parseInsight } from "@/lib/geoff/parse";
import {
  checkRateLimit,
  emptyRateLimitState,
  RATE_LIMIT_MAX,
  type RateLimitState,
} from "@/lib/geoff/rateLimit";
import { InsightRequestSchema, type InsightResponse } from "@/lib/geoff/types";

// No route segment config: `nodejs` is the default runtime, and since Next 15
// GET handlers are dynamic by default — `dynamic`/`revalidate` are removed
// under Cache Components, so nothing here should be cached by declaration.

/** A snapshot is a few hundred bytes; anything larger is not one of ours. */
const MAX_BODY_BYTES = 32 * 1024;

/** Process-wide spend guard — see lib/geoff/rateLimit.ts. */
let rateLimitState: RateLimitState = emptyRateLimitState();

/** GET reports availability so the UI can hide the card when unconfigured. */
export async function GET() {
  return NextResponse.json({ configured: isGeoffConfigured() });
}

export async function POST(request: NextRequest) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Snapshot too large" }, { status: 413 });
  }

  const decision = checkRateLimit(rateLimitState, Date.now());
  rateLimitState = decision.state;
  if (!decision.allowed) {
    return NextResponse.json(
      {
        error: `Too many insight requests (max ${RATE_LIMIT_MAX}/min). Try again in ${decision.retryAfterSeconds}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(decision.retryAfterSeconds) },
      }
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Snapshot too large" }, { status: 413 });
  }

  const parsed = InsightRequestSchema.safeParse(safeJsonParse(raw));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid snapshot", issues: parsed.error.issues.slice(0, 5) },
      { status: 400 }
    );
  }

  try {
    const { text, model } = await geoffChat(
      buildInsightMessages(parsed.data.snapshot),
      {
        model: parsed.data.model,
        temperature: INSIGHT_TEMPERATURE,
        maxTokens: INSIGHT_MAX_TOKENS,
      }
    );

    const body: InsightResponse = {
      insight: parseInsight(text),
      model,
      generatedAt: Date.now(),
    };
    return NextResponse.json(body);
  } catch (error) {
    return NextResponse.json(...errorResponse(error));
  }
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function errorResponse(error: unknown): [{ error: string }, { status: number }] {
  if (error instanceof GeoffNotConfiguredError) {
    return [{ error: error.message }, { status: 503 }];
  }
  if (error instanceof GeoffApiError) {
    // Pass rate limits through as 429 so the client can back off; collapse
    // everything else to 502 rather than leaking upstream status semantics.
    const status = error.status === 429 ? 429 : 502;
    const message =
      error.status === 429
        ? "Geoff rate limit reached — wait a moment and try again."
        : `Geoff request failed (${error.status}).`;
    console.error("Geoff insight upstream error:", error.message);
    return [{ error: message }, { status }];
  }
  if (error instanceof Error && error.name === "AbortError") {
    return [{ error: "Geoff timed out." }, { status: 504 }];
  }
  // Bad JSON or a reply that failed Zod validation lands here.
  console.error("Geoff insight error:", error);
  return [
    { error: "Geoff returned an unusable response. Try again." },
    { status: 502 },
  ];
}
