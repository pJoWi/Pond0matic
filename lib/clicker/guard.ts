/**
 * Pure gate for the clicker API: explicit opt-in via CLICKER_ENABLED=1 and
 * never in production builds. Routes 404 when this returns false.
 */
export function clickerEnabled(env: { CLICKER_ENABLED?: string; NODE_ENV?: string }): boolean {
  return env.CLICKER_ENABLED === "1" && env.NODE_ENV !== "production";
}
