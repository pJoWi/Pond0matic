"use client";
import { useSettings } from "@/contexts/SettingsContext";

export function ThemeToggle() {
  const { settings, update } = useSettings();
  const isDark =
    settings.theme === "dark" ||
    (settings.theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
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
