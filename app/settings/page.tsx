"use client";
import { ConnectionSettings } from "@/components/settings/ConnectionSettings";
import { SwapDefaultsSettings } from "@/components/settings/SwapDefaultsSettings";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-lg font-bold">Settings</h1>
      <ConnectionSettings />
      <SwapDefaultsSettings />
    </div>
  );
}
