import "../styles/globals.css";
import "../styles/theme-cyberpunk.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "PondX AutoBot - Swapper",
  description: "Solana Jupiter auto-swapper interface"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
