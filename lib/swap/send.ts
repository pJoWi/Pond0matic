/**
 * Self-managed submit + confirm for a signed swap transaction. Replaces the
 * Jupiter v2 /execute step (v1 /swap only returns an unsigned tx). Sends the
 * raw tx, then polls signature status to a "confirmed" commitment, throwing on
 * an on-chain error or a confirmation timeout.
 */
export interface SendConfirmConnection {
  sendRawTransaction(raw: Uint8Array, opts?: unknown): Promise<string>;
  getSignatureStatuses(
    sigs: string[]
  ): Promise<{ value: Array<{ confirmationStatus?: string; err: unknown } | null> }>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function sendAndConfirm(
  connection: SendConfirmConnection,
  rawTx: Uint8Array,
  opts: { timeoutMs?: number; pollMs?: number; sleep?: (ms: number) => Promise<void> } = {}
): Promise<{ signature: string }> {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const pollMs = opts.pollMs ?? 2_000;
  const sleep = opts.sleep ?? defaultSleep;

  const signature = await connection.sendRawTransaction(rawTx, { skipPreflight: false, maxRetries: 3 });

  const deadline = Date.now() + timeoutMs;
  // Poll at least once even when timeoutMs is 0.
  do {
    const { value } = await connection.getSignatureStatuses([signature]);
    const status = value[0];
    if (status) {
      if (status.err) {
        throw new Error(`Swap transaction failed on-chain: ${JSON.stringify(status.err)}`);
      }
      if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") {
        return { signature };
      }
    }
    if (Date.now() >= deadline) break;
    await sleep(pollMs);
  } while (Date.now() < deadline);

  throw new Error(`Swap not confirmed within ${timeoutMs}ms (signature ${signature})`);
}
