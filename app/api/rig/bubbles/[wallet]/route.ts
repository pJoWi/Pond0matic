import { NextRequest, NextResponse } from "next/server";

// Solana addresses are base58, 32–44 chars. Validate before building the
// upstream URL (CLAUDE.md convention #3) so we never proxy arbitrary input.
const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;

  if (!wallet || !BASE58_RE.test(wallet)) {
    return NextResponse.json({ error: "Valid wallet address required" }, { status: 400 });
  }

  try {
    // Server-side proxy for cary0x bubbles (no CORS headers upstream).
    // Note: cary0x returns HTTP 200 with {"error":"Too many requests."} when
    // rate-limited — the client-side parseBubbles rejects that body.
    const response = await fetch(`https://www.cary0x.com/api/bubbles/${wallet}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch bubbles data";
    console.error("Bubbles API proxy error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
