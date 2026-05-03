import { describe, it, expect, beforeEach } from "vitest";
import {
  appendRecord,
  clearWallet,
  flushStorage,
  loadStorage,
  recordsForWallet,
  removeRecord,
  updateRecord,
} from "@/lib/portfolio/storage";
import { MAX_RECORDS, STORAGE_KEY, emptyStorage, type SwapRecord } from "@/lib/portfolio/types";

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
  // @ts-expect-error patch into global
  globalThis.window = {
    localStorage: new MemoryStorage(),
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
});

function makeRecord(overrides: Partial<SwapRecord> = {}): SwapRecord {
  return {
    id: "r-" + Math.random(),
    signature: "sig-" + Math.random(),
    mode: "normal",
    fromMint: "from",
    fromSymbol: "SOL",
    fromAmount: 1,
    toMint: "to",
    toSymbol: "wPOND",
    toAmount: 100,
    fromPriceUsd: 100,
    toPriceUsd: 0.001,
    status: "confirmed",
    timestamp: Date.now(),
    walletAddress: "wallet-1",
    ...overrides,
  };
}

describe("portfolio.storage.loadStorage", () => {
  it("returns empty when storage is missing", () => {
    expect(loadStorage()).toEqual(emptyStorage());
  });

  it("returns empty on corrupt JSON", () => {
    (globalThis as any).window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadStorage()).toEqual(emptyStorage());
  });

  it("returns empty on bad schema", () => {
    (globalThis as any).window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99 }));
    expect(loadStorage()).toEqual(emptyStorage());
  });
});

describe("portfolio.storage.appendRecord", () => {
  it("inserts at the front (newest first) and increases count", () => {
    let s = emptyStorage();
    s = appendRecord(s, makeRecord({ id: "a", timestamp: 1 }));
    s = appendRecord(s, makeRecord({ id: "b", timestamp: 2 }));
    expect(s.records.map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("caps at MAX_RECORDS, dropping oldest", () => {
    let s = emptyStorage();
    for (let i = 0; i < MAX_RECORDS + 10; i++) {
      s = appendRecord(s, makeRecord({ id: `r${i}` }));
    }
    expect(s.records.length).toBe(MAX_RECORDS);
    // The most recently appended record is at the front
    expect(s.records[0].id).toBe(`r${MAX_RECORDS + 9}`);
  });
});

describe("portfolio.storage.updateRecord", () => {
  it("patches matching record by id", () => {
    let s = emptyStorage();
    s = appendRecord(s, makeRecord({ id: "x", status: "pending" }));
    s = updateRecord(s, "x", { status: "confirmed" });
    expect(s.records[0].status).toBe("confirmed");
  });

  it("is a no-op when id does not match", () => {
    const initial = appendRecord(emptyStorage(), makeRecord({ id: "x" }));
    const next = updateRecord(initial, "missing", { status: "failed" });
    expect(next).toBe(initial);
  });
});

describe("portfolio.storage.removeRecord & clearWallet", () => {
  it("removeRecord drops only the matching id", () => {
    let s = emptyStorage();
    s = appendRecord(s, makeRecord({ id: "a" }));
    s = appendRecord(s, makeRecord({ id: "b" }));
    s = removeRecord(s, "a");
    expect(s.records.map((r) => r.id)).toEqual(["b"]);
  });

  it("clearWallet drops only that wallet's records", () => {
    let s = emptyStorage();
    s = appendRecord(s, makeRecord({ id: "a", walletAddress: "wallet-1" }));
    s = appendRecord(s, makeRecord({ id: "b", walletAddress: "wallet-2" }));
    s = clearWallet(s, "wallet-1");
    expect(s.records.map((r) => r.id)).toEqual(["b"]);
  });
});

describe("portfolio.storage.recordsForWallet", () => {
  it("filters by wallet, preserves order", () => {
    let s = emptyStorage();
    s = appendRecord(s, makeRecord({ id: "a", walletAddress: "w1" }));
    s = appendRecord(s, makeRecord({ id: "b", walletAddress: "w2" }));
    s = appendRecord(s, makeRecord({ id: "c", walletAddress: "w1" }));
    const w1 = recordsForWallet(s, "w1");
    expect(w1.map((r) => r.id)).toEqual(["c", "a"]);
  });

  it("returns empty array for empty wallet string", () => {
    let s = emptyStorage();
    s = appendRecord(s, makeRecord({ id: "a", walletAddress: "w1" }));
    expect(recordsForWallet(s, "")).toEqual([]);
  });
});

describe("portfolio.storage round-trip via flushStorage + loadStorage", () => {
  it("persists then reads identical content", () => {
    let s = emptyStorage();
    s = appendRecord(s, makeRecord({ id: "rt-1" }));
    flushStorage(s);
    const back = loadStorage();
    expect(back.records).toHaveLength(1);
    expect(back.records[0].id).toBe("rt-1");
  });
});
