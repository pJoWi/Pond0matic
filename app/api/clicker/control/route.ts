import { NextRequest, NextResponse } from "next/server";
import { ControlRequestSchema } from "@/lib/clicker/types";
import { guardOr404, setPaused } from "../_lib/clickerServer";

export async function POST(request: NextRequest) {
  const blocked = guardOr404();
  if (blocked) return blocked;

  const body = ControlRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request", issues: body.error.issues }, { status: 400 });
  }

  const result = await setPaused(body.data.paused);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
