/**
 * Window and browser utilities with SSR safety guards
 */

/**
 * Safely check if code is running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get Phantom wallet provider safely with SSR guard
 *
 * @returns Phantom provider or null if not available
 */
export function getPhantomProvider(): any | null {
  if (!isBrowser()) return null;
  return (window as any)?.solana || null;
}

/**
 * Safely access localStorage with SSR guard
 *
 * @returns localStorage instance or null
 */
export function getLocalStorage(): Storage | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Safe localStorage getter with fallback
 *
 * @param key - localStorage key
 * @param fallback - Fallback value if key doesn't exist or error occurs
 * @returns Stored value or fallback
 */
export function safeLocalStorageGet(key: string, fallback: string = ''): string {
  try {
    const storage = getLocalStorage();
    return storage?.getItem(key) ?? fallback;
  } catch (error) {
    console.warn(`localStorage get failed for key "${key}":`, error);
    return fallback;
  }
}

/**
 * Safe localStorage setter with error handling
 *
 * @param key - localStorage key
 * @param value - Value to store
 * @returns true if successful, false otherwise
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    const storage = getLocalStorage();
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`localStorage set failed for key "${key}":`, error);
    return false;
  }
}

/**
 * Safe localStorage remove with error handling
 *
 * @param key - localStorage key to remove
 * @returns true if successful, false otherwise
 */
export function safeLocalStorageRemove(key: string): boolean {
  try {
    const storage = getLocalStorage();
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`localStorage remove failed for key "${key}":`, error);
    return false;
  }
}
