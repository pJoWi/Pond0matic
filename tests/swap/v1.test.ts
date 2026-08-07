import { describe, it, expect } from "vitest";
import { buildV1QuoteUrl, buildV1SwapBody, parseV1Quote, parseV1SwapResponse, JUP_V1_QUOTE } from "@/lib/swap/v1";

describe("v1 quote url", () => {
  it("encodes all params including platformFeeBps", () => {
    const url = buildV1QuoteUrl({ inputMint: "IN", outputMint: "OUT", amountRaw: "1000", slippageBps: 50, platformFeeBps: 100 });
    expect(url.startsWith(JUP_V1_QUOTE)).toBe(true);
    expect(url).toContain("inputMint=IN");
    expect(url).toContain("outputMint=OUT");
    expect(url).toContain("amount=1000");
    expect(url).toContain("slippageBps=50");
    expect(url).toContain("platformFeeBps=100");
  });
});

describe("v1 swap body fee precedence", () => {
  const quote = { outAmount: "5" };
  it("routes fee to the vault when no referral", () => {
    const body = buildV1SwapBody({ quoteResponse: quote, userPublicKey: "PK", vaultAddress: "VAULT" });
    expect(body.feeAccount).toBe("VAULT");
    expect(body.userPublicKey).toBe("PK");
  });
  it("prefers the referral address over the vault", () => {
    const body = buildV1SwapBody({ quoteResponse: quote, userPublicKey: "PK", referralAddress: "REF", vaultAddress: "VAULT" });
    expect(body.feeAccount).toBe("REF");
  });
  it("omits feeAccount when neither is set", () => {
    const body = buildV1SwapBody({ quoteResponse: quote, userPublicKey: "PK" });
    expect(body.feeAccount).toBeUndefined();
  });
});

describe("v1 parsers", () => {
  it("parses a quote", () => {
    expect(parseV1Quote({ outAmount: "42", inAmount: "1000" }).outAmount).toBe("42");
  });
  it("parses a swap response", () => {
    expect(parseV1SwapResponse({ swapTransaction: "b64tx" }).swapTransaction).toBe("b64tx");
  });
  it("rejects a swap response missing the transaction", () => {
    expect(() => parseV1SwapResponse({})).toThrow();
  });
});
