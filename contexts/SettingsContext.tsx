"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  parseStoredSettings,
  serializeSettings,
  type StoredSettings,
} from "@/lib/settings/storage";

interface SettingsContextValue {
  settings: StoredSettings;
  update: (patch: Partial<StoredSettings>) => void;
  /** RPC + API key present and verified. Combine with useWallet().connected for the full gate. */
  settingsReady: boolean;
  setupOpen: boolean;
  setSetupOpen: (open: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoredSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    setSettings(parseStoredSettings(localStorage.getItem(SETTINGS_STORAGE_KEY)));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(SETTINGS_STORAGE_KEY, serializeSettings(settings));
  }, [settings, hydrated]);

  // Apply theme to <html> (the layout's inline script handles first paint)
  useEffect(() => {
    const dark =
      settings.theme === "dark" ||
      (settings.theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }, [settings.theme]);

  const value = useMemo<SettingsContextValue>(() => {
    const update = (patch: Partial<StoredSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        // Editing RPC or key invalidates its verification unless explicitly set
        if (patch.rpc !== undefined && patch.rpcVerified === undefined) next.rpcVerified = false;
        if (patch.jupiterApiKey !== undefined && patch.apiKeyVerified === undefined)
          next.apiKeyVerified = false;
        return next;
      });
    };
    const settingsReady = Boolean(
      settings.rpc && settings.jupiterApiKey && settings.rpcVerified && settings.apiKeyVerified
    );
    return { settings, update, settingsReady, setupOpen, setSetupOpen };
  }, [settings, setupOpen]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
