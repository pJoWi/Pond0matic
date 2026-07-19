import { NextRequest, NextResponse } from "next/server";
import { StartRequestSchema } from "@/lib/clicker/types";
import { guardOr404, startClicker } from "../_lib/clickerServer";

export async function POST(request: NextRequest) {
  const blocked = guardOr404();
  if (blocked) return blocked;

  const body = StartRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request", issues: body.error.issues }, { status: 400 });
  }

  const result = await startClicker(body.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
