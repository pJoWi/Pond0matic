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
    // Server-side proxy so the browser isn't blocked by pond0x's missing CORS
    // headers on this endpoint (luck/referral bonus data).
    const response = await fetch(`https://www.pond0x.com/api/solana/luck/${wallet}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 30 }, // matches the client poll cadence
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch luck data";
    console.error("Luck API proxy error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
