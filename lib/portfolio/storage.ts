import {
  PortfolioStorageSchema,
  STORAGE_KEY,
  PORTFOLIO_UPDATED_EVENT,
  MAX_RECORDS,
  emptyStorage,
  type PortfolioStorage,
  type SwapRecord,
} from "./types";

let saveTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 250;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadStorage(): PortfolioStorage {
  if (!isBrowser()) return emptyStorage();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStorage();
    const parsed = JSON.parse(raw);
    const result = PortfolioStorageSchema.safeParse(parsed);
    if (!result.success) return emptyStorage();
    return { ...result.data, records: result.data.records.slice(0, MAX_RECORDS) };
  } catch {
    return emptyStorage();
  }
}

export function saveStorage(storage: PortfolioStorage): void {
  if (!isBrowser()) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
      window.dispatchEvent(new CustomEvent(PORTFOLIO_UPDATED_EVENT));
    } catch {
      // ignore quota errors
    }
  }, SAVE_DEBOUNCE_MS);
}

export function flushStorage(storage: PortfolioStorage): void {
  if (!isBrowser()) return;
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    window.dispatchEvent(new CustomEvent(PORTFOLIO_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

/**
 * Adds a record to the front (newest first) and caps at MAX_RECORDS.
 * Pure: returns a new storage object, does not mutate the input.
 */
export function appendRecord(storage: PortfolioStorage, record: SwapRecord): PortfolioStorage {
  const records = [record, ...storage.records].slice(0, MAX_RECORDS);
  return { ...storage, records, updatedAt: Date.now() };
}

/**
 * Patches the matching record by id. No-op if no record matches.
 */
export function updateRecord(
  storage: PortfolioStorage,
  id: string,
  patch: Partial<SwapRecord>
): PortfolioStorage {
  let changed = false;
  const records = storage.records.map((r) => {
    if (r.id !== id) return r;
    changed = true;
    return { ...r, ...patch };
  });
  if (!changed) return storage;
  return { ...storage, records, updatedAt: Date.now() };
}

/**
 * Drops all records belonging to the given wallet. Used by the "Clear all"
 * button to scope deletion to the currently-connected wallet only.
 */
export function clearWallet(storage: PortfolioStorage, walletAddress: string): PortfolioStorage {
  const records = storage.records.filter((r) => r.walletAddress !== walletAddress);
  if (records.length === storage.records.length) return storage;
  return { ...storage, records, updatedAt: Date.now() };
}

/**
 * Removes a single record by id.
 */
export function removeRecord(storage: PortfolioStorage, id: string): PortfolioStorage {
  const records = storage.records.filter((r) => r.id !== id);
  if (records.length === storage.records.length) return storage;
  return { ...storage, records, updatedAt: Date.now() };
}

/**
 * Returns records belonging to a specific wallet, newest first.
 * Returns an empty array when walletAddress is empty.
 */
export function recordsForWallet(storage: PortfolioStorage, walletAddress: string): SwapRecord[] {
  if (!walletAddress) return [];
  return storage.records.filter((r) => r.walletAddress === walletAddress);
}
