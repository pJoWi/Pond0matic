"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { SwapMode } from "@/types/swapModes";
import { DEFAULT_BOOST_CONFIG, DEFAULT_REWARDS_CONFIG } from "@/types/swapModes";

export type DashboardType = "pond0x" | "void" | "aqua";

// Token mint addresses
const SOL_MINT_ADDRESS = "So11111111111111111111111111111111111111112";
const USDC_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const WPOND_MINT_ADDRESS = "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq";

interface StatusBarProps {
  wallet: string;
  isConnected: boolean;
  connecting: boolean;
  onConnect: () => Promise<void> | Promise<string>;
  onDisconnect: () => Promise<void>;
  rpc: string;
  jupiterApiKey: string;
  onJupiterApiKeyChange: (key: string) => void;
  affiliate: string;
  onAffiliateChange: (value: "pond0x" | "aquavaults") => void;
  currentVault?: string | null;
  swapMode: SwapMode;
  onSwapModeChange: (mode: SwapMode) => void;
  isSwapper: boolean;
  currentDashboard?: DashboardType;
  onDashboardChange?: (dashboard: DashboardType) => void;
  swapProgress?: {
    current: number;
    total: number;
    status: "idle" | "running";
  };
  embedded?: boolean;
  inline?: boolean;
  // Swap control handlers
  onStart?: () => void;
  onStop?: () => void;
  // Context setters for applying defaults
  setFromMint?: (mint: string) => void;
  setToMint?: (mint: string) => void;
  setAmount?: (amount: string) => void;
  setMaxAmount?: (amount: string) => void;
  setSwapsPerRound?: (count: number) => void;
  setNumberOfRounds?: (rounds: number) => void;
  setSwapDelayMs?: (ms: number) => void;
  setNumberOfSwaps?: (swaps: number) => void;
  log?: (message: string) => void;
}

export function StatusBar({
  wallet,
  isConnected,
  connecting,
  onConnect,
  onDisconnect,
  rpc,
  jupiterApiKey,
  onJupiterApiKeyChange,
  affiliate,
  onAffiliateChange,
  currentVault,
  swapMode,
  onSwapModeChange,
  isSwapper,
  currentDashboard = "pond0x",
  onDashboardChange,
  swapProgress,
  embedded = false,
  inline = false,
  onStart,
  onStop,
  setFromMint,
  setToMint,
  setAmount,
  setMaxAmount,
  setSwapsPerRound,
  setNumberOfRounds,
  setSwapDelayMs,
  setNumberOfSwaps,
  log,
}: StatusBarProps) {
  const modeTheme = {
    normal: {
      border: "border-lily-green/60",
      text: "text-lily-bright",
      glow: "shadow-[0_0_24px_rgba(107,157,120,0.35)]",
      bar: "linear-gradient(135deg, rgba(74,124,89,0.7), rgba(139,196,159,0.9))",
    },
    boost: {
      border: "border-orange-500/70",
      text: "text-orange-200",
      glow: "shadow-[0_0_24px_rgba(255,107,53,0.35)]",
      bar: "linear-gradient(135deg, rgba(255,107,53,0.8), rgba(249,115,22,0.9))",
    },
    rewards: {
      border: "border-cyan-400/70",
      text: "text-cyan-200",
      glow: "shadow-[0_0_24px_rgba(109,213,237,0.35)]",
      bar: "linear-gradient(135deg, rgba(109,213,237,0.8), rgba(33,147,176,0.9))",
    },
  }[swapMode];

  const dashboardLabel = {
    pond0x: "Pond0x",
    void: "The Void",
    aqua: "Aqua",
  }[currentDashboard];

  const progress = swapProgress ?? { current: 0, total: 0, status: "idle" as const };
  const ratio = progress.total > 0 ? Math.min(100, Math.max(0, (progress.current / progress.total) * 100)) : 0;

  /**
   * Handle mode change with automatic defaults application
   * - Normal mode: SOL → wPOND, clear amounts
   * - Boost mode: USDC → SOL, apply boost defaults
   * - Rewards mode: USDC → SOL, apply rewards defaults
   */
  const handleModeChangeWithDefaults = (mode: SwapMode) => {
    // Set the mode
    onSwapModeChange(mode);

    if (mode === "normal") {
      // Normal mode: SOL → wPOND, set default amount
      setFromMint?.(SOL_MINT_ADDRESS);
      setToMint?.(WPOND_MINT_ADDRESS);
      setAmount?.("0.01");
      setMaxAmount?.("");
      log?.("Mode: Normal | SOL → wPOND | 0.01 SOL");
    } else if (mode === "boost") {
      // Boost mode: USDC → SOL, apply boost defaults
      setFromMint?.(USDC_MINT_ADDRESS);
      setToMint?.(SOL_MINT_ADDRESS);
      setAmount?.(DEFAULT_BOOST_CONFIG.minAmount);
      setMaxAmount?.(DEFAULT_BOOST_CONFIG.maxAmount);
      setSwapsPerRound?.(DEFAULT_BOOST_CONFIG.swapsPerRound);
      setNumberOfRounds?.(DEFAULT_BOOST_CONFIG.numberOfRounds);
      setSwapDelayMs?.(DEFAULT_BOOST_CONFIG.delayMs);
      log?.(`Mode: Boost | USDC → SOL | ${DEFAULT_BOOST_CONFIG.swapsPerRound} swaps × ${DEFAULT_BOOST_CONFIG.numberOfRounds} rounds`);
    } else if (mode === "rewards") {
      // Rewards mode: USDC → SOL, apply rewards defaults
      setFromMint?.(USDC_MINT_ADDRESS);
      setToMint?.(SOL_MINT_ADDRESS);
      setAmount?.(DEFAULT_REWARDS_CONFIG.amount);
      setNumberOfSwaps?.(DEFAULT_REWARDS_CONFIG.numberOfSwaps);
      log?.(`Mode: Rewards | USDC → SOL | ${DEFAULT_REWARDS_CONFIG.amount} USDC × ${DEFAULT_REWARDS_CONFIG.numberOfSwaps} swaps`);
    }
  };

  if (inline) {
    const [open, setOpen] = useState(true);
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[12px] text-text-secondary px-1">
          <div className="flex items-center gap-2">
            <span>Status</span>
            <StatusLEDs
              isConnected={isConnected}
              swapStatus={progress.status}
              swapMode={swapMode}
              palette={modeTheme}
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-pond-bright/30 bg-pond-deep/60 text-white text-[12px] hover:bg-pond-water/50 transition"
            aria-expanded={open}
          >
            ⚙️
            <span className="hidden sm:inline">{open ? "Hide" : "Show"}</span>
          </button>
        </div>
        <div
          className={cn(
            "grid md:grid-cols-3",
            "transition-all duration-200",
            open ? "gap-1" : "max-h-0 overflow-hidden"
          )}
          style={{ maxHeight: open ? "1000px" : "0px" }}
        >
          {open && (
            <>
              <DashboardModule
                currentDashboard={currentDashboard}
                onChange={onDashboardChange}
                compact
              />
              <SwapModeModule
                swapMode={swapMode}
                onSwapModeChange={handleModeChangeWithDefaults}
                palette={modeTheme}
                isSwapper={isSwapper}
                progress={progress}
                ratio={ratio}
                compact
                onStart={onStart}
                onStop={onStop}
              />
              <SwapInfoModule
                currentVault={currentVault}
                affiliate={affiliate}
                onAffiliateChange={onAffiliateChange}
                jupiterApiKey={jupiterApiKey}
                onJupiterApiKeyChange={onJupiterApiKeyChange}
                progress={progress}
                compact
              />
            </>
          )}
        </div>
      </div>
    );
  }

  const containerClass = embedded
    ? "relative z-30"
    : "fixed left-0 right-0 z-40 px-4 sm:px-6 top-[142px] md:top-[118px] lg:top-[106px]";

  const shellPadding = embedded ? "p-1.5" : "px-3 sm:px-4 py-2";

  return (
    <div className={containerClass}>
      <div className="max-w-6xl mx-auto">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl",
            "bg-gradient-to-br from-pond-deep/90 via-pond-water/80 to-pond-deep/85",
            shellPadding
          )}
          style={{ boxShadow: "0 10px 35px rgba(0,0,0,0.35)" }}
        >
          <StatusBackground />
          <div className="grid gap-1 md:grid-cols-3">
            <DashboardModule
              currentDashboard={currentDashboard}
              onChange={onDashboardChange}
              compact
            />
            <SwapModeModule
              swapMode={swapMode}
              onSwapModeChange={handleModeChangeWithDefaults}
              palette={modeTheme}
              isSwapper={isSwapper}
              progress={progress}
              ratio={ratio}
              compact
              onStart={onStart}
              onStop={onStop}
            />
            <SwapInfoModule
              currentVault={currentVault}
              affiliate={affiliate}
              onAffiliateChange={onAffiliateChange}
              jupiterApiKey={jupiterApiKey}
              onJupiterApiKeyChange={onJupiterApiKeyChange}
              progress={progress}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusLEDs({
  isConnected,
  swapStatus,
  swapMode,
  palette,
}: {
  isConnected: boolean;
  swapStatus: "idle" | "running";
  swapMode: SwapMode;
  palette: { border: string; text: string; glow: string; bar: string };
}) {
  const modeLEDColors = {
    normal: { bg: "bg-lily-green", glow: "shadow-lily-green/60" },
    boost: { bg: "bg-orange-400", glow: "shadow-orange-400/60" },
    rewards: { bg: "bg-cyan-400", glow: "shadow-cyan-400/60" },
  }[swapMode];

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/20 border border-white/10">
      {/* Connection LED */}
      <div className="flex items-center gap-1" title={isConnected ? "Wallet Connected" : "Wallet Disconnected"}>
        <div
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-300",
            isConnected
              ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
              : "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
          )}
        />
      </div>

      {/* Activity LED */}
      <div className="flex items-center gap-1" title={swapStatus === "running" ? "Swap Running" : "Swap Idle"}>
        <div
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-300",
            swapStatus === "running"
              ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse"
              : "bg-slate-500 shadow-[0_0_4px_rgba(100,116,139,0.5)]"
          )}
        />
      </div>

      {/* Mode LED */}
      <div className="flex items-center gap-1" title={`Mode: ${swapMode.toUpperCase()}`}>
        <div
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-300",
            modeLEDColors.bg,
            modeLEDColors.glow
          )}
          style={{
            boxShadow: swapMode === "normal"
              ? "0 0 6px rgba(107,157,120,0.8)"
              : swapMode === "boost"
              ? "0 0 6px rgba(251,146,60,0.8)"
              : "0 0 6px rgba(34,211,238,0.8)"
          }}
        />
      </div>
    </div>
  );
}

function StatusBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 10% 10%, rgba(74,143,184,0.15), transparent 35%), radial-gradient(circle at 90% 30%, rgba(240,198,116,0.12), transparent 30%), radial-gradient(circle at 50% 80%, rgba(139,196,159,0.18), transparent 35%)",
          filter: "blur(32px)",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent animate-pulse" />
    </div>
  );
}

function DashboardModule({
  currentDashboard,
  onChange,
  compact,
}: {
  currentDashboard: DashboardType;
  onChange?: (dashboard: DashboardType) => void;
  compact?: boolean;
}) {
  const labels: Record<DashboardType, string> = {
    pond0x: "Pond0x",
    void: "The Void",
    aqua: "Aqua",
  };
  const options: DashboardType[] = ["pond0x", "void"];

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-[11px] uppercase tracking-[0.1em] text-text-muted">Dashboard</p>
        </div>
      </div>
      <div className="mt-1">
        <select
          value={currentDashboard}
          onChange={(e) => onChange?.(e.target.value as DashboardType)}
          className="w-full bg-pond-deep/60 border border-pond-bright/30 rounded-lg px-2 py-1.5 text-[13px] text-white focus:outline-none focus:border-pond-bright/60 focus:ring-1 focus:ring-pond-bright/40"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {labels[opt]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function SwapModeModule({
  swapMode,
  onSwapModeChange,
  palette,
  isSwapper,
  progress,
  ratio,
  compact,
  onStart,
  onStop,
}: {
  swapMode: SwapMode;
  onSwapModeChange: (mode: SwapMode) => void;
  palette: { border: string; text: string; glow: string; bar: string };
  isSwapper: boolean;
  progress: { current: number; total: number; status: "idle" | "running" };
  ratio: number;
  compact?: boolean;
  onStart?: () => void;
  onStop?: () => void;
}) {
  const modes: SwapMode[] = ["normal", "boost", "rewards"];
  const handleCycle = () => {
    const idx = modes.indexOf(swapMode);
    onSwapModeChange(modes[(idx + 1) % modes.length]);
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-white/5 p-1.5 transition-all duration-300",
        palette.border,
        palette.glow,
        "hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.1em] text-text-muted">Swap mode</p>
        <div className="flex items-center gap-1">
          {/* Play/Stop buttons */}
          {onStart && onStop && (
            progress.status === "idle" ? (
              <button
                type="button"
                onClick={onStart}
                className="text-[11px] px-2 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-200 shadow-[0_0_8px_rgba(52,211,153,0.2)]"
                title="Start swap with current mode defaults"
              >
                ▶ Play
              </button>
            ) : (
              <button
                type="button"
                onClick={onStop}
                className="text-[11px] px-2 py-1 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                title="Stop swap"
              >
                ■ Stop
              </button>
            )
          )}
          {/* Mode cycle button */}
          <button
            type="button"
            onClick={handleCycle}
            className="text-[11px] px-2 py-1 rounded-lg border border-white/10 text-text-secondary hover:text-white hover:border-white/30 transition-all duration-200"
            title="Cycle mode (applies defaults)"
          >
            Mode
          </button>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className={cn("text-[13px] font-semibold", palette.text)}>{swapMode.toUpperCase()}</span>
        </div>
        <div className="text-right text-[11px] text-text-secondary">
          <p>Status</p>
          <p className={cn("font-semibold", progress.status === "running" ? "text-emerald-200" : "text-text-secondary")}>
            {progress.status === "running" ? "Running" : "Idle"}
          </p>
        </div>
      </div>
      <div className="mt-1.5 space-y-1">
        <div className="flex justify-between text-[11px] text-text-secondary">
          <span>Swap progression</span>
          <span className="text-white font-semibold">
            {progress.total > 0 ? `Swap ${progress.current} / ${progress.total}` : "No swaps"}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden border border-white/5">
          <div
            className="h-full rounded-full"
            style={{ width: `${ratio}%`, background: palette.bar }}
          />
        </div>
      </div>
    </div>
  );
}

function SwapInfoModule({
  currentVault,
  affiliate,
  onAffiliateChange,
  jupiterApiKey,
  onJupiterApiKeyChange,
  progress,
  compact,
}: {
  currentVault?: string | null;
  affiliate: string;
  onAffiliateChange: (value: "pond0x" | "aquavaults") => void;
  jupiterApiKey: string;
  onJupiterApiKeyChange: (key: string) => void;
  progress: { current: number; total: number; status: "idle" | "running" };
  compact?: boolean;
}) {
  const [showApiKey, setShowApiKey] = React.useState(false);

  const formatVault = () => {
    if (!currentVault) return "Not linked";
    return currentVault.length > 10
      ? `${currentVault.slice(0, 4)}...${currentVault.slice(-4)}`
      : currentVault;
  };

  const formatApiKey = () => {
    if (!jupiterApiKey) return "Not set";
    return jupiterApiKey.length > 10
      ? `${jupiterApiKey.slice(0, 4)}...${jupiterApiKey.slice(-4)}`
      : jupiterApiKey;
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.1em] text-text-muted">Swap info</p>
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded-full border",
            progress.status === "running"
              ? "border-emerald-400/50 text-emerald-200"
              : "border-white/15 text-text-secondary"
          )}
        >
          {progress.status === "running" ? "Running" : "Idle"}
        </span>
      </div>
      <div className="mt-1 space-y-1.5">
        <div className="flex items-center justify-between text-[12px] text-text-secondary">
          <span>Affiliate</span>
          <select
            value={affiliate}
            onChange={(e) => onAffiliateChange(e.target.value as "pond0x" | "aquavaults")}
            className="bg-pond-deep/60 border border-pond-bright/30 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-pond-bright/60 focus:ring-1 focus:ring-pond-bright/40"
          >
            <option value="pond0x">Pond0x</option>
            <option value="aquavaults">AquaVaults</option>
          </select>
        </div>
        <div className="flex items-center justify-between text-[12px] text-text-secondary">
          <span>Fee vault</span>
          <span className="text-white font-semibold">{formatVault()}</span>
        </div>
        <div className="flex items-center justify-between text-[12px] text-text-secondary">
          <span>Jupiter API</span>
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="text-white font-semibold hover:text-cyan-300 transition-colors"
            title={jupiterApiKey ? "Click to edit API key" : "Click to set API key"}
          >
            {formatApiKey()}
          </button>
        </div>
        {showApiKey && (
          <div className="pt-1 space-y-1">
            <input
              type="password"
              value={jupiterApiKey}
              onChange={(e) => onJupiterApiKeyChange(e.target.value)}
              placeholder="Enter Jupiter API key..."
              className="w-full bg-pond-deep/60 border border-cyan-500/30 rounded-lg px-2 py-1.5 text-[11px] text-white font-mono focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40"
            />
            <div className="text-[9px] text-text-muted">
              Get your free API key at{" "}
              <a
                href="https://portal.jup.ag"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                portal.jup.ag
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
