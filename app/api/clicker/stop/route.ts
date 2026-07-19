import { NextResponse } from "next/server";
import {
  DEFAULT_CONTROL,
  guardOr404,
  nowSeconds,
  readControl,
  writeControl,
} from "../_lib/clickerServer";

export async function POST() {
  const blocked = guardOr404();
  if (blocked) return blocked;

  const control = await readControl();
  // armed:false makes the Python process exit within one scan cycle
  await writeControl({ ...DEFAULT_CONTROL, ...control, armed: false, heartbeat_ts: nowSeconds() });
  return NextResponse.json({ ok: true });
}
