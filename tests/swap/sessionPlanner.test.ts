import { describe, it, expect } from "vitest";
import {
  planRound,
  hasNextRound,
  totalRounds,
  randomAmount,
  type SessionConfig,
} from "@/lib/swap/sessionPlanner";

const base: SessionConfig = {
  mode: "normal",
  amount: "0.01",
  maxAmount: "0.02",
  loopReturnAmount: "",
  swapsPerRound: 3,
  numberOfRounds: 2,
  numberOfSwaps: 2,
  swapDelayMs: 6000,
  autoDelayMs: 3000,
};
const rngLow = () => 0; // always picks min
const rngHigh = () => 0.9999999;

describe("randomAmount", () => {
  it("stays within [min, max]", () => {
    expect(Number(randomAmount(0.01, 0.02, rngLow))).toBeCloseTo(0.01, 10);
    expect(Number(randomAmount(0.01, 0.02, rngHigh))).toBeLessThanOrEqual(0.02);
    expect(Number(randomAmount(0.01, 0.02, rngHigh))).toBeGreaterThan(0.019);
  });
  it("clamps negative min to 0 and treats max<=min as min (legacy parity)", () => {
    expect(Number(randomAmount(-5, 0, rngLow))).toBe(0);
    expect(Number(randomAmount(0.05, 0, rngHigh))).toBeCloseTo(0.05, 6);
  });
});

describe("totalRounds / hasNextRound", () => {
  it("normal is always exactly 1 round", () => {
    const cfg = { ...base, mode: "normal" as const };
    expect(totalRounds(cfg)).toBe(1);
    expect(hasNextRound(0, cfg)).toBe(true);
    expect(hasNextRound(1, cfg)).toBe(false);
  });
  it("boost uses numberOfRounds, 0 = infinite", () => {
    expect(totalRounds({ ...base, mode: "boost" })).toBe(2);
    expect(totalRounds({ ...base, mode: "boost", numberOfRounds: 0 })).toBe(Infinity);
    expect(hasNextRound(999999, { ...base, mode: "boost", numberOfRounds: 0 })).toBe(true);
  });
  it("rewards uses numberOfSwaps, 0 = infinite", () => {
    expect(totalRounds({ ...base, mode: "rewards" })).toBe(2);
    expect(totalRounds({ ...base, mode: "rewards", numberOfSwaps: 0 })).toBe(Infinity);
  });
});

describe("planRound — normal", () => {
  it("is a single forward swap, nothing else", () => {
    const steps = planRound({ ...base, mode: "normal" }, 1, rngLow);
    expect(steps).toEqual([
      { kind: "swap", amountUi: "0.01", swapInRound: 1, swapsInRound: 1 },
    ]);
  });
});

describe("planRound — boost", () => {
  it("emits N swaps with delays between (not after last), then return-swap", () => {
    const steps = planRound({ ...base, mode: "boost", numberOfRounds: 1 }, 1, rngLow);
    const kinds = steps.map((s) => s.kind);
    expect(kinds).toEqual(["swap", "delay", "swap", "delay", "swap", "return-swap"]);
    expect(steps.filter((s) => s.kind === "delay").every((s: any) => s.ms === 6000)).toBe(true);
  });
  it("randomizes each swap amount within [amount, maxAmount]", () => {
    let call = 0;
    const rngSeq = () => [0, 0.5, 1][call++ % 3] * 0.9999;
    const steps = planRound({ ...base, mode: "boost", numberOfRounds: 1 }, 1, rngSeq);
    const amounts = steps.filter((s) => s.kind === "swap").map((s: any) => Number(s.amountUi));
    for (const a of amounts) {
      expect(a).toBeGreaterThanOrEqual(0.01);
      expect(a).toBeLessThanOrEqual(0.02);
    }
  });
  it("passes manual loopReturnAmount through, null when empty", () => {
    const manual = planRound({ ...base, mode: "boost", loopReturnAmount: "1.5" }, 2, rngLow)
      .find((s) => s.kind === "return-swap") as any;
    expect(manual.manualAmountUi).toBe("1.5");
    const auto = planRound({ ...base, mode: "boost" }, 2, rngLow)
      .find((s) => s.kind === "return-swap") as any;
    expect(auto.manualAmountUi).toBeNull();
  });
  it("appends round delay only when another round follows", () => {
    const withNext = planRound({ ...base, mode: "boost" }, 1, rngLow); // round 1 of 2
    expect(withNext[withNext.length - 1]).toEqual({ kind: "delay", ms: 3000 });
    const last = planRound({ ...base, mode: "boost" }, 2, rngLow); // round 2 of 2
    expect(last[last.length - 1].kind).toBe("return-swap");
  });
  it("clamps swapsPerRound to at least 1", () => {
    const steps = planRound({ ...base, mode: "boost", swapsPerRound: 0, numberOfRounds: 1 }, 1, rngLow);
    expect(steps.filter((s) => s.kind === "swap")).toHaveLength(1);
  });
});

describe("planRound — rewards", () => {
  it("is forward swap, delay, return-swap (+ round delay when more rounds follow)", () => {
    const steps = planRound({ ...base, mode: "rewards" }, 1, rngLow); // round 1 of 2
    expect(steps.map((s) => s.kind)).toEqual(["swap", "delay", "return-swap", "delay"]);
    expect((steps[0] as any).amountUi).toBe("0.01"); // fixed, not randomized
    expect((steps[1] as any).ms).toBe(6000);
    expect((steps[3] as any).ms).toBe(3000);
    expect((steps[2] as any).manualAmountUi).toBeNull(); // rewards always accumulated
  });
});
