"use client";
import { useState, useEffect } from "react";
import { TopNavigation } from "./TopNavigation";
import { SwapModeNavigation } from "./SwapModeNavigation";
import { ClientProviders } from "./ClientProviders";
import { useSwapperContext } from "@/contexts/SwapperContext";
import Mount from "@/app/(utils)/mount";
import { usePathname } from "next/navigation";
import type { SwapMode } from "@/types/swapModes";

interface LayoutClientProps {
  children: React.ReactNode;
}

// Inner component that has access to SwapperContext
function LayoutContent({ children }: { children: React.ReactNode }) {
  const ctx = useSwapperContext();
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [bubbles, setBubbles] = useState(true);

  // Show swap mode navigation only on swapper page
  const isSwapperRoute = pathname === '/swapper';

  // Load preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const savedBubbles = localStorage.getItem('bubbles');
    if (savedBubbles !== null) {
      setBubbles(savedBubbles === 'true');
    }
  }, []);

  // Update theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Update bubbles preference
  useEffect(() => {
    localStorage.setItem('bubbles', String(bubbles));
  }, [bubbles]);

  const handleThemeToggle = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

  const handleBubblesToggle = () => {
    setBubbles(b => !b);
  };

  return (
    <>
      <TopNavigation
        theme={theme}
        onThemeToggle={handleThemeToggle}
        bubbles={bubbles}
        onBubblesToggle={handleBubblesToggle}
        swapMode={ctx.swapMode}
        onSwapModeChange={ctx.setSwapMode}
      />

      {/* Swap Mode Navigation - Only on swapper page */}
      {isSwapperRoute && (
        <SwapModeNavigation
          swapMode={ctx.swapMode}
          onSwapModeChange={ctx.setSwapMode}
        />
      )}

      {/* Bubble Canvas */}
      <canvas
        id="bubble-canvas"
        className={`bubble-canvas ${bubbles ? "" : "bubbles-off"}`}
      />

      {/* Mount Bubbles */}
      <Mount />

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>
    </>
  );
}

export function LayoutClient({ children }: LayoutClientProps) {
  return (
    <ClientProviders>
      <LayoutContent>{children}</LayoutContent>
    </ClientProviders>
  );
}
