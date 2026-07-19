# Guard-Railed Autoclicker Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An opt-in, guard-railed PyAutoGUI wallet-popup clicker controlled from the swapper UI, per the approved spec `docs/superpowers/specs/2026-07-19-autoclicker-tool-design.md`.

**Architecture:** A Python process (`autoclicker/clicker.py`) scans the screen for confirm/cancel template PNGs and enforces all guardrails itself (session timer, click budget, heartbeat dead-man's switch). Next.js API routes (`app/api/clicker/*`) spawn/stop it and exchange state through three files in `autoclicker/runtime/`. The UI follows the project's pure-evaluator + orchestrator-hook pattern.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Zod v4, Vitest 4, Python 3 + pyautogui + opencv-python.

## Global Constraints

- All clicker API routes return **404 unless `CLICKER_ENABLED === "1"` AND `NODE_ENV !== "production"`** (shared guard helper).
- Guardrails are enforced **in the Python process**, not only in the UI. Both sides fail toward "not clicking".
- Do NOT touch `tools/` — it stays read-only exploration (project rule).
- Wallet identity only via `@solana/wallet-adapter-react` (`useWallet()`), never `window.solana` (project convention #1).
- Feature logic = pure evaluator (`lib/clicker/`) + one orchestrator hook (convention #2). Zod validation at every API boundary (convention #3). One exported component per file (convention #4). Polling via `hooks/useVisibilityPolling.ts`, never bare `setInterval` (convention #5).
- Python side has NO test harness (spec decision) — verified manually via `--dry-run`.
- Heartbeat timeout: **15 s**. Post-click sleep: **2 s**. Template match confidence: **0.9**. Scan order: `templates/confirm/*.png` sorted by filename, then `templates/cancel/*.png`; first match wins per cycle.
- File protocol (in `autoclicker/runtime/`, gitignored):
  - `control.json` (written by Next.js): `armed`, `paused`, `scan_interval_s`, `session_minutes`, `click_budget`, `heartbeat_ts` (unix **seconds**).
  - `status.json` (written by Python): `state` (`armed|paused|stopped`), `reason`, `clicks_used`, `click_budget`, `session_deadline`, `last_scan_ts` (unix seconds), `pid`, `dry_run`.
  - `events.jsonl` (appended by Python): `ts`, `kind` (`start|click|pause|resume|auto_stop`), optional `template`, `action` (`confirm|cancel`), `x`, `y`, `reason`.
- Repo committing happens on `main` (project convention — specs/docs are committed directly).

---

### Task 1: Python clicker (`autoclicker/`)

**Files:**
- Create: `autoclicker/clicker.py`
- Create: `autoclicker/README.md`
- Create: `autoclicker/templates/confirm/` + `autoclicker/templates/cancel/` (copy starter PNGs from `C:\Users\jowij\PyAutoGUI`)
- Modify: `.gitignore` (add `autoclicker/runtime/`)

**Interfaces:**
- Produces: the file protocol from Global Constraints. Later tasks parse `status.json` / `events.jsonl` exactly as written here and write `control.json` exactly as read here.
- CLI: `python clicker.py [--dry-run] [--standalone]`. `--dry-run` logs matches without clicking. `--standalone` skips the heartbeat check (for use without the dashboard; all other guardrails still apply). Exit behavior: the process **exits** on disarm/timer/budget/heartbeat-loss (one session = one process); it stays alive while `paused`.

- [ ] **Step 1: Write `autoclicker/clicker.py`**

```python
#!/usr/bin/env python3
"""Guard-railed wallet-popup autoclicker for Pond0matic.

Reads runtime/control.json every cycle, enforces guardrails (session timer,
click budget, heartbeat dead-man's switch), scans template PNGs and clicks
the first match. State is reported via runtime/status.json and
runtime/events.jsonl. Normally spawned by the dev server
(POST /api/clicker/start); see README.md for standalone use.
"""
import argparse
import glob
import json
import os
import sys
import time

import pyautogui

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RUNTIME_DIR = os.path.join(BASE_DIR, "runtime")
CONTROL_PATH = os.path.join(RUNTIME_DIR, "control.json")
STATUS_PATH = os.path.join(RUNTIME_DIR, "status.json")
EVENTS_PATH = os.path.join(RUNTIME_DIR, "events.jsonl")

HEARTBEAT_TIMEOUT_S = 15
POST_CLICK_SLEEP_S = 2
CONFIDENCE = 0.9

pyautogui.FAILSAFE = True  # slam the mouse into a screen corner to abort
pyautogui.PAUSE = 0.5


def load_templates():
    """[(action, name, path)] — confirm templates first, each dir sorted by filename."""
    templates = []
    for action in ("confirm", "cancel"):
        folder = os.path.join(BASE_DIR, "templates", action)
        for path in sorted(glob.glob(os.path.join(folder, "*.png"))):
            templates.append((action, os.path.basename(path), path))
    return templates


def read_control():
    try:
        with open(CONTROL_PATH, "r", encoding="utf8") as f:
            control = json.load(f)
        return control if isinstance(control, dict) else None
    except (OSError, ValueError):
        return None


def append_event(event):
    event["ts"] = time.time()
    with open(EVENTS_PATH, "a", encoding="utf8") as f:
        f.write(json.dumps(event) + "\n")


def write_status(state, reason, clicks_used, click_budget, session_deadline, dry_run):
    status = {
        "state": state,
        "reason": reason,
        "clicks_used": clicks_used,
        "click_budget": click_budget,
        "session_deadline": session_deadline,
        "last_scan_ts": time.time(),
        "pid": os.getpid(),
        "dry_run": dry_run,
    }
    with open(STATUS_PATH, "w", encoding="utf8") as f:
        json.dump(status, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Pond0matic guard-railed autoclicker")
    parser.add_argument("--dry-run", action="store_true", help="log matches without clicking")
    parser.add_argument("--standalone", action="store_true",
                        help="skip the heartbeat check (running without the dashboard)")
    args = parser.parse_args()

    os.makedirs(RUNTIME_DIR, exist_ok=True)
    control = read_control()
    if control is None or not control.get("armed"):
        print("No armed control.json found - nothing to do")
        sys.exit(1)

    session_minutes = int(control.get("session_minutes", 60))
    click_budget = int(control.get("click_budget", 50))
    session_deadline = time.time() + session_minutes * 60
    clicks_used = 0
    screen_w, screen_h = pyautogui.size()
    templates = load_templates()
    was_paused = False
    stop_reason = None

    if not templates:
        write_status("stopped", "no_templates", 0, click_budget, session_deadline, args.dry_run)
        append_event({"kind": "auto_stop", "reason": "no_templates"})
        sys.exit(1)

    append_event({"kind": "start", "reason": "dry_run" if args.dry_run else "armed"})

    try:
        while True:
            control = read_control()
            now = time.time()

            if control is None:
                stop_reason = "control_missing"
                break
            if not control.get("armed"):
                stop_reason = "control_disarm"
                break
            if not args.standalone and now - float(control.get("heartbeat_ts", 0)) > HEARTBEAT_TIMEOUT_S:
                stop_reason = "heartbeat_lost"
                break
            if now >= session_deadline:
                stop_reason = "session_timer"
                break
            if clicks_used >= click_budget:
                stop_reason = "click_budget"
                break

            if control.get("paused"):
                if not was_paused:
                    append_event({"kind": "pause"})
                    was_paused = True
                write_status("paused", "paused", clicks_used, click_budget, session_deadline, args.dry_run)
                time.sleep(1)
                continue
            if was_paused:
                append_event({"kind": "resume"})
                was_paused = False

            for action, name, path in templates:
                try:
                    location = pyautogui.locateCenterOnScreen(path, confidence=CONFIDENCE)
                except pyautogui.ImageNotFoundException:
                    continue
                except Exception:
                    continue
                if location is None:
                    continue
                x, y = int(location[0]), int(location[1])
                if x < 0 or x >= screen_w or y < 0 or y >= screen_h:
                    continue
                if not args.dry_run:
                    pyautogui.click((x, y))
                clicks_used += 1
                append_event({"kind": "click", "template": name, "action": action,
                              "x": x, "y": y,
                              "reason": "dry_run" if args.dry_run else "clicked"})
                time.sleep(POST_CLICK_SLEEP_S)
                break  # first match wins this cycle

            write_status("armed", "running", clicks_used, click_budget, session_deadline, args.dry_run)
            time.sleep(float(control.get("scan_interval_s", 2)))

    except pyautogui.FailSafeException:
        stop_reason = "failsafe"
    except KeyboardInterrupt:
        stop_reason = "keyboard_interrupt"

    write_status("stopped", stop_reason or "unknown", clicks_used, click_budget, session_deadline, args.dry_run)
    append_event({"kind": "auto_stop", "reason": stop_reason or "unknown"})
    print(f"Clicker stopped: {stop_reason}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Write `autoclicker/README.md`**

```markdown
# Autoclicker (guard-railed wallet-popup clicker)

Opt-in local tool that clicks the Phantom wallet popup during auto-swap
sessions. Design: `docs/superpowers/specs/2026-07-19-autoclicker-tool-design.md`.

**This tool moves your real mouse and can approve real transactions.**
Guardrails (enforced by this process itself): session timer, click budget,
heartbeat dead-man's switch (auto-stops ~15 s after the swapper loop stops),
pause support, event log. PyAutoGUI fail-safe: slam the mouse into a screen
corner to abort instantly.

## Requirements

- Python 3 on PATH as `python`
- `pip install pyautogui opencv-python pillow`

## Normal use (from the dashboard)

1. Add `CLICKER_ENABLED=1` to `.env.local` (dev builds only — the API is dead
   in production and on any deploy).
2. `npm run dev`, open the swapper, use the Auto-Clicker panel.

## Standalone use (no dashboard)

Write `runtime/control.json` yourself, then run with `--standalone` (skips the
heartbeat check; timer and budget still apply):

    python -c "import json,time,os; os.makedirs('runtime',exist_ok=True); json.dump({'armed':True,'paused':False,'scan_interval_s':2,'session_minutes':60,'click_budget':50,'heartbeat_ts':time.time()}, open('runtime/control.json','w'))"
    python clicker.py --standalone

Add `--dry-run` to log "would click" events without clicking — always do this
first after capturing new templates.

## Templates

Drop PNGs into `templates/confirm/` and `templates/cancel/` — no code change
needed. Capture them with the Windows Snipping Tool at 100% display scaling:
screenshot ONLY the button (e.g. Phantom's "Confirm" button), a few pixels of
margin, same monitor/scale you'll run on. Confirm templates are scanned first
(sorted by filename); first match wins. Re-capture after wallet UI updates.

## Runtime files (`runtime/`, gitignored)

- `control.json` — written by the dashboard: armed/paused/settings/heartbeat
- `status.json` — written by the clicker: state, clicks used, deadline, pid
- `events.jsonl` — one JSON line per event (click/pause/auto-stop/…)
```

- [ ] **Step 3: Copy starter templates and gitignore runtime**

```bash
cd "E:/JowiBE/Projects/web3/Pond0matic"
mkdir -p autoclicker/templates/confirm autoclicker/templates/cancel autoclicker/runtime
cp "C:/Users/jowij/PyAutoGUI/confirm_button.png" autoclicker/templates/confirm/
cp "C:/Users/jowij/PyAutoGUI/confirm_button_2.png" autoclicker/templates/confirm/
cp "C:/Users/jowij/PyAutoGUI/cancel1.png" autoclicker/templates/cancel/
cp "C:/Users/jowij/PyAutoGUI/cancel2.png" autoclicker/templates/cancel/
echo "autoclicker/runtime/" >> .gitignore
```

- [ ] **Step 4: Verify guardrails manually (dry-run)**

```bash
cd "E:/JowiBE/Projects/web3/Pond0matic/autoclicker"
python -c "import pyautogui, cv2" || pip install pyautogui opencv-python pillow
# 1) Standalone dry-run: should start, write status.json (state "armed"), events.jsonl gets a start event
python -c "import json,time,os; os.makedirs('runtime',exist_ok=True); json.dump({'armed':True,'paused':False,'scan_interval_s':2,'session_minutes':60,'click_budget':5,'heartbeat_ts':time.time()}, open('runtime/control.json','w'))"
python clicker.py --dry-run --standalone   # let it run ~10 s, then Ctrl+C
cat runtime/status.json                     # expect: "state": "stopped", "reason": "keyboard_interrupt"
# 2) Heartbeat dead-man's switch: same control.json, WITHOUT --standalone
python -c "import json,time,os; json.dump({'armed':True,'paused':False,'scan_interval_s':2,'session_minutes':60,'click_budget':5,'heartbeat_ts':time.time()}, open('runtime/control.json','w'))"
python clicker.py --dry-run                 # expect: exits by itself after ~15 s, prints "Clicker stopped: heartbeat_lost"
# 3) Disarm: set armed false in a second terminal while it runs -> exits with "control_disarm"
```

Expected: all three stop reasons appear in `runtime/status.json` and as `auto_stop` events in `runtime/events.jsonl`.

- [ ] **Step 5: Commit**

```bash
cd "E:/JowiBE/Projects/web3/Pond0matic"
git add autoclicker .gitignore
git commit -m "feat: add guard-railed Python autoclicker process"
```

---

### Task 2: Shared types, Zod schemas, and API guard (`lib/clicker/`)

**Files:**
- Create: `lib/clicker/types.ts`
- Create: `lib/clicker/guard.ts`
- Test: `tests/clicker/types.test.ts`

**Interfaces:**
- Produces (used by Tasks 3–6):
  - `ClickerStatusSchema` / `ClickerStatus` — parses `status.json` (snake_case fields exactly as in Global Constraints).
  - `ClickerEventSchema` / `ClickerEvent` — parses one `events.jsonl` line.
  - `StartRequestSchema` / `StartRequest` — `{ scanIntervalS: int 1–30, sessionMinutes: int 5–240, clickBudget: int 1–500, dryRun: boolean (default false) }`.
  - `ControlRequestSchema` / `ControlRequest` — `{ paused: boolean }`.
  - `ClickerStatusResponse` — `{ status: ClickerStatus | null, processAlive: boolean, events: ClickerEvent[] }`.
  - `clickerEnabled(env: { CLICKER_ENABLED?: string; NODE_ENV?: string }): boolean` — pure guard.

- [ ] **Step 1: Write the failing tests**

Create `tests/clicker/types.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  ClickerStatusSchema,
  ClickerEventSchema,
  StartRequestSchema,
} from "@/lib/clicker/types";
import { clickerEnabled } from "@/lib/clicker/guard";

const VALID_STATUS = {
  state: "armed",
  reason: "running",
  clicks_used: 3,
  click_budget: 50,
  session_deadline: 1_789_000_000,
  last_scan_ts: 1_788_999_000,
  pid: 1234,
  dry_run: false,
};

describe("ClickerStatusSchema", () => {
  it("accepts a valid status.json payload", () => {
    expect(ClickerStatusSchema.safeParse(VALID_STATUS).success).toBe(true);
  });

  it("rejects an unknown state", () => {
    expect(ClickerStatusSchema.safeParse({ ...VALID_STATUS, state: "exploded" }).success).toBe(false);
  });

  it("rejects negative clicks_used", () => {
    expect(ClickerStatusSchema.safeParse({ ...VALID_STATUS, clicks_used: -1 }).success).toBe(false);
  });
});

describe("ClickerEventSchema", () => {
  it("accepts a click event with coordinates", () => {
    const event = { ts: 1_789_000_000, kind: "click", template: "confirm_button.png", action: "confirm", x: 812, y: 640, reason: "clicked" };
    expect(ClickerEventSchema.safeParse(event).success).toBe(true);
  });

  it("accepts a lifecycle event without coordinates", () => {
    expect(ClickerEventSchema.safeParse({ ts: 1_789_000_000, kind: "auto_stop", reason: "heartbeat_lost" }).success).toBe(true);
  });

  it("rejects an unknown kind", () => {
    expect(ClickerEventSchema.safeParse({ ts: 1, kind: "explode" }).success).toBe(false);
  });
});

describe("StartRequestSchema", () => {
  it("accepts valid settings and defaults dryRun to false", () => {
    const parsed = StartRequestSchema.parse({ scanIntervalS: 2, sessionMinutes: 60, clickBudget: 50 });
    expect(parsed.dryRun).toBe(false);
  });

  it("rejects out-of-range values", () => {
    expect(StartRequestSchema.safeParse({ scanIntervalS: 0, sessionMinutes: 60, clickBudget: 50 }).success).toBe(false);
    expect(StartRequestSchema.safeParse({ scanIntervalS: 2, sessionMinutes: 1_000, clickBudget: 50 }).success).toBe(false);
    expect(StartRequestSchema.safeParse({ scanIntervalS: 2, sessionMinutes: 60, clickBudget: 0 }).success).toBe(false);
  });
});

describe("clickerEnabled", () => {
  it("is enabled only with CLICKER_ENABLED=1 outside production", () => {
    expect(clickerEnabled({ CLICKER_ENABLED: "1", NODE_ENV: "development" })).toBe(true);
    expect(clickerEnabled({ CLICKER_ENABLED: "1", NODE_ENV: "production" })).toBe(false);
    expect(clickerEnabled({ CLICKER_ENABLED: undefined, NODE_ENV: "development" })).toBe(false);
    expect(clickerEnabled({ CLICKER_ENABLED: "true", NODE_ENV: "development" })).toBe(false);
    expect(clickerEnabled({})).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/clicker/types.test.ts`
Expected: FAIL — cannot resolve `@/lib/clicker/types`.

- [ ] **Step 3: Write the implementation**

Create `lib/clicker/types.ts`:

```typescript
import { z } from "zod";

// ---------- Files written by the Python clicker (snake_case on disk) ----------

export const ClickerStatusSchema = z.object({
  state: z.enum(["armed", "paused", "stopped"]),
  reason: z.string(),
  clicks_used: z.number().int().min(0),
  click_budget: z.number().int().min(1),
  session_deadline: z.number(), // unix seconds
  last_scan_ts: z.number(),     // unix seconds
  pid: z.number().int(),
  dry_run: z.boolean(),
});
export type ClickerStatus = z.infer<typeof ClickerStatusSchema>;

export const ClickerEventSchema = z.object({
  ts: z.number(), // unix seconds
  kind: z.enum(["start", "click", "pause", "resume", "auto_stop"]),
  template: z.string().optional(),
  action: z.enum(["confirm", "cancel"]).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  reason: z.string().optional(),
});
export type ClickerEvent = z.infer<typeof ClickerEventSchema>;

// ---------- API request bodies ----------

export const StartRequestSchema = z.object({
  scanIntervalS: z.number().int().min(1).max(30),
  sessionMinutes: z.number().int().min(5).max(240),
  clickBudget: z.number().int().min(1).max(500),
  dryRun: z.boolean().default(false),
});
export type StartRequest = z.infer<typeof StartRequestSchema>;

export const ControlRequestSchema = z.object({
  paused: z.boolean(),
});
export type ControlRequest = z.infer<typeof ControlRequestSchema>;

// ---------- API responses ----------

export interface ClickerStatusResponse {
  status: ClickerStatus | null;
  processAlive: boolean;
  events: ClickerEvent[];
}
```

Create `lib/clicker/guard.ts`:

```typescript
/**
 * Pure gate for the clicker API: explicit opt-in via CLICKER_ENABLED=1 and
 * never in production builds. Routes 404 when this returns false.
 */
export function clickerEnabled(env: { CLICKER_ENABLED?: string; NODE_ENV?: string }): boolean {
  return env.CLICKER_ENABLED === "1" && env.NODE_ENV !== "production";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/clicker/types.test.ts`
Expected: PASS (all tests green).

- [ ] **Step 5: Commit**

```bash
cd "E:/JowiBE/Projects/web3/Pond0matic"
git add lib/clicker tests/clicker
git commit -m "feat: clicker file-protocol schemas and API guard"
```

---

### Task 3: Policy evaluator (`lib/clicker/clickerPolicyEvaluator.ts`)

**Files:**
- Create: `lib/clicker/clickerPolicyEvaluator.ts`
- Test: `tests/clicker/clickerPolicyEvaluator.test.ts`

**Interfaces:**
- Consumes: `ClickerStatus` from `@/lib/clicker/types` (Task 2); `RigHealthSnapshot` from `@/lib/alerts/types` (existing — fields `health, drifted, failed, inMempool, sent, miningSessions, fetchedAt`).
- Produces (used by Tasks 5–6):

```typescript
export interface ClickerPolicyInput {
  swapperRunning: boolean;
  miningActive: boolean;
  manualPause: boolean;
  status: ClickerStatus | null;
  processAlive: boolean;
  now: number; // ms epoch
}
export interface ClickerPolicyResult {
  led: "green" | "yellow" | "red" | "gray";
  label: string;
  shouldSendHeartbeat: boolean;
  desiredPaused: boolean;
  shouldStop: boolean;
  offline: boolean;
}
export function evaluateClickerPolicy(input: ClickerPolicyInput): ClickerPolicyResult;
export function deriveMiningActive(current: RigHealthSnapshot | null, previous: RigHealthSnapshot | null): boolean;
```

- [ ] **Step 1: Write the failing tests**

Create `tests/clicker/clickerPolicyEvaluator.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { evaluateClickerPolicy, deriveMiningActive } from "@/lib/clicker/clickerPolicyEvaluator";
import type { ClickerStatus } from "@/lib/clicker/types";
import type { RigHealthSnapshot } from "@/lib/alerts/types";

const NOW = 1_789_000_000_000; // ms

function status(overrides: Partial<ClickerStatus> = {}): ClickerStatus {
  return {
    state: "armed",
    reason: "running",
    clicks_used: 3,
    click_budget: 50,
    session_deadline: NOW / 1000 + 3600,
    last_scan_ts: NOW / 1000 - 2, // scanned 2 s ago
    pid: 1234,
    dry_run: false,
    ...overrides,
  };
}

function baseInput(overrides = {}) {
  return {
    swapperRunning: true,
    miningActive: false,
    manualPause: false,
    status: status(),
    processAlive: true,
    now: NOW,
    ...overrides,
  };
}

describe("evaluateClickerPolicy", () => {
  it("is idle gray when never started", () => {
    const r = evaluateClickerPolicy(baseInput({ status: null, processAlive: false }));
    expect(r).toMatchObject({ led: "gray", shouldSendHeartbeat: false, shouldStop: false, offline: false });
  });

  it("is gray with the stop reason after a stop", () => {
    const r = evaluateClickerPolicy(baseInput({ status: status({ state: "stopped", reason: "click_budget" }), processAlive: false }));
    expect(r.led).toBe("gray");
    expect(r.label).toContain("click_budget");
  });

  it("reports offline and requests stop when status is stale", () => {
    const r = evaluateClickerPolicy(baseInput({ status: status({ last_scan_ts: NOW / 1000 - 60 }) }));
    expect(r).toMatchObject({ led: "red", offline: true, shouldStop: true, shouldSendHeartbeat: false });
  });

  it("requests disarm when the swapper loop is not running", () => {
    const r = evaluateClickerPolicy(baseInput({ swapperRunning: false }));
    expect(r).toMatchObject({ led: "red", shouldStop: true, shouldSendHeartbeat: false });
  });

  it("pauses with heartbeat while mining is active", () => {
    const r = evaluateClickerPolicy(baseInput({ miningActive: true }));
    expect(r).toMatchObject({ led: "yellow", desiredPaused: true, shouldSendHeartbeat: true, shouldStop: false });
    expect(r.label).toContain("mining");
  });

  it("pauses on manual pause", () => {
    const r = evaluateClickerPolicy(baseInput({ manualPause: true }));
    expect(r).toMatchObject({ led: "yellow", desiredPaused: true, shouldSendHeartbeat: true });
  });

  it("resumes (desiredPaused false) when a paused clicker has no pause cause left", () => {
    const r = evaluateClickerPolicy(baseInput({ status: status({ state: "paused", reason: "paused" }) }));
    expect(r).toMatchObject({ led: "yellow", desiredPaused: false, shouldSendHeartbeat: true, shouldStop: false });
  });

  it("is green armed with heartbeat in the happy path", () => {
    const r = evaluateClickerPolicy(baseInput());
    expect(r).toMatchObject({ led: "green", desiredPaused: false, shouldSendHeartbeat: true, shouldStop: false, offline: false });
  });
});

function rig(overrides: Partial<RigHealthSnapshot> = {}): RigHealthSnapshot {
  return { health: 80, drifted: 0, failed: 0, inMempool: 0, sent: 100, miningSessions: 50, fetchedAt: NOW, ...overrides };
}

describe("deriveMiningActive", () => {
  it("is false without a snapshot", () => {
    expect(deriveMiningActive(null, null)).toBe(false);
  });

  it("is true when claims are in the mempool", () => {
    expect(deriveMiningActive(rig({ inMempool: 2 }), rig())).toBe(true);
  });

  it("is true when the mining-session count increased", () => {
    expect(deriveMiningActive(rig({ miningSessions: 51 }), rig({ miningSessions: 50 }))).toBe(true);
  });

  it("is false when nothing indicates activity", () => {
    expect(deriveMiningActive(rig(), rig())).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/clicker/clickerPolicyEvaluator.test.ts`
Expected: FAIL — cannot resolve `@/lib/clicker/clickerPolicyEvaluator`.

- [ ] **Step 3: Write the implementation**

Create `lib/clicker/clickerPolicyEvaluator.ts`:

```typescript
import type { RigHealthSnapshot } from "@/lib/alerts/types";
import type { ClickerStatus } from "./types";

export interface ClickerPolicyInput {
  swapperRunning: boolean;
  miningActive: boolean;
  manualPause: boolean;
  status: ClickerStatus | null;
  processAlive: boolean;
  now: number; // ms epoch
}

export interface ClickerPolicyResult {
  led: "green" | "yellow" | "red" | "gray";
  label: string;
  shouldSendHeartbeat: boolean;
  desiredPaused: boolean;
  shouldStop: boolean;
  offline: boolean;
}

const STATUS_STALE_MS = 20_000;

/**
 * Pure function: given swapper/mining/user state and the clicker's last
 * reported status, decide what the UI should display and do. No side effects;
 * the orchestrator hook applies the result.
 */
export function evaluateClickerPolicy(input: ClickerPolicyInput): ClickerPolicyResult {
  const { swapperRunning, miningActive, manualPause, status, processAlive, now } = input;

  if (!status || status.state === "stopped" || !processAlive) {
    const reason = status?.state === "stopped" ? status.reason : "not started";
    return { led: "gray", label: `stopped (${reason})`, shouldSendHeartbeat: false, desiredPaused: false, shouldStop: false, offline: false };
  }

  if (now - status.last_scan_ts * 1000 > STATUS_STALE_MS) {
    return { led: "red", label: "offline (stale status)", shouldSendHeartbeat: false, desiredPaused: false, shouldStop: true, offline: true };
  }

  if (!swapperRunning) {
    return { led: "red", label: "disarming (swapper stopped)", shouldSendHeartbeat: false, desiredPaused: false, shouldStop: true, offline: false };
  }

  const desiredPaused = miningActive || manualPause;
  if (status.state === "paused" || desiredPaused) {
    const why = miningActive ? "mining active" : manualPause ? "manual pause" : "resuming";
    return { led: "yellow", label: `paused (${why})`, shouldSendHeartbeat: true, desiredPaused, shouldStop: false, offline: false };
  }

  return { led: "green", label: "armed", shouldSendHeartbeat: true, desiredPaused: false, shouldStop: false, offline: false };
}

/**
 * Heuristic: the cary0x health data has no "is mining" flag, so mining is
 * considered active while claims sit in the mempool or the session count
 * just increased. The panel also offers a manual pause as a safety net.
 */
export function deriveMiningActive(
  current: RigHealthSnapshot | null,
  previous: RigHealthSnapshot | null
): boolean {
  if (!current) return false;
  if (current.inMempool > 0) return true;
  if (previous && current.miningSessions > previous.miningSessions) return true;
  return false;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/clicker/clickerPolicyEvaluator.test.ts`
Expected: PASS. Also run the full suite once: `npx vitest run` — expected: no regressions.

- [ ] **Step 5: Commit**

```bash
cd "E:/JowiBE/Projects/web3/Pond0matic"
git add lib/clicker/clickerPolicyEvaluator.ts tests/clicker/clickerPolicyEvaluator.test.ts
git commit -m "feat: pure clicker policy evaluator with mining heuristic"
```

---

### Task 4: API routes (`app/api/clicker/*`)

**Files:**
- Create: `app/api/clicker/_lib/clickerServer.ts`
- Create: `app/api/clicker/start/route.ts`
- Create: `app/api/clicker/stop/route.ts`
- Create: `app/api/clicker/control/route.ts`
- Create: `app/api/clicker/status/route.ts`

**Interfaces:**
- Consumes: schemas + `clickerEnabled` from Task 2; the file protocol from Task 1.
- Produces (used by Task 5):
  - `POST /api/clicker/start` body `StartRequest` → `{ ok: true }` | 400 | 404 | 409 (`{ error: "Clicker already running" }`).
  - `POST /api/clicker/stop` → `{ ok: true }` | 404.
  - `POST /api/clicker/control` body `ControlRequest` → `{ ok: true }` (also refreshes the heartbeat) | 400 | 404 | 409 (not started).
  - `GET /api/clicker/status` → `ClickerStatusResponse` | 404.

Note: `_lib/` is not routable in the App Router (underscore prefix = private folder), so the helper lives next to the routes without becoming an endpoint.

- [ ] **Step 1: Write the server helper**

Create `app/api/clicker/_lib/clickerServer.ts`:

```typescript
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
```

- [ ] **Step 2: Write the four routes**

Create `app/api/clicker/start/route.ts`:

```typescript
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
```

Create `app/api/clicker/stop/route.ts`:

```typescript
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
```

Create `app/api/clicker/control/route.ts`:

```typescript
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
```

Create `app/api/clicker/status/route.ts`:

```typescript
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
```

- [ ] **Step 3: Verify manually with curl**

```bash
cd "E:/JowiBE/Projects/web3/Pond0matic"
# without the flag: expect 404 on every route
npm run dev &   # or run in a second terminal
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/clicker/status   # expect 404
# stop dev server, add CLICKER_ENABLED=1 to .env.local, restart dev server
echo "CLICKER_ENABLED=1" >> .env.local
curl -s http://localhost:3000/api/clicker/status
# expect: {"status":<last status or null>,"processAlive":false,"events":[...]}
curl -s -X POST http://localhost:3000/api/clicker/start -H "Content-Type: application/json" \
  -d '{"scanIntervalS":2,"sessionMinutes":60,"clickBudget":5,"dryRun":true}'
# expect: {"ok":true}; a dry-run python process starts; status endpoint shows state "armed", processAlive true
curl -s -X POST http://localhost:3000/api/clicker/control -d '{"paused":true}'   # expect {"ok":true}; status flips to "paused"
curl -s -X POST http://localhost:3000/api/clicker/stop                            # expect {"ok":true}; process exits, state "stopped" reason "control_disarm"
curl -s -X POST http://localhost:3000/api/clicker/start -H "Content-Type: application/json" -d '{"scanIntervalS":99,"sessionMinutes":60,"clickBudget":5}'
# expect: 400 with zod issues
```

- [ ] **Step 4: Run the test suite and lint**

Run: `npx vitest run && npm run lint`
Expected: PASS / no new lint errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/clicker
git commit -m "feat: clicker control API routes (spawn/stop/control/status)"
```

---

### Task 5: Orchestrator hook (`hooks/useClickerControl.ts`)

**Files:**
- Create: `hooks/useClickerControl.ts`

**Interfaces:**
- Consumes: `evaluateClickerPolicy` (Task 3); API routes (Task 4); `useVisibilityPolling(visibleMs, hiddenMs): number` (existing).
- Produces (used by Task 6):

```typescript
export interface UseClickerControlArgs {
  swapperRunning: boolean;
  miningActive: boolean;
  manualPause: boolean;
}
export interface UseClickerControlResult {
  available: boolean; // false when the API 404s (flag off) -> hide the panel
  status: ClickerStatus | null;
  events: ClickerEvent[];
  policy: ClickerPolicyResult;
  start: (settings: StartRequest) => Promise<string | null>; // error message or null
  stop: () => Promise<void>;
}
export function useClickerControl(args: UseClickerControlArgs): UseClickerControlResult;
```

- [ ] **Step 1: Write the hook**

Create `hooks/useClickerControl.ts`:

```typescript
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVisibilityPolling } from "./useVisibilityPolling";
import {
  evaluateClickerPolicy,
  type ClickerPolicyResult,
} from "@/lib/clicker/clickerPolicyEvaluator";
import type {
  ClickerEvent,
  ClickerStatus,
  ClickerStatusResponse,
  StartRequest,
} from "@/lib/clicker/types";

export interface UseClickerControlArgs {
  swapperRunning: boolean;
  miningActive: boolean;
  manualPause: boolean;
}

export interface UseClickerControlResult {
  available: boolean;
  status: ClickerStatus | null;
  events: ClickerEvent[];
  policy: ClickerPolicyResult;
  start: (settings: StartRequest) => Promise<string | null>;
  stop: () => Promise<void>;
}

/**
 * Orchestrator for the guard-railed autoclicker. All decisions live in
 * evaluateClickerPolicy; this hook only polls, applies the result
 * (heartbeat / pause / stop) and exposes actions to the panel.
 * Poll cadence (5 s visible) doubles as the heartbeat, well inside the
 * Python side's 15 s dead-man's window.
 */
export function useClickerControl(args: UseClickerControlArgs): UseClickerControlResult {
  const { swapperRunning, miningActive, manualPause } = args;
  const [available, setAvailable] = useState(true);
  const [status, setStatus] = useState<ClickerStatus | null>(null);
  const [processAlive, setProcessAlive] = useState(false);
  const [events, setEvents] = useState<ClickerEvent[]>([]);
  const pollMs = useVisibilityPolling(5_000, 60_000);
  const busyRef = useRef(false);

  const policy = evaluateClickerPolicy({
    swapperRunning,
    miningActive,
    manualPause,
    status,
    processAlive,
    now: Date.now(),
  });

  const stop = useCallback(async () => {
    await fetch("/api/clicker/stop", { method: "POST" }).catch(() => undefined);
  }, []);

  const start = useCallback(async (settings: StartRequest): Promise<string | null> => {
    try {
      const res = await fetch("/api/clicker/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        return data?.error ?? `Start failed (${res.status})`;
      }
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Start failed";
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const res = await fetch("/api/clicker/status");
        if (res.status === 404) {
          if (!cancelled) setAvailable(false);
          return;
        }
        const data: ClickerStatusResponse = await res.json();
        if (cancelled) return;
        setAvailable(true);
        setStatus(data.status);
        setProcessAlive(data.processAlive);
        setEvents(data.events);

        const decision = evaluateClickerPolicy({
          swapperRunning,
          miningActive,
          manualPause,
          status: data.status,
          processAlive: data.processAlive,
          now: Date.now(),
        });
        if (decision.shouldStop) {
          await fetch("/api/clicker/stop", { method: "POST" }).catch(() => undefined);
        } else if (decision.shouldSendHeartbeat) {
          await fetch("/api/clicker/control", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paused: decision.desiredPaused }),
          }).catch(() => undefined);
        }
      } catch {
        // dev server hiccup — keep last known state, next tick heals
      } finally {
        busyRef.current = false;
      }
    };

    tick();
    const id = setInterval(tick, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs, swapperRunning, miningActive, manualPause]);

  return { available, status, events, policy, start, stop };
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors. (The hook is deliberately thin — all decision logic is already covered by the Task 3 evaluator tests; the hook itself is exercised end-to-end in Task 8.)

- [ ] **Step 3: Commit**

```bash
git add hooks/useClickerControl.ts
git commit -m "feat: clicker orchestrator hook (poll + heartbeat + policy application)"
```

---

### Task 6: UI panel (`ClickerPanel`) and mount

**Files:**
- Create: `components/CompactSwapper/components/ClickerPanel.tsx`
- Modify: `components/CompactSwapper/index.tsx` (import + mount after the `SettingsPanel` block, currently ending around line 332)

**Interfaces:**
- Consumes: `useClickerControl` (Task 5), `useSwapperContext().running` (existing), `useWallet()` from `@solana/wallet-adapter-react`, `useRigHealth(publicKey)` (existing — returns `{ current, previous }`), `deriveMiningActive` (Task 3), `StatusLED` (existing: props `color: "green"|"blue"|"red"|"yellow"|"gray"`, `pulsing?`, `label?`).
- Produces: `<ClickerPanel />` — self-contained, no props; renders `null` when the clicker API is unavailable (flag off).

- [ ] **Step 1: Write the panel**

Create `components/CompactSwapper/components/ClickerPanel.tsx`:

```tsx
"use client";
import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSwapperContext } from "@/contexts/SwapperContext";
import { useRigHealth } from "@/hooks/useRigHealth";
import { useClickerControl } from "@/hooks/useClickerControl";
import { deriveMiningActive } from "@/lib/clicker/clickerPolicyEvaluator";
import { StatusLED } from "./StatusLED";

const DEFAULTS = { scanIntervalS: 2, sessionMinutes: 60, clickBudget: 50 };

export function ClickerPanel() {
  const ctx = useSwapperContext();
  const { publicKey } = useWallet();
  const rig = useRigHealth(publicKey);
  const miningActive = deriveMiningActive(rig.current, rig.previous);

  const [manualPause, setManualPause] = useState(false);
  const [scanIntervalS, setScanIntervalS] = useState(DEFAULTS.scanIntervalS);
  const [sessionMinutes, setSessionMinutes] = useState(DEFAULTS.sessionMinutes);
  const [clickBudget, setClickBudget] = useState(DEFAULTS.clickBudget);
  const [dryRun, setDryRun] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const clicker = useClickerControl({ swapperRunning: ctx.running, miningActive, manualPause });

  if (!clicker.available) return null;

  const active = clicker.status !== null && clicker.status.state !== "stopped";
  const secondsLeft = clicker.status
    ? Math.max(0, Math.round(clicker.status.session_deadline - Date.now() / 1000))
    : 0;

  const handleArm = async () => {
    setError(null);
    const err = await clicker.start({ scanIntervalS, sessionMinutes, clickBudget, dryRun });
    if (err) setError(err);
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-3 text-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="flex items-center gap-2 font-semibold text-gray-200">
          <StatusLED color={clicker.policy.led} pulsing={clicker.policy.led === "green"} />
          Auto-Clicker
          <span className="text-xs font-normal text-gray-400">{clicker.policy.label}</span>
        </span>
        <span className="text-gray-400">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-gray-400">
            Clicks the wallet popup for you while the swapper runs. Auto-stops on the
            session timer, click budget, or ~15 s after the swapper loop stops. Pauses
            while your rig is mining. Emergency stop: slam the mouse into a screen corner.
          </p>

          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs text-gray-400">
              Scan interval (s)
              <input
                type="number" min={1} max={30} value={scanIntervalS} disabled={active}
                onChange={(e) => setScanIntervalS(Number(e.target.value))}
                className="mt-1 w-full rounded bg-gray-900 px-2 py-1 text-gray-200 disabled:opacity-50"
              />
            </label>
            <label className="text-xs text-gray-400">
              Session (min)
              <input
                type="number" min={5} max={240} value={sessionMinutes} disabled={active}
                onChange={(e) => setSessionMinutes(Number(e.target.value))}
                className="mt-1 w-full rounded bg-gray-900 px-2 py-1 text-gray-200 disabled:opacity-50"
              />
            </label>
            <label className="text-xs text-gray-400">
              Click budget
              <input
                type="number" min={1} max={500} value={clickBudget} disabled={active}
                onChange={(e) => setClickBudget(Number(e.target.value))}
                className="mt-1 w-full rounded bg-gray-900 px-2 py-1 text-gray-200 disabled:opacity-50"
              />
            </label>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1 text-xs text-gray-400">
              <input type="checkbox" checked={dryRun} disabled={active} onChange={(e) => setDryRun(e.target.checked)} />
              Dry-run (log only, no clicks)
            </label>
            <label className="flex items-center gap-1 text-xs text-gray-400">
              <input type="checkbox" checked={manualPause} onChange={(e) => setManualPause(e.target.checked)} />
              Pause
            </label>
          </div>

          {active ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-300">
                <span>Clicks: {clicker.status!.clicks_used} / {clicker.status!.click_budget}</span>
                <span>Time left: {Math.floor(secondsLeft / 60)}m {secondsLeft % 60}s</span>
                {clicker.status!.dry_run && <span className="text-yellow-400">DRY-RUN</span>}
              </div>
              <button
                type="button" onClick={() => clicker.stop()}
                className="w-full rounded bg-red-600 py-1.5 font-semibold text-white hover:bg-red-500"
              >
                Disarm
              </button>
            </div>
          ) : (
            <button
              type="button" onClick={handleArm} disabled={!ctx.running}
              title={ctx.running ? undefined : "Start the swapper loop first"}
              className="w-full rounded bg-green-600 py-1.5 font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Arm clicker
            </button>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          {clicker.events.length > 0 && (
            <div className="max-h-32 space-y-1 overflow-y-auto rounded bg-gray-900/60 p-2">
              {[...clicker.events].reverse().map((event, i) => (
                <div key={`${event.ts}-${i}`} className="text-[11px] text-gray-400">
                  {new Date(event.ts * 1000).toLocaleTimeString()} — {event.kind}
                  {event.template ? ` ${event.action}:${event.template} @ (${event.x},${event.y})` : ""}
                  {event.reason ? ` (${event.reason})` : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Mount the panel**

Modify `components/CompactSwapper/index.tsx`. Add to the imports (next to the `SettingsPanel` import at line 13):

```tsx
import { ClickerPanel } from "./components/ClickerPanel";
```

Then directly after the `<SettingsPanel ... />` block (which ends at line 332 with `/>`), insert:

```tsx
          {/* Auto-Clicker (local opt-in tool; renders null unless CLICKER_ENABLED=1) */}
          <ClickerPanel />
```

- [ ] **Step 3: Type-check, lint, and eyeball**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. Then with `CLICKER_ENABLED=1` in `.env.local` and `npm run dev`: the swapper page shows the collapsed "Auto-Clicker" row with a gray LED; without the flag the panel is absent.

- [ ] **Step 4: Commit**

```bash
git add components/CompactSwapper/components/ClickerPanel.tsx components/CompactSwapper/index.tsx
git commit -m "feat: ClickerPanel in swapper UI (arm/disarm, settings, click log)"
```

---

### Task 7: Documentation and audit supersede

**Files:**
- Modify: `USER_MANUAL.md:646-650`
- Modify: `docs/audit/2026-07-10-audit-report.md:146-149` (finding A8)
- Modify: `CLAUDE.md` (architecture map, after the `tools/` bullet)

- [ ] **Step 1: Replace the USER_MANUAL autoclicker tip**

In `USER_MANUAL.md`, replace lines 648-650 (the `**AUTOSWAP**` block):

```markdown
**AUTO-CLICKER (optional, local-only)**: The swapper includes a guard-railed
Auto-Clicker panel that can approve the wallet popup for you during long swap
sessions. It requires explicit opt-in (`CLICKER_ENABLED=1` in `.env.local`,
dev builds only) and enforces a session timer, a click budget, a dead-man's
switch tied to the swapper loop, and an automatic pause while your rig is
mining. Every click is logged in the panel. Details:
`autoclicker/README.md` and
`docs/superpowers/specs/2026-07-19-autoclicker-tool-design.md`.
```

- [ ] **Step 2: Mark audit finding A8 as superseded**

In `docs/audit/2026-07-10-audit-report.md`, directly after the A8 paragraph (line 149), insert:

```markdown
> **Superseded (2026-07-19):** the autoclicker half of A8 is superseded by the
> guard-railed autoclicker tool
> (`docs/superpowers/specs/2026-07-19-autoclicker-tool-design.md`): the
> USER_MANUAL line now documents the official, opt-in, guard-railed tool
> instead of an unguarded script. The INSTALLATION_MANUAL half of A8 remains
> open.
```

- [ ] **Step 3: Add the autoclicker to the CLAUDE.md architecture map**

In `CLAUDE.md`, after the `tools/` bullet (line 23), add:

```markdown
- `autoclicker/` — opt-in, guard-railed local wallet-popup clicker: Python
  process + `app/api/clicker/*` + `ClickerPanel`, gated by `CLICKER_ENABLED=1`
  (dev only). Guardrails are enforced in the Python process (timer, click
  budget, heartbeat). It lives here, NOT in `tools/`, so the "tools/ is
  read-only" rule stays absolute.
```

- [ ] **Step 4: Commit**

```bash
git add USER_MANUAL.md docs/audit/2026-07-10-audit-report.md CLAUDE.md
git commit -m "docs: document autoclicker tool, supersede audit finding A8"
```

---

### Task 8: End-to-end dry-run verification

**Files:** none created — this is the acceptance checklist. Fix-and-commit anything that fails.

- [ ] **Step 1: Full-stack dry-run session**

1. `CLICKER_ENABLED=1` in `.env.local`, `npm run dev`, open the swapper, connect the wallet.
2. Start the auto-swap loop → the Auto-Clicker panel's "Arm clicker" button becomes enabled.
3. Arm with defaults + **Dry-run checked**. Expect: LED green + "armed", clicks 0/50, countdown ticking.
4. Put a `templates/confirm/` source image on screen (open one of the PNGs in an image viewer at 100%). Expect within ~2 scan cycles: a `click` event in the log marked `dry_run`, counter increments, **no real mouse click**.
5. Toggle "Pause" → LED yellow "paused (manual pause)"; untoggle → green.
6. Stop the swapper loop → within ~15 s the clicker disarms itself (LED gray, reason `heartbeat_lost` or `control_disarm`).
7. Re-arm, then kill the Python process in Task Manager → panel shows "stopped (not started)" / offline within one poll cycle.
8. `npx vitest run && npm run lint && npx tsc --noEmit` → all green.

- [ ] **Step 2: First real (non-dry-run) session — user-attended**

With the user present: small click budget (5), short session (15 min), dry-run OFF, one real low-value swap. Verify the Phantom popup is actually clicked and logged. If the template doesn't match, capture a fresh screenshot of the current Phantom confirm button into `templates/confirm/` (see README) and retry.

- [ ] **Step 3: Final commit if fixes were made**

```bash
git add -A && git commit -m "fix: e2e verification fixes for autoclicker"
```

---

## Self-Review Notes

- **Spec coverage:** Python clicker + guardrails (Task 1), file protocol (Tasks 1/2/4), evaluator + mining heuristic (Task 3), four gated routes (Task 4), orchestrator hook (Task 5), panel + mount (Task 6), USER_MANUAL/audit/CLAUDE.md updates (Task 7), `.gitignore` (Task 1), dry-run verification (Task 8). Spec's "open items" (fresh templates, pip deps) are handled in Task 1 Step 4 and Task 8 Step 2.
- **Deviation from spec (documented):** spec named the states `armed|paused|disarmed|stopped`; implementation collapses `disarmed` into `stopped` (one session = one process, exit on disarm) — fewer states, same behavior. Spec's separate "resume/stop kinds" collapsed into `resume`/`auto_stop` events.
- **Type consistency check:** `ClickerStatus` snake_case fields match `clicker.py` `write_status` exactly; `StartRequest` camelCase is mapped to snake_case only in `start/route.ts` `writeControl`; `ClickerPolicyResult` fields used by hook and panel match Task 3's export.
