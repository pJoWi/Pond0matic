import { describe, it, expect } from "vitest";
import { clampToStep, bpsToPct } from "@/lib/ui/slider";

describe("clampToStep", () => {
  it("clamps below min and above max", () => {
    expect(clampToStep(5, 10, 300, 10)).toBe(10);
    expect(clampToStep(999, 10, 300, 10)).toBe(300);
  });
  it("snaps to the nearest step within range", () => {
    expect(clampToStep(53, 10, 300, 10)).toBe(50);
    expect(clampToStep(57, 10, 300, 10)).toBe(60);
  });
});

describe("bpsToPct", () => {
  it("formats bps as a percent string", () => {
    expect(bpsToPct(100)).toBe("1.00");
    expect(bpsToPct(50)).toBe("0.50");
    expect(bpsToPct(10)).toBe("0.10");
    expect(bpsToPct(255)).toBe("2.55");
  });
});
