import { NextResponse } from "next/server";
import type { ClickerStatusResponse } from "@/lib/clicker/types";
import { guardOr404, isProcessAlive, readEvents, readStatus } from "../_lib/clickerServer";

export async function GET() {
  const blocked = guardOr404();
  if (blocked) return blocked;

  const status = await readStatus();
  const events = await readEvents(50);
  const response: ClickerStatusResponse = {
    status,
    processAlive: status ? isProcessAlive(status.pid) : false,
    events,
  };
  return NextResponse.json(response);
}
