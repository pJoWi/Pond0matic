"use client";
import React from "react";
import { cn, short } from "@/lib/utils";

// Wetware Protocol Configuration
const WETWARE_ADDRESS = "9GjEVnpWiLe2uknUmtaH6DSfgcBvL66DtSKGREXDctZU";
const WETWARE_OPERATIONS = {
  condensation: { amount: 0.001, label: "Condensation", icon: "💧", description: "Entry-level operation" },
  lubrication: { amount: 0.01, label: "Lubrication", icon: "⚙️", description: "Standard operation" },
  ionization: { amount: 0.1, label: "Ionization", icon: "⚡", description: "Advanced operation" },
} as const;

type WetwareOperationType = keyof typeof WETWARE_OPERATIONS;

interface VoidTabProps {
  wallet: string;
  solBalance: number;
  lastWetwareOp: string;
  onSendWetwareOperation: (operation: WetwareOperationType) => void;
}

export function VoidTab({ wallet, solBalance, lastWetwareOp, onSendWetwareOperation }: VoidTabProps) {
  return (
    <section
      id="void-panel"
      role="tabpanel"
      aria-labelledby="void-tab"
      className="bg-cyber-darker/60 backdrop-blur-md border border-ember-gold/30 rounded-xl shadow-ember-gold-md overflow-hidden transition-all duration-300 hover:border-ember-gold/50 animate-fade-in"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-ember-gold/20 bg-gradient-to-br from-ember-gold/10 to-ember-orange/5">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-ember-gold via-ember-amber to-ember-orange bg-clip-text text-transparent text-center">
          🌌 THE VOID 🌌
        </h2>
        <p className="text-center text-sm text-gray-400 mt-2">Wetware Protocol • Fixed SOL Operations</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Wetware Protocol Operations */}
        <div className="space-y-4">
          <div className="text-center space-y-2 mb-6">
            <h3 className="text-lg font-bold text-ember-orange-light uppercase tracking-wider">Select Operation</h3>
            <p className="text-xs text-gray-500">Send fixed amounts of SOL to {short(WETWARE_ADDRESS, 6)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Condensation */}
            <button
              onClick={() => onSendWetwareOperation("condensation")}
              disabled={!wallet || solBalance < WETWARE_OPERATIONS.condensation.amount}
              className={cn(
                "group relative flex flex-col items-center justify-center p-8 rounded-xl text-sm font-semibold transition-all duration-300 border-2",
                "bg-gradient-to-br from-ember-orange/20 to-ember-amber/10 border-ember-orange/40",
                "hover:border-ember-orange hover:shadow-ember-orange hover:scale-105 hover:-translate-y-1",
                "active:scale-95 focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-black",
                "disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 disabled:translate-y-0"
              )}
              aria-label={`Send ${WETWARE_OPERATIONS.condensation.amount} SOL for Condensation operation`}
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {WETWARE_OPERATIONS.condensation.icon}
              </div>
              <div className="text-xl font-bold text-ember-orange-light mb-2">{WETWARE_OPERATIONS.condensation.label}</div>
              <div className="text-2xl font-mono font-bold text-white mb-1">{WETWARE_OPERATIONS.condensation.amount} SOL</div>
              <div className="text-xs text-gray-400">{WETWARE_OPERATIONS.condensation.description}</div>
            </button>

            {/* Lubrication */}
            <button
              onClick={() => onSendWetwareOperation("lubrication")}
              disabled={!wallet || solBalance < WETWARE_OPERATIONS.lubrication.amount}
              className={cn(
                "group relative flex flex-col items-center justify-center p-8 rounded-xl text-sm font-semibold transition-all duration-300 border-2",
                "bg-gradient-to-br from-ember-amber/20 to-ember-orange/10 border-ember-amber/40",
                "hover:border-ember-amber hover:shadow-ember-amber hover:scale-105 hover:-translate-y-1",
                "active:scale-95 focus:outline-none focus:ring-2 focus:ring-ember-amber focus:ring-offset-2 focus:ring-offset-cyber-black",
                "disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 disabled:translate-y-0"
              )}
              aria-label={`Send ${WETWARE_OPERATIONS.lubrication.amount} SOL for Lubrication operation`}
            >
              <div className="text-5xl mb-4 group-hover:scale-110 group-hover:rotate-180 transition-all duration-300">
                {WETWARE_OPERATIONS.lubrication.icon}
              </div>
              <div className="text-xl font-bold text-ember-amber-light mb-2">{WETWARE_OPERATIONS.lubrication.label}</div>
              <div className="text-2xl font-mono font-bold text-white mb-1">{WETWARE_OPERATIONS.lubrication.amount} SOL</div>
              <div className="text-xs text-gray-400">{WETWARE_OPERATIONS.lubrication.description}</div>
            </button>

            {/* Ionization */}
            <button
              onClick={() => onSendWetwareOperation("ionization")}
              disabled={!wallet || solBalance < WETWARE_OPERATIONS.ionization.amount}
              className={cn(
                "group relative flex flex-col items-center justify-center p-8 rounded-xl text-sm font-semibold transition-all duration-300 border-2",
                "bg-gradient-to-br from-ember-gold/20 to-ember-orange/10 border-ember-gold/40",
                "hover:border-ember-gold hover:shadow-ember-gold hover:scale-105 hover:-translate-y-1",
                "active:scale-95 focus:outline-none focus:ring-2 focus:ring-ember-gold focus:ring-offset-2 focus:ring-offset-cyber-black",
                "disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 disabled:translate-y-0"
              )}
              aria-label={`Send ${WETWARE_OPERATIONS.ionization.amount} SOL for Ionization operation`}
            >
              <div className="text-5xl mb-4 group-hover:scale-110 group-hover:animate-pulse transition-all duration-300">
                {WETWARE_OPERATIONS.ionization.icon}
              </div>
              <div className="text-xl font-bold text-ember-gold mb-2">{WETWARE_OPERATIONS.ionization.label}</div>
              <div className="text-2xl font-mono font-bold text-white mb-1">{WETWARE_OPERATIONS.ionization.amount} SOL</div>
              <div className="text-xs text-gray-400">{WETWARE_OPERATIONS.ionization.description}</div>
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-cyber-black/50 border border-ember-orange/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="flex-1 space-y-2">
              <h4 className="font-bold text-ember-orange-light">About Wetware Protocol</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                The Wetware Protocol uses fixed SOL amounts to trigger different operations. All transactions are sent directly to the
                protocol address <span className="font-mono text-ember-amber-light">{short(WETWARE_ADDRESS, 8)}</span>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <div className="bg-ember-orange/10 border border-ember-orange/30 rounded px-3 py-2">
                  <div className="text-xs text-gray-500 mb-1">Required Balance</div>
                  <div className="font-mono font-bold text-ember-orange-light">{solBalance.toFixed(4)} SOL</div>
                </div>
                <div className="bg-ember-amber/10 border border-ember-amber/30 rounded px-3 py-2">
                  <div className="text-xs text-gray-500 mb-1">Last Operation</div>
                  <div className="font-mono font-bold text-ember-amber-light">{lastWetwareOp || "None"}</div>
                </div>
                <div className="bg-ember-gold/10 border border-ember-gold/30 rounded px-3 py-2">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="font-mono font-bold text-ember-gold">{wallet ? "Ready" : "Connect Wallet"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
