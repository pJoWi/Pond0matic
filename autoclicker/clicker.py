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
