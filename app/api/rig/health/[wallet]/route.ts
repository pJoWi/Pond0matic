import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;

  if (!wallet) {
    return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://www.cary0x.com/api/health/${wallet}`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 10 }, // Cache for 10 seconds
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Health API proxy error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch health data" },
      { status: 500 }
    );
  }
}
