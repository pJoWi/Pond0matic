import { NextResponse } from "next/server";
import { guardOr404, stopClicker } from "../_lib/clickerServer";

export async function POST() {
  const blocked = guardOr404();
  if (blocked) return blocked;

  await stopClicker();
  return NextResponse.json({ ok: true });
}
