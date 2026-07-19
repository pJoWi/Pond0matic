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
const CONTROL_TMP_PATH = path.join(RUNTIME_DIR, "control.json.tmp");
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

// ---------------------------------------------------------------------------
// In-process mutex for all control.json read-modify-write sequences.
// This prevents the lost-update and double-start race conditions.
// ---------------------------------------------------------------------------
let controlLock: Promise<void> = Promise.resolve();
export function withControlLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = controlLock.then(fn);
  controlLock = run.then(() => undefined, () => undefined);
  return run;
}

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

/**
 * Atomic write: write to .tmp then rename over the real file.
 *
 * On Windows, Python opens control.json without FILE_SHARE_DELETE, so a
 * rename that lands inside Python's read window throws EPERM/EACCES/EBUSY.
 * We retry the rename up to 5 times with a 50 ms delay.  If all retries
 * fail, we fall back to a direct writeFile — write-sharing IS permitted, so
 * the direct write succeeds where rename cannot.  A torn read on the Python
 * side causes read_control() to return None → the clicker exits with reason
 * "control_missing", which is the fail-safe direction (not clicking).
 */
export async function writeControl(control: ControlFile): Promise<void> {
  await fs.mkdir(RUNTIME_DIR, { recursive: true });
  const json = JSON.stringify(control, null, 2);
  await fs.writeFile(CONTROL_TMP_PATH, json, "utf8");

  const TRANSIENT = new Set(["EPERM", "EACCES", "EBUSY"]);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await fs.rename(CONTROL_TMP_PATH, CONTROL_PATH);
      return; // success
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (!TRANSIENT.has(code ?? "")) throw err; // non-transient — propagate immediately
      lastErr = err;
      if (attempt < 4) await new Promise<void>((r) => setTimeout(r, 50)); // no sleep after final attempt
    }
  }
  // All rename attempts exhausted — fall back to direct write (fail-safe: a
  // torn read exits the clicker; armed:false is always safely observable).
  try {
    await fs.writeFile(CONTROL_PATH, json, "utf8");
  } catch {
    throw lastErr; // surface the original rename error if fallback also fails
  }
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

// ---------------------------------------------------------------------------
// High-level helpers — each one owns a withControlLock region so the route
// files stay thin and the lock genuinely covers read→write.
// ---------------------------------------------------------------------------

type StartResult =
  | { ok: true }
  | { ok: false; status: 409; error: string }
  | { ok: false; status: 500; error: string };

/**
 * Check-and-start under the mutex.
 * Refuses 409 if the pid is alive (status.json check) OR if control.json
 * already shows armed:true with a fresh heartbeat (<15 s old). This closes
 * the 1–2 s window between spawn and the first status.json write.
 */
export async function startClicker(req: StartRequest): Promise<StartResult> {
  return withControlLock(async () => {
    // Existing check: pid reported in status.json
    const status = await readStatus();
    if (status && status.state !== "stopped" && isProcessAlive(status.pid)) {
      return { ok: false, status: 409, error: "Clicker already running" } as const;
    }

    // Fix 1c: also refuse if control.json already armed with a fresh heartbeat
    const existing = await readControl();
    if (
      existing &&
      existing.armed === true &&
      typeof existing.heartbeat_ts === "number" &&
      nowSeconds() - existing.heartbeat_ts < 15
    ) {
      return { ok: false, status: 409, error: "Clicker already running" } as const;
    }

    await writeControl({
      armed: true,
      paused: false,
      scan_interval_s: req.scanIntervalS,
      session_minutes: req.sessionMinutes,
      click_budget: req.clickBudget,
      heartbeat_ts: nowSeconds(),
    });

    spawnClicker(req); // intentionally not awaited — detached child
    return { ok: true } as const;
  });
}

/**
 * Disarm the clicker under the mutex.
 * armed:false causes Python to exit within one scan cycle.
 */
export async function stopClicker(): Promise<void> {
  await withControlLock(async () => {
    const control = await readControl();
    await writeControl({ ...DEFAULT_CONTROL, ...control, armed: false, heartbeat_ts: nowSeconds() });
  });
}

/**
 * Update paused flag + heartbeat under the mutex.
 * Returns {ok:false} if control.json shows the clicker is not started.
 */
export async function setPaused(
  paused: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return withControlLock(async () => {
    const control = await readControl();
    if (!control || !control.armed) {
      return { ok: false, error: "Clicker not started" } as const;
    }
    await writeControl({ ...DEFAULT_CONTROL, ...control, paused, heartbeat_ts: nowSeconds() });
    return { ok: true } as const;
  });
}

/**
 * Spawn the clicker process. Errors are caught and written to status.json /
 * events.jsonl so the panel shows "stopped (spawn_failed)" instead of
 * silently staying in "arming" state forever.
 */
function spawnClicker(req: StartRequest): void {
  const args = [path.join(AUTOCLICKER_DIR, "clicker.py")];
  if (req.dryRun) args.push("--dry-run");
  const child = spawn("python", args, {
    cwd: AUTOCLICKER_DIR,
    detached: true,
    stdio: "ignore",
  });

  child.on("error", () => {
    const ts = nowSeconds();
    const failedStatus = {
      state: "stopped" as const,
      reason: "spawn_failed",
      clicks_used: 0,
      click_budget: req.clickBudget,
      session_deadline: 0,
      last_scan_ts: ts,
      pid: 0,
      dry_run: req.dryRun,
    };
    const event = JSON.stringify({ ts, kind: "auto_stop", reason: "spawn_failed" });

    // Disarm control.json (under the lock) then write status + event.
    // Not awaited: error handler must be synchronous-compatible; the writes
    // are best-effort and will land before any subsequent poll.
    withControlLock(async () => {
      const control = await readControl();
      await writeControl({ ...DEFAULT_CONTROL, ...control, armed: false, heartbeat_ts: ts });
    }).catch(() => undefined);

    fs.mkdir(RUNTIME_DIR, { recursive: true })
      .then(() =>
        Promise.all([
          fs.writeFile(STATUS_PATH, JSON.stringify(failedStatus, null, 2), "utf8"),
          fs.appendFile(EVENTS_PATH, event + "\n", "utf8"),
        ]),
      )
      .catch(() => undefined);
  });

  child.unref();
}
