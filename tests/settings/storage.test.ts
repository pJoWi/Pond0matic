import { describe, it, expect } from "vitest";
import {
  parseStoredSettings,
  serializeSettings,
  DEFAULT_SETTINGS,
} from "@/lib/settings/storage";

describe("parseStoredSettings", () => {
  it("returns defaults for null / invalid JSON / wrong shape", () => {
    expect(parseStoredSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseStoredSettings("not json{")).toEqual(DEFAULT_SETTINGS);
    expect(parseStoredSettings(JSON.stringify({ rpc: 42 }))).toEqual(DEFAULT_SETTINGS);
  });
  it("round-trips a valid settings object", () => {
    const s = {
      ...DEFAULT_SETTINGS,
      rpc: "https://mainnet.helius-rpc.com/?api-key=x",
      jupiterApiKey: "jup-key",
      rpcVerified: true,
      apiKeyVerified: true,
      theme: "light" as const,
      slippageBps: 75,
      affiliate: "aquavaults" as const,
    };
    expect(parseStoredSettings(serializeSettings(s))).toEqual(s);
  });
  it("rejects out-of-range bps by falling back to defaults", () => {
    const bad = { ...DEFAULT_SETTINGS, slippageBps: 99999 };
    expect(parseStoredSettings(JSON.stringify(bad))).toEqual(DEFAULT_SETTINGS);
  });
  it("defaults rigBoost to 0 and migrates settings saved before it existed", () => {
    expect(DEFAULT_SETTINGS.rigBoost).toBe(0);
    // Settings saved before rigBoost existed must still parse (default applied),
    // NOT reset to defaults — that would wipe the user's saved RPC/key.
    const { rigBoost: _omit, ...legacy } = DEFAULT_SETTINGS;
    const stored = { ...legacy, rpc: "https://x", jupiterApiKey: "k", rpcVerified: true, apiKeyVerified: true };
    const parsed = parseStoredSettings(JSON.stringify(stored));
    expect(parsed.rpc).toBe("https://x");
    expect(parsed.rigBoost).toBe(0);
  });
  it("round-trips a set rigBoost", () => {
    const s = { ...DEFAULT_SETTINGS, rigBoost: 174.6 };
    expect(parseStoredSettings(serializeSettings(s)).rigBoost).toBeCloseTo(174.6);
  });
});
