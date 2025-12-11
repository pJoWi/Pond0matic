"use client";
import { useState, useEffect } from "react";
import { TopNavigation } from "./TopNavigation";
import { SwapModeNavigation } from "./SwapModeNavigation";
<<<<<<< HEAD
import { PondWaterBackground } from "./PondWaterBackground";
import { ClientProviders } from "./ClientProviders";
import { useSwapperContext } from "@/contexts/SwapperContext";
=======
import { ClientProviders } from "./ClientProviders";
import { useSwapperContext } from "@/contexts/SwapperContext";
import Mount from "@/app/(utils)/mount";
>>>>>>> a0b5e4fc1862c9ff2e8fd02ba49fc6c001dc2ea1
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
<<<<<<< HEAD
  const [waterEffect, setWaterEffect] = useState(true);
=======
  const [bubbles, setBubbles] = useState(true);
>>>>>>> a0b5e4fc1862c9ff2e8fd02ba49fc6c001dc2ea1

  // Show swap mode navigation only on swapper page
  const isSwapperRoute = pathname === '/swapper';

  // Load preferences from localStorage
  useEffect(() => {
<<<<<<< HEAD
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
=======
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
>>>>>>> a0b5e4fc1862c9ff2e8fd02ba49fc6c001dc2ea1
    }
  }, []);

  // Update theme
  useEffect(() => {
<<<<<<< HEAD
    // Always use pond0x theme, just switch between dark/light variants
    document.documentElement.setAttribute('data-theme', `pond0x-${theme}`);
    document.documentElement.setAttribute('data-mode', 'pond0x');
    localStorage.setItem('pond-theme', theme);
  }, [theme]);

  // Update water effect preference
  useEffect(() => {
    localStorage.setItem('water-effect', String(waterEffect));
  }, [waterEffect]);
=======
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Update bubbles preference
  useEffect(() => {
    localStorage.setItem('bubbles', String(bubbles));
  }, [bubbles]);
>>>>>>> a0b5e4fc1862c9ff2e8fd02ba49fc6c001dc2ea1

  const handleThemeToggle = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

<<<<<<< HEAD
  const handleWaterToggle = () => {
    setWaterEffect(w => !w);
=======
  const handleBubblesToggle = () => {
    setBubbles(b => !b);
>>>>>>> a0b5e4fc1862c9ff2e8fd02ba49fc6c001dc2ea1
  };

  return (
    <>
      <TopNavigation
        theme={theme}
        onThemeToggle={handleThemeToggle}
<<<<<<< HEAD
        waterEffect={waterEffect}
        onWaterToggle={handleWaterToggle}
=======
        bubbles={bubbles}
        onBubblesToggle={handleBubblesToggle}
>>>>>>> a0b5e4fc1862c9ff2e8fd02ba49fc6c001dc2ea1
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

<<<<<<< HEAD
      {/* Pond Water Background Effect */}
      <PondWaterBackground enabled={waterEffect} />
=======
      {/* Bubble Canvas */}
      <canvas
        id="bubble-canvas"
        className={`bubble-canvas ${bubbles ? "" : "bubbles-off"}`}
      />

      {/* Mount Bubbles */}
      <Mount />
>>>>>>> a0b5e4fc1862c9ff2e8fd02ba49fc6c001dc2ea1

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
