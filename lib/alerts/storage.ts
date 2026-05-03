import { StoredAlertConfigSchema, type StoredAlertConfig } from "./types";
import { defaultConfig } from "./defaults";

export const STORAGE_KEY = "pond0matic.alerts.v1";
export const ALERTS_UPDATED_EVENT = "pond0matic:alerts-updated";

let saveTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 250;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Load alert config from localStorage. Returns seeded defaults when:
 *   - storage is empty
 *   - stored JSON is corrupt
 *   - stored shape fails schema validation (e.g. version bump in future)
 *
 * Never throws. Safe to call from SSR (returns defaults).
 */
export function loadConfig(): StoredAlertConfig {
  if (!isBrowser()) return defaultConfig();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig();
    const parsed = JSON.parse(raw);
    const result = StoredAlertConfigSchema.safeParse(parsed);
    if (!result.success) return defaultConfig();
    // Cap recentTriggers at 50 even if storage somehow grew larger
    return { ...result.data, recentTriggers: result.data.recentTriggers.slice(0, 50) };
  } catch {
    return defaultConfig();
  }
}

/**
 * Persist alert config to localStorage. Debounced so that many small updates
 * within a polling tick coalesce into one write. Dispatches a window event so
 * other tabs/components (TopNavigation badge) can react.
 */
export function saveConfig(config: StoredAlertConfig): void {
  if (!isBrowser()) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      window.dispatchEvent(new CustomEvent(ALERTS_UPDATED_EVENT));
    } catch {
      // Quota exceeded or storage disabled - swallow; UI continues to work in-memory
    }
  }, SAVE_DEBOUNCE_MS);
}

/**
 * Force an immediate write, bypassing the debounce. Used at module-level
 * teardown (page unload) to make sure the latest tick is persisted.
 */
export function flushConfig(config: StoredAlertConfig): void {
  if (!isBrowser()) return;
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(ALERTS_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

export function exportConfigToString(config: StoredAlertConfig): string {
  return JSON.stringify(config, null, 2);
}

export type ImportResult =
  | { ok: true; config: StoredAlertConfig }
  | { ok: false; error: string };

/**
 * Validate and parse an exported config JSON string.
 * Returns a discriminated result instead of throwing so callers can
 * surface a friendly error to the user.
 */
export function importConfigFromString(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "File is not valid JSON." };
  }
  const result = StoredAlertConfigSchema.safeParse(parsed);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const where = firstIssue?.path.join(".") || "<root>";
    return { ok: false, error: `Invalid config at ${where}: ${firstIssue?.message ?? "unknown error"}` };
  }
  return { ok: true, config: { ...result.data, recentTriggers: result.data.recentTriggers.slice(0, 50) } };
}
