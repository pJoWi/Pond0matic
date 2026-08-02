"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { TokenIcon } from "@/components/icons/tokens";
import { WaterRipple } from "@/components/ui/WaterRipple";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { TOKEN_ICONS } from "@/lib/tokenIcons";
import { formatPrice } from "@/lib/format";
import type { TokenPrices } from "@/hooks/useTokenPrices";

interface TokenPricesPanelProps {
  prices: TokenPrices;
}

interface TokenRowData {
  symbol: string;
  price: number;
  icon: string;
  featured: boolean;
}

function TokenRow({ token, loading }: { token: TokenRowData; loading: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative flex items-center justify-between px-5 py-4 border-b border-teal-400/10 hover:bg-teal-400/10 transition-all duration-300 rounded-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-full blur-sm" />

      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          <WaterRipple delay={0} />
        </div>
      )}

      <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
        <div className="relative flex-shrink-0 w-11 h-11 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full ring-2 ring-teal-400/40 group-hover:ring-emerald-400/60 transition-all" />
          <TokenIcon
            info={{ symbol: token.symbol, icon: token.icon, name: token.symbol }}
            width={44}
            height={44}
            enableUnknownTokenWarning={false}
          />
        </div>
        <span
          className={cn(
            "font-semibold text-base tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]",
            token.featured ? "text-cyan-100" : "text-teal-200"
          )}
        >
          {token.symbol}
        </span>
      </div>

      <div
        className={cn(
          "text-lg font-semibold tabular-nums tracking-tight relative z-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]",
          token.price > 0 ? "text-emerald-300" : "text-teal-500"
        )}
      >
        {loading ? <span className="animate-pulse">---</span> : formatPrice(token.price)}
      </div>
    </div>
  );
}

interface ChainSectionProps {
  title: string;
  tokens: TokenRowData[];
  chainColor: string;
  chainIcon: string;
  loading: boolean;
}

function ChainSection({ title, tokens, chainColor, chainIcon, loading }: ChainSectionProps) {
  return (
    <div className="relative bg-slate-950/85 backdrop-blur-2xl border-2 border-teal-400/30 overflow-hidden rounded-[2.5rem_3rem_2rem_2.5rem] shadow-[0_12px_48px_rgba(0,0,0,0.5)] animate-pond-float">
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-cyan-300/5 opacity-30" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(74,222,128,0.2)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(45,212,191,0.2)_0%,transparent_50%)]" />
      </div>

      <div className={cn("relative px-6 py-4 border-b-2 z-10", chainColor, "bg-gradient-to-r from-teal-950/60 to-transparent backdrop-blur-sm")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl filter drop-shadow-[0_2px_12px_rgba(74,222,128,0.6)]">{chainIcon}</span>
            <h3 className="font-semibold text-base tracking-wide text-cyan-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              {title}
            </h3>
          </div>
          <LiveIndicator />
        </div>
      </div>

      <div className="relative p-2 z-10">
        {loading ? (
          <div className="px-4 py-12 text-center">
            <div className="inline-block">
              <div className="w-10 h-10 rounded-full border-3 border-teal-400/30 border-t-emerald-400 animate-spin" />
            </div>
            <p className="mt-4 text-xs font-medium text-teal-400/80 tracking-wide">
              Loading pond data...
            </p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="px-4 py-12 text-center text-teal-400/60 font-medium text-sm tracking-wide">
            No tokens in pond
          </div>
        ) : (
          tokens.map((token) => <TokenRow key={token.symbol} token={token} loading={loading} />)
        )}
      </div>
    </div>
  );
}

/**
 * Market panel showing Solana token prices (SOL + wPOND).
 */
export function TokenPricesPanel({ prices }: TokenPricesPanelProps) {
  const { solPrice, wpondPrice, loading } = prices;

  const solanaTokens: TokenRowData[] = [
    { symbol: "SOL", price: solPrice, icon: TOKEN_ICONS.SOL, featured: true },
    { symbol: "wPOND", price: wpondPrice, icon: TOKEN_ICONS.wPOND, featured: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="font-semibold text-xl tracking-wide text-teal-100 flex items-center gap-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          <span className="text-2xl">🪷</span>
          <span>Market Waters</span>
        </h2>
      </div>

      <ChainSection
        title="Solana Pond"
        tokens={solanaTokens}
        chainColor="border-purple-400/40"
        chainIcon="💜"
        loading={loading}
      />
    </div>
  );
}
