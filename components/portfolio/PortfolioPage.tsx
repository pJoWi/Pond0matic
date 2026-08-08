"use client";
import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PondwaterPnLPanel } from "./PondwaterPnLPanel";
import { SwapHistoryPanel } from "./SwapHistoryPanel";
import { GeoffPortfolioInsight } from "./GeoffPortfolioInsight";

export function PortfolioPage() {
  const { connected } = useWallet();

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-20 bg-bg" />

      <div className="relative max-w-5xl mx-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-wide text-ink">
            Portfolio
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Track your Pond0matic swap history and pondwater PnL.
          </p>
        </header>

        {!connected ? (
          <div className="bg-surface border-2 border-edge rounded-[2rem_3rem_2rem_2.5rem] p-8 text-center text-ink-muted">
            Connect a wallet to view your portfolio.
          </div>
        ) : (
          <>
            <div className="bg-surface border-2 border-edge rounded-[2rem_3rem_2rem_2.5rem] p-5">
              <h2 className="text-sm font-semibold tracking-wide text-ink uppercase mb-4">
                Pondwater PnL
              </h2>
              <PondwaterPnLPanel />
            </div>

            <GeoffPortfolioInsight />

            <div className="bg-surface border-2 border-edge rounded-[2.5rem_2rem_2.5rem_2rem] p-5">
              <SwapHistoryPanel />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
