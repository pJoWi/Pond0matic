"use client";
import React, { type CSSProperties, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { StatusBar, type DashboardType } from "./StatusBar";
import type { SwapMode } from "@/types/swapModes";

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

  useEffect(() => {
    setRpcDraft(rpc);
  }, [rpc]);

  const navItems = [
    { href: "/", label: "Dashboard", tone: "lily" as const },
    { href: "/swapper", label: "Swapper", tone: "wave" as const },
    { href: "/flywheel", label: "Flywheel", tone: "spark" as const },
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
                />
              ))}
            </div>
          </nav>

          <div className="flex items-center justify-end gap-1.5">
            <ToggleButton
              active={theme === "dark"}
              activeLabel="Dark"
              inactiveLabel="Light"
              icon={theme === "dark" ? <MoonIcon /> : <SunIcon />}
              onClick={onThemeToggle}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              tone="lily"
            />
            <ToggleButton
              active={waterEffect}
              activeLabel="Water"
              inactiveLabel="Static"
              icon={waterEffect ? <DropletIcon /> : <WaveIcon />}
              onClick={onWaterToggle}
              title={`${waterEffect ? "Disable" : "Enable"} pond water animation`}
              tone="wave"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur-xl shadow-[0_10px_24px_rgba(0,0,0,0.35)] p-2 space-y-2">
          <div className="relative rounded-xl border border-pond-bright/25 bg-gradient-to-r from-pond-water/35 via-pond-deep/45 to-pond-water/35 p-2 shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2">
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
                onToggleEdit={() => setEditingRpc((prev) => !prev)}
                rpcDraft={rpcDraft}
                onRpcDraftChange={(value) => {
                  setRpcDraft(value);
                  if (rpcError) setRpcError(null);
                }}
                onRpcSave={handleRpcSave}
                onRpcCancel={() => {
                  setRpcDraft(rpc);
                  setRpcError(null);
                  setEditingRpc(false);
                }}
                error={rpcError}
              />
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
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
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
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
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
      <div className="flex flex-col">
        <span
          className="text-lg sm:text-xl font-bold tracking-wider bg-clip-text text-transparent transition-all duration-500 group-hover:tracking-[0.18em]"
          style={{
            backgroundImage: "linear-gradient(120deg, var(--theme-primary), var(--theme-secondary), var(--pink-bright, #ffc0e3))",
            backgroundSize: "200% auto",
            animation: "gradient-shift 6s ease infinite",
          }}
        >
          Pond0matic
        </span>
        <span className="text-[11px] text-[color:var(--theme-text-muted)]">
          Dashboard / Swapper / Flywheel
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
}

function NavButton({ href, active, label, tone }: NavButtonProps) {
  const tones: Record<
    NavTone,
    { from: string; to: string; border: string; glow: string }
  > = {
    lily: {
      from: "var(--theme-primary)",
      to: "var(--theme-secondary)",
      border: "rgba(139, 196, 159, 0.55)",
      glow: "rgba(139, 196, 159, 0.28)",
    },
    wave: {
      from: "var(--pond-bright, #4a8fb8)",
      to: "var(--pond-light, #2d5f7f)",
      border: "rgba(74, 143, 184, 0.6)",
      glow: "rgba(74, 143, 184, 0.25)",
    },
    spark: {
      from: "var(--gold-light, #f0c674)",
      to: "var(--pink-bright, #ffc0e3)",
      border: "rgba(240, 198, 116, 0.6)",
      glow: "rgba(255, 192, 227, 0.26)",
    },
  };

  const vars = {
    "--tone-from": tones[tone].from,
    "--tone-to": tones[tone].to,
    "--tone-border": tones[tone].border,
    "--tone-glow": tones[tone].glow,
  } as CSSProperties;

  return (
    <Link
      href={href}
      className={cn(
        "group relative px-3 py-1.5 rounded-xl font-medium text-sm transition-all duration-300",
        "flex items-center gap-1.5 overflow-hidden",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--tone-border)] focus-visible:ring-offset-[rgba(13,31,45,0.8)]",
        active ? "text-white" : "text-[color:var(--theme-text-muted)] hover:text-white"
      )}
      style={{
        ...vars,
        border: active ? "1px solid var(--tone-border)" : "1px solid transparent",
        background: active
          ? "linear-gradient(135deg, var(--tone-from), var(--tone-to))"
          : "rgba(255,255,255,0.02)",
        boxShadow: active
          ? "0 8px 26px var(--tone-glow), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 0 0 1px rgba(255,255,255,0.02)",
      }}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn(
          "absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none",
          active ? "opacity-40" : "opacity-0 group-hover:opacity-20"
        )}
        style={{
          background: "linear-gradient(135deg, var(--tone-from), var(--tone-to))",
          filter: "blur(10px)",
        }}
      />
      <span className="relative flex items-center gap-2">
        <span className="relative z-10">{label}</span>
      </span>
      {active && (
        <span
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow:
              "0 0 0 1px var(--tone-border), inset 0 0 0 1px rgba(255,255,255,0.08)",
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
  const truncatedRpc = rpc.length > 32 ? `${rpc.slice(0, 32)}...` : rpc;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleEdit}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-sm font-semibold transition-all duration-300",
          "border bg-pond-deep/60 shadow-md hover:bg-pond-water/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-pond-bright/60",
          editing
            ? "border-pond-bright/60 shadow-[0_0_18px_rgba(74,143,184,0.4)]"
            : "border-pond-bright/25"
        )}
        title="Click to edit RPC"
      >
        <span className="w-2 h-2 rounded-full bg-pond-bright shadow-[0_0_8px_var(--glow-blue)]" />
        <div className="flex flex-col leading-tight">
          <span className="text-white text-sm">RPC Endpoint</span>
          <span className="text-[11px] text-text-secondary font-mono max-w-[200px] truncate">
            {truncatedRpc}
          </span>
        </div>
        <span
          className={cn(
            "ml-auto text-[10px] px-2 py-0.5 rounded-full border transition-all duration-300",
            editing
              ? "bg-pond-bright/20 border-pond-bright/40 text-pond-bright"
              : "bg-white/10 border-white/12 text-text-secondary hover:bg-white/15 hover:border-white/20"
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
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
      <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.364-7.364L16.95 5.05M7.05 16.95l-1.414 1.414m0-13.657L7.05 5.05m9.9 9.9l1.414 1.414" />
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12.66 2.58a1 1 0 00-1.32 0C9.07 4.5 5 8.73 5 12.5 5 17.19 8.58 20 12 20s7-2.81 7-7.5c0-3.77-4.07-8-6.34-9.92zM12 18c-2.14 0-5-1.2-5-5.5 0-2.41 2.33-5.53 5-8.03 2.67 2.5 5 5.62 5 8.03C17 16.8 14.14 18 12 18z" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M4.5 15c1.5 0 2.25-1 3.75-1s2.25 1 3.75 1 2.25-1 3.75-1 2.25 1 3.75 1v2c-1.5 0-2.25-1-3.75-1s-2.25 1-3.75 1-2.25-1-3.75-1-2.25 1-3.75 1V15z" />
      <path d="M4.5 9c1.5 0 2.25-1 3.75-1S10.5 9 12 9s2.25-1 3.75-1S18 9 19.5 9v2c-1.5 0-2.25-1-3.75-1S13.5 11 12 11s-2.25-1-3.75-1S6 11 4.5 11V9z" />
    </svg>
  );
}
