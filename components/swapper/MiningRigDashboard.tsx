"use client";
import React from "react";
import { cn, short } from "@/lib/utils";

// Pond0x Protocol Addresses (Official Solana Mainnet)
const POND0X_ADDRESSES = {
  HASHRATE_BOOSTER: "4ngqDt821wV2CjxoZLCLcTAPZNt6ZqpswoqyQEztsU36",
  SWAP_REWARD_DISTRIBUTOR: "1orFCnFfgwPzSgUaoK6Wr3MjgXZ7mtk8NGz9Hh4iWWL",
} as const;

// Badge emoji mapping
const BADGE_EMOJIS: Record<string, string> = {
  pork: "🐽",
  chef: "🧑‍🍳",
  points: "✨",
  swap: "🤝",
};

// Helper function to get badge emoji
const getBadgeEmoji = (badgeName: string): string => {
  const lowerBadge = badgeName.toLowerCase().trim();
  return BADGE_EMOJIS[lowerBadge] || "";
};

// Mining Rig Configuration
const MIN_PERMANENT_BOOST_SOL = 0.01;
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

  // Additional API data
  inMempool: number;
  sent: number;
  failed: number;
  drifted: number;
  estimatedSolUsd: number;
  maxClaimEstimateUsd: number;
  badges: string;
  isPro: boolean;
  proSwapsSol: number;
  proSwapsBx: number;

  // Vault Stats
  vaultTotalSol: number;
  vaultTransactionCount: number;

  // Navigation
  onOpenSwapper: () => void;

  // Wallet state
  wallet: string;

  // Loading state
  isLoading: boolean;
  onFetchRigData: () => void;

  // Actions
  onSendPermanentBoost: (solAmount: number) => void;
  onSendLuckBurn: (solAmount: number) => void;
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
  inMempool,
  sent,
  failed,
  drifted,
  estimatedSolUsd,
  maxClaimEstimateUsd,
  badges,
  isPro,
  proSwapsSol,
  proSwapsBx,
  vaultTotalSol,
  vaultTransactionCount,
  onOpenSwapper,
  wallet,
  isLoading,
  onFetchRigData,
  onSendPermanentBoost,
  onSendLuckBurn,
}: MiningRigDashboardProps) {
  const [permanentBoostInput, setPermanentBoostInput] = React.useState<string>("");
  const [luckBurnInput, setLuckBurnInput] = React.useState<string>("");
  const [boostLoading, setBoostLoading] = React.useState(false);
  const [luckLoading, setLuckLoading] = React.useState(false);

  return (
    <section className="relative overflow-hidden rounded-2xl border-2 border-lily-green/40 backdrop-blur-xl bg-gradient-to-br from-pond-water/50 via-pond-deep/40 to-pond-water/50 shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all duration-300">
      {/* Pond Water Animation */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-teal-500/20 animate-[wave_8s_ease-in-out_infinite]"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-400/10 via-cyan-400/5 to-blue-500/10 animate-[wave_6s_ease-in-out_infinite_reverse]"></div>
      </div>

      {/* Pond Water Bubbles & Droplets */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Rising bubbles */}
        <div className="absolute bottom-[10%] left-[15%] w-3 h-3 bg-cyan-400/40 rounded-full animate-[bubble-rise_6s_ease-in-out_infinite] shadow-[0_0_12px_rgba(34,211,238,0.4)]"></div>
        <div className="absolute bottom-[5%] right-[25%] w-2 h-2 bg-teal-400/50 rounded-full animate-[bubble-rise_8s_ease-in-out_infinite_1s] shadow-[0_0_10px_rgba(45,212,191,0.5)]"></div>
        <div className="absolute bottom-[15%] left-[60%] w-2.5 h-2.5 bg-blue-300/40 rounded-full animate-[bubble-rise_7s_ease-in-out_infinite_2s] shadow-[0_0_15px_rgba(147,197,253,0.4)]"></div>
        <div className="absolute bottom-[8%] right-[50%] w-1.5 h-1.5 bg-cyan-300/60 rounded-full animate-[bubble-rise_9s_ease-in-out_infinite_3s] shadow-[0_0_8px_rgba(103,232,249,0.5)]"></div>
        <div className="absolute bottom-[12%] left-[40%] w-2 h-2 bg-blue-400/45 rounded-full animate-[bubble-rise_7.5s_ease-in-out_infinite_1.5s] shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
        <div className="absolute bottom-[20%] right-[70%] w-1.5 h-1.5 bg-teal-300/55 rounded-full animate-[bubble-rise_8.5s_ease-in-out_infinite_2.5s] shadow-[0_0_8px_rgba(94,234,212,0.5)]"></div>

        {/* Floating lily sparkles */}
        <div className="absolute top-[30%] left-[25%] w-1.5 h-1.5 bg-emerald-400/70 rounded-full animate-[lily-float_5s_ease-in-out_infinite] shadow-[0_0_10px_rgba(52,211,153,0.6)]"></div>
        <div className="absolute top-[50%] right-[35%] w-2 h-2 bg-teal-300/60 rounded-full animate-[lily-float_6s_ease-in-out_infinite_1.5s] shadow-[0_0_12px_rgba(94,234,212,0.5)]"></div>
        <div className="absolute bottom-[40%] left-[70%] w-1 h-1 bg-cyan-500/50 rounded-full animate-[lily-float_7s_ease-in-out_infinite_2.5s] shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>
        <div className="absolute top-[60%] left-[50%] w-1.5 h-1.5 bg-emerald-300/65 rounded-full animate-[lily-float_5.5s_ease-in-out_infinite_1s] shadow-[0_0_10px_rgba(110,231,183,0.6)]"></div>
        <div className="absolute bottom-[55%] right-[60%] w-1 h-1 bg-teal-400/55 rounded-full animate-[lily-float_6.5s_ease-in-out_infinite_2s] shadow-[0_0_8px_rgba(45,212,191,0.5)]"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 py-4 border-b border-lily-green/30">
        <div className="flex items-center justify-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-lily-bright via-emerald-400 to-lily-bright bg-clip-text text-transparent text-center flex items-center justify-center gap-3">
            <span>⚙️</span>
            <span>POND0X MINING RIG</span>
            <span>⚙️</span>
          </h2>
        </div>
        <p className="text-center text-sm text-gray-400 mt-2">
          Boost your rig • Maximize mining power • Increase luck
        </p>
        {badges && (
          <div className="flex items-center justify-center gap-2 mt-2">
            {badges.split(", ").map((badge) => {
              const emoji = getBadgeEmoji(badge);
              return (
                <span
                  key={badge}
                  className="px-2 py-0.5 bg-ember-gold/20 border border-ember-gold/40 rounded text-xs text-ember-gold font-medium flex items-center gap-1"
                >
                  {emoji && <span className="text-sm">{emoji}</span>}
                  <span>{badge}</span>
                </span>
              );
            })}
            {isPro && (
              <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded text-xs text-purple-400 font-medium">
                PRO
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rig Status Display */}
      <div className="relative z-10 p-6 space-y-6">
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
            <div className="text-xs text-gray-500 mb-1">SOL Swaps</div>
            <div className="text-2xl font-bold text-ember-orange-light">{proSwapsSol.toLocaleString()}</div>
          </div>
          <div className="bg-cyber-black/50 border border-cyan-500/30 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">BX Swaps</div>
            <div className="text-2xl font-bold text-cyan-400">{proSwapsBx.toLocaleString()}</div>
          </div>
          <div className="bg-cyber-black/50 border border-ember-gold/30 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Permanent SOL</div>
            <div className="text-2xl font-bold text-ember-gold">{permanentBoostTotal.toFixed(2)}</div>
          </div>
          <div className="bg-cyber-black/50 border border-purple-500/30 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Luck Points</div>
            <div className="text-2xl font-bold text-purple-400">{luckPoints}</div>
          </div>
        </div>

        {/* Vault Stats (On-chain data) */}
        {vaultTransactionCount > 0 && (
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/5 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">🏦</div>
              <div>
                <h3 className="text-lg font-bold text-emerald-400">Hashrate Booster Vault</h3>
                <p className="text-xs text-gray-400">SOL sent to vault (forwarded to Treasury)</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-cyber-black/50 border border-ember-gold/30 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">Total SOL Sent</div>
                <div className="text-2xl font-bold text-ember-gold">{vaultTotalSol.toFixed(4)} SOL</div>
                <div className="text-[10px] text-gray-600 mt-1">On-chain verified</div>
              </div>
              <div className="bg-cyber-black/50 border border-cyan-500/30 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">Transaction Count</div>
                <div className="text-2xl font-bold text-cyan-400">{vaultTransactionCount}</div>
                <div className="text-[10px] text-gray-600 mt-1">Boost transactions</div>
              </div>
            </div>
          </div>
        )}

        {/* Mining Stats from API */}
        {miningSessionsCount > 0 && (
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/5 border border-cyan-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="text-lg font-bold text-cyan-400">Mining Statistics</h3>
                <p className="text-xs text-gray-400">Live data from Pond0x API</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-cyber-black/50 border border-cyan-500/30 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">In Mempool</div>
                <div className="text-xl font-bold text-cyan-400">{inMempool.toLocaleString()}</div>
              </div>
              <div className="bg-cyber-black/50 border border-green-500/30 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Sent</div>
                <div className="text-xl font-bold text-green-400">{sent}</div>
              </div>
              <div className="bg-cyber-black/50 border border-red-500/30 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Failed</div>
                <div className="text-xl font-bold text-red-400">{failed}</div>
              </div>
              <div className="bg-cyber-black/50 border border-yellow-500/30 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Drifted</div>
                <div className="text-xl font-bold text-yellow-400">{drifted}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-cyber-black/50 border border-ember-gold/30 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">SOL Price</div>
                <div className="text-2xl font-bold text-ember-gold">${estimatedSolUsd.toFixed(2)}</div>
              </div>
              <div className="bg-cyber-black/50 border border-purple-500/30 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">Max Claim Estimate</div>
                <div className="text-2xl font-bold text-purple-400">${maxClaimEstimateUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
            </div>
          </div>
        )}

        {/* Boost Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Open Swapper */}
          <div className="bg-gradient-to-br from-cyan-500/20 to-teal-600/10 border-2 border-cyan-500/40 rounded-xl p-6 space-y-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <div className="text-center">
              <div className="text-4xl mb-2">🤖</div>
              <h3 className="text-xl font-bold text-cyan-400 mb-2">Swap AutoBot</h3>
              <p className="text-xs text-gray-400 mb-4">
                Execute automated swaps to boost your mining rig
              </p>
            </div>
            <button
              onClick={onOpenSwapper}
              className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg font-bold text-sm text-white hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-cyber-black"
            >
              OPEN AUTOBOT
            </button>
            <p className="text-xs text-gray-500 text-center">
              +1/6 boost per swap • {OPTIMAL_BOOST_THRESHOLD} boost = 100% power
            </p>
          </div>

          {/* Permanent Boost */}
          <div className="bg-gradient-to-br from-ember-gold/20 to-ember-orange/10 border-2 border-ember-gold/40 rounded-xl p-6 space-y-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
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
              onClick={async () => {
                const val = parseFloat(permanentBoostInput);
                if (val >= MIN_PERMANENT_BOOST_SOL) {
                  setBoostLoading(true);
                  try {
                    await onSendPermanentBoost(val);
                    setPermanentBoostInput("");
                  } finally {
                    setBoostLoading(false);
                  }
                }
              }}
              disabled={!wallet || parseFloat(permanentBoostInput) < MIN_PERMANENT_BOOST_SOL || boostLoading}
              className={cn(
                "w-full px-4 py-3 rounded-lg font-bold text-sm text-white transition-all focus:outline-none focus:ring-2 focus:ring-ember-gold focus:ring-offset-2 focus:ring-offset-cyber-black",
                boostLoading
                  ? "bg-gradient-to-r from-ember-gold/50 to-ember-amber/50 cursor-wait"
                  : "bg-gradient-to-r from-ember-gold to-ember-amber hover:shadow-ember-gold hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
              )}
            >
              {boostLoading ? "SENDING..." : "BOOST RIG"}
            </button>
            <p className="text-xs text-gray-500 text-center">+10% power +15% health</p>
          </div>

          {/* Luck Burn */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/10 border-2 border-purple-500/40 rounded-xl p-6 space-y-4 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
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
              onClick={async () => {
                const val = parseFloat(luckBurnInput);
                if (val >= MIN_LUCK_SOL) {
                  setLuckLoading(true);
                  try {
                    await onSendLuckBurn(val);
                    setLuckBurnInput("");
                  } finally {
                    setLuckLoading(false);
                  }
                }
              }}
              disabled={!wallet || parseFloat(luckBurnInput) < MIN_LUCK_SOL || luckLoading}
              className={cn(
                "w-full px-4 py-3 rounded-lg font-bold text-sm text-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-cyber-black",
                luckLoading
                  ? "bg-gradient-to-r from-purple-500/50 to-pink-600/50 cursor-wait"
                  : "bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
              )}
            >
              {luckLoading ? "SENDING..." : "SEND LUCK BURN"}
            </button>
            <p className="text-xs text-gray-500 text-center">+5% health +luck points</p>
          </div>
        </div>
      </div>
    </section>
  );
}
