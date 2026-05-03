"use client";
import { toast } from "sonner";
import type { AlertEvent } from "./types";

function emitToast(event: AlertEvent): void {
  const fullMessage = `${event.title}: ${event.message}`;
  switch (event.severity) {
    case "critical":
      toast.error(fullMessage);
      break;
    case "warning":
      toast.warning(fullMessage);
      break;
    case "info":
    default:
      toast.info(fullMessage);
      break;
  }
}

function emitBrowserNotification(event: AlertEvent): void {
  if (typeof window === "undefined") return;
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(event.title, {
      body: event.message,
      icon: "/tokens/solana/wpond.png",
      tag: event.ruleId, // Replace existing notification for the same rule
    });
  } catch {
    // Some browsers throw if the page is suspended; silent fail is fine
  }
}

/**
 * Fire an alert through every available channel:
 *   - in-app sonner toast (always)
 *   - browser Notification (only when permission is granted)
 *
 * Logs to console in dev for debugging.
 */
export function fire(event: AlertEvent): void {
  emitToast(event);
  emitBrowserNotification(event);
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[alerts]", event);
  }
}
