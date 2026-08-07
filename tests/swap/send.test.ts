import { describe, it, expect } from "vitest";
import { sendAndConfirm } from "@/lib/swap/send";

const noSleep = async () => {};
function conn(statuses: Array<{ confirmationStatus?: string; err: unknown } | null>) {
  let i = 0;
  return {
    sent: [] as Uint8Array[],
    async sendRawTransaction(raw: Uint8Array) { this.sent.push(raw); return "SIG123"; },
    async getSignatureStatuses() { return { value: [statuses[Math.min(i++, statuses.length - 1)]] }; },
  };
}

describe("sendAndConfirm", () => {
  it("returns the signature once confirmed", async () => {
    const c = conn([null, { confirmationStatus: "confirmed", err: null }]);
    const { signature } = await sendAndConfirm(c, new Uint8Array([1]), { pollMs: 0, timeoutMs: 1000, sleep: noSleep });
    expect(signature).toBe("SIG123");
    expect(c.sent.length).toBe(1);
  });

  it("throws when the transaction lands with an error", async () => {
    const c = conn([{ confirmationStatus: "confirmed", err: { InstructionError: [0, "Custom"] } }]);
    await expect(sendAndConfirm(c, new Uint8Array([1]), { pollMs: 0, timeoutMs: 1000, sleep: noSleep })).rejects.toThrow();
  });

  it("throws on confirmation timeout", async () => {
    const c = conn([null]);
    await expect(sendAndConfirm(c, new Uint8Array([1]), { pollMs: 0, timeoutMs: 0, sleep: noSleep })).rejects.toThrow(/timeout|not confirmed/i);
  });
});
