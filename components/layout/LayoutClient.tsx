"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { TopNavigation } from "./TopNavigation";
import type { DashboardType } from "./StatusBar";
import { PondWaterBackground } from "./PondWaterBackground";
import { ClientProviders } from "./ClientProviders";
import { useSwapperContext } from "@/contexts/SwapperContext";
import { useSwapExecution } from "@/hooks/useSwapExecution";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface LayoutClientProps {
  children: React.ReactNode;
}

// Create a context for view mode
const ViewModeContext = createContext<"enhanced" | "classic">("enhanced");

export function useViewMode() {
  return useContext(ViewModeContext);
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const ctx = useSwapperContext();
  const pathname = usePathname();
  const {
    executeNormalMode,
    executeBoostMode,
    executeRewardsMode,
    stopAuto,
  } = useSwapExecution();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [waterEffect, setWaterEffect] = useState(true);
  const [viewMode, setViewMode] = useState<"enhanced" | "classic">("enhanced");
  const [currentDashboard, setCurrentDashboard] = useState<DashboardType>("pond0x");

  // Handler to start swap based on current mode
  const handleStartSwap = async () => {
    // Check if wallet is connected
    if (!ctx.isConnected) {
      ctx.log("❌ Wallet not connected. Please connect your wallet first.");
      return;
    }

    if (ctx.swapMode === "boost") {
      ctx.log("▶ Starting Boost mode...");
      await executeBoostMode();
    } else if (ctx.swapMode === "rewards") {
      ctx.log("▶ Starting Rewards mode...");
      await executeRewardsMode();
    } else {
      ctx.log("▶ Starting Normal mode...");
      await executeNormalMode();
    }
  };

  const handleStopSwap = () => {
    ctx.log("■ Stopping swap...");
    stopAuto();
  };

  const handleFetchDashboardData = async () => {
    // Use the same fetch logic as the Pond0x overview button
    await ctx.fetchRigData();
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('pond-theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', `pond0x-${savedTheme}`);
      document.documentElement.setAttribute('data-mode', 'pond0x');
    } else {
      document.documentElement.setAttribute('data-theme', 'pond0x-dark');
      document.documentElement.setAttribute('data-mode', 'pond0x');
    }

    const savedWater = localStorage.getItem('water-effect');
    if (savedWater !== null) {
      setWaterEffect(savedWater === 'true');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', `pond0x-${theme}`);
    document.documentElement.setAttribute('data-mode', 'pond0x');
    localStorage.setItem('pond-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('water-effect', String(waterEffect));
  }, [waterEffect]);

  useEffect(() => {
    const savedViewMode = localStorage.getItem('dashboard-view-mode') as 'enhanced' | 'classic' | null;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }

    const savedDashboard = localStorage.getItem('current-dashboard') as DashboardType | null;
    if (savedDashboard) {
      setCurrentDashboard(savedDashboard);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboard-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('current-dashboard', currentDashboard);
  }, [currentDashboard]);

  const handleThemeToggle = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

  const handleWaterToggle = () => {
    setWaterEffect(w => !w);
  };

  const handleDashboardChange = (dashboard: DashboardType) => {
    setCurrentDashboard(dashboard);
  };

  return (
    <ViewModeContext.Provider value={viewMode}>
      {/* Fixed Top Navigation with Status Bar */}
      <TopNavigation
        theme={theme}
        onThemeToggle={handleThemeToggle}
        waterEffect={waterEffect}
        onWaterToggle={handleWaterToggle}
        wallet={ctx.wallet}
        isConnected={ctx.isConnected}
        connecting={ctx.connecting}
        onConnect={ctx.connect}
        onDisconnect={ctx.disconnect}
        rpc={ctx.rpc}
        onRpcChange={ctx.setRpc}
        jupiterApiKey={ctx.jupiterApiKey}
        onJupiterApiKeyChange={ctx.setJupiterApiKey}
        affiliate={ctx.affiliate as "pond0x" | "aquavaults"}
        onAffiliateChange={ctx.setAffiliate}
        currentVault={ctx.currentVault}
        swapMode={ctx.swapMode}
        onSwapModeChange={ctx.setSwapMode}
        isSwapper={pathname === "/swapper"}
        currentDashboard={currentDashboard}
        onDashboardChange={handleDashboardChange}
        swapProgress={{
          current: ctx.currentSwapIndex || 0,
          total: (() => {
            // Calculate total swaps based on mode
            if (ctx.swapMode === "normal") {
              return 1; // Normal mode = single swap
            } else if (ctx.swapMode === "boost") {
              // Boost mode = swapsPerRound × numberOfRounds
              if (ctx.numberOfRounds === 0) {
                // Infinite mode - show current as total
                return ctx.currentSwapIndex || 0;
              }
              return ctx.swapsPerRound * ctx.numberOfRounds;
            } else {
              // Rewards mode = numberOfSwaps
              if (ctx.numberOfSwaps === 0) {
                // Infinite mode - show current as total
                return ctx.currentSwapIndex || 0;
              }
              return ctx.numberOfSwaps;
            }
          })(),
          status: ctx.running ? "running" : "idle",
        }}
        onStart={handleStartSwap}
        onStop={handleStopSwap}
        onFetchDashboardData={handleFetchDashboardData}
        setFromMint={ctx.setFromMint}
        setToMint={ctx.setToMint}
        setAmount={ctx.setAmount}
        setMaxAmount={ctx.setMaxAmount}
        setSwapsPerRound={ctx.setSwapsPerRound}
        setNumberOfRounds={ctx.setNumberOfRounds}
        setSwapDelayMs={ctx.setSwapDelayMs}
        setNumberOfSwaps={ctx.setNumberOfSwaps}
        log={ctx.log}
      />

      {/* Water Background Effect */}
      <PondWaterBackground enabled={waterEffect} />

      {/* Main Content - with proper spacing for fixed header + status bar */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-72 pb-8 min-h-screen">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        theme={theme}
        richColors
        closeButton
      />
    </ViewModeContext.Provider>
  );
}

export function LayoutClient({ children }: LayoutClientProps) {
  return (
    <ClientProviders>
      <LayoutContent>{children}</LayoutContent>
    </ClientProviders>
  );
}
