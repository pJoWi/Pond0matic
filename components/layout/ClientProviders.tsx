"use client";
import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { Toaster } from "sonner";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { SwapConfigProvider } from "@/contexts/SwapConfigContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { ActivityProvider } from "@/contexts/ActivityContext";
import { RigProvider } from "@/contexts/RigContext";
import { useSwapRecorder } from "@/hooks/useSwapRecorder";
import { DEFAULT_RPC } from "@/lib/vaults";
import "@solana/wallet-adapter-react-ui/styles.css";

/** Mounted once: captures swap lifecycle events into the portfolio store. */
function SwapRecorderMount() {
  useSwapRecorder();
  return null;
}

/** Solana providers need the user-configured RPC from SettingsContext. */
function SolanaProviders({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const endpoint = settings.rpc || DEFAULT_RPC;
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={endpoint} key={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <SolanaProviders>
        <SwapConfigProvider>
          <SessionProvider>
            <ActivityProvider>
              <RigProvider>
                <SwapRecorderMount />
                {children}
                <Toaster position="bottom-right" richColors />
              </RigProvider>
            </ActivityProvider>
          </SessionProvider>
        </SwapConfigProvider>
      </SolanaProviders>
    </SettingsProvider>
  );
}
