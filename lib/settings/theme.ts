import type { ThemeSetting } from "@/lib/settings/storage";

/**
 * Resolve whether dark mode is active for the theme toggle's label.
 *
 * `ready` gates the OS-preference lookup. Before the client has mounted, we are
 * either rendering on the server (no `window`/`matchMedia`) or producing the
 * first client render, which MUST byte-match the server's HTML — so a "system"
 * theme is resolved WITHOUT consulting the OS preference (returns false). Only
 * once `ready` is true (after mount) do we factor in `prefersDark`. An explicit
 * "dark" is deterministic and safe on the server, so it short-circuits.
 */
export function resolveThemeIsDark(
  theme: ThemeSetting,
  ready: boolean,
  prefersDark: boolean
): boolean {
  if (theme === "dark") return true;
  if (!ready) return false;
  return theme === "system" && prefersDark;
}
