import { describe, it, expect } from "vitest";
import { exportToCsv, exportToJson } from "@/lib/portfolio/exporter";
import type { SwapRecord } from "@/lib/portfolio/types";

const record: SwapRecord = {
  id: "r1",
  signature: "sig-abc",
  mode: "boost",
  fromMint: "from-mint",
  fromSymbol: "SOL",
  fromAmount: 1.234,
  toMint: "to-mint",
  toSymbol: "wPOND",
  toAmount: 1_000_000,
  fromPriceUsd: 100,
  toPriceUsd: 0.0005,
  feesUsd: 0.05,
  status: "confirmed",
  timestamp: 1_700_000_000_000,
  walletAddress: "wallet-1",
};

const recordWithComma: SwapRecord = {
  ...record,
  id: "r2",
  signature: "sig,with,commas",
  fromSymbol: 'symbol"quote',
};

describe("exporter.exportToJson", () => {
  it("round-trips through JSON.parse", () => {
    const json = exportToJson([record, recordWithComma]);
    const parsed = JSON.parse(json) as SwapRecord[];
    expect(parsed).toEqual([record, recordWithComma]);
  });

  it("returns valid JSON for empty array", () => {
    expect(JSON.parse(exportToJson([]))).toEqual([]);
  });
});

describe("exporter.exportToCsv", () => {
  it("starts with the header row in the documented order", () => {
    const csv = exportToCsv([record]);
    const firstLine = csv.split("\n")[0];
    expect(firstLine).toBe(
      "timestamp,date,mode,signature,from_symbol,from_amount,from_price_usd,to_symbol,to_amount,to_price_usd,fees_usd,status,wallet_address"
    );
  });

  it("emits one data row per record", () => {
    const csv = exportToCsv([record, record]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 rows
  });

  it("escapes commas and quotes correctly", () => {
    const csv = exportToCsv([recordWithComma]);
    const dataLine = csv.split("\n")[1];
    // signature contains commas → must be wrapped in quotes
    expect(dataLine).toContain('"sig,with,commas"');
    // from_symbol contains a quote → must be doubled and wrapped
    expect(dataLine).toContain('"symbol""quote"');
  });

  it("includes ISO date alongside epoch timestamp", () => {
    const csv = exportToCsv([record]);
    const dataLine = csv.split("\n")[1];
    expect(dataLine).toContain("2023-11-14T22:13:20.000Z");
  });

  it("emits header only for empty records array", () => {
    const csv = exportToCsv([]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(1);
  });
});
