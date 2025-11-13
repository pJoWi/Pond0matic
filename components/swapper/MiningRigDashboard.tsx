"use client";
import React from "react";
import { cn, short } from "@/lib/utils";

// Pond0x Protocol Addresses (Official Solana Mainnet)
const POND0X_ADDRESSES = {
  HASHRATE_BOOSTER: "4ngqDt821wV2CjxoZLCLcTAPZNt6ZqpswoqyQEztsU36",
  SWAP_REWARD_DISTRIBUTOR: "1orFCnFfgwPzSgUaoK6Wr3MjgXZ7mtk8NGz9Hh4iWWL",
} as const;

// Mining Rig Configuration
const MIN_BOOSTBOT_USD = 0.01;
const MIN_PERMANENT_BOOST_SOL = 0.1;
const MIN_LUCK_SOL = 0.001;
const OPTIMAL_BOOST_THRESHOLD = 615; // Target boost for 100% power

interface MiningRigDashboardProps {
  // Health & Performance
  rigHealth: number;
  rigPower: number;
  rigTemp: number;

  // Boost & Stats
  totalBoosts: number;
  permanentBoostTotal: number;
  luckPoints: number;
  boostBotActive: boolean;

  // Flywheel Data
  miningSessionsCount: number;
  swapBoost: number;
  sessionPenalty: number;
  currentBoost: number;
  priority: number;
  driftRisk: number;

  // Wallet state
  wallet: string;

  // Actions
  onRunBoostBot: (amount: string, count: number) => void;
  onSendPermanentBoost: (solAmount: number) => void;
  onSendLuckBurn: (solAmount: number) => void;

  // Config for BoostBot
  swapAmount: string;
  autoCount: number;
}

export function MiningRigDashboard({
  rigHealth,
  rigPower,
  rigTemp,
  totalBoosts,
  permanentBoostTotal,
  luckPoints,
  boostBotActive,
  miningSessionsCount,
  swapBoost,
  sessionPenalty,
  currentBoost,
  priority,
  driftRisk,
  wallet,
  onRunBoostBot,
  onSendPermanentBoost,
  onSendLuckBurn,
  swapAmount,
  autoCount,
}: MiningRigDashboardProps) {
  const [permanentBoostInput, setPermanentBoostInput] = React.useState<string>("");
  const [luckBurnInput, setLuckBurnInput] = React.useState<string>("");

  return (
    <section className="bg-cyber-darker/60 backdrop-blur-md border border-ember-orange/30 rounded-xl shadow-ember-orange-md overflow-hidden transition-all duration-300 hover:border-ember-orange/50">
      {/* Header */}
      <div className="px-6 py-4 border-b border-ember-orange/20 bg-gradient-to-br from-ember-orange/10 to-ember-gold/5">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-ember-orange via-ember-amber to-ember-gold bg-clip-text text-transparent text-center flex items-center justify-center gap-3">
          <span>⚙️</span>
          <span>POND0X MINING RIG</span>
          <span>⚙️</span>
        </h2>
        <p className="text-center text-sm text-gray-400 mt-2">Boost your rig • Maximize mining power • Increase luck</p>
      </div>

      {/* Rig Status Display */}
      <div className="p-6 space-y-6">
        {/* Status Meters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Health */}
          <div className="space-y-3 p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Health</span>
              <span className="text-lg font-bold text-green-400">{rigHealth}%</span>
            </div>
            <div className="w-full h-3 bg-cyber-black/50 rounded-full overflow-hidden border border-green-500/30">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                style={{ width: `${rigHealth}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">Boost to maintain rig health</p>
          </div>

          {/* Power */}
          <div className="space-y-3 p-4 bg-gradient-to-br from-ember-orange/10 to-ember-amber/5 border border-ember-orange/30 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Power (Boost)</span>
              <span className="text-lg font-bold text-ember-orange-light">{rigPower.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 bg-cyber-black/50 rounded-full overflow-hidden border border-ember-orange/30">
              <div
                className="h-full bg-gradient-to-r from-ember-orange to-ember-amber transition-all duration-1000 shadow-ember-orange-sm"
                style={{ width: `${rigPower}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {currentBoost > 0 ? `+${currentBoost.toFixed(1)}` : currentBoost.toFixed(1)} boost
              {currentBoost >= OPTIMAL_BOOST_THRESHOLD ? " ✓" : ` (need ${(OPTIMAL_BOOST_THRESHOLD - currentBoost).toFixed(0)})`}
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-3 p-4 bg-gradient-to-br from-red-500/10 to-orange-600/5 border border-red-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Temperature</span>
              <span className="text-lg font-bold text-red-400">{rigTemp}°C</span>
            </div>
            <div className="w-full h-3 bg-cyber-black/50 rounded-full overflow-hidden border border-red-500/30">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                style={{ width: `${(rigTemp / 100) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">Optimal: 40-70°C</p>
          </div>
        </div>

        {/* Flywheel Mechanics Info */}
        <div className="bg-gradient-to-br from-ember-gold/10 to-ember-orange/5 border-2 border-ember-gold/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🌀</div>
            <div>
              <h3 className="text-lg font-bold text-ember-gold">Pond0x Flywheel</h3>
              <p className="text-xs text-gray-400">Real-time boost calculation</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-cyber-black/50 border border-green-500/30 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Swap Boost</div>
              <div className="text-xl font-bold text-green-400">+{swapBoost.toFixed(2)}</div>
              <div className="text-[10px] text-gray-600 mt-1">{totalBoosts} swaps × 1/6</div>
            </div>
            <div className="bg-cyber-black/50 border border-red-500/30 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Session Penalty</div>
              <div className="text-xl font-bold text-red-400">{sessionPenalty.toFixed(0)}</div>
              <div className="text-[10px] text-gray-600 mt-1">{miningSessionsCount} sessions × -3</div>
            </div>
            <div className="bg-cyber-black/50 border border-ember-orange/30 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Current Boost</div>
              <div
                className={cn(
                  "text-xl font-bold",
                  currentBoost >= OPTIMAL_BOOST_THRESHOLD
                    ? "text-ember-orange-light"
                    : currentBoost > 0
                    ? "text-yellow-400"
                    : "text-red-400"
                )}
              >
                {currentBoost > 0 ? "+" : ""}
                {currentBoost.toFixed(1)}
              </div>
              <div className="text-[10px] text-gray-600 mt-1">Target: {OPTIMAL_BOOST_THRESHOLD}</div>
            </div>
            <div className="bg-cyber-black/50 border border-purple-500/30 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Priority</div>
              <div className="text-xl font-bold text-purple-400">{priority}/100</div>
              <div className="text-[10px] text-gray-600 mt-1">Claims list</div>
            </div>
          </div>
        </div>

        {/* Rig Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-cyber-black/50 border border-ember-orange/30 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Total Swaps</div>
            <div className="text-2xl font-bold text-ember-orange-light">{totalBoosts}</div>
          </div>
          <div className="bg-cyber-black/50 border border-ember-gold/30 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Permanent SOL</div>
            <div className="text-2xl font-bold text-ember-gold">{permanentBoostTotal.toFixed(2)}</div>
          </div>
          <div className="bg-cyber-black/50 border border-purple-500/30 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Luck Points</div>
            <div className="text-2xl font-bold text-purple-400">{luckPoints}</div>
          </div>
          <div className="bg-cyber-black/50 border border-blue-500/30 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Status</div>
            <div className="text-lg font-bold text-blue-400">{boostBotActive ? "BOOSTING" : "IDLE"}</div>
          </div>
        </div>

        {/* Boost Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BoostBot */}
          <div className="bg-gradient-to-br from-ember-orange/20 to-ember-amber/10 border-2 border-ember-orange/40 rounded-xl p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🤖</div>
              <h3 className="text-xl font-bold text-ember-orange-light mb-2">BoostBot</h3>
              <p className="text-xs text-gray-400 mb-4">
                Micro swaps to SOL for temporary boost (&gt;{MIN_BOOSTBOT_USD} USD)
              </p>
            </div>
            <button
              onClick={() => onRunBoostBot(swapAmount, autoCount)}
              disabled={!wallet || boostBotActive}
              className="w-full px-4 py-3 bg-gradient-to-r from-ember-orange to-ember-amber rounded-lg font-bold text-sm text-white hover:shadow-ember-orange hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 transition-all focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-black"
            >
              {boostBotActive ? "BOOSTING..." : "START BOOSTBOT"}
            </button>
            <p className="text-xs text-gray-500 text-center">
              +1/6 boost per swap • {OPTIMAL_BOOST_THRESHOLD} boost = 100% power
            </p>
          </div>

          {/* Permanent Boost */}
          <div className="bg-gradient-to-br from-ember-gold/20 to-ember-orange/10 border-2 border-ember-gold/40 rounded-xl p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">⚡</div>
              <h3 className="text-xl font-bold text-ember-gold mb-2">Permanent Boost</h3>
              <p className="text-xs text-gray-400 mb-4">
                Deposit SOL to Hashrate Booster (min {MIN_PERMANENT_BOOST_SOL} SOL)
              </p>
              <p className="text-[10px] text-gray-600 font-mono mb-2">→ {short(POND0X_ADDRESSES.HASHRATE_BOOSTER, 6)}</p>
            </div>
            <input
              type="number"
              step="0.1"
              min={MIN_PERMANENT_BOOST_SOL}
              placeholder={`${MIN_PERMANENT_BOOST_SOL} SOL`}
              value={permanentBoostInput}
              onChange={(e) => setPermanentBoostInput(e.target.value)}
              className="w-full px-3 py-2 bg-cyber-black/50 border border-ember-gold/30 rounded-lg text-sm font-mono text-white text-center focus:border-ember-gold/60 focus:outline-none focus:ring-2 focus:ring-ember-gold/40 transition-all"
            />
            <button
              onClick={() => {
                const val = parseFloat(permanentBoostInput);
                if (val >= MIN_PERMANENT_BOOST_SOL) {
                  onSendPermanentBoost(val);
                  setPermanentBoostInput("");
                }
              }}
              disabled={!wallet || parseFloat(permanentBoostInput) < MIN_PERMANENT_BOOST_SOL}
              className="w-full px-4 py-3 bg-gradient-to-r from-ember-gold to-ember-amber rounded-lg font-bold text-sm text-white hover:shadow-ember-gold hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 transition-all focus:outline-none focus:ring-2 focus:ring-ember-gold focus:ring-offset-2 focus:ring-offset-cyber-black"
            >
              DEPOSIT PERMANENT BOOST
            </button>
            <p className="text-xs text-gray-500 text-center">+10% power +15% health</p>
          </div>

          {/* Luck Burn */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/10 border-2 border-purple-500/40 rounded-xl p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🍀</div>
              <h3 className="text-xl font-bold text-purple-400 mb-2">Luck Burn</h3>
              <p className="text-xs text-gray-400 mb-4">
                Send to Swap Reward Distributor for luck (min {MIN_LUCK_SOL} SOL)
              </p>
              <p className="text-[10px] text-gray-600 font-mono mb-2">→ {short(POND0X_ADDRESSES.SWAP_REWARD_DISTRIBUTOR, 6)}</p>
            </div>
            <input
              type="number"
              step="0.001"
              min={MIN_LUCK_SOL}
              placeholder={`${MIN_LUCK_SOL} SOL`}
              value={luckBurnInput}
              onChange={(e) => setLuckBurnInput(e.target.value)}
              className="w-full px-3 py-2 bg-cyber-black/50 border border-purple-500/30 rounded-lg text-sm font-mono text-white text-center focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
            />
            <button
              onClick={() => {
                const val = parseFloat(luckBurnInput);
                if (val >= MIN_LUCK_SOL) {
                  onSendLuckBurn(val);
                  setLuckBurnInput("");
                }
              }}
              disabled={!wallet || parseFloat(luckBurnInput) < MIN_LUCK_SOL}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg font-bold text-sm text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-cyber-black"
            >
              SEND LUCK BURN
            </button>
            <p className="text-xs text-gray-500 text-center">+5% health +luck points</p>
          </div>
        </div>
      </div>
    </section>
  );
}
