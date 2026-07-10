/** Pure formatting helpers for CLI/MCP output. */
import { LAMPORTS_PER_SOL, TxSummary } from "./solana";
import { labelForMint } from "./tokens";

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function formatSol(lamports: number): string {
  return `${lamportsToSol(lamports).toFixed(6)} SOL`;
}

export function formatTime(unixSeconds: number | null): string {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : "unknown";
}

export function formatTxSummary(s: TxSummary): string {
  const lines = [
    `signature : ${s.signature}`,
    `status    : ${s.succeeded ? "success" : "FAILED"}`,
    `time      : ${formatTime(s.blockTime)} (slot ${s.slot})`,
    `fee       : ${formatSol(s.feeLamports)}`,
    `programs  : ${s.programs.join(", ")}`,
  ];
  if (s.tokenDeltas.length > 0) {
    lines.push("token moves:");
    for (const d of s.tokenDeltas) {
      const sign = d.delta > 0 ? "+" : "";
      const owner = d.owner ? ` (owner ${d.owner.slice(0, 4)}…${d.owner.slice(-4)})` : "";
      lines.push(`  ${sign}${d.delta} ${labelForMint(d.mint)}${owner}`);
    }
  }
  return lines.join("\n");
}
