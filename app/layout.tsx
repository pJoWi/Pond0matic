import "./globals.css";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { ClientProviders } from "@/components/layout/ClientProviders";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Pond0matic",
  description: "Pond0x mining cockpit — boost swapper, rig stats, portfolio.",
};

// Sets .dark before first paint to avoid a light-mode flash. Reads the same
// localStorage key SettingsContext uses; falls back to dark.
const themeInit = `(function(){try{var s=JSON.parse(localStorage.getItem("pond0matic:settings")||"{}");var t=s.theme||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){document.documentElement.classList.add("dark");}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <ClientProviders>
          <AppShell>{children}</AppShell>
        </ClientProviders>
      </body>
    </html>
  );
}
