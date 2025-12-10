import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 *
 * @param inputs - Class names or conditional class objects
 * @returns Merged class string with proper Tailwind precedence
 *
 * @example
 * cn("px-4 py-2", condition && "bg-red-500", "hover:bg-blue-500")
 */
export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shorten a string (typically addresses or signatures) for display
 * Shows first N and last N characters with ellipsis in between
 *
 * @param s - String to shorten (address, signature, etc.)
 * @param n - Number of characters to show from each end (default: 4)
 * @returns Shortened string in format "abcd…wxyz" or empty string if input is falsy
 *
 * @example
 * short("So11111111111111111111111111111111111111112", 4)
 * // Returns: "So11…1112"
 */
export const short = (s: string, n = 4) =>
  (s ? `${s.slice(0, n)}…${s.slice(-n)}` : "");

/**
 * Generate a Helius explorer URL for a Solana transaction
 * Uses Orb (Helius explorer) with advanced mode and logs tab
 *
 * @param sig - Transaction signature
 * @returns Full URL to view transaction on Helius explorer
 *
 * @example
 * solscanTx("5j7s...xyz")
 * // Returns: "https://orb.helius.dev/tx/5j7s...xyz?cluster=mainnet-beta&advanced=true&tab=logs"
 */
export const solscanTx = (sig: string) =>
  `https://orb.helius.dev/tx/${sig}?cluster=mainnet-beta&advanced=true&tab=logs`;

/**
 * Get current time formatted as a locale-specific time string
 *
 * @returns Time string (e.g., "3:45:12 PM")
 *
 * @example
 * now() // Returns: "3:45:12 PM" (depending on locale)
 */
export const now = () => new Date().toLocaleTimeString();
