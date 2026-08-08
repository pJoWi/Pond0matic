import { describe, expect, it } from "vitest";
import {
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  checkRateLimit,
  emptyRateLimitState,
  type RateLimitState,
} from "@/lib/geoff/rateLimit";

/** Drive n requests through the limiter from a given state/clock. */
function run(
  state: RateLimitState,
  times: number,
  now: number,
  max = RATE_LIMIT_MAX
) {
  let current = state;
  const decisions = [];
  for (let i = 0; i < times; i++) {
    const decision = checkRateLimit(current, now, max);
    current = decision.state;
    decisions.push(decision);
  }
  return { state: current, decisions };
}

describe("checkRateLimit", () => {
  it("allows the first request and opens a window", () => {
    const decision = checkRateLimit(emptyRateLimitState(), 1_000);
    expect(decision.allowed).toBe(true);
    expect(decision.state).toEqual({ windowStart: 1_000, count: 1 });
  });

  it("allows exactly max requests per window, then blocks", () => {
    const { decisions, state } = run(
      emptyRateLimitState(),
      RATE_LIMIT_MAX + 3,
      5_000
    );
    expect(decisions.slice(0, RATE_LIMIT_MAX).every((d) => d.allowed)).toBe(true);
    expect(decisions.slice(RATE_LIMIT_MAX).every((d) => !d.allowed)).toBe(true);
    // Blocked calls must not inflate the counter — otherwise a hammering
    // client would keep pushing the window's count up forever.
    expect(state.count).toBe(RATE_LIMIT_MAX);
  });

  it("reports seconds until the window resets", () => {
    const { state } = run(emptyRateLimitState(), RATE_LIMIT_MAX, 0);
    const blocked = checkRateLimit(state, 20_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(
      Math.ceil((RATE_LIMIT_WINDOW_MS - 20_000) / 1000)
    );
  });

  it("never reports a zero retry-after while blocked", () => {
    const { state } = run(emptyRateLimitState(), RATE_LIMIT_MAX, 0);
    const blocked = checkRateLimit(state, RATE_LIMIT_WINDOW_MS - 1);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it("starts a fresh window once the old one expires", () => {
    const { state } = run(emptyRateLimitState(), RATE_LIMIT_MAX, 0);
    const next = checkRateLimit(state, RATE_LIMIT_WINDOW_MS);
    expect(next.allowed).toBe(true);
    expect(next.state).toEqual({ windowStart: RATE_LIMIT_WINDOW_MS, count: 1 });
  });

  it("honours a custom max", () => {
    const { decisions } = run(emptyRateLimitState(), 3, 0, 2);
    expect(decisions.map((d) => d.allowed)).toEqual([true, true, false]);
  });
});
