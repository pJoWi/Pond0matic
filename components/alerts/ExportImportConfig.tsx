"use client";
import React, { useRef } from "react";
import { toast } from "sonner";
import {
  exportConfigToString,
  flushConfig,
  importConfigFromString,
  loadConfig,
} from "@/lib/alerts/storage";

export function ExportImportConfig() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const config = loadConfig();
    const json = exportConfigToString(config);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pond0matic-alerts-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Alert config exported");
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const result = importConfigFromString(text);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      flushConfig(result.config);
      toast.success("Alert config imported. Reloading…");
      // Hard reload so all hooks pick up the new config cleanly
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to read file");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleExport}
        className="px-3 py-1.5 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-400/40 rounded-lg text-xs font-medium text-teal-200 transition-all"
      >
        Export
      </button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="px-3 py-1.5 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-400/40 rounded-lg text-xs font-medium text-teal-200 transition-all"
      >
        Import
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImportFile(file);
          e.target.value = ""; // allow re-importing same file
        }}
      />
    </div>
  );
}
