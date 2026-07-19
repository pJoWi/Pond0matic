import { NextRequest, NextResponse } from "next/server";
import { ControlRequestSchema } from "@/lib/clicker/types";
import {
  DEFAULT_CONTROL,
  guardOr404,
  nowSeconds,
  readControl,
  writeControl,
} from "../_lib/clickerServer";

export async function POST(request: NextRequest) {
  const blocked = guardOr404();
  if (blocked) return blocked;

  const body = ControlRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request", issues: body.error.issues }, { status: 400 });
  }

  const control = await readControl();
  if (!control || !control.armed) {
    return NextResponse.json({ error: "Clicker not started" }, { status: 409 });
  }

  // Every control call doubles as the heartbeat
  await writeControl({ ...DEFAULT_CONTROL, ...control, paused: body.data.paused, heartbeat_ts: nowSeconds() });
  return NextResponse.json({ ok: true });
}
