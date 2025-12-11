import "../styles/globals.css";
import "../styles/theme-cyberpunk.css";
import "../styles/modern-effects.css";
<<<<<<< HEAD
import "../styles/pond-water-background.css";
=======
>>>>>>> a0b5e4fc1862c9ff2e8fd02ba49fc6c001dc2ea1
import type { ReactNode } from "react";
import { LayoutClient } from "@/components/layout/LayoutClient";

export const metadata = {
  title: "Pond0x Mystical Dashboard - Auto Swapper",
  description: "Pond0x mystical mining dashboard with Solana & Ethereum token swaps"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
<<<<<<< HEAD
    <html lang="en" data-theme="pond0x-dark" data-mode="pond0x" suppressHydrationWarning>
=======
    <html lang="en" data-theme="pond0x" data-mode="pond0x">
>>>>>>> a0b5e4fc1862c9ff2e8fd02ba49fc6c001dc2ea1
      <body>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
