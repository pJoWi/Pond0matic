/**
 * Pure boost-projection evaluator for the Pond0x rig.
 *
 * The absolute boost is read live (Supabase feed) — NOT computed here.
 * This projects, relative to a known live boost: progress to max, swaps
 * needed to reach max, boost added this session, and the session runway.
 */
export const MAX_BOOST = 615;
export const SWAP_BOOST = 1 / 6; // boost gained per swap
export const SESSION_COST = 3; // boost consumed per mining session

export interface BoostProjection {
  /** 0..100 — current boost as a percentage of MAX_BOOST */
  pctToMax: number;
  /** swaps needed to climb from current boost to MAX_BOOST */
  swapsToMax: number;
  /** boost gained from this session's swaps (sessionSwaps * SWAP_BOOST) */
  sessionBoostAdded: number;
  /** how many mining sessions the current boost can still pay for */
  sessionsBuffer: number;
}

export function boostProjection(
  currentBoost: number,
  sessionSwaps: number,
  maxBoost = MAX_BOOST
): BoostProjection {
  const boost = Math.max(0, Math.min(maxBoost, currentBoost || 0));
  const remaining = Math.max(0, maxBoost - boost);
  return {
    pctToMax: maxBoost > 0 ? (boost / maxBoost) * 100 : 0,
    swapsToMax: Math.ceil(remaining / SWAP_BOOST),
    sessionBoostAdded: Math.max(0, sessionSwaps || 0) * SWAP_BOOST,
    sessionsBuffer: Math.floor(boost / SESSION_COST),
  };
}
