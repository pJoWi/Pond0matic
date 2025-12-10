"use client";
import React, { useState } from "react";
import { cn, short } from "@/lib/utils";
import { DEFAULT_RPC } from "@/lib/vaults";

interface WalletPanelProps {
  wallet: string;
  connecting: boolean;
  rpc: string;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onRpcChange: (newRpc: string) => void;
}

export function WalletPanel({
  wallet,
  connecting,
  rpc,
  onConnect,
  onDisconnect,
  onRpcChange,
}: WalletPanelProps) {
  const [tempRpc, setTempRpc] = useState<string>(rpc);

  const handleConfirmRpc = () => {
    onRpcChange(tempRpc);
  };

  return (
    <section
      className="relative glass-intense border-2 border-lily-green/30 rounded-2xl shadow-[0_8px_32px_rgba(107,157,120,0.15)] overflow-hidden transition-all duration-500 hover:border-lily-green/50 hover:shadow-[0_12px_48px_rgba(107,157,120,0.25)] group"
      role="region"
      aria-label="Wallet connection"
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-lily-green/5 via-transparent to-pond-bright/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lily-bright/10 to-transparent animate-shimmer" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between px-6 py-4 border-b-2 border-lily-green/20 bg-gradient-to-r from-lily-green/10 via-pond-bright/10 to-lily-green/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-lily-bright/30 rounded-full blur-lg animate-pulse" />
            <div className="relative text-2xl">🔌</div>
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-lily-bright via-pond-bright to-lily-green bg-clip-text text-transparent tracking-tight">
            PLUG
          </h2>
        </div>
        <div
          className={cn(
            "flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border-2",
            wallet
              ? "bg-gradient-to-r from-lily-green/20 to-pond-bright/20 text-lily-bright border-lily-green/50 shadow-[0_0_20px_rgba(107,157,120,0.3)] backdrop-blur-sm"
              : "bg-gray-800/40 text-gray-400 border-gray-600/50 backdrop-blur-sm"
          )}
        >
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300",
              wallet
                ? "bg-lily-bright shadow-[0_0_12px_rgba(139,196,159,0.8)] animate-led-pulse"
                : "bg-gray-500"
            )}
          />
          {wallet ? "Connected" : "Disconnected"}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Section */}
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold" htmlFor="wallet-connection">
            Wallet
          </label>
          {!wallet ? (
            <button
              id="wallet-connection"
              onClick={onConnect}
              disabled={connecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-ember-orange via-ember-amber to-ember-gold rounded-lg font-semibold text-sm text-white hover:shadow-ember-orange hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-black"
              aria-label={connecting ? "Connecting to wallet" : "Connect wallet"}
            >
              <span className="text-lg" aria-hidden="true">
                🔌
              </span>
              {connecting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Connecting...</span>
                </>
              ) : (
                "CONNECT WALLET"
              )}
            </button>
          ) : (
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-ember-orange/10 border border-ember-orange/40 rounded-lg shadow-ember-orange-sm transition-all duration-300 hover:border-ember-orange/60">
              <span className="font-mono text-sm text-ember-orange-light truncate" aria-label={`Wallet address: ${wallet}`}>
                {short(wallet, 6)}
              </span>
              <button
                onClick={onDisconnect}
                className="px-3 py-1 bg-red-500/20 border border-red-500/40 rounded text-xs text-red-400 hover:bg-red-500/30 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-cyber-black"
                aria-label="Disconnect wallet"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* RPC Section */}
        <div className="space-y-3">
          <label htmlFor="rpc-endpoint" className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
            RPC Endpoint
          </label>
          <div className="flex gap-2">
            <input
              id="rpc-endpoint"
              type="url"
              className="flex-1 px-3 py-2 bg-cyber-black/50 border border-ember-orange/30 rounded-lg text-sm font-mono text-white placeholder-gray-500 focus:border-ember-orange/60 focus:shadow-ember-orange-sm focus:outline-none focus:ring-2 focus:ring-ember-orange/40 transition-all"
              placeholder={DEFAULT_RPC}
              value={tempRpc}
              onChange={(e) => setTempRpc(e.target.value)}
              aria-describedby="rpc-hint"
            />
            <button
              onClick={handleConfirmRpc}
              disabled={tempRpc === rpc}
              className="px-4 py-2 bg-neon-red/20 border border-neon-red/40 rounded-lg text-sm font-semibold text-neon-red hover:bg-neon-red/30 hover:shadow-neon-red-sm hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-neon-red focus:ring-offset-2 focus:ring-offset-cyber-black"
              aria-label="Set RPC endpoint"
            >
              Set
            </button>
          </div>
          <p id="rpc-hint" className="sr-only">
            Enter a custom Solana RPC endpoint URL
          </p>
        </div>

        {/* Affiliate Section */}
        <div className="space-y-3">
          <label htmlFor="affiliate-select" className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
            Affiliate
          </label>
          <div className="px-4 py-3 bg-ember-gold/10 border border-ember-gold/40 rounded-lg shadow-ember-gold-sm">
            <div className="text-sm font-semibold text-ember-gold">Pond0x Mining Rig</div>
            <div className="text-xs text-gray-400 mt-1">Active affiliate program</div>
          </div>
        </div>
      </div>
    </section>
  );
}
