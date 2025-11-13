"use client";
import { useEffect, useState, useCallback } from "react";
import Swapper from "@/components/SolanaJupiterSwapper";
import { CompactSwapper } from "@/components/CompactSwapper";
import { SwapperProvider, useSwapperContext } from "@/contexts/SwapperContext";
import { useSwapExecution } from "@/hooks/useSwapExecution";
import { TOKEN_VAULTS_AFFILIATE_1, TOKEN_VAULTS_AFFILIATE_2, DEFAULT_RPC } from "@/lib/vaults";
import Mount from "@/app/(utils)/mount";

const SOL_MINT = "So11111111111111111111111111111111111111112";

function SwapperWrapper({ compact }: { compact: boolean }) {
  const ctx = useSwapperContext();
  const { swapOnce, startAuto, stopAuto } = useSwapExecution();

  const handleSwap = useCallback(async () => {
    if (ctx.mode === "normal" && !ctx.autoActive) {
      // Single swap execution
      await swapOnce(ctx.fromMint, ctx.toMint, ctx.amount);
      return;
    }
    // Auto-swap start
    await startAuto();
  }, [ctx.mode, ctx.autoActive, ctx.fromMint, ctx.toMint, ctx.amount, swapOnce, startAuto]);

  const handleStop = useCallback(() => {
    stopAuto();
  }, [stopAuto]);

  if (compact) {
    return <CompactSwapper onSwap={handleSwap} onStop={handleStop} />;
  }

  return <Swapper theme="dark" />;
}

export default function Page() {
  const [theme, setTheme] = useState<'dark' | 'light'>("dark");
  const [bubbles, setBubbles] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Load bubbles preference
    const savedBubbles = localStorage.getItem('bubbles');
    if (savedBubbles !== null) {
      setBubbles(savedBubbles === 'true');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('bubbles', String(bubbles));
  }, [bubbles]);

  return (
    <>
      {/* Fixed Top Banner */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cyber-black/90 backdrop-blur-cyber border-b border-neon-pink/20 shadow-neon-pink-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <img
              className="w-8 h-8 drop-shadow-[0_0_8px_rgba(255,20,147,0.8)] animate-neon-pulse"
              src="/logo.svg"
              alt="PondX Logo"
            />
            <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-neon-pink via-neon-rose to-neon-red bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
              PondX AutoBot
            </h1>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-3">
            {/* Compact Mode Toggle */}
            <button
              onClick={() => setCompactMode(c => !c)}
              className={`group relative px-4 py-2 border rounded-lg transition-all duration-300 ${
                compactMode
                  ? 'bg-ember-orange/10 border-ember-orange/50 hover:border-ember-orange hover:shadow-ember-orange-sm'
                  : 'bg-cyber-darker border-gray-600 hover:border-gray-500'
              }`}
              title={`Switch to ${compactMode ? 'full' : 'compact'} view`}
            >
              <span className={`text-sm font-semibold transition-colors ${
                compactMode ? 'text-ember-orange-light' : 'text-gray-400'
              }`}>
                {compactMode ? '📱 COMPACT' : '🖥️ FULL'}
              </span>
            </button>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="group relative px-4 py-2 bg-cyber-darker border border-neon-pink/30 rounded-lg hover:border-neon-pink/60 hover:shadow-neon-pink-sm transition-all duration-300"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span className="text-sm font-semibold text-neon-pink group-hover:text-neon-rose transition-colors">
                {theme === 'dark' ? '🌙 DARK' : '☀️ LIGHT'}
              </span>
            </button>

            {/* Bubble Animation Toggle */}
            <button
              onClick={() => setBubbles(b => !b)}
              className={`group relative px-4 py-2 border rounded-lg transition-all duration-300 ${
                bubbles
                  ? 'bg-neon-red/10 border-neon-red/50 hover:border-neon-red hover:shadow-neon-red-sm'
                  : 'bg-cyber-darker border-gray-600 hover:border-gray-500'
              }`}
              title={`${bubbles ? 'Disable' : 'Enable'} background animation`}
            >
              <span className={`text-sm font-semibold transition-colors ${
                bubbles ? 'text-neon-red' : 'text-gray-400'
              }`}>
                {bubbles ? '✨ FX ON' : '💤 FX OFF'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Background Bubble Canvas */}
      <canvas
        id="bubble-canvas"
        className={`bubble-canvas ${bubbles ? "" : "bubbles-off"}`}
      />

      {/* Mount Bubbles */}
      <Mount />

      {/* Main Content */}
      <main className="relative z-10">
        <SwapperProvider
          initialRpc={DEFAULT_RPC}
          initialFromMint={SOL_MINT}
          initialToMint="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // USDC
          initialPlatformFeeBps={85}
          initialSlippageBps={50}
          tokenVaultsAffiliate1={TOKEN_VAULTS_AFFILIATE_1}
          tokenVaultsAffiliate2={TOKEN_VAULTS_AFFILIATE_2}
        >
          <SwapperWrapper compact={compactMode} />
        </SwapperProvider>
      </main>
    </>
  );
}
