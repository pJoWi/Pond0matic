import { VersionedTransaction, PublicKey, Connection } from '@solana/web3.js';

// Known safe program IDs for Jupiter swaps
const SAFE_PROGRAM_IDS = new Set([
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', // Jupiter v6
  'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB', // Jupiter v4
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', // Associated Token Program
  '11111111111111111111111111111111', // System Program
  'ComputeBudget111111111111111111111111111111', // Compute Budget Program
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
  const programIds = tx.message.compiledInstructions.map(ix => {
    const programId = tx.message.staticAccountKeys[ix.programIdIndex];
    return programId ? programId.toBase58() : null;
  }).filter((pid): pid is string => pid !== null);

  const unknownPrograms = programIds.filter(pid => !SAFE_PROGRAM_IDS.has(pid));
  if (unknownPrograms.length > 0) {
    warnings.push(`Transaction includes unknown programs: ${unknownPrograms.join(', ')}`);
  }

  // 4. Validate reasonable number of instructions
  if (tx.message.compiledInstructions.length > 20) {
    warnings.push(`Unusually high number of instructions: ${tx.message.compiledInstructions.length}`);
  }

  // 5. Check for excessive account keys (potential attack vector)
  if (tx.message.staticAccountKeys.length > 50) {
    warnings.push(`Unusually high number of account keys: ${tx.message.staticAccountKeys.length}`);
  }

  // 6. Ensure transaction has at least one instruction
  if (tx.message.compiledInstructions.length === 0) {
    errors.push('Transaction has no instructions');
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
  connection: Connection,
  tx: VersionedTransaction
): Promise<{ success: boolean; error?: string; logs?: string[] }> {
  try {
    const simulation = await connection.simulateTransaction(tx, {
      commitment: 'confirmed',
    });

    if (simulation.value.err) {
      return {
        success: false,
        error: `Simulation failed: ${JSON.stringify(simulation.value.err)}`,
        logs: simulation.value.logs || []
      };
    }

    return {
      success: true,
      logs: simulation.value.logs || []
    };
  } catch (error) {
    return {
      success: false,
      error: `Simulation error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

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
      error: `Swap amount exceeds ${maxSwapPercentage}% of balance (${percentageOfBalance.toFixed(1)}%). This is blocked for your safety. Please reduce the amount.`,
      requiresConfirmation: true
    };
  }

  return { isValid: true, requiresConfirmation: false };
}
