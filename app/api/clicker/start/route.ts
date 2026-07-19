import { NextRequest, NextResponse } from "next/server";
import { StartRequestSchema } from "@/lib/clicker/types";
import {
  guardOr404,
  isProcessAlive,
  nowSeconds,
  readStatus,
  spawnClicker,
  writeControl,
} from "../_lib/clickerServer";

export async function POST(request: NextRequest) {
  const blocked = guardOr404();
  if (blocked) return blocked;

  const body = StartRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request", issues: body.error.issues }, { status: 400 });
  }

  const status = await readStatus();
  if (status && status.state !== "stopped" && isProcessAlive(status.pid)) {
    return NextResponse.json({ error: "Clicker already running" }, { status: 409 });
  }

  await writeControl({
    armed: true,
    paused: false,
    scan_interval_s: body.data.scanIntervalS,
    session_minutes: body.data.sessionMinutes,
    click_budget: body.data.clickBudget,
    heartbeat_ts: nowSeconds(),
  });
  await spawnClicker(body.data);
  return NextResponse.json({ ok: true });
}
