import type { SwapRecord } from "./types";

const CSV_HEADER = [
  "timestamp",
  "date",
  "mode",
  "signature",
  "from_symbol",
  "from_amount",
  "from_price_usd",
  "to_symbol",
  "to_amount",
  "to_price_usd",
  "fees_usd",
  "status",
  "wallet_address",
] as const;

function escapeCsv(value: string | number | undefined): string {
  if (value === undefined || value === null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportToJson(records: SwapRecord[]): string {
  return JSON.stringify(records, null, 2);
}

export function exportToCsv(records: SwapRecord[]): string {
  const lines: string[] = [];
  lines.push(CSV_HEADER.join(","));
  for (const r of records) {
    lines.push(
      [
        r.timestamp,
        new Date(r.timestamp).toISOString(),
        r.mode,
        r.signature,
        r.fromSymbol,
        r.fromAmount,
        r.fromPriceUsd,
        r.toSymbol,
        r.toAmount,
        r.toPriceUsd,
        r.feesUsd ?? "",
        r.status,
        r.walletAddress,
      ]
        .map(escapeCsv)
        .join(",")
    );
  }
  return lines.join("\n");
}
