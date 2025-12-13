"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { SwapMode } from "@/types/swapModes";

export type DashboardType = "pond0x" | "void" | "aqua";

interface StatusBarProps {
  wallet: string;
  isConnected: boolean;
  connecting: boolean;
  onConnect: () => Promise<void> | Promise<string>;
  onDisconnect: () => Promise<void>;
  rpc: string;
  onRpcChange: (rpc: string) => void;
  affiliate: string;
  onAffiliateChange: (value: "pond0x" | "aquavaults") => void;
  currentVault?: string | null;
  swapMode: SwapMode;
  onSwapModeChange: (mode: SwapMode) => void;
  isSwapper: boolean;
  currentDashboard?: DashboardType;
  onDashboardChange?: (dashboard: DashboardType) => void;
}

export function StatusBar({
  wallet,
  isConnected,
  connecting,
  onConnect,
  onDisconnect,
  rpc,
  onRpcChange,
  affiliate,
  onAffiliateChange,
  currentVault,
  swapMode,
  onSwapModeChange,
  isSwapper,
  currentDashboard = "pond0x",
  onDashboardChange,
}: StatusBarProps) {
  // Mode-based theme colors for buttons only
  const modeTheme = {
    normal: {
      buttonGradient: "from-lily-green to-emerald-600",
      buttonBorder: "border-lily-green/60",
      buttonGlow: "rgba(107, 157, 120, 0.4)",
      buttonHover: "hover:shadow-[0_0_20px_rgba(107,157,120,0.5)]",
    },
    boost: {
      buttonGradient: "from-orange-500 to-red-600",
      buttonBorder: "border-orange-500/60",
      buttonGlow: "rgba(255, 107, 53, 0.4)",
      buttonHover: "hover:shadow-[0_0_20px_rgba(255,107,53,0.5)]",
    },
    rewards: {
      buttonGradient: "from-cyan-400 to-blue-600",
      buttonBorder: "border-cyan-400/60",
      buttonGlow: "rgba(109, 213, 237, 0.4)",
      buttonHover: "hover:shadow-[0_0_20px_rgba(109,213,237,0.5)]",
    },
  }[swapMode];

  return (
    <div
      className="relative z-30 animate-in slide-in-from-bottom-4 duration-500"
      style={{ filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.35))" }}
    >
      {/* Circuitboard background pattern */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none opacity-30">
        {/* Horizontal circuit lines */}
        <div className="absolute top-[20%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lily-green/40 to-transparent" style={{ animation: "circuit-glow 3s ease-in-out infinite" }} />
        <div className="absolute top-[40%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lily-green/40 to-transparent" style={{ animation: "circuit-glow 4s ease-in-out infinite 0.5s" }} />
        <div className="absolute top-[60%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lily-green/40 to-transparent" style={{ animation: "circuit-glow 3.5s ease-in-out infinite 1s" }} />
        <div className="absolute top-[80%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lily-green/40 to-transparent" style={{ animation: "circuit-glow 4.5s ease-in-out infinite 1.5s" }} />

        {/* Vertical circuit lines */}
        <div className="absolute left-[15%] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-lily-green/30 to-transparent" style={{ animation: "circuit-glow 4s ease-in-out infinite 0.3s" }} />
        <div className="absolute left-[35%] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-lily-green/30 to-transparent" style={{ animation: "circuit-glow 3.5s ease-in-out infinite 0.8s" }} />
        <div className="absolute left-[55%] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-lily-green/30 to-transparent" style={{ animation: "circuit-glow 4s ease-in-out infinite 1.2s" }} />
        <div className="absolute left-[75%] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-lily-green/30 to-transparent" style={{ animation: "circuit-glow 3.8s ease-in-out infinite 1.6s" }} />

        {/* Circuit nodes at intersections */}
        <div className="absolute top-[20%] left-[15%] w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: "spark-pulse 2s ease-in-out infinite" }} />
        <div className="absolute top-[40%] left-[35%] w-1.5 h-1.5 rounded-full bg-orange-400" style={{ animation: "spark-pulse 2.5s ease-in-out infinite 0.5s" }} />
        <div className="absolute top-[60%] left-[55%] w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: "spark-pulse 2.2s ease-in-out infinite 1s" }} />
        <div className="absolute top-[80%] left-[75%] w-1.5 h-1.5 rounded-full bg-orange-400" style={{ animation: "spark-pulse 2.8s ease-in-out infinite 1.5s" }} />

        {/* Traveling sparks */}
        <div className="absolute top-[40%] left-0 right-0 h-0.5">
          <div className="absolute w-8 h-full bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full" style={{ animation: "spark-travel 4s linear infinite" }} />
        </div>
        <div className="absolute top-[60%] left-0 right-0 h-0.5">
          <div className="absolute w-8 h-full bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full" style={{ animation: "spark-travel 5s linear infinite 2s" }} />
        </div>
      </div>

      <div
        className={cn(
          "relative grid gap-2 rounded-2xl px-4 py-3 transition-all duration-500",
          "grid-cols-1 md:grid-cols-4",
          "bg-gradient-to-br from-lily-green/15 via-pond-deep/90 to-lily-green/20",
          "border border-lily-green/30 backdrop-blur-xl",
          "hover:border-lily-green/70 hover:shadow-[0_0_30px_rgba(74,124,89,0.25)]"
        )}
        style={{
          boxShadow: "0 0 15px rgba(74, 124, 89, 0.15)",
        }}
      >
        {/* Card 1: Wallet Connection */}
        <ConnectionCard
          wallet={wallet}
          isConnected={isConnected}
          connecting={connecting}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />

        {/* Card 2: Affiliate (swapper) or RPC (dashboard) */}
        {isSwapper ? (
          <AffiliateCard
            current={affiliate as "pond0x" | "aquavaults"}
            onChange={onAffiliateChange}
          />
        ) : (
          <RpcCard rpc={rpc} onRpcChange={onRpcChange} />
        )}

        {/* Card 3: Swap Mode (swapper) or Affiliate (dashboard) */}
        {isSwapper ? (
          <SwapModeCard mode={swapMode} onModeChange={onSwapModeChange} theme={modeTheme} />
        ) : (
          <AffiliateDisplayCard affiliate={affiliate} />
        )}

        {/* Card 4: Fee Vault (swapper) or Dashboard Switcher (dashboard) */}
        {isSwapper ? (
          <FeeVaultCard currentVault={currentVault} />
        ) : (
          <DashboardSwitcherCard
            currentDashboard={currentDashboard}
            onDashboardChange={onDashboardChange}
            isConnected={isConnected}
          />
        )}
      </div>
    </div>
  );
}

// ============ SUB-COMPONENTS ============

function ConnectionCard({
  wallet,
  isConnected,
  connecting,
  onConnect,
  onDisconnect,
}: {
  wallet: string;
  isConnected: boolean;
  connecting: boolean;
  onConnect: () => Promise<void> | Promise<string>;
  onDisconnect: () => Promise<void>;
}) {
  const formatAddress = (addr: string) => {
    if (!addr) return "Not connected";
    return addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-300 group">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "w-2.5 h-2.5 rounded-full shadow-lg transition-all duration-300",
            isConnected ? "bg-emerald-400 shadow-emerald-400/50" : "bg-amber-300 shadow-amber-300/50",
            connecting && "animate-pulse scale-110"
          )}
          style={{
            boxShadow: isConnected
              ? "0 0 10px rgba(52, 211, 153, 0.6)"
              : "0 0 10px rgba(252, 211, 77, 0.6)"
          }}
        />
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors duration-300 group-hover:text-lily-bright">
            Connection
          </span>
          <span className="text-sm font-semibold text-white">
            {isConnected ? "Connected" : connecting ? "Connecting..." : "Disconnected"}
          </span>
          <span className="text-[12px] text-text-secondary font-mono">{formatAddress(wallet)}</span>
        </div>
      </div>
      <div className="ml-auto">
        <button
          onClick={isConnected ? onDisconnect : onConnect}
          disabled={connecting}
          className={cn(
            "text-xs px-3 py-1 rounded-lg border font-semibold transition-all duration-200",
            connecting
              ? "border-lily-green/20 bg-lily-green/10 text-white/50 cursor-not-allowed"
              : "border-lily-green/40 bg-lily-green/20 text-white hover:border-lily-bright hover:bg-lily-green/30 hover:shadow-[0_0_12px_var(--glow-green)] hover:scale-105 active:scale-95"
          )}
        >
          {connecting ? "Connecting..." : isConnected ? "Disconnect" : "Connect"}
        </button>
      </div>
    </div>
  );
}

function RpcCard({ rpc, onRpcChange }: { rpc: string; onRpcChange: (rpc: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [rpcInput, setRpcInput] = useState(rpc);
  const [error, setError] = useState<string | null>(null);

  const validateRpcUrl = (url: string): { valid: boolean; error?: string } => {
    if (!url.trim()) {
      return { valid: false, error: "RPC URL cannot be empty" };
    }

    try {
      const parsedUrl = new URL(url.trim());
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return { valid: false, error: "URL must use HTTP or HTTPS protocol" };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "Invalid URL format" };
    }
  };

  const handleSet = () => {
    const validation = validateRpcUrl(rpcInput);
    if (validation.valid) {
      onRpcChange(rpcInput.trim());
      setIsEditing(false);
      setError(null);
    } else {
      setError(validation.error || "Invalid RPC URL");
    }
  };

  const handleCancel = () => {
    setRpcInput(rpc);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border cursor-pointer transition-all duration-300 group active:scale-95",
          isEditing
            ? "border-pond-bright/40 bg-white/8 shadow-[0_0_15px_rgba(74,143,184,0.2)]"
            : "border-white/10 hover:bg-white/8 hover:border-white/20 hover:shadow-[0_0_15px_rgba(74,143,184,0.2)]"
        )}
        onClick={() => setIsEditing(!isEditing)}
        title="Click to edit RPC"
      >
        <span className={cn(
          "text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-300",
          isEditing ? "text-pond-bright" : "text-text-muted group-hover:text-pond-bright"
        )}>
          RPC
        </span>
        <span className="text-sm text-white truncate max-w-[180px] font-mono">{rpc}</span>
        <span className={cn(
          "text-[11px] px-2 py-0.5 rounded-full border transition-all duration-300 ml-auto",
          isEditing
            ? "bg-pond-bright/20 border-pond-bright/40 text-pond-bright"
            : "bg-white/10 border-white/10 text-text-secondary group-hover:bg-white/15 group-hover:border-white/20"
        )}>
          {isEditing ? "Editing" : "Edit"}
        </span>
      </div>

      {/* Slide-down edit panel */}
      {isEditing && (
        <div className="absolute left-0 right-0 mt-2 rounded-lg border border-lily-green/30 bg-gradient-to-br from-pond-water/95 via-pond-deep/90 to-pond-water/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                RPC Endpoint URL
              </label>
              <input
                type="text"
                value={rpcInput}
                onChange={(e) => {
                  setRpcInput(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSet();
                  if (e.key === 'Escape') handleCancel();
                }}
                placeholder="https://api.mainnet-beta.solana.com"
                className={cn(
                  "w-full bg-black/30 border-2 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none transition-all duration-300 placeholder:text-text-muted/50",
                  error
                    ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/50"
                    : "border-lily-green/30 focus:border-lily-bright focus:ring-2 focus:ring-lily-green/50"
                )}
                autoFocus
              />
              {error && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                  <span>⚠️</span>
                  {error}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSet}
                className="flex-1 px-4 py-2 bg-lily-green/20 border-2 border-lily-green rounded-lg text-sm font-semibold text-lily-bright hover:bg-lily-green/30 hover:border-lily-bright hover:shadow-[0_0_15px_var(--glow-green)] hover:scale-105 active:scale-95 transition-all duration-300"
              >
                SET
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-red-500/20 border-2 border-red-500/40 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/30 hover:border-red-500/60 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AffiliateCard({
  current,
  onChange,
}: {
  current: "pond0x" | "aquavaults";
  onChange: (value: "pond0x" | "aquavaults") => void;
}) {
  const [open, setOpen] = useState(false);
  const options: Array<"pond0x" | "aquavaults"> = ["pond0x", "aquavaults"];
  const label = current === "aquavaults" ? "AquaVaults" : "Pond0x";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/8 hover:border-white/20 hover:shadow-[0_0_15px_rgba(107,157,120,0.2)] transition-all duration-300 group w-full"
      >
        <span className="text-xs font-semibold text-text-muted uppercase tracking-[0.1em] group-hover:text-lily-bright transition-colors duration-300">
          Affiliate
        </span>
        <span className="text-sm text-white flex-1">{label}</span>
        <span className={cn(
          "text-[10px] text-text-secondary transition-transform duration-300",
          open && "rotate-180"
        )}>▾</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-2 rounded-lg border border-lily-green/30 bg-pond-water/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm transition-all duration-200",
                opt === current
                  ? "text-white bg-lily-green/20 border-l-2 border-lily-bright"
                  : "text-text-secondary hover:bg-white/10 hover:text-white border-l-2 border-transparent"
              )}
            >
              {opt === "aquavaults" ? "AquaVaults" : "Pond0x"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AffiliateDisplayCard({ affiliate }: { affiliate: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-300 group">
      <span className="text-xs font-semibold text-text-muted uppercase tracking-[0.1em] group-hover:text-lily-bright transition-colors duration-300">
        Affiliate
      </span>
      <span className="text-sm text-white">
        {affiliate === "aquavaults" ? "AquaVaults" : "Pond0x"}
      </span>
      <span className="w-2.5 h-2.5 rounded-full bg-lily-bright shadow-[0_0_10px_var(--glow-green)] animate-pulse ml-auto" />
    </div>
  );
}

function SwapModeCard({
  mode,
  onModeChange,
  theme,
}: {
  mode: SwapMode;
  onModeChange: (mode: SwapMode) => void;
  theme?: any;
}) {
  const handleCycle = () => {
    const modes: SwapMode[] = ["normal", "boost", "rewards"];
    const idx = modes.indexOf(mode);
    onModeChange(modes[(idx + 1) % modes.length]);
  };

  const meta: Record<
    SwapMode,
    { label: string; gradient: string; border: string; hint: string; glow: string }
  > = {
    normal: {
      label: "Normal",
      gradient: "linear-gradient(135deg, #4a7c59, #8bc49f)",
      border: "rgba(139,196,159,0.5)",
      hint: "Single swap",
      glow: "rgba(107,157,120,0.3)",
    },
    boost: {
      label: "Boost",
      gradient: "linear-gradient(135deg, #ff6b35, #f97316)",
      border: "rgba(255,139,89,0.6)",
      hint: "Multi-round",
      glow: "rgba(255,107,53,0.3)",
    },
    rewards: {
      label: "Rewards",
      gradient: "linear-gradient(135deg, #6dd5ed, #2193b0)",
      border: "rgba(109,213,237,0.65)",
      hint: "Earn points",
      glow: "rgba(33,147,176,0.3)",
    },
  };

  const current = meta[mode];

  return (
    <button
      type="button"
      onClick={handleCycle}
      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold border bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20 hover:scale-102 active:scale-95 transition-all duration-300 group w-full"
      style={{
        boxShadow: `0 10px 28px rgba(0,0,0,0.25), 0 0 20px ${current.glow}`
      }}
    >
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] uppercase tracking-[0.08em] text-text-muted group-hover:text-white transition-colors duration-300">
          Swap Mode
        </span>
        <span className="text-sm text-white flex items-center gap-1">
          {current.label}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 group-hover:bg-white/15 transition-all duration-300">
            {current.hint}
          </span>
        </span>
      </div>
      <span
        className="w-8 h-8 rounded-full border shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"
        style={{
          background: current.gradient,
          borderColor: current.border,
          boxShadow: `0 0 12px ${current.glow}, 0 4px 8px rgba(0,0,0,0.3)`,
        }}
      />
    </button>
  );
}

function FeeVaultCard({ currentVault }: { currentVault?: string | null }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-300 group">
      <span className="text-xs font-semibold text-text-muted uppercase tracking-[0.1em] group-hover:text-pond-bright transition-colors duration-300">
        Fee Vault
      </span>
      <span className="text-sm text-white truncate max-w-[180px] font-mono">
        {currentVault || "Not set"}
      </span>
      <span className="w-2.5 h-2.5 rounded-full bg-pond-bright shadow-[0_0_10px_var(--glow-blue)] animate-pulse ml-auto" />
    </div>
  );
}

function DashboardSwitcherCard({
  currentDashboard,
  onDashboardChange,
  isConnected,
}: {
  currentDashboard: DashboardType;
  onDashboardChange?: (dashboard: DashboardType) => void;
  isConnected: boolean;
}) {
  const handleCycle = () => {
    if (!onDashboardChange) return;
    const dashboards: DashboardType[] = ["pond0x", "void", "aqua"];
    const idx = dashboards.indexOf(currentDashboard);
    onDashboardChange(dashboards[(idx + 1) % dashboards.length]);
  };

  const dashboardMeta: Record<
    DashboardType,
    { label: string; icon: string; gradient: string; border: string; glow: string }
  > = {
    pond0x: {
      label: "Pond0x",
      icon: "🐸",
      gradient: "linear-gradient(135deg, #4a7c59, #8bc49f)",
      border: "rgba(139,196,159,0.5)",
      glow: "rgba(107,157,120,0.3)",
    },
    void: {
      label: "The Void",
      icon: "🌌",
      gradient: "linear-gradient(135deg, #1a1a2e, #4a148c)",
      border: "rgba(138,43,226,0.5)",
      glow: "rgba(138,43,226,0.3)",
    },
    aqua: {
      label: "Aqua",
      icon: "💧",
      gradient: "linear-gradient(135deg, #0891b2, #06b6d4)",
      border: "rgba(6,182,212,0.5)",
      glow: "rgba(6,182,212,0.3)",
    },
  };

  const current = dashboardMeta[currentDashboard];

  return (
    <button
      type="button"
      onClick={handleCycle}
      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold border bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20 hover:scale-102 active:scale-95 transition-all duration-300 group w-full"
      style={{
        boxShadow: `0 10px 28px rgba(0,0,0,0.25), 0 0 20px ${current.glow}`
      }}
    >
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] uppercase tracking-[0.08em] text-text-muted group-hover:text-white transition-colors duration-300">
          Dashboard
        </span>
        <span className="text-sm text-white flex items-center gap-1.5">
          <span>{current.icon}</span>
          {current.label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          "w-2 h-2 rounded-full",
          isConnected
            ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] animate-pulse"
            : "bg-amber-400 shadow-[0_0_10px_rgba(252,211,77,0.6)]"
        )} />
        <span
          className="w-8 h-8 rounded-full border shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"
          style={{
            background: current.gradient,
            borderColor: current.border,
            boxShadow: `0 0 12px ${current.glow}, 0 4px 8px rgba(0,0,0,0.3)`,
          }}
        />
      </div>
    </button>
  );
}
