/**
 * Rig health snapshot types used by the clicker and health polling.
 */

export interface RigHealthSnapshot {
  health: number;
  drifted: number;
  failed: number;
  inMempool: number;
  sent: number;
  miningSessions: number;
  fetchedAt: number;
}
