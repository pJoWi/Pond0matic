import { describe, it, expect } from "vitest";
import {
  buildOrderUrl,
  buildExecuteBody,
  jupiterHeaders,
  jupiterErrorMessage,
  clampReferralFeeBps,
  parseOrder,
  parseExecuteResponse,
  bytesToBase64,
  selectFeeAccount,
  feeAccountForOrder,
  JUP_ORDER,
  SOL_MINT,
  USDC_MINT,
} from "@/lib/swap/orders";

const orderFixture = {
  requestId: "req-123",
  transaction: "AQIDBA==",
  inAmount: "10000000",
  outAmount: "1500000",
  mode: "manual",
  router: "metis",
  swapType: "aggregator",
};

describe("buildOrderUrl", () => {
  it("encodes required params on the order endpoint", () => {
    const url = new URL(
      buildOrderUrl({ inputMint: SOL_MINT, outputMint: USDC_MINT, amountRaw: "12345" })
    );
    expect(url.origin + url.pathname).toBe(JUP_ORDER);
    expect(url.searchParams.get("inputMint")).toBe(SOL_MINT);
    expect(url.searchParams.get("outputMint")).toBe(USDC_MINT);
    expect(url.searchParams.get("amount")).toBe("12345");
    // price-only order: no taker, no fee params
    expect(url.searchParams.get("taker")).toBeNull();
    expect(url.searchParams.get("referralAccount")).toBeNull();
  });
  it("includes taker, referral and slippage params when provided", () => {
    const url = new URL(
      buildOrderUrl({
        inputMint: USDC_MINT,
        outputMint: SOL_MINT,
        amountRaw: "1000",
        taker: "Wallet1111111111111111111111111111111111111",
        referralAccount: "Vault111111111111111111111111111111111111111",
        referralFee: 100,
        slippageBps: 50,
      })
    );
    expect(url.searchParams.get("taker")).toBe("Wallet1111111111111111111111111111111111111");
    expect(url.searchParams.get("referralAccount")).toBe("Vault111111111111111111111111111111111111111");
    expect(url.searchParams.get("referralFee")).toBe("100");
    expect(url.searchParams.get("slippageBps")).toBe("50");
  });
});

describe("clampReferralFeeBps", () => {
  it("clamps into Jupiter's 50-255 range", () => {
    expect(clampReferralFeeBps(100)).toBe(100);
    expect(clampReferralFeeBps(10)).toBe(50);
    expect(clampReferralFeeBps(0)).toBe(50);
    expect(clampReferralFeeBps(9999)).toBe(255);
  });
});

describe("jupiterHeaders", () => {
  it("sets x-api-key when provided", () => {
    expect(jupiterHeaders("secret")).toEqual({ "x-api-key": "secret" });
    expect(jupiterHeaders("")).toEqual({});
  });
  it("adds content-type for JSON requests", () => {
    expect(jupiterHeaders("secret", true)).toEqual({
      "x-api-key": "secret",
      "content-type": "application/json",
    });
  });
});

describe("jupiterErrorMessage", () => {
  it("maps known statuses", () => {
    expect(jupiterErrorMessage(429)).toMatch(/rate limit/i);
    expect(jupiterErrorMessage(401)).toMatch(/api key/i);
    expect(jupiterErrorMessage(403)).toMatch(/api key/i);
    expect(jupiterErrorMessage(500)).toMatch(/500/);
  });
});

describe("parseOrder", () => {
  it("accepts a valid order and keeps unknown fields", () => {
    const o = parseOrder(orderFixture);
    expect(o.requestId).toBe("req-123");
    expect(o.transaction).toBe("AQIDBA==");
    expect(o.outAmount).toBe("1500000");
    expect((o as any).swapType).toBe("aggregator"); // loose passthrough
  });
  it("accepts a price-only order (transaction null) and a failed build (empty string)", () => {
    expect(parseOrder({ ...orderFixture, transaction: null }).transaction).toBeNull();
    const failed = parseOrder({
      ...orderFixture,
      transaction: "",
      errorCode: 1001,
      errorMessage: "no route",
    });
    expect(failed.transaction).toBe("");
    expect(failed.errorCode).toBe(1001);
  });
  it("rejects a response missing requestId or outAmount", () => {
    const { requestId: _r, ...noId } = orderFixture;
    expect(() => parseOrder(noId)).toThrow();
    const { outAmount: _o, ...noOut } = orderFixture;
    expect(() => parseOrder(noOut)).toThrow();
  });
  it("rejects non-object input", () => {
    expect(() => parseOrder("<html>rate limited</html>")).toThrow();
  });
});

describe("buildExecuteBody / parseExecuteResponse", () => {
  it("builds the execute body", () => {
    expect(JSON.parse(buildExecuteBody("c2lnbmVk", "req-123"))).toEqual({
      signedTransaction: "c2lnbmVk",
      requestId: "req-123",
    });
  });
  it("parses success and failure results", () => {
    const ok = parseExecuteResponse({
      status: "Success",
      signature: "5sig",
      code: 0,
      totalInputAmount: "1000",
      totalOutputAmount: "990",
    });
    expect(ok.status).toBe("Success");
    expect(ok.signature).toBe("5sig");
    const fail = parseExecuteResponse({ status: "Failed", code: -1, signature: "5sig" });
    expect(fail.status).toBe("Failed");
    expect(fail.code).toBe(-1);
  });
  it("rejects an unknown status", () => {
    expect(() => parseExecuteResponse({ status: "Maybe" })).toThrow();
  });
});

describe("bytesToBase64", () => {
  it("round-trips bytes to base64", () => {
    expect(bytesToBase64(new Uint8Array([1, 2, 3, 4]))).toBe("AQIDBA==");
    expect(bytesToBase64(new Uint8Array([]))).toBe("");
  });
});

describe("selectFeeAccount", () => {
  const vaults = { MintA: "VaultA" };
  it("referral address wins over vault", () => {
    expect(selectFeeAccount("Referral1", vaults, "MintA")).toBe("Referral1");
  });
  it("falls back to the vault for the input mint", () => {
    expect(selectFeeAccount(undefined, vaults, "MintA")).toBe("VaultA");
  });
  it("returns undefined when neither exists (no fee params on order)", () => {
    expect(selectFeeAccount(undefined, vaults, "MintB")).toBeUndefined();
    expect(selectFeeAccount("", vaults, "MintB")).toBeUndefined();
  });
});

describe("feeAccountForOrder", () => {
  const vaults = { MintA: "VaultA" };
  it("omits the fee account when the configured fee is 0 (true 0%, no vault charge)", () => {
    // Jupiter v2 floors sub-50-bps referral fees, so 0 must drop the account
    // entirely — otherwise a configured 0 would silently become 0.5%.
    expect(feeAccountForOrder(0, undefined, vaults, "MintA")).toBeUndefined();
    expect(feeAccountForOrder(0, "Referral1", vaults, "MintA")).toBeUndefined();
    expect(feeAccountForOrder(-5, "Referral1", vaults, "MintA")).toBeUndefined();
  });
  it("preserves referral > vault > none precedence when a fee is configured", () => {
    expect(feeAccountForOrder(100, "Referral1", vaults, "MintA")).toBe("Referral1");
    expect(feeAccountForOrder(100, undefined, vaults, "MintA")).toBe("VaultA");
    expect(feeAccountForOrder(100, undefined, vaults, "MintB")).toBeUndefined();
  });
  it("still returns an account for a sub-50 fee (floored to 50 bps by clamp downstream)", () => {
    expect(feeAccountForOrder(25, undefined, vaults, "MintA")).toBe("VaultA");
  });
});
