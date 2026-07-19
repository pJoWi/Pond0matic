# Autoclicker tool (guard-railed wallet-popup clicker) — Design

Date: 2026-07-19
Status: Approved (design), supersedes audit finding A8

## Context & decision

The auto-swap loop requires a manual wallet approval (Phantom popup) per swap.
`USER_MANUAL.md:649` informally recommended the user's standalone PyAutoGUI
script (`autoswap.py`); audit finding A8 flagged that line for deletion because
an unguarded auto-approver contradicts the manual's security guidance.

**Decision:** instead of deleting the capability, adopt it as an official,
opt-in, guard-railed local tool controlled from the swapper UI. This document
supersedes A8: the USER_MANUAL line is replaced by a reference to the official
tool, and the audit report marks A8 as superseded by this design.

The `tools/` rule is unchanged: `tools/` stays read-only exploration, never
signing/sending. The clicker therefore lives in its own top-level `autoclicker/`
directory.

## Goals

- Start/stop and configure the clicker entirely from the swapper UI.
- Click Confirm and Cancel templates in the Phantom popup (template PNGs).
- Guardrails, enforced in the Python process itself (not only the UI):
  1. Session timer: auto-stop after a configurable duration.
  2. Click budget: auto-disarm after N clicks per session.
  3. Swapper coupling: clicker may only be armed while the auto-swap loop
     runs (heartbeat dead-man's switch).
  4. Mining pause: auto-pause while the user's rig is actively mining
     (detected via the existing cary0x rig-status data).
  5. Click log: every click visible in the UI.
- Fail toward "not clicking" on any crash, on either side.

## Non-goals

- No in-process signing or key handling anywhere. The clicker only moves the
  OS mouse; the human-visible Phantom popup remains the signing surface.
- No remote/production availability. This is a local-machine tool only.
- No OCR/amount verification of the popup contents (image match only).

## Architecture

Chosen approach: **file-based control + API-spawned process** (no open ports).

```
autoclicker/
  clicker.py              # main loop (derived from autoswap.py)
  templates/
    confirm/*.png         # confirm templates — drop a PNG in, no code change
    cancel/*.png          # cancel templates
  runtime/                # gitignored: control.json, status.json, events.jsonl
  README.md               # standalone usage, template capture, safety notes
```

### Python clicker (`clicker.py`)

- Loop: read `runtime/control.json` → enforce guardrails → scan screen for
  templates (`pyautogui.locateCenterOnScreen`, `confidence=0.9`, requires
  opencv) → click center of a match → append event → write
  `runtime/status.json`.
- Scan order: all `templates/confirm/*.png` first (sorted by filename), then
  `templates/cancel/*.png`. First match wins per scan cycle; after a click the
  clicker sleeps ~2 s before the next scan.
- PyAutoGUI FAILSAFE stays on (mouse to a screen corner aborts).
- `--dry-run` flag: full loop and logging, no real clicks — used to verify
  templates safely.
- Guardrail enforcement lives here: the process disarms itself on session
  deadline, exhausted click budget, or stale heartbeat (> ~15 s), regardless
  of what the UI does or whether it is still alive.

### Control protocol (files in `autoclicker/runtime/`)

- `control.json` (written by Next.js API): `armed`, `paused`,
  `scan_interval_s`, `session_minutes`, `click_budget`, `heartbeat_ts`.
- `status.json` (written by clicker): `state`
  (`armed|paused|disarmed|stopped`), `clicks_used`, `click_budget`,
  `session_deadline`, `last_scan_ts`, `pid`.
- `events.jsonl` (appended by clicker): one JSON line per event — timestamp,
  kind (`click|pause|resume|auto_stop|start|stop`), template name, action
  (`confirm|cancel`), coordinates, reason.

The heartbeat is the swapper-coupling guardrail: the UI refreshes
`heartbeat_ts` every few seconds only while the auto-swap loop is running.
Loop stopped, tab closed, or dashboard crashed → heartbeat goes stale →
clicker disarms itself.

### Next.js API (`app/api/clicker/*`)

All request bodies validated with Zod at the boundary (convention #3).

- `POST /api/clicker/start` — spawn `python autoclicker/clicker.py` as a child
  process (refuse if `status.json` shows a live pid); write initial
  `control.json` from the requested timer/budget/interval.
- `POST /api/clicker/stop` — set `armed: false`, terminate the process.
- `POST /api/clicker/control` — update settings (pause, interval, timer) and
  refresh the heartbeat.
- `GET /api/clicker/status` — return `status.json` plus the last ~50 events.

Gating: every route returns 404 unless `CLICKER_ENABLED=1` is set (explicit
opt-in via `.env.local`) **and** `NODE_ENV !== 'production'` — checked in a
shared guard helper. On any public deploy (no flag, production build, no
Python) the routes are dead.

### UI (project conventions #2, #4, #5, #7)

- `lib/clicker/clickerPolicyEvaluator.ts` — pure function:
  `(swapperRunning, miningActive, deadline, budget, clicksUsed, now)` →
  desired clicker state + reason. No React/DOM/IO. Fully Vitest-tested.
- `hooks/useClickerControl.ts` — orchestrator hook: polls
  `/api/clicker/status` via `useVisibilityPolling`, sends heartbeat while the
  swap loop runs, applies evaluator output (auto-pause on mining via existing
  rig-health data, auto-disarm on swapper stop).
- `components/ClickerPanel.tsx` — single component in the swapper: arm/disarm,
  status LED (reuse `StatusLED`), settings (scan interval, session timer,
  click budget), progress (clicks used / budget, time remaining), click-log
  feed.

## Error handling

- Python process crash → `status.json.last_scan_ts` goes stale → UI shows
  "clicker offline".
- UI/dashboard crash → heartbeat stale → clicker disarms itself.
- Missing/invalid `control.json` → clicker treats as `armed: false`.
- Off-screen or out-of-bounds match coordinates are skipped (as in
  `autoswap.py`).

## Testing

- `clickerPolicyEvaluator`: full Vitest coverage of guardrail transitions
  (arm, budget exhaustion, deadline, mining pause/resume, heartbeat loss).
- API route validation: Vitest tests for the Zod schemas and gating flag.
- Python side: manual verification via `--dry-run` (logged "would click"
  events, no real clicks). Kept intentionally simple; no Python test harness.

## Documentation updates (part of implementation)

- `USER_MANUAL.md:648-650` — replace the informal autoswap.py tip with a
  section on the official ClickerPanel and its guardrails.
- `docs/audit/2026-07-10-audit-report.md` — mark A8 as superseded by this
  design (keep the original finding text for history).
- `CLAUDE.md` — add `autoclicker/` to the architecture map; restate that
  `tools/` remains read-only.
- `.gitignore` — add `autoclicker/runtime/`.

## Open items (implementation-time)

- Template capture: existing PNGs from `C:\Users\jowij\PyAutoGUI` are copied
  as a starting set, but fresh screenshots of the current Phantom popup on the
  target machine are likely needed; README documents the capture procedure.
- Python dependency check on the dashboard machine (`pyautogui`,
  `opencv-python`, `pillow`); README lists a one-line `pip install`.
