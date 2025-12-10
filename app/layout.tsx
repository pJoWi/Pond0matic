import "../styles/globals.css";
import "../styles/theme-cyberpunk.css";
import "../styles/modern-effects.css";
import "../styles/pond-water-background.css";
import type { ReactNode } from "react";
import { LayoutClient } from "@/components/layout/LayoutClient";

export const metadata = {
  title: "Pond0x Mystical Dashboard - Auto Swapper",
  description: "Pond0x mystical mining dashboard with Solana & Ethereum token swaps"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="pond0x-dark" data-mode="pond0x" suppressHydrationWarning>
      <body>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
