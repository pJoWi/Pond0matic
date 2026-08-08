/**
 * Pure fixed-window rate limiter for the Geoff route.
 *
 * Every insight costs Geoff tokens, and /api/geoff/insight is unauthenticated
 * like the rest of the proxy routes — so a stuck client or a second tab left
 * hammering Refresh can quietly burn a plan's quota. This caps the burn.
 *
 * Data in → decision out; the caller owns the state object and the clock, so
 * it is deterministic and testable. Single-process in-memory only: this is a
 * cost guard for a local/single-instance dashboard, not a security boundary.
 */
export const RATE_LIMIT_MAX = 10;
export const RATE_LIMIT_WINDOW_MS = 60_000;

export interface RateLimitState {
  windowStart: number;
  count: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  state: RateLimitState;
  /** Seconds until the window resets; 0 when allowed. */
  retryAfterSeconds: number;
}

export function emptyRateLimitState(): RateLimitState {
  return { windowStart: 0, count: 0 };
}

export function checkRateLimit(
  state: RateLimitState,
  now: number,
  max: number = RATE_LIMIT_MAX,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): RateLimitDecision {
  // New window: either no window is open (count 0 — the initial state, whose
  // windowStart of 0 is not a real timestamp) or the previous one expired.
  if (state.count === 0 || now - state.windowStart >= windowMs) {
    return {
      allowed: true,
      state: { windowStart: now, count: 1 },
      retryAfterSeconds: 0,
    };
  }

  if (state.count >= max) {
    const remainingMs = state.windowStart + windowMs - now;
    return {
      allowed: false,
      state,
      retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
    };
  }

  return {
    allowed: true,
    state: { windowStart: state.windowStart, count: state.count + 1 },
    retryAfterSeconds: 0,
  };
}
