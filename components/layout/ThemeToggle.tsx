"use client";
import { useEffect, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { resolveThemeIsDark } from "@/lib/settings/theme";

export function ThemeToggle() {
  const { settings, update } = useSettings();
  // Defer the OS-preference lookup until after mount: the server and the first
  // client render must agree, so a "system" theme resolves without matchMedia
  // until `mounted` is true (avoids a hydration mismatch). The <html> class is
  // already set correctly at first paint by the layout's inline script.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = resolveThemeIsDark(settings.theme, mounted, prefersDark);
  return (
    <button
      type="button"
      onClick={() => update({ theme: isDark ? "light" : "dark" })}
      className="rounded-full border border-edge px-3 py-1 text-xs text-ink-muted hover:text-ink hover:border-accent transition-colors"
      aria-label="Toggle dark mode"
    >
      {isDark ? "☾ dark" : "☀ light"}
    </button>
  );
}
