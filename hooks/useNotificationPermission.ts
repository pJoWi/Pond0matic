"use client";
import { useCallback, useEffect, useState } from "react";

export type NotificationPermissionStatus =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

function readStatus(): NotificationPermissionStatus {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Wraps the browser Notification permission API in a hook that:
 *  - reports current status (granted/denied/default/unsupported)
 *  - exposes a request() that prompts the user
 *  - re-reads status on window focus so external changes propagate
 */
export function useNotificationPermission(): {
  status: NotificationPermissionStatus;
  request: () => Promise<NotificationPermissionStatus>;
} {
  const [status, setStatus] = useState<NotificationPermissionStatus>("unsupported");

  useEffect(() => {
    setStatus(readStatus());
    const onFocus = () => setStatus(readStatus());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const request = useCallback(async (): Promise<NotificationPermissionStatus> => {
    if (typeof Notification === "undefined") return "unsupported";
    try {
      const result = await Notification.requestPermission();
      const next = result as NotificationPermissionStatus;
      setStatus(next);
      return next;
    } catch {
      return readStatus();
    }
  }, []);

  return { status, request };
}
