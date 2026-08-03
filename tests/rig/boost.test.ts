import { describe, it, expect } from "vitest";
import { boostProjection, MAX_BOOST, SWAP_BOOST, SESSION_COST } from "@/lib/rig/boost";

describe("boostProjection", () => {
  it("projects from a live boost (matches the tracker mockup)", () => {
    const p = boostProjection(174.6, 54);
    expect(p.pctToMax).toBeCloseTo(28.39, 1);        // 174.6 / 615
    expect(p.swapsToMax).toBe(2643);                  // ceil((615-174.6)/(1/6))
    expect(p.sessionBoostAdded).toBeCloseTo(9, 5);    // 54 * 1/6
    expect(p.sessionsBuffer).toBe(58);                // floor(174.6 / 3)
  });
  it("clamps at max: no swaps needed, 100%", () => {
    const p = boostProjection(700, 0);
    expect(p.pctToMax).toBe(100);
    expect(p.swapsToMax).toBe(0);
  });
  it("floors at zero and ignores negative session swaps", () => {
    const p = boostProjection(0, -10);
    expect(p.pctToMax).toBe(0);
    expect(p.swapsToMax).toBe(MAX_BOOST / SWAP_BOOST);
    expect(p.sessionBoostAdded).toBe(0);
    expect(p.sessionsBuffer).toBe(0);
  });
  it("exposes the economy constants", () => {
    expect(MAX_BOOST).toBe(615);
    expect(SWAP_BOOST).toBeCloseTo(1 / 6, 10);
    expect(SESSION_COST).toBe(3);
  });
});
