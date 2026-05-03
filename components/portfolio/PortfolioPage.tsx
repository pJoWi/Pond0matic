"use client";
import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PondwaterPnLPanel } from "./PondwaterPnLPanel";
import { SwapHistoryPanel } from "./SwapHistoryPanel";

export function PortfolioPage() {
  const { connected } = useWallet();

  return (
    <div className="pond-dashboard relative min-h-screen">
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-[#0a2f2f] via-[#0c3d3d] to-[#156565]" />

      <div className="relative max-w-5xl mx-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-wide text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]">
            Portfolio
          </h1>
          <p className="text-sm text-teal-200/80 mt-1">
            Track your Pond0matic swap history and pondwater PnL.
          </p>
        </header>

        {!connected ? (
          <div className="bg-slate-950/80 backdrop-blur-2xl border-2 border-teal-400/30 rounded-[2rem_3rem_2rem_2.5rem] p-8 text-center text-teal-200/90 shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
            Connect a wallet to view your portfolio.
          </div>
        ) : (
          <>
            <div className="bg-slate-950/80 backdrop-blur-2xl border-2 border-teal-400/30 rounded-[2rem_3rem_2rem_2.5rem] p-5 shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
              <h2 className="text-sm font-semibold tracking-wide text-teal-100 uppercase mb-4">
                Pondwater PnL
              </h2>
              <PondwaterPnLPanel />
            </div>

            <div className="bg-slate-950/80 backdrop-blur-2xl border-2 border-teal-400/30 rounded-[2.5rem_2rem_2.5rem_2rem] p-5 shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
              <SwapHistoryPanel />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
