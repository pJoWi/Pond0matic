"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { cn } from "@/lib/utils";
import { TokenIcon } from "@/components/icons/tokens";
import { TOKEN_ICONS } from "@/lib/tokenIcons";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useWalletBalances } from "@/hooks/useWalletBalances";

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

/**
 * Pond-themed wallet bar. Disconnected: shows a Connect button that opens
 * the wallet adapter modal (Phantom). Connected: shows balances driven by
 * useWalletBalances() against the live Solana RPC.
 */
export function WalletBar() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const prices = useTokenPrices();
  const balances = useWalletBalances(publicKey, prices);
  const [expanded, setExpanded] = useState(false);

  if (!connected || !publicKey) {
    return (
      <div className="relative mb-6">
        <div className="relative backdrop-blur-2xl border-2 border-teal-400/30 rounded-[2rem_2.5rem_2rem_2.5rem] bg-slate-950/80 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />
          <div className="relative z-10 p-4 flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-teal-300/90 tracking-wide">
              Connect a wallet to see your pond holdings
            </div>
            <button
              type="button"
              onClick={() => setVisible(true)}
              className="px-5 py-2.5 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-400/50 hover:border-emerald-400/80 rounded-xl font-semibold text-sm text-emerald-200 hover:text-emerald-100 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_24px_rgba(74,222,128,0.3)]"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  const address = publicKey.toBase58();

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard!");
    } catch {
      toast.error("Failed to copy address");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Disconnect failed");
    }
  };

  return (
    <div className="relative mb-6">
      <div
        className={cn(
          "relative backdrop-blur-2xl border-2 border-teal-400/30 overflow-hidden transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
          "rounded-[2rem_2.5rem_2rem_2.5rem]",
          expanded ? "bg-slate-950/90" : "bg-slate-950/80"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-300/5 opacity-30" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(45,212,191,0.15)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(74,222,128,0.15)_0%,transparent_50%)]" />
        </div>

        <div className="relative z-10">
          {/* Collapsed state */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-400/50 rounded-full backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
                <div className="relative">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pond-pulse-soft shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                  <div className="absolute inset-0 w-2 h-2 bg-emerald-400/40 rounded-full animate-pond-ping-slow" />
                </div>
                <span className="text-[11px] font-semibold tracking-wide text-emerald-300">Connected</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0 w-7 h-7 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full ring-2 ring-teal-400/40" />
                  <TokenIcon
                    info={{ symbol: "SOL", icon: TOKEN_ICONS.SOL, name: "SOL" }}
                    width={28}
                    height={28}
                    enableUnknownTokenWarning={false}
                  />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-cyan-200 tabular-nums">
                    {balances.loading && balances.sol === 0 ? "—" : balances.sol.toFixed(2)}
                  </span>
                  <span className="text-xs font-medium text-teal-400/80">SOL</span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-purple-950/50 border border-purple-400/40 rounded-full">
                <span className="text-sm">💜</span>
                <span className="text-[10px] font-semibold tracking-wide text-purple-300">Solana</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex-shrink-0 p-2.5 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-400/40 hover:border-teal-400/60 rounded-xl transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_24px_rgba(45,212,191,0.3)]"
              aria-label={expanded ? "Collapse wallet" : "Expand wallet"}
            >
              <svg
                className={cn("w-5 h-5 text-teal-300 transition-transform duration-300", expanded && "rotate-180")}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Expanded state */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-500 ease-in-out",
              expanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="px-4 pb-4 space-y-4 border-t border-teal-400/20">
              <div className="pt-4 space-y-2">
                <div className="text-[10px] font-medium tracking-wide text-teal-300/80 uppercase">Wallet Address</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-black/40 border border-teal-400/30 rounded-xl font-mono text-sm text-cyan-200 truncate">
                    {truncateAddress(address)}
                  </div>
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="p-2.5 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-400/40 hover:border-teal-400/60 rounded-xl transition-all duration-300 group"
                    title="Copy address"
                  >
                    <svg className="w-4 h-4 text-teal-300 group-hover:text-teal-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-medium tracking-wide text-teal-300/80 uppercase flex items-center justify-between">
                  <span>Token Balances</span>
                  <span className="text-emerald-300">
                    {balances.error ? "unavailable" : `${balances.tokens.length + 1} assets`}
                  </span>
                </div>

                {balances.error ? (
                  <div className="px-3 py-3 bg-rose-950/30 border border-pink-400/30 rounded-xl text-xs text-pink-200">
                    Balances unavailable. Try refresh.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <BalanceRow symbol="SOL" amount={balances.sol} usdValue={balances.solUsd} icon={TOKEN_ICONS.SOL} />
                    {balances.tokens.map((token) => (
                      <BalanceRow key={token.mint} {...token} />
                    ))}
                  </div>
                )}

                <div className="pt-2 mt-2 border-t border-teal-400/20 flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-semibold tracking-wide text-teal-300 uppercase">Total Value</span>
                  <span className="text-lg font-bold text-emerald-300 tabular-nums">
                    ${balances.totalUsd.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                className="w-full px-4 py-2.5 bg-rose-950/60 hover:bg-rose-900/60 border border-pink-400/40 hover:border-pink-400/60 rounded-xl font-semibold text-sm text-pink-300 hover:text-pink-200 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_24px_rgba(244,114,182,0.3)] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Disconnect Wallet</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BalanceRow({
  symbol,
  amount,
  usdValue,
  icon,
}: {
  symbol: string;
  amount: number;
  usdValue: number;
  icon: string;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-black/30 hover:bg-black/40 border border-teal-400/20 hover:border-teal-400/30 rounded-xl transition-all duration-300 group">
      <div className="flex items-center gap-2.5">
        <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full ring-2 ring-teal-400/30 group-hover:ring-emerald-400/50 transition-all" />
          <TokenIcon info={{ symbol, icon, name: symbol }} width={32} height={32} enableUnknownTokenWarning={false} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-cyan-200">{symbol}</span>
          <span className="text-[10px] text-teal-400/70 tabular-nums">
            {amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-emerald-300 tabular-nums">${usdValue.toFixed(2)}</div>
      </div>
    </div>
  );
}
