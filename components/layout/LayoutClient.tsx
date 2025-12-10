"use client";
import { useState, useEffect } from "react";
import { TopNavigation } from "./TopNavigation";
import { SwapModeNavigation } from "./SwapModeNavigation";
import { PondWaterBackground } from "./PondWaterBackground";
import { ClientProviders } from "./ClientProviders";
import { useSwapperContext } from "@/contexts/SwapperContext";
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
  const [waterEffect, setWaterEffect] = useState(true);

  // Show swap mode navigation only on swapper page
  const isSwapperRoute = pathname === '/swapper';

  // Load preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('pond-theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      // Set pond0x theme with dark/light variant
      document.documentElement.setAttribute('data-theme', `pond0x-${savedTheme}`);
      document.documentElement.setAttribute('data-mode', 'pond0x');
    } else {
      // Default to pond0x dark theme
      document.documentElement.setAttribute('data-theme', 'pond0x-dark');
      document.documentElement.setAttribute('data-mode', 'pond0x');
    }

    const savedWater = localStorage.getItem('water-effect');
    if (savedWater !== null) {
      setWaterEffect(savedWater === 'true');
    }
  }, []);

  // Update theme
  useEffect(() => {
    // Always use pond0x theme, just switch between dark/light variants
    document.documentElement.setAttribute('data-theme', `pond0x-${theme}`);
    document.documentElement.setAttribute('data-mode', 'pond0x');
    localStorage.setItem('pond-theme', theme);
  }, [theme]);

  // Update water effect preference
  useEffect(() => {
    localStorage.setItem('water-effect', String(waterEffect));
  }, [waterEffect]);

  const handleThemeToggle = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

  const handleWaterToggle = () => {
    setWaterEffect(w => !w);
  };

  return (
    <>
      <TopNavigation
        theme={theme}
        onThemeToggle={handleThemeToggle}
        waterEffect={waterEffect}
        onWaterToggle={handleWaterToggle}
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

      {/* Pond Water Background Effect */}
      <PondWaterBackground enabled={waterEffect} />

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
