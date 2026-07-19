import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { clickerEnabled } from "@/lib/clicker/guard";
import {
  ClickerEventSchema,
  ClickerStatusSchema,
  type ClickerEvent,
  type ClickerStatus,
  type StartRequest,
} from "@/lib/clicker/types";

const AUTOCLICKER_DIR = path.join(process.cwd(), "autoclicker");
const RUNTIME_DIR = path.join(AUTOCLICKER_DIR, "runtime");
const CONTROL_PATH = path.join(RUNTIME_DIR, "control.json");
const STATUS_PATH = path.join(RUNTIME_DIR, "status.json");
const EVENTS_PATH = path.join(RUNTIME_DIR, "events.jsonl");

export interface ControlFile {
  armed: boolean;
  paused: boolean;
  scan_interval_s: number;
  session_minutes: number;
  click_budget: number;
  heartbeat_ts: number; // unix seconds
}

export const DEFAULT_CONTROL: ControlFile = {
  armed: false,
  paused: false,
  scan_interval_s: 2,
  session_minutes: 60,
  click_budget: 50,
  heartbeat_ts: 0,
};

/** 404 unless CLICKER_ENABLED=1 and not a production build. */
export function guardOr404(): NextResponse | null {
  if (!clickerEnabled(process.env)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

export async function readStatus(): Promise<ClickerStatus | null> {
  try {
    const raw = await fs.readFile(STATUS_PATH, "utf8");
    const parsed = ClickerStatusSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function readEvents(limit: number): Promise<ClickerEvent[]> {
  try {
    const raw = await fs.readFile(EVENTS_PATH, "utf8");
    const events: ClickerEvent[] = [];
    for (const line of raw.trim().split("\n").slice(-limit)) {
      try {
        const parsed = ClickerEventSchema.safeParse(JSON.parse(line));
        if (parsed.success) events.push(parsed.data);
      } catch {
        // skip malformed line (partial write) — next poll heals
      }
    }
    return events;
  } catch {
    return [];
  }
}

export async function readControl(): Promise<Partial<ControlFile> | null> {
  try {
    const parsed = JSON.parse(await fs.readFile(CONTROL_PATH, "utf8"));
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeControl(control: ControlFile): Promise<void> {
  await fs.mkdir(RUNTIME_DIR, { recursive: true });
  await fs.writeFile(CONTROL_PATH, JSON.stringify(control, null, 2), "utf8");
}

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function nowSeconds(): number {
  return Date.now() / 1000;
}

export async function spawnClicker(req: StartRequest): Promise<void> {
  const args = [path.join(AUTOCLICKER_DIR, "clicker.py")];
  if (req.dryRun) args.push("--dry-run");
  const child = spawn("python", args, {
    cwd: AUTOCLICKER_DIR,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}
