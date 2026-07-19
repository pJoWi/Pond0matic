"use client";
import React, { type CSSProperties, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { StatusBar, type DashboardType } from "./StatusBar";
import type { SwapMode } from "@/types/swapModes";
import { useBalances } from "@/hooks/useBalances";
import { TokenLogo } from "@/components/icons/tokens/TokenLogo";
import { useAlertsBadgeCount } from "@/hooks/useAlertsBadgeCount";

interface TopNavigationProps {
  theme: "dark" | "light";
  onThemeToggle: () => void;
  waterEffect: boolean;
  onWaterToggle: () => void;
  wallet: string;
  isConnected: boolean;
  connecting: boolean;
  onConnect: () => Promise<void> | Promise<string>;
  onDisconnect: () => Promise<void>;
  rpc: string;
  onRpcChange: (rpc: string) => void;
  jupiterApiKey: string;
  onJupiterApiKeyChange: (key: string) => void;
  affiliate: string;
  onAffiliateChange: (value: "pond0x" | "aquavaults") => void;
  currentVault?: string | null;
  swapMode: SwapMode;
  onSwapModeChange: (mode: SwapMode) => void;
  isSwapper: boolean;
  currentDashboard: DashboardType;
  onDashboardChange: (dashboard: DashboardType) => void;
  swapProgress?: {
    current: number;
    total: number;
    status: "idle" | "running";
  };
  // Swap control handlers
  onStart?: () => void;
  onStop?: () => void;
  // Dashboard data fetch handler
  onFetchDashboardData?: () => void;
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

export function TopNavigation({
  theme,
  onThemeToggle,
  waterEffect,
  onWaterToggle,
  wallet,
  isConnected,
  connecting,
  onConnect,
  onDisconnect,
  rpc,
  onRpcChange,
  jupiterApiKey,
  onJupiterApiKeyChange,
  affiliate,
  onAffiliateChange,
  currentVault,
  swapMode,
  onSwapModeChange,
  isSwapper,
  currentDashboard,
  onDashboardChange,
  swapProgress,
  onStart,
  onStop,
  onFetchDashboardData,
  setFromMint,
  setToMint,
  setAmount,
  setMaxAmount,
  setSwapsPerRound,
  setNumberOfRounds,
  setSwapDelayMs,
  setNumberOfSwaps,
  log,
}: TopNavigationProps) {
  const pathname = usePathname();
  const [editingRpc, setEditingRpc] = useState(false);
  const [rpcDraft, setRpcDraft] = useState(rpc);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [editingJupiterApiKey, setEditingJupiterApiKey] = useState(false);
  const [jupiterApiKeyDraft, setJupiterApiKeyDraft] = useState(jupiterApiKey);
  const [solPrice, setSolPrice] = useState<number>(0);
  const [isConnectionBarVisible, setIsConnectionBarVisible] = useState(true);

  // Fetch SOL balance
  const { solBalance } = useBalances(
    wallet,
    rpc,
    "So11111111111111111111111111111111111111112",
    log
  );

  const alertBadgeCount = useAlertsBadgeCount();

  useEffect(() => {
    setRpcDraft(rpc);
  }, [rpc]);

  useEffect(() => {
    setJupiterApiKeyDraft(jupiterApiKey);
  }, [jupiterApiKey]);

  // Fetch SOL price from Jupiter Price API
  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const response = await fetch(
          "https://lite-api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112"
        );
        const data = await response.json();
        const price = data?.So11111111111111111111111111111111111111112?.usdPrice;
        if (price) {
          setSolPrice(price);
        }
      } catch (error) {
        console.error("Failed to fetch SOL price:", error);
      }
    };

    fetchSolPrice();
    // Refresh price every 30 seconds
    const interval = setInterval(fetchSolPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { href: "/", label: "Dashboard", tone: "lily" as const },
    { href: "/swapper", label: "Swapper", tone: "wave" as const },
    { href: "/alerts", label: "Alerts", tone: "spark" as const, badgeCount: alertBadgeCount },
    { href: "/portfolio", label: "Portfolio", tone: "wave" as const },
  ];

  const validateRpcUrl = (value: string) => {
    if (!value.trim()) return "RPC URL cannot be empty";
    try {
      const url = new URL(value.trim());
      if (!["http:", "https:"].includes(url.protocol)) {
        return "URL must use http/https";
      }
      return null;
    } catch {
      return "Invalid URL format";
    }
  };

  const handleRpcSave = () => {
    const validation = validateRpcUrl(rpcDraft);
    if (validation) {
      setRpcError(validation);
      return;
    }
    onRpcChange(rpcDraft.trim());
    setEditingRpc(false);
    setRpcError(null);
  };

  const handleJupiterApiKeySave = () => {
    onJupiterApiKeyChange(jupiterApiKeyDraft.trim());
    setEditingJupiterApiKey(false);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl"
      style={{
        background:
          "linear-gradient(120deg, rgba(10, 20, 25, 0.94), rgba(14, 34, 48, 0.92))",
        borderBottom: "1px solid var(--theme-border, rgba(107,157,120,0.35))",
        boxShadow:
          "0 10px 40px rgba(0, 0, 0, 0.55), 0 0 24px var(--theme-glow-soft, rgba(107,157,120,0.25))",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 10%, rgba(74, 143, 184, 0.08), transparent 35%), radial-gradient(circle at 80% 0%, rgba(240, 198, 116, 0.08), transparent 30%), radial-gradient(circle at 50% 80%, rgba(139, 196, 159, 0.12), transparent 40%)",
          filter: "blur(36px)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(139, 196, 159, 0.55) 50%, transparent 100%)",
          animation: "shimmer 3s ease-in-out infinite",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 space-y-1.5">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-center gap-2 py-1.5">
          <LogoBadge />

          <nav
            className="relative flex items-center justify-center gap-1.5 rounded-2xl px-2 py-1 shadow-lg overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(26,58,82,0.95), rgba(10,18,26,0.9))",
              border: "1px solid var(--theme-border, rgba(107,157,120,0.25))",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
            }}
            aria-label="Primary navigation"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background: "linear-gradient(135deg, rgba(74,124,89,0.16), rgba(74,143,184,0.16), rgba(240,198,116,0.16))",
              backgroundSize: "220% 220%",
              animation: "gradient-shift 9s ease infinite",
            }}
          />
            <div className="flex items-center gap-[0.35rem] relative">
              {navItems.map((item) => (
                <NavButton
                  key={item.href}
                  href={item.href}
                  active={pathname === item.href}
                  label={item.label}
                  tone={item.tone}
                  badgeCount={"badgeCount" in item ? item.badgeCount : undefined}
                />
              ))}
            </div>
          </nav>

          <div className="flex items-center justify-end gap-1.5">
            <ToggleButton
              active={theme === "dark"}
              activeLabel="Dark"
              inactiveLabel="Dark"
              icon={<MoonIcon />}
              onClick={onThemeToggle}
              title="Dark mode"
              tone="lily"
            />
            <ToggleButton
              active={waterEffect}
              activeLabel="Water"
              inactiveLabel="Water"
              icon={<DropletIcon />}
              onClick={onWaterToggle}
              title="Pond water animation"
              tone="wave"
            />
          </div>
        </div>

<div className="border-t border-white/5">
            {/* Compact Navigation Bar */}
            <div className="flex items-center px-4 py-2.5 gap-3">
              {/* Left: Connection & Status */}
              <div className="flex items-center gap-2">
                {/* Connected Pill with Wallet Address */}
                <button
                  onClick={isConnected ? onDisconnect : onConnect}
                  disabled={connecting}
                  className={cn(
                    "group flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 min-w-[140px] justify-center",
                    "bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-md",
                    isConnected
                      ? "border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.25),0_0_40px_rgba(16,185,129,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]"
                      : "border-slate-600/30 hover:border-slate-500/50 hover:shadow-[0_0_12px_rgba(148,163,184,0.15)]"
                  )}
                >
                  <span className={cn("relative flex w-2 h-2")}>
                    <span className={cn(
                      "absolute inline-flex h-full w-full rounded-full opacity-75",
                      isConnected ? "bg-emerald-400 animate-ping-slow" : "bg-slate-600"
                    )}></span>
                    <span className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      isConnected ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,1)]" : "bg-slate-600"
                    )}></span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-200 tracking-tight">
                    {isConnected ? wallet.slice(0, 4) + "..." + wallet.slice(-4) : "Connect"}
                  </span>
                </button>

                {/* RPC - Clickable to Edit */}
                <div className="relative">
                  <button
                    onClick={() => setEditingRpc(!editingRpc)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 min-w-[140px] justify-center",
                      "bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-md",
                      "hover:border-cyan-400/50 hover:shadow-[0_0_12px_rgba(34,211,238,0.15)]",
                      rpc.length > 0
                        ? "border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.25),0_0_40px_rgba(34,211,238,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]"
                        : "border-slate-600/30"
                    )}
                  >
                    <span className={cn("relative flex w-2 h-2")}>
                      <span className={cn(
                        "absolute inline-flex h-full w-full rounded-full opacity-75",
                        rpc.length > 0 ? "bg-cyan-400 animate-ping-slow" : "bg-slate-600"
                      )}></span>
                      <span className={cn(
                        "relative inline-flex rounded-full h-2 w-2",
                        rpc.length > 0 ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)]" : "bg-slate-600"
                      )}></span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-200 tracking-tight">
                      {rpc.length > 0 ? (
                        <>
                          {rpc.includes('helius') ? 'Helius' :
                           rpc.includes('alchemy') ? 'Alchemy' :
                           rpc.includes('quicknode') ? 'QuickNode' :
                           rpc.slice(0, 8) + '...' + rpc.slice(-6)}
                        </>
                      ) : 'RPC'}
                    </span>
                  </button>

                  {/* RPC Edit Panel */}
                  {editingRpc && (
                    <div className="absolute top-full left-0 mt-2 z-50 w-96">
                      <div className="rounded-lg border border-cyan-400/40 bg-slate-900/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-cyan-300">Configure RPC Endpoint</span>
                          <button
                            onClick={() => setEditingRpc(false)}
                            className="text-slate-400 hover:text-white text-sm transition-colors"
                          >✕</button>
                        </div>
                        <input
                          type="text"
                          value={rpcDraft}
                          onChange={(e) => {
                            setRpcDraft(e.target.value);
                            if (rpcError) setRpcError(null);
                          }}
                          placeholder="https://mainnet.helius-rpc.com/?api-key=..."
                          className="w-full px-3 py-2 text-[11px] font-mono rounded-md border border-cyan-400/30 bg-slate-950/50 text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30"
                        />
                        {rpcError && <p className="text-[10px] text-red-400">{rpcError}</p>}
                        <p className="text-[9px] text-slate-400 leading-relaxed">Helius, Alchemy, or QuickNode recommended</p>
                        <button
                          onClick={handleRpcSave}
                          className="w-full px-3 py-2 text-[11px] font-semibold rounded-md bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 transition-all"
                        >
                          Save RPC Endpoint
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Jupiter API - Clickable to Edit */}
                <div className="relative">
                  <button
                    onClick={() => setEditingJupiterApiKey(!editingJupiterApiKey)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
                      "bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-md",
                      "hover:border-teal-400/50",
                      jupiterApiKey.length > 0
                        ? "border-teal-400/30 shadow-[0_0_12px_rgba(20,184,166,0.1)]"
                        : "border-slate-600/30"
                    )}
                  >
                    <span className={cn(
                      "relative flex w-2 h-2"
                    )}>
                      <span className={cn(
                        "absolute inline-flex h-full w-full rounded-full opacity-75",
                        jupiterApiKey.length > 0 ? "bg-teal-400 animate-ping-slow" : "bg-slate-600"
                      )}></span>
                      <span className={cn(
                        "relative inline-flex rounded-full h-2 w-2",
                        jupiterApiKey.length > 0 ? "bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,1)]" : "bg-slate-600"
                      )}></span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-200 tracking-tight">
                      {jupiterApiKey.length > 0 ? jupiterApiKey.slice(0, 4) + '...' + jupiterApiKey.slice(-4) : 'Jupiter API'}
                    </span>
                  </button>

                  {/* API Edit Panel */}
                  {editingJupiterApiKey && (
                    <div className="absolute top-full left-0 mt-2 z-50 w-96">
                      <div className="rounded-lg border border-teal-400/40 bg-slate-900/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-teal-300">Configure Jupiter API</span>
                          <button
                            onClick={() => setEditingJupiterApiKey(false)}
                            className="text-slate-400 hover:text-white text-sm transition-colors"
                          >✕</button>
                        </div>
                        <input
                          type="password"
                          value={jupiterApiKeyDraft}
                          onChange={(e) => setJupiterApiKeyDraft(e.target.value)}
                          placeholder="Enter Jupiter API key"
                          className="w-full px-3 py-2 text-[11px] font-mono rounded-md border border-teal-400/30 bg-slate-950/50 text-teal-100 placeholder-slate-500 focus:outline-none focus:border-teal-400/60 focus:ring-1 focus:ring-teal-400/30"
                        />
                        <p className="text-[9px] text-slate-400 leading-relaxed">Get yours at <span className="text-teal-400">jup.ag/api-keys</span></p>
                        <button
                          onClick={handleJupiterApiKeySave}
                          className="w-full px-3 py-2 text-[11px] font-semibold rounded-md bg-teal-500/20 border border-teal-400/40 text-teal-300 hover:bg-teal-500/30 transition-all"
                        >
                          Save API Key
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* SOL Balance with Token Logo */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-600/30 bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <span className="menu-icon text-slate-400 text-xs leading-none">☰</span>
                  <div className="flex items-center gap-1.5">
                    <TokenLogo symbol="SOL" size={14} />
                    <span className="text-xs font-bold text-white tracking-tight">{solBalance.toFixed(2)}</span>
                  </div>
                </div>

                {/* Fetch Data Button - Shows when connected + RPC + API */}
                {isConnected && rpc.length > 0 && jupiterApiKey.length > 0 && onFetchDashboardData && (
                  <button
                    onClick={onFetchDashboardData}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-400/40 bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 backdrop-blur-md hover:from-emerald-900/40 hover:to-emerald-800/30 transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]"
                  >
                    <span className="text-[10px] font-semibold text-emerald-300 tracking-tight">Fetch Data</span>
                  </button>
                )}
              </div>

            </div>

            <StatusBar
              wallet={wallet}
              isConnected={isConnected}
              connecting={connecting}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              rpc={rpc}
              jupiterApiKey={jupiterApiKey}
              onJupiterApiKeyChange={onJupiterApiKeyChange}
              affiliate={affiliate}
              onAffiliateChange={onAffiliateChange}
              currentVault={currentVault}
              swapMode={swapMode}
              onSwapModeChange={onSwapModeChange}
              isSwapper={isSwapper}
              currentDashboard={currentDashboard}
              onDashboardChange={onDashboardChange}
              swapProgress={swapProgress}
              inline
              onStart={onStart}
              onStop={onStop}
              setFromMint={setFromMint}
              setToMint={setToMint}
              setAmount={setAmount}
              setMaxAmount={setMaxAmount}
              setSwapsPerRound={setSwapsPerRound}
              setNumberOfRounds={setNumberOfRounds}
              setSwapDelayMs={setSwapDelayMs}
              setNumberOfSwaps={setNumberOfSwaps}
              log={log}
            />
          </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            opacity: 0.3;
            background-position: -200% 0;
          }
          50% {
            opacity: 0.6;
            background-position: 0% 0;
          }
          100% {
            opacity: 0.3;
            background-position: 200% 0;
          }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.75;
          }
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .menu-icon,
        .heart-icon,
        .chevron-icon {
          font-style: normal;
          user-select: none;
        }
      `}</style>
    </header>
  );
}

function UtilityBar({
  wallet,
  isConnected,
  connecting,
  onConnect,
  onDisconnect,
  rpc,
  editingRpc,
  onToggleRpc,
  rpcDraft,
  setRpcDraft,
  onRpcSave,
  onRpcCancel,
  rpcError,
}: {
  wallet: string;
  isConnected: boolean;
  connecting: boolean;
  onConnect: () => Promise<void> | Promise<string>;
  onDisconnect: () => Promise<void>;
  rpc: string;
  editingRpc: boolean;
  onToggleRpc: () => void;
  rpcDraft: string;
  setRpcDraft: (value: string) => void;
  onRpcSave: () => void;
  onRpcCancel: () => void;
  rpcError: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-black/10 bg-black/20 px-3 py-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
      <ConnectionPill
        wallet={wallet}
        isConnected={isConnected}
        connecting={connecting}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
      <RpcPill
        rpc={rpc}
        editing={editingRpc}
        onToggleEdit={onToggleRpc}
        rpcDraft={rpcDraft}
        onRpcDraftChange={setRpcDraft}
        onRpcSave={onRpcSave}
        onRpcCancel={onRpcCancel}
        error={rpcError}
      />
    </div>
  );
}

function LogoBadge() {
  return (
    <Link href="/" className="group flex items-center gap-3 w-fit" aria-label="Pond0matic Dashboard">
      <div className="relative">
        <span
          className="absolute inset-0 rounded-full blur-2xl opacity-60 transition group-hover:opacity-90"
          style={{ background: "radial-gradient(circle, var(--glow-blue, rgba(74,143,184,0.5)) 0%, transparent 60%)" }}
        />
        <img
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-[color:var(--theme-border,rgba(107,157,120,0.35))] shadow-lg shadow-[rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105"
          src="/pond0x-logo.png"
          alt="Pond0matic Logo"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.05), transparent 50%)",
            filter: "drop-shadow(0 0 10px var(--glow-blue, rgba(74,143,184,0.35)))",
          }}
        />
      </div>
      <div className="relative flex flex-col">
        {/* Bubble SVG Background */}
        <div className="absolute inset-0 -left-2 -right-2 -top-1 -bottom-1 overflow-hidden pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-500">
          <svg
            width="100%" height="100%" viewBox="0 0 30 30"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
            role="img" aria-label="Ascending bubbles with drift"
          >
            <defs>
              <radialGradient id="bubbleFill" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#E9FEFF" stopOpacity="0.35"/>
                <stop offset="55%" stopColor="#7BE6FF" stopOpacity="0.18"/>
                <stop offset="100%" stopColor="#7CFFB5" stopOpacity="0.08"/>
              </radialGradient>

              <linearGradient id="bubbleStroke" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#CFFBFF" stopOpacity="0.7"/>
                <stop offset="100%" stopColor="#7CFFB5" stopOpacity="0.55"/>
              </linearGradient>

              <filter id="bubbleGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="0.5"/>
              </filter>
            </defs>

            <g filter="url(#bubbleGlow)">
              <g>
                <animateTransform type="translate" attributeName="transform"
                  values="-1,20; 1,-10; -1,-30" dur="3.2s" begin="0s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;0.55;0" dur="3.2s" begin="0s" repeatCount="indefinite"/>
                <circle cx="6" cy="30" r="2.0" fill="url(#bubbleFill)" stroke="url(#bubbleStroke)" strokeWidth="0.7"/>
                <circle cx="5.3" cy="29.4" r="0.5" fill="#E9FEFF" opacity="0.55"/>
              </g>

              <g>
                <animateTransform type="translate" attributeName="transform"
                  values="1,22; -1,-12; 1,-32" dur="3.6s" begin="0.3s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;0.45;0" dur="3.6s" begin="0.3s" repeatCount="indefinite"/>
                <circle cx="9.5" cy="31" r="1.3" fill="url(#bubbleFill)" stroke="url(#bubbleStroke)" strokeWidth="0.6"/>
                <circle cx="9.1" cy="30.6" r="0.35" fill="#E9FEFF" opacity="0.45"/>
              </g>

              <g>
                <animateTransform type="translate" attributeName="transform"
                  values="-1,18; 0,-10; 1,-28" dur="2.8s" begin="0.6s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;0.6;0" dur="2.8s" begin="0.6s" repeatCount="indefinite"/>
                <circle cx="13.5" cy="30" r="1.9" fill="url(#bubbleFill)" stroke="url(#bubbleStroke)" strokeWidth="0.7"/>
                <circle cx="12.9" cy="29.3" r="0.45" fill="#E9FEFF" opacity="0.5"/>
              </g>

              <g>
                <animateTransform type="translate" attributeName="transform"
                  values="0,24; 1,-14; -1,-34" dur="4.0s" begin="0.9s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;0.42;0" dur="4.0s" begin="0.9s" repeatCount="indefinite"/>
                <circle cx="18.8" cy="32" r="1.1" fill="url(#bubbleFill)" stroke="url(#bubbleStroke)" strokeWidth="0.55"/>
                <circle cx="18.5" cy="31.6" r="0.28" fill="#E9FEFF" opacity="0.4"/>
              </g>

              <g>
                <animateTransform type="translate" attributeName="transform"
                  values="1,19; -1,-11; 0,-29" dur="3.1s" begin="1.2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;0.52;0" dur="3.1s" begin="1.2s" repeatCount="indefinite"/>
                <circle cx="22.3" cy="30" r="2.2" fill="url(#bubbleFill)" stroke="url(#bubbleStroke)" strokeWidth="0.75"/>
                <circle cx="21.5" cy="29.2" r="0.6" fill="#E9FEFF" opacity="0.55"/>
              </g>

              <g>
                <animateTransform type="translate" attributeName="transform"
                  values="-1,23; 1,-13; -1,-33" dur="3.8s" begin="1.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;0.45;0" dur="3.8s" begin="1.5s" repeatCount="indefinite"/>
                <circle cx="26.2" cy="32" r="1.4" fill="url(#bubbleFill)" stroke="url(#bubbleStroke)" strokeWidth="0.6"/>
                <circle cx="25.8" cy="31.4" r="0.32" fill="#E9FEFF" opacity="0.42"/>
              </g>

              <g>
                <animateTransform type="translate" attributeName="transform"
                  values="0,25; 0,-15; 0,-35" dur="4.5s" begin="1.9s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;0.3;0" dur="4.5s" begin="1.9s" repeatCount="indefinite"/>
                <circle cx="15.5" cy="33" r="0.8" fill="url(#bubbleFill)" stroke="url(#bubbleStroke)" strokeWidth="0.45"/>
              </g>

              <g>
                <animateTransform type="translate" attributeName="transform"
                  values="1,26; -1,-16; 1,-36" dur="5.0s" begin="2.2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;0.25;0" dur="5.0s" begin="2.2s" repeatCount="indefinite"/>
                <circle cx="11.5" cy="34" r="0.55" fill="#E9FEFF" opacity="0.35"/>
              </g>

              <g>
                <animateTransform type="translate" attributeName="transform"
                  values="-1,27; 1,-17; -1,-37" dur="5.4s" begin="2.6s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;0.22;0" dur="5.4s" begin="2.6s" repeatCount="indefinite"/>
                <circle cx="20.5" cy="35" r="0.6" fill="#E9FEFF" opacity="0.3"/>
              </g>
            </g>
          </svg>
        </div>

        <span
          className="relative text-lg sm:text-xl font-bold tracking-wider bg-clip-text text-transparent transition-all duration-500 group-hover:tracking-[0.18em]"
          style={{
            backgroundImage: "linear-gradient(120deg, var(--theme-primary), var(--theme-secondary), var(--pink-bright, #ffc0e3))",
            backgroundSize: "200% auto",
            animation: "gradient-shift 6s ease infinite",
          }}
        >
          Pond0matic
        </span>
        <span className="relative text-[11px] text-[color:var(--theme-text-muted)]">
          Dashboard / Swapper / AI Terminal
        </span>
      </div>
    </Link>
  );
}

type NavTone = "lily" | "wave" | "spark";

interface NavButtonProps {
  href: string;
  active: boolean;
  label: string;
  tone: NavTone;
  badgeCount?: number;
}

function NavButton({ href, active, label, tone, badgeCount }: NavButtonProps) {
  const tones: Record<
    NavTone,
    { from: string; to: string; border: string; glow: string; waterBase: string }
  > = {
    lily: {
      from: "var(--theme-primary)",
      to: "var(--theme-secondary)",
      border: "rgba(139, 196, 159, 0.55)",
      glow: "rgba(139, 196, 159, 0.28)",
      waterBase: "rgba(107, 157, 120, 0.15)",
    },
    wave: {
      from: "var(--pond-bright, #4a8fb8)",
      to: "var(--pond-light, #2d5f7f)",
      border: "rgba(74, 143, 184, 0.6)",
      glow: "rgba(74, 143, 184, 0.25)",
      waterBase: "rgba(74, 143, 184, 0.12)",
    },
    spark: {
      from: "var(--gold-light, #f0c674)",
      to: "var(--pink-bright, #ffc0e3)",
      border: "rgba(240, 198, 116, 0.6)",
      glow: "rgba(255, 192, 227, 0.26)",
      waterBase: "rgba(240, 198, 116, 0.1)",
    },
  };

  const vars = {
    "--tone-from": tones[tone].from,
    "--tone-to": tones[tone].to,
    "--tone-border": tones[tone].border,
    "--tone-glow": tones[tone].glow,
    "--tone-water": tones[tone].waterBase,
  } as CSSProperties;

  return (
    <Link
      href={href}
      className={cn(
        "group relative px-3 py-1.5 rounded-xl font-medium text-sm transition-all duration-300",
        "flex items-center gap-1.5 overflow-hidden",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--tone-border)] focus-visible:ring-offset-[rgba(13,31,45,0.8)]",
        active ? "text-white shadow-lg" : "text-[color:var(--theme-text-muted)] hover:text-white"
      )}
      style={{
        ...vars,
        border: active ? "1px solid var(--tone-border)" : "1px solid transparent",
        background: "transparent",
        boxShadow: active
          ? "0 8px 26px var(--tone-glow), 0 0 40px var(--tone-glow)"
          : "none",
      }}
      aria-current={active ? "page" : undefined}
    >
      {/* Pondwater ripple effect */}
      <span
        className={cn(
          "absolute inset-0 rounded-xl transition-all duration-500 pointer-events-none",
          active ? "opacity-50" : "opacity-0 group-hover:opacity-30"
        )}
        style={{
          background: "radial-gradient(circle at center, var(--tone-from) 0%, transparent 70%)",
          filter: "blur(12px)",
        }}
      />

      {/* Water shimmer effect */}
      <span
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: "linear-gradient(110deg, transparent 30%, var(--tone-glow) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 3s ease-in-out infinite",
        }}
      />

      {/* Flowing gradient background */}
      <span
        className={cn(
          "absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none",
          active ? "opacity-60" : "opacity-0 group-hover:opacity-40"
        )}
        style={{
          background: "linear-gradient(135deg, var(--tone-from), var(--tone-to))",
          filter: "blur(15px)",
        }}
      />

      {/* Content */}
      <span className="relative flex items-center gap-2 z-10">
        {/* Bubble indicator for active state */}
        {active && (
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{
              background: "var(--tone-from)",
              boxShadow: `0 0 8px var(--tone-from)`,
            }}
          />
        )}
        <span className="relative">{label}</span>
        {typeof badgeCount === "number" && badgeCount > 0 && (
          <span
            className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-amber-500/90 text-amber-50 shadow-[0_0_10px_rgba(251,191,36,0.7)]"
            aria-label={`${badgeCount} recent alert${badgeCount === 1 ? "" : "s"}`}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </span>

      {/* Enhanced border glow for active */}
      {active && (
        <span
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow:
              "0 0 0 1px var(--tone-border), inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 20px var(--tone-glow)",
          }}
        />
      )}
    </Link>
  );
}

function ToggleButton({
  active,
  activeLabel,
  inactiveLabel,
  icon,
  onClick,
  title,
  tone,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  tone: NavTone;
}) {
  const tones: Record<NavTone, { border: string; glow: string; surface: string }> = {
    lily: {
      border: "rgba(139, 196, 159, 0.6)",
      glow: "rgba(139, 196, 159, 0.35)",
      surface: "rgba(26, 58, 82, 0.75)",
    },
    wave: {
      border: "rgba(74, 143, 184, 0.6)",
      glow: "rgba(74, 143, 184, 0.35)",
      surface: "rgba(20, 38, 52, 0.75)",
    },
    spark: {
      border: "rgba(240, 198, 116, 0.55)",
      glow: "rgba(240, 198, 116, 0.3)",
      surface: "rgba(40, 30, 18, 0.7)",
    },
  };

  const toneValues = tones[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgba(255,255,255,0.4)] focus-visible:ring-offset-[rgba(13,31,45,0.9)]"
      style={{
        background: toneValues.surface,
        border: `1px solid ${active ? toneValues.border : "rgba(255,255,255,0.06)"}`,
        color: active
          ? "var(--theme-text)"
          : "var(--theme-text-muted, rgba(156,163,175,1))",
        boxShadow: active
          ? `0 0 0 1px ${toneValues.border}, 0 10px 28px ${toneValues.glow}`
          : "0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <span className="relative flex items-center gap-2">
        <span
          className={cn(
            "flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300",
            active ? "bg-white/15" : "bg-white/5"
          )}
          style={{
            boxShadow: active
              ? `0 0 14px ${toneValues.glow}`
              : "0 0 0 transparent",
          }}
        >
          <span className="text-base leading-none">{icon}</span>
        </span>
        <span className="hidden sm:inline">
          {active ? activeLabel : inactiveLabel}
        </span>
      </span>
    </button>
  );
}

function ConnectionPill({
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
    <button
      type="button"
      onClick={isConnected ? onDisconnect : onConnect}
      disabled={connecting}
      className={cn(
        "relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-sm font-semibold transition-all duration-300",
        "border bg-pond-deep/60 shadow-md hover:bg-pond-water/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-lily-bright/60",
        connecting && "opacity-70 cursor-not-allowed"
      )}
      style={{
        borderColor: isConnected ? "rgba(139,196,159,0.55)" : "rgba(255,255,255,0.12)",
        boxShadow: isConnected
          ? "0 8px 20px rgba(107,157,120,0.25)"
          : "0 1px 0 rgba(255,255,255,0.05)",
        background: isConnected
          ? "linear-gradient(135deg, rgba(74,124,89,0.24), rgba(139,196,159,0.28))"
          : "rgba(255,255,255,0.04)",
      }}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full shadow-lg transition-all duration-300",
          isConnected ? "bg-emerald-400 shadow-emerald-400/50" : "bg-amber-300 shadow-amber-300/50",
          connecting && "animate-pulse scale-110"
        )}
        style={{
          boxShadow: isConnected
            ? "0 0 8px rgba(52, 211, 153, 0.6)"
            : "0 0 8px rgba(252, 211, 77, 0.6)"
        }}
      />
      <div className="flex flex-col leading-tight">
        <span className="text-white text-sm">
          {connecting ? "Connecting..." : isConnected ? "Connected" : "Connect wallet"}
        </span>
        <span className="text-[11px] text-text-secondary font-mono">
          {formatAddress(wallet)}
        </span>
      </div>
    </button>
  );
}

function RpcPill({
  rpc,
  editing,
  onToggleEdit,
  rpcDraft,
  onRpcDraftChange,
  onRpcSave,
  onRpcCancel,
  error,
}: {
  rpc: string;
  editing: boolean;
  onToggleEdit: () => void;
  rpcDraft: string;
  onRpcDraftChange: (value: string) => void;
  onRpcSave: () => void;
  onRpcCancel: () => void;
  error: string | null;
}) {
  const hasValidRpc = rpc.length > 0 && !error;

  // Extract part after '=' if it exists (for API key display), otherwise show "Set"
  const getRpcDisplay = () => {
    if (!hasValidRpc) return "Not set";

    const equalsIndex = rpc.lastIndexOf('=');
    if (equalsIndex !== -1 && equalsIndex < rpc.length - 1) {
      const apiKeyPart = rpc.slice(equalsIndex + 1);
      if (apiKeyPart.length > 8) {
        return `${apiKeyPart.slice(0, 4)}${"•".repeat(Math.min(apiKeyPart.length - 8, 20))}${apiKeyPart.slice(-4)}`;
      }
      return apiKeyPart;
    }

    return "Set";
  };

  const maskedRpc = getRpcDisplay();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleEdit}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-sm font-semibold transition-all duration-300",
          "border bg-pond-deep/60 shadow-md hover:bg-pond-water/45 focus:outline-none focus-visible:ring-2",
          hasValidRpc
            ? "focus-visible:ring-lily-bright/60"
            : "focus-visible:ring-red-500/60",
          editing
            ? hasValidRpc
              ? "border-lily-green/60 shadow-[0_0_18px_rgba(107,157,120,0.4)]"
              : "border-red-500/60 shadow-[0_0_18px_rgba(239,68,68,0.4)]"
            : hasValidRpc
            ? "border-lily-green/25"
            : "border-red-500/40"
        )}
        title="Click to edit RPC"
      >
        <span
          className={cn(
            "w-2 h-2 rounded-full shadow-lg transition-all duration-300",
            hasValidRpc
              ? "bg-emerald-400 shadow-emerald-400/50"
              : "bg-red-500 shadow-red-500/50"
          )}
          style={{
            boxShadow: hasValidRpc
              ? "0 0 8px rgba(52, 211, 153, 0.6)"
              : "0 0 8px rgba(239, 68, 68, 0.6)"
          }}
        />
        <div className="flex flex-col leading-tight">
          <span className="text-white text-sm">RPC Endpoint</span>
          <span className={cn(
            "text-[11px] font-mono max-w-[200px] truncate",
            hasValidRpc ? "text-text-secondary" : "text-red-400"
          )}>
            {maskedRpc}
          </span>
        </div>
        <span
          className={cn(
            "ml-auto text-[10px] px-2 py-0.5 rounded-full border transition-all duration-300",
            editing
              ? hasValidRpc
                ? "bg-lily-green/20 border-lily-green/40 text-lily-bright"
                : "bg-red-500/20 border-red-500/40 text-red-400"
              : "bg-pond-deep/40 border-lily-green/20 text-lily-green hover:bg-lily-green/15 hover:border-lily-green/40 hover:text-lily-bright"
          )}
        >
          {editing ? "Editing" : "Edit"}
        </span>
      </button>

      {editing && (
        <div className="absolute left-0 right-0 mt-2 rounded-lg border border-lily-green/30 bg-gradient-to-br from-pond-water/95 via-pond-deep/90 to-pond-water/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                RPC Endpoint URL
              </label>
              <input
                type="text"
                value={rpcDraft}
                onChange={(e) => onRpcDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onRpcSave();
                  if (e.key === "Escape") onRpcCancel();
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
                  <span>!</span>
                  {error}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRpcSave}
                className="flex-1 px-3 py-2 bg-lily-green/20 border-2 border-lily-green rounded-lg text-sm font-semibold text-lily-bright hover:bg-lily-green/30 hover:border-lily-bright hover:shadow-[0_0_15px_var(--glow-green)] hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Save
              </button>
              <button
                onClick={onRpcCancel}
                className="flex-1 px-3 py-2 bg-red-500/20 border-2 border-red-500/40 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/30 hover:border-red-500/60 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105 active:scale-95 transition-all duration-300"
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

function JupiterApiKeyPill({
  apiKey,
  editing,
  onToggleEdit,
  apiKeyDraft,
  onApiKeyDraftChange,
  onApiKeySave,
  onApiKeyCancel,
}: {
  apiKey: string;
  editing: boolean;
  onToggleEdit: () => void;
  apiKeyDraft: string;
  onApiKeyDraftChange: (value: string) => void;
  onApiKeySave: () => void;
  onApiKeyCancel: () => void;
}) {
  const hasApiKey = apiKey.length > 0;
  const maskedApiKey = hasApiKey
    ? `${apiKey.slice(0, 4)}${"•".repeat(Math.min(apiKey.length - 8, 20))}${apiKey.slice(-4)}`
    : "Not set";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleEdit}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-sm font-semibold transition-all duration-300",
          "border bg-pond-deep/60 shadow-md hover:bg-pond-water/45 focus:outline-none focus-visible:ring-2",
          hasApiKey
            ? "focus-visible:ring-lily-bright/60"
            : "focus-visible:ring-red-500/60",
          editing
            ? hasApiKey
              ? "border-lily-green/60 shadow-[0_0_18px_rgba(107,157,120,0.4)]"
              : "border-red-500/60 shadow-[0_0_18px_rgba(239,68,68,0.4)]"
            : hasApiKey
            ? "border-lily-green/25"
            : "border-red-500/40"
        )}
        title="Click to edit Jupiter API Key"
      >
        <span
          className={cn(
            "w-2 h-2 rounded-full shadow-lg transition-all duration-300",
            hasApiKey
              ? "bg-emerald-400 shadow-emerald-400/50"
              : "bg-red-500 shadow-red-500/50"
          )}
          style={{
            boxShadow: hasApiKey
              ? "0 0 8px rgba(52, 211, 153, 0.6)"
              : "0 0 8px rgba(239, 68, 68, 0.6)"
          }}
        />
        <div className="flex flex-col leading-tight">
          <span className="text-white text-sm">Jupiter API Key</span>
          <span className={cn(
            "text-[11px] font-mono max-w-[200px] truncate",
            hasApiKey ? "text-text-secondary" : "text-red-400"
          )}>
            {maskedApiKey}
          </span>
        </div>
        <span
          className={cn(
            "ml-auto text-[10px] px-2 py-0.5 rounded-full border transition-all duration-300",
            editing
              ? hasApiKey
                ? "bg-lily-green/20 border-lily-green/40 text-lily-bright"
                : "bg-red-500/20 border-red-500/40 text-red-400"
              : "bg-pond-deep/40 border-lily-green/20 text-lily-green hover:bg-lily-green/15 hover:border-lily-green/40 hover:text-lily-bright"
          )}
        >
          {editing ? "Editing" : "Edit"}
        </span>
      </button>

      {editing && (
        <div className="absolute left-0 right-0 mt-2 rounded-lg border border-lily-green/30 bg-gradient-to-br from-pond-water/95 via-pond-deep/90 to-pond-water/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                Jupiter API Key
              </label>
              <input
                type="password"
                value={apiKeyDraft}
                onChange={(e) => onApiKeyDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onApiKeySave();
                  if (e.key === "Escape") onApiKeyCancel();
                }}
                placeholder="Enter your Jupiter API key (optional)"
                className="w-full bg-black/30 border-2 border-lily-green/30 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-lily-bright focus:ring-2 focus:ring-lily-green/50 transition-all duration-300 placeholder:text-text-muted/50"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-2">
                Get your API key at{" "}
                <a
                  href="https://portal.jup.ag"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lily-bright hover:text-lily-green underline"
                >
                  portal.jup.ag
                </a>
                {" "}(Free tier: 60 req/min)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onApiKeySave}
                className="flex-1 px-3 py-2 bg-lily-green/20 border-2 border-lily-green rounded-lg text-sm font-semibold text-lily-bright hover:bg-lily-green/30 hover:border-lily-bright hover:shadow-[0_0_15px_var(--glow-green)] hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Save
              </button>
              <button
                onClick={onApiKeyCancel}
                className="flex-1 px-3 py-2 bg-red-500/20 border-2 border-red-500/40 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/30 hover:border-red-500/60 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105 active:scale-95 transition-all duration-300"
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

function FetchDataButton({
  isConnected,
  hasRpc,
  hasApiKey,
  onFetch,
}: {
  isConnected: boolean;
  hasRpc: boolean;
  hasApiKey: boolean;
  onFetch?: () => void;
}) {
  const canFetch = isConnected && hasRpc && hasApiKey;

  if (!canFetch) return null;

  return (
    <button
      type="button"
      onClick={onFetch}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-lily-bright/60 bg-gradient-to-br from-lily-green/30 via-pond-bright/25 to-lily-green/30 shadow-md hover:shadow-[0_0_24px_rgba(107,157,120,0.45)] hover:scale-105 active:scale-95 transition-all duration-300"
      style={{
        boxShadow: "0 4px 12px rgba(0,0,0,0.3), 0 0 18px rgba(107,157,120,0.3)"
      }}
      title="Fetch dashboard data"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-lily-bright"
      >
        <path
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-sm font-semibold text-lily-bright">Fetch Data</span>
    </button>
  );
}

function SOLBalancePill({
  balance,
  price,
  isConnected,
}: {
  balance: number;
  price: number;
  isConnected: boolean;
}) {
  const formattedBalance = balance.toFixed(4);

  if (!isConnected) return null;

  return (
    <div
      className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-lily-green/60 bg-gradient-to-br from-lily-green/20 via-pond-bright/15 to-lily-green/20 shadow-md hover:shadow-[0_0_20px_rgba(107,157,120,0.35)] transition-all duration-300"
      style={{
        boxShadow: "0 4px 12px rgba(0,0,0,0.3), 0 0 16px rgba(107,157,120,0.2)"
      }}
    >
      <TokenLogo
        symbol="SOL"
        size={28}
        className="border-2 border-lily-bright/40 shadow-[0_0_12px_rgba(139,196,159,0.5)]"
      />
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold text-lily-bright">{formattedBalance}</span>
        <span className="text-[10px] text-lily-green font-semibold tracking-wider">SOL</span>
      </div>
    </div>
  );
}

function BalanceBadge({ label, amount }: { label: string; amount?: number }) {
  const formatted = amount !== undefined && amount !== null ? amount.toFixed(4) : "-";
  return (
    <div className="flex-1 min-w-[180px] flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-pond-bright/30 bg-pond-deep/60 text-white">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-pond-bright/40 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-xs font-bold shadow-[0_0_10px_rgba(88,101,242,0.5)]"
          aria-hidden
        >
          ◎
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">{label} balance</span>
          <span className="text-sm font-semibold">{formatted}</span>
        </div>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded-full border border-pond-bright/40 bg-pond-water/40 text-pond-bright">
        Live
      </span>
    </div>
  );
}

function EmbeddedStatus({
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
  currentDashboard,
  onDashboardChange,
  swapProgress,
}: {
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
  currentDashboard: DashboardType;
  onDashboardChange: (dashboard: DashboardType) => void;
  swapProgress?: {
    current: number;
    total: number;
    status: "idle" | "running";
  };
}) {
  return (
    <div className="mt-2">
      <StatusBar
        wallet={wallet}
        isConnected={isConnected}
        connecting={connecting}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        rpc={rpc}
        jupiterApiKey={jupiterApiKey}
        onJupiterApiKeyChange={onJupiterApiKeyChange}
        affiliate={affiliate}
        onAffiliateChange={onAffiliateChange}
        currentVault={currentVault}
        swapMode={swapMode}
        onSwapModeChange={onSwapModeChange}
        isSwapper={isSwapper}
        currentDashboard={currentDashboard}
        onDashboardChange={onDashboardChange}
        swapProgress={swapProgress}
        embedded
      />
    </div>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="gold" className="w-4 h-4">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="gold" className="w-4 h-4">
            <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
      <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.364-7.364L16.95 5.05M7.05 16.95l-1.414 1.414m0-13.657L7.05 5.05m9.9 9.9l1.414 1.414" />
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="cyan" className="w-4 h-4">
      <path d="M12.66 2.58a1 1 0 00-1.32 0C9.07 4.5 5 8.73 5 12.5 5 17.19 8.58 20 12 20s7-2.81 7-7.5c0-3.77-4.07-8-6.34-9.92zM12 18c-2.14 0-5-1.2-5-5.5 0-2.41 2.33-5.53 5-8.03 2.67 2.5 5 5.62 5 8.03C17 16.8 14.14 18 12 18z" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentcolor" className="w-4 h-4">
      <path d="M4.5 15c1.5 0 2.25-1 3.75-1s2.25 1 3.75 1 2.25-1 3.75-1 2.25 1 3.75 1v2c-1.5 0-2.25-1-3.75-1s-2.25 1-3.75 1-2.25-1-3.75-1-2.25 1-3.75 1V15z" />
      <path d="M4.5 9c1.5 0 2.25-1 3.75-1S10.5 9 12 9s2.25-1 3.75-1S18 9 19.5 9v2c-1.5 0-2.25-1-3.75-1S13.5 11 12 11s-2.25-1-3.75-1S6 11 4.5 11V9z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
    </svg>
  );
}

function CompactConnectionPill({
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
    return addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
  };

  return (
    <div className={cn(
      "flex items-center gap-2.5 px-3.5 py-2 rounded-lg border transition-all duration-300",
      "bg-gradient-to-r from-slate-900/60 to-slate-800/60 backdrop-blur-sm",
      isConnected
        ? "border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.25)]"
        : "border-slate-600/40"
    )}>
      <div className={cn(
        "w-2 h-2 rounded-full transition-all duration-300",
        isConnected ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse" : "bg-slate-600"
      )} />
      <span className="text-[11px] font-semibold text-slate-200">Connected</span>
      <span className="font-mono text-[11px] text-cyan-300 tracking-tight font-medium">
        {formatAddress(wallet)}
      </span>
      <button
        onClick={isConnected ? onDisconnect : onConnect}
        disabled={connecting}
        className={cn(
          "ml-auto p-1 rounded-md transition-all duration-300",
          isConnected
            ? "text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
            : "text-slate-500 hover:bg-slate-700/50"
        )}
        title={isConnected ? "Disconnect wallet" : "Connect wallet"}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isConnected ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          )}
        </svg>
      </button>
    </div>
  );
}

function CompactRpcPill({
  rpc,
  editing,
  onToggleEdit,
  rpcDraft,
  onRpcDraftChange,
  onRpcSave,
  onRpcCancel,
  error,
}: {
  rpc: string;
  editing: boolean;
  onToggleEdit: () => void;
  rpcDraft: string;
  onRpcDraftChange: (value: string) => void;
  onRpcSave: () => void;
  onRpcCancel: () => void;
  error: string | null;
}) {
  const hasValidRpc = rpc.length > 0 && !error;

  const getRpcDisplay = () => {
    if (!hasValidRpc) return "Not set";
    const equalsIndex = rpc.lastIndexOf('=');
    if (equalsIndex !== -1 && equalsIndex < rpc.length - 1) {
      const apiKeyPart = rpc.slice(equalsIndex + 1);
      if (apiKeyPart.length > 8) {
        return `${apiKeyPart.slice(0, 4)}${"•".repeat(Math.min(apiKeyPart.length - 8, 6))}${apiKeyPart.slice(-4)}`;
      }
      return apiKeyPart;
    }
    return "Set";
  };

  return (
    <div className="relative">
      <div className={cn(
        "flex items-center gap-2.5 px-3.5 py-2 rounded-lg border transition-all duration-300",
        "bg-gradient-to-r from-slate-900/60 to-slate-800/60 backdrop-blur-sm",
        hasValidRpc
          ? "border-cyan-500/40 shadow-[0_0_14px_rgba(34,211,238,0.2)]"
          : "border-slate-600/40"
      )}>
        <div className={cn(
          "w-2 h-2 rounded-full transition-all duration-300",
          hasValidRpc ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" : "bg-slate-600"
        )} />
        <span className="text-[11px] font-semibold text-slate-200">RPC</span>
        <span className="font-mono text-[10px] text-cyan-300 tracking-tight">
          {getRpcDisplay()}
        </span>
        <button
          onClick={onToggleEdit}
          className="ml-auto text-[10px] px-2 py-1 rounded-md border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all"
        >
          {editing ? "✕" : "Edit"}
        </button>
      </div>

      {/* Slide-out overlapping input section */}
      <div
        className={cn(
          "absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden transition-all duration-300 ease-out origin-top",
          editing ? "max-h-32 opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-0"
        )}
      >
        <div className="rounded-lg border border-cyan-500/40 bg-slate-900/95 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={rpcDraft}
              onChange={(e) => onRpcDraftChange(e.target.value)}
              placeholder="https://mainnet.helius-rpc.com/?api-key=..."
              className="font-mono flex-1 px-3 py-2 text-[11px] rounded-md border border-cyan-500/30 bg-slate-950/50 text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all"
            />
            <button
              onClick={onRpcSave}
              className="px-3 py-2 text-[11px] font-medium rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 transition-all whitespace-nowrap"
            >
              Set
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Helius, Alchemy, or QuickNode recommended
          </p>
          {error && <p className="text-[10px] text-red-400 font-medium">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function CompactJupiterApiKeyPill({
  apiKey,
  editing,
  onToggleEdit,
  apiKeyDraft,
  onApiKeyDraftChange,
  onApiKeySave,
  onApiKeyCancel,
}: {
  apiKey: string;
  editing: boolean;
  onToggleEdit: () => void;
  apiKeyDraft: string;
  onApiKeyDraftChange: (value: string) => void;
  onApiKeySave: () => void;
  onApiKeyCancel: () => void;
}) {
  const hasApiKey = apiKey.length > 0;
  const maskedApiKey = hasApiKey
    ? `${apiKey.slice(0, 4)}${"•".repeat(Math.min(apiKey.length - 8, 6))}${apiKey.slice(-4)}`
    : "Not set";

  return (
    <div className="relative">
      <div className={cn(
        "flex items-center gap-2.5 px-3.5 py-2 rounded-lg border transition-all duration-300",
        "bg-gradient-to-r from-slate-900/60 to-slate-800/60 backdrop-blur-sm",
        hasApiKey
          ? "border-teal-500/40 shadow-[0_0_14px_rgba(20,184,166,0.2)]"
          : "border-slate-600/40"
      )}>
        <div className={cn(
          "w-2 h-2 rounded-full transition-all duration-300",
          hasApiKey ? "bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" : "bg-slate-600"
        )} />
        <span className="text-[11px] font-semibold text-slate-200">API</span>
        <span className="font-mono text-[10px] text-teal-300 tracking-tight">
          {maskedApiKey}
        </span>
        <button
          onClick={onToggleEdit}
          className="ml-auto text-[10px] px-2 py-1 rounded-md border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 transition-all"
        >
          {editing ? "✕" : "Edit"}
        </button>
      </div>

      {/* Slide-out overlapping input section */}
      <div
        className={cn(
          "absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden transition-all duration-300 ease-out origin-top",
          editing ? "max-h-32 opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-0"
        )}
      >
        <div className="rounded-lg border border-teal-500/40 bg-slate-900/95 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKeyDraft}
              onChange={(e) => onApiKeyDraftChange(e.target.value)}
              placeholder="Enter Jupiter API key"
              className="font-mono flex-1 px-3 py-2 text-[11px] rounded-md border border-teal-500/30 bg-slate-950/50 text-teal-100 placeholder-slate-500 focus:outline-none focus:border-teal-400/60 focus:ring-1 focus:ring-teal-400/30 transition-all"
            />
            <button
              onClick={onApiKeySave}
              className="px-3 py-2 text-[11px] font-medium rounded-md bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 transition-all whitespace-nowrap"
            >
              Set
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Get yours at <span className="text-teal-400">jup.ag/api-keys</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function CompactSOLBalance({
  balance,
  price,
  isConnected,
}: {
  balance: number;
  price: number;
  isConnected: boolean;
}) {
  if (!isConnected) return null;

  const formattedBalance = balance.toFixed(4);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-lily-green/40 bg-gradient-to-br from-lily-green/20 to-pond-bright/15 text-sm">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/80">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M3 10h18M7 15h.01M11 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <span className="text-white/90 font-bold">{formattedBalance}</span>
      <span className="text-white/60 text-xs font-semibold">SOL</span>
    </div>
  );
}
