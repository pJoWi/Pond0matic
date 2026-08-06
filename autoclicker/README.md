# Autoclicker (guard-railed wallet-popup clicker)

Opt-in local tool that clicks the Phantom wallet popup during auto-swap
sessions.

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
