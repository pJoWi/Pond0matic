import "../styles/globals.css";

import "../styles/modern-effects.css";
import "../styles/pond-water-background.css";
import type { ReactNode } from "react";
import { LayoutClient } from "@/components/layout/LayoutClient";

export const metadata = {
  title: "Pond0x Dashboard - Pond0matic",
  description: "Pond0x Dashboard with Auto Swapper for Solana-based tokens.",
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
