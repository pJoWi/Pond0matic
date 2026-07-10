import { describe, expect, it } from "vitest";
import { summarizeTransaction, RawTransaction } from "@/tools/core/solana";
import { formatSol, formatTxSummary, lamportsToSol } from "@/tools/core/format";
import { labelForMint, resolveMint } from "@/tools/core/tokens";
import { assertBase58 } from "@/tools/core/pond0x";

const WPOND = "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function makeTx(overrides: Partial<RawTransaction["meta"] & object> = {}): RawTransaction {
  return {
    slot: 1000,
    blockTime: 1750000000,
    meta: {
      err: null,
      fee: 5000,
      preTokenBalances: [],
      postTokenBalances: [],
      ...overrides,
    },
    transaction: {
      message: {
        accountKeys: [{ pubkey: "abc", signer: true }],
        instructions: [
          { programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4" },
          { programId: "ComputeBudget111111111111111111111111111111" },
        ],
      },
    },
  };
}

describe("summarizeTransaction", () => {
  it("labels known programs and dedupes them", () => {
    const s = summarizeTransaction("sig1", makeTx());
    expect(s.programs).toEqual(["Jupiter Aggregator v6", "Compute Budget"]);
    expect(s.succeeded).toBe(true);
    expect(s.feeLamports).toBe(5000);
  });

  it("computes token deltas from pre/post balances", () => {
    const s = summarizeTransaction(
      "sig2",
      makeTx({
        preTokenBalances: [
          { accountIndex: 1, mint: USDC, owner: "me", uiTokenAmount: { uiAmount: 10, decimals: 6 } },
        ],
        postTokenBalances: [
          { accountIndex: 1, mint: USDC, owner: "me", uiTokenAmount: { uiAmount: 4, decimals: 6 } },
          { accountIndex: 2, mint: WPOND, owner: "me", uiTokenAmount: { uiAmount: 100, decimals: 3 } },
        ],
      }),
    );
    expect(s.tokenDeltas).toContainEqual({ mint: USDC, owner: "me", delta: -6 });
    expect(s.tokenDeltas).toContainEqual({ mint: WPOND, owner: "me", delta: 100 });
  });

  it("counts a closed token account as a full outflow", () => {
    const s = summarizeTransaction(
      "sig3",
      makeTx({
        preTokenBalances: [
          { accountIndex: 1, mint: USDC, owner: "me", uiTokenAmount: { uiAmount: 7, decimals: 6 } },
        ],
        postTokenBalances: [],
      }),
    );
    expect(s.tokenDeltas).toEqual([{ mint: USDC, owner: "me", delta: -7 }]);
  });

  it("marks failed transactions", () => {
    const s = summarizeTransaction("sig4", makeTx({ err: { InstructionError: [0, "Custom"] } }));
    expect(s.succeeded).toBe(false);
  });
});

describe("format helpers", () => {
  it("converts lamports to SOL", () => {
    expect(lamportsToSol(1_000_000_000)).toBe(1);
    expect(formatSol(5000)).toBe("0.000005 SOL");
  });

  it("renders a readable summary", () => {
    const out = formatTxSummary(summarizeTransaction("sig", makeTx()));
    expect(out).toContain("status    : success");
    expect(out).toContain("Jupiter Aggregator v6");
  });
});

describe("tokens", () => {
  it("resolves symbols case-insensitively and passes mints through", () => {
    expect(resolveMint("wpond")).toBe(WPOND);
    expect(resolveMint(USDC)).toBe(USDC);
  });

  it("labels unknown mints with a shortened form", () => {
    expect(labelForMint(USDC)).toBe("USDC");
    expect(labelForMint("Fs9GkAtXRwADRtqtUjSufyYXcQjLgWvNbvijQdn6pump")).toBe("Fs9G…pump");
  });
});

describe("assertBase58", () => {
  it("accepts valid pubkeys", () => {
    expect(() => assertBase58(WPOND)).not.toThrow();
  });
  it("rejects URL-breaking input", () => {
    expect(() => assertBase58("../../etc/passwd")).toThrow();
    expect(() => assertBase58("0x44a1")).toThrow();
  });
});
