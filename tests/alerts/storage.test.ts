import { describe, it, expect, beforeEach } from "vitest";
import {
  exportConfigToString,
  importConfigFromString,
  loadConfig,
  saveConfig,
  flushConfig,
  STORAGE_KEY,
} from "@/lib/alerts/storage";
import { defaultConfig } from "@/lib/alerts/defaults";
import type { StoredAlertConfig } from "@/lib/alerts/types";

// Minimal in-memory localStorage shim for the Node test environment.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(k: string) { return this.store.get(k) ?? null; }
  setItem(k: string, v: string) { this.store.set(k, v); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
  key(i: number) { return [...this.store.keys()][i] ?? null; }
  get length() { return this.store.size; }
}

beforeEach(() => {
  const memStorage = new MemoryStorage();
  // @ts-expect-error patch into global
  globalThis.window = {
    localStorage: memStorage,
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
});

describe("storage.loadConfig", () => {
  it("returns seeded defaults when storage is empty", () => {
    const cfg = loadConfig();
    expect(cfg.version).toBe(1);
    expect(cfg.rigRules.length).toBeGreaterThan(0);
    expect(cfg.priceRules).toEqual([]);
    expect(cfg.recentTriggers).toEqual([]);
  });

  it("returns defaults when storage contains corrupt JSON", () => {
    (globalThis as any).window.localStorage.setItem(STORAGE_KEY, "{not json");
    const cfg = loadConfig();
    expect(cfg).toEqual(defaultConfig());
  });

  it("returns defaults when stored shape fails schema", () => {
    (globalThis as any).window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 999, what: "ever" })
    );
    const cfg = loadConfig();
    expect(cfg).toEqual(defaultConfig());
  });
});

describe("storage.flushConfig", () => {
  it("round-trips a config losslessly via flush + load", () => {
    const original: StoredAlertConfig = {
      ...defaultConfig(),
      priceRules: [
        {
          id: "p-test",
          symbol: "wPOND",
          kind: "above",
          threshold: 0.001,
          enabled: true,
          oneShot: true,
          cooldownMs: 60_000,
        },
      ],
    };
    flushConfig(original);
    const back = loadConfig();
    expect(back).toEqual(original);
  });
});

describe("storage.exportConfigToString / importConfigFromString", () => {
  it("export then import returns equal config", () => {
    const original = defaultConfig();
    const json = exportConfigToString(original);
    const result = importConfigFromString(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config).toEqual(original);
    }
  });

  it("rejects non-JSON input with friendly error", () => {
    const result = importConfigFromString("not json at all");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/JSON/);
  });

  it("rejects valid JSON that fails schema", () => {
    const result = importConfigFromString(JSON.stringify({ version: 999 }));
    expect(result.ok).toBe(false);
  });
});

describe("saveConfig debounce", () => {
  it("eventually persists after the debounce window", async () => {
    const cfg = defaultConfig();
    saveConfig(cfg);
    // Wait past the 250ms debounce
    await new Promise((r) => setTimeout(r, 350));
    const back = loadConfig();
    expect(back).toEqual(cfg);
  });
});
