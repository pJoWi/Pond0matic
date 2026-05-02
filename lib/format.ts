/**
 * Format a USD price with decimal precision tuned to its magnitude.
 * - >= 1: 4 decimals
 * - >= 0.01: 6 decimals
 * - everything smaller: 8 decimals
 */
export function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toFixed(4)}`;
  if (price >= 0.01) return `$${price.toFixed(6)}`;
  return `$${price.toFixed(8)}`;
}
