"use client";
import { useTokenPrices } from "@/hooks/useTokenPrices";

const rows = (solPrice: number, wpondPrice: number) => [
  { symbol: "SOL", price: solPrice, decimals: 2 },
  { symbol: "wPOND", price: wpondPrice, decimals: 6 },
  { symbol: "USDC", price: 1, decimals: 2 },
];

export function PricesTab() {
  const { solPrice, wpondPrice, loading } = useTokenPrices();
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Prices</h2>
      <div className="overflow-hidden rounded-xl border border-edge">
        {rows(solPrice, wpondPrice).map((row, i) => (
          <div
            key={row.symbol}
            className={`flex items-center justify-between bg-surface px-4 py-3 ${i > 0 ? "border-t border-edge" : ""}`}
          >
            <span className="text-sm font-semibold">{row.symbol}</span>
            <span className="font-num text-sm">
              {loading && row.price === 0 ? "…" : `$${row.price.toFixed(row.decimals)}`}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-ink-muted">
        Live via lite-api.jup.ag price v3 (keyless) — refreshes automatically while the tab is visible.
      </p>
    </div>
  );
}
