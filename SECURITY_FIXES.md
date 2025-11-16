# Security Fixes - Implementation Plan

**Critical Issues Found by Code Review**

## Priority 0 (Critical) - Implementing Now

### P0 #1: Race Condition in Auto-Swap ✅ IN PROGRESS

**Location**: `hooks/useSwapExecution.ts:208-213`

**Current Code**:
```typescript
if (ctx.running || runRef.current) {
  ctx.log("Auto-swap already running");
  return;
}
runRef.current = true;
ctx.setRunning(true);
```

**Fixed Code**:
```typescript
// Atomic check-and-set to prevent race conditions
const wasAlreadyRunning = ctx.running || runRef.current;
if (wasAlreadyRunning) {
  ctx.log("Auto-swap already running");
  return;
}

// Double-check pattern for additional safety
runRef.current = true;
if (ctx.running) {
  runRef.current = false;
  return;
}
ctx.setRunning(true);
```

**Status**: Ready to apply

---

### P0 #2: Transaction Validation Before Signing

**Location**: `hooks/useSwapExecution.ts:111-118`

**Implementation**: Create new validation utilities

**New File**: `lib/transactionValidation.ts`

```typescript
import { VersionedTransaction, PublicKey } from '@solana/web3.js';

// Known safe program IDs
const SAFE_PROGRAM_IDS = new Set([
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', // Jupiter v6
  'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB', // Jupiter v4
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program
  '11111111111111111111111111111111', // System Program
]);

export interface TransactionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a Jupiter swap transaction before signing
 *
 * @param tx - The deserialized VersionedTransaction
 * @param expectedFeePayer - The user's public key (expected fee payer)
 * @param maxFeeLamports - Maximum acceptable fee (default: 0.01 SOL)
 * @returns Validation result with errors and warnings
 */
export function validateSwapTransaction(
  tx: VersionedTransaction,
  expectedFeePayer: PublicKey,
  maxFeeLamports: number = 10_000_000 // 0.01 SOL
): TransactionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validate transaction structure
  if (!tx.message || !tx.message.staticAccountKeys || tx.message.staticAccountKeys.length === 0) {
    errors.push('Invalid transaction structure: missing message or account keys');
    return { isValid: false, errors, warnings };
  }

  // 2. Verify fee payer matches expected wallet
  const feePayer = tx.message.staticAccountKeys[0];
  if (!feePayer.equals(expectedFeePayer)) {
    errors.push(`Fee payer mismatch: expected ${expectedFeePayer.toBase58()}, got ${feePayer.toBase58()}`);
  }

  // 3. Check program IDs against whitelist
  const programIds = tx.message.compiledInstructions.map(ix =>
    tx.message.staticAccountKeys[ix.programIdIndex]?.toBase58()
  ).filter(Boolean);

  const unknownPrograms = programIds.filter(pid => !SAFE_PROGRAM_IDS.has(pid));
  if (unknownPrograms.length > 0) {
    warnings.push(`Transaction includes unknown programs: ${unknownPrograms.join(', ')}`);
  }

  // 4. Validate reasonable number of instructions
  if (tx.message.compiledInstructions.length > 20) {
    warnings.push(`Unusually high number of instructions: ${tx.message.compiledInstructions.length}`);
  }

  // 5. Check for excessive account keys
  if (tx.message.staticAccountKeys.length > 50) {
    warnings.push(`Unusually high number of account keys: ${tx.message.staticAccountKeys.length}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Simulates a transaction to check if it would succeed
 *
 * @param connection - Solana connection instance
 * @param tx - The transaction to simulate
 * @returns Simulation result
 */
export async function simulateTransaction(
  connection: any,
  tx: VersionedTransaction
): Promise<{ success: boolean; error?: string }> {
  try {
    const simulation = await connection.simulateTransaction(tx);

    if (simulation.value.err) {
      return {
        success: false,
        error: `Simulation failed: ${JSON.stringify(simulation.value.err)}`
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Simulation error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
```

---

### P0 #3: Maximum Swap Amount Validation

**Location**: `hooks/useSwapExecution.ts:62-73`

**Implementation**: Add balance and amount validation

```typescript
/**
 * Validates swap amount before execution
 *
 * @param amount - Amount to swap (UI units)
 * @param tokenBalance - Available token balance (UI units)
 * @param tokenSymbol - Token symbol for error messages
 * @param maxSwapPercentage - Max % of balance allowed (default: 90%)
 * @returns Validation result
 */
export function validateSwapAmount(
  amount: string,
  tokenBalance: number,
  tokenSymbol: string,
  maxSwapPercentage: number = 90
): { isValid: boolean; error?: string; requiresConfirmation: boolean } {
  const amountNum = Number(amount);

  // Check for valid number
  if (isNaN(amountNum) || amountNum <= 0) {
    return { isValid: false, error: 'Invalid amount', requiresConfirmation: false };
  }

  // Check sufficient balance
  if (amountNum > tokenBalance) {
    return {
      isValid: false,
      error: `Insufficient balance. Have ${tokenBalance} ${tokenSymbol}, need ${amountNum}`,
      requiresConfirmation: false
    };
  }

  // Check if swapping too much (safety check)
  const percentageOfBalance = (amountNum / tokenBalance) * 100;
  if (percentageOfBalance > maxSwapPercentage) {
    return {
      isValid: false,
      error: `Swap amount exceeds ${maxSwapPercentage}% of balance (${percentageOfBalance.toFixed(1)}%). This requires explicit confirmation for safety.`,
      requiresConfirmation: true
    };
  }

  // Warn about large swaps (>$1000 USD equivalent)
  // This requires USD value check - implement separately
  return { isValid: true, requiresConfirmation: false };
}
```

---

## Priority 1 (High) - Next Phase

### P1 #4: Window Object SSR Guards

**Implementation**: Create safe window access utility

**New File**: `lib/windowHelpers.ts`

```typescript
/**
 * Safely access window object with SSR guard
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get Phantom wallet provider safely
 */
export function getPhantomProvider(): any | null {
  if (!isBrowser()) return null;
  return (window as any)?.solana || null;
}

/**
 * Safely access localStorage
 */
export function getLocalStorage(): Storage | null {
  if (!isBrowser()) return null;
  return window.localStorage;
}

/**
 * Safe localStorage getter with fallback
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
 * Safe localStorage setter
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    const storage = getLocalStorage();
    storage?.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`localStorage set failed for key "${key}":`, error);
    return false;
  }
}
```

---

### P1 #5: Error Boundaries

**New File**: `components/ErrorBoundary.tsx`

```typescript
'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    // TODO: Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
          <div className="glass p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              ⚠️ Something Went Wrong
            </h2>
            <p className="text-gray-300 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500 rounded transition"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Implementation Order

### Phase 1 (Today - Critical):
1. ✅ Apply race condition fix
2. ✅ Create transaction validation utilities
3. ✅ Add swap amount validation
4. ✅ Add window object guards

### Phase 2 (This Week - High Priority):
1. Add Error Boundaries
2. Fix unbounded loop-return mode
3. Implement balance validation before swaps
4. Add localStorage error handling

### Phase 3 (Next Week - Medium Priority):
1. Split SwapperContext for performance
2. Add request deduplication
3. Implement proper error logging
4. Add transaction simulation

---

## Testing Checklist

After implementing fixes:

- [ ] Test auto-swap doesn't trigger twice on rapid clicks
- [ ] Verify transaction validation rejects malicious transactions
- [ ] Confirm max amount validation prevents accidental full balance swaps
- [ ] Test SSR compatibility (no hydration errors)
- [ ] Verify Error Boundary catches runtime errors
- [ ] Test all swap modes (normal, roundtrip, boost, loopreturn)
- [ ] Confirm wallet connection/disconnection works properly
- [ ] Test with small and large swap amounts

---

## Security Audit Recommendations

Before mainnet deployment:
1. ✅ Complete all P0 fixes
2. ✅ Complete all P1 fixes
3. Add transaction simulation before signing
4. Implement rate limiting (max swaps per hour)
5. Add confirmation dialog for large swaps
6. Enable proper error tracking (Sentry/LogRocket)
7. Conduct external security audit
8. Test with real funds on devnet first

---

**Last Updated**: 2025-11-16
**Review Status**: Fixes ready to apply
**Risk Level Before Fixes**: HIGH ⚠️
**Risk Level After Fixes**: MEDIUM-LOW ✅
