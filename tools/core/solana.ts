/**
 * Read-only Solana queries built on the raw JSON-RPC client.
 * This module never signs or sends transactions.
 */
import { rpcCall } from "./rpc";

export const LAMPORTS_PER_SOL = 1_000_000_000;
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

/** Well-known program IDs for labeling transaction summaries. */
export const KNOWN_PROGRAMS: Record<string, string> = {
  "11111111111111111111111111111111": "System Program",
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: "SPL Token",
  ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL: "Associated Token Account",
  ComputeBudget111111111111111111111111111111: "Compute Budget",
  JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4: "Jupiter Aggregator v6",
  jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNu: "Jupiter Limit Order",
  REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3: "Jupiter Referral",
};

export async function getBalance(pubkey: string): Promise<number> {
  const res = await rpcCall<{ value: number }>("getBalance", [pubkey]);
  return res.value;
}

export interface TokenHolding {
  mint: string;
  uiAmount: number;
  decimals: number;
  /** Non-null delegate = someone else can move these tokens. Audit-critical. */
  delegate: string | null;
  delegatedUiAmount: number | null;
  tokenAccount: string;
}

export async function getTokenHoldings(owner: string): Promise<TokenHolding[]> {
  const res = await rpcCall<{
    value: Array<{
      pubkey: string;
      account: {
        data: {
          parsed: {
            info: {
              mint: string;
              delegate?: string;
              delegatedAmount?: { uiAmount: number };
              tokenAmount: { uiAmount: number; decimals: number };
            };
          };
        };
      };
    }>;
  }>("getTokenAccountsByOwner", [
    owner,
    { programId: TOKEN_PROGRAM_ID },
    { encoding: "jsonParsed" },
  ]);

  return res.value.map(({ pubkey, account }) => {
    const info = account.data.parsed.info;
    return {
      mint: info.mint,
      uiAmount: info.tokenAmount.uiAmount ?? 0,
      decimals: info.tokenAmount.decimals,
      delegate: info.delegate ?? null,
      delegatedUiAmount: info.delegatedAmount?.uiAmount ?? null,
      tokenAccount: pubkey,
    };
  });
}

export interface SignatureInfo {
  signature: string;
  slot: number;
  blockTime: number | null;
  err: unknown;
}

export async function getSignatures(
  address: string,
  limit = 20,
): Promise<SignatureInfo[]> {
  return rpcCall<SignatureInfo[]>("getSignaturesForAddress", [
    address,
    { limit },
  ]);
}

interface RawTokenBalance {
  accountIndex: number;
  mint: string;
  owner?: string;
  uiTokenAmount: { uiAmount: number | null; decimals: number };
}

export interface RawTransaction {
  slot: number;
  blockTime: number | null;
  meta: {
    err: unknown;
    fee: number;
    preTokenBalances?: RawTokenBalance[];
    postTokenBalances?: RawTokenBalance[];
    logMessages?: string[];
  } | null;
  transaction: {
    message: {
      accountKeys: Array<{ pubkey: string; signer: boolean }>;
      instructions: Array<{ programId: string }>;
    };
  };
}

export async function getTransaction(signature: string): Promise<RawTransaction | null> {
  return rpcCall<RawTransaction | null>("getTransaction", [
    signature,
    { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
  ]);
}

export interface TokenDelta {
  mint: string;
  owner: string | undefined;
  delta: number;
}

export interface TxSummary {
  signature: string;
  slot: number;
  blockTime: number | null;
  feeLamports: number;
  succeeded: boolean;
  programs: string[];
  tokenDeltas: TokenDelta[];
}

/**
 * Pure function: condense a raw parsed transaction into what a human wants
 * to know — which programs ran, what tokens moved, what it cost.
 */
export function summarizeTransaction(
  signature: string,
  tx: RawTransaction,
): TxSummary {
  const programs = [
    ...new Set(
      tx.transaction.message.instructions.map(
        (ix) => KNOWN_PROGRAMS[ix.programId] ?? ix.programId,
      ),
    ),
  ];

  const pre = tx.meta?.preTokenBalances ?? [];
  const post = tx.meta?.postTokenBalances ?? [];
  const keyOf = (b: RawTokenBalance) => `${b.accountIndex}:${b.mint}`;
  const preMap = new Map(pre.map((b) => [keyOf(b), b]));

  const tokenDeltas: TokenDelta[] = [];
  for (const p of post) {
    const before = preMap.get(keyOf(p))?.uiTokenAmount.uiAmount ?? 0;
    const after = p.uiTokenAmount.uiAmount ?? 0;
    const delta = after - before;
    if (delta !== 0) tokenDeltas.push({ mint: p.mint, owner: p.owner, delta });
  }
  for (const b of pre) {
    if (!post.some((p) => keyOf(p) === keyOf(b))) {
      const before = b.uiTokenAmount.uiAmount ?? 0;
      if (before !== 0)
        tokenDeltas.push({ mint: b.mint, owner: b.owner, delta: -before });
    }
  }

  return {
    signature,
    slot: tx.slot,
    blockTime: tx.blockTime,
    feeLamports: tx.meta?.fee ?? 0,
    succeeded: tx.meta?.err == null,
    programs,
    tokenDeltas,
  };
}
