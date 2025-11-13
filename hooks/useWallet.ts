/**
 * Wallet connection hook for Phantom wallet integration
 */

import { useCallback, useState } from "react";

export function useWallet() {
  const [wallet, setWallet] = useState<string>("");
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async (): Promise<string> => {
    try {
      setConnecting(true);
      const provider = (window as any)?.solana;

      if (!provider?.isPhantom) {
        throw new Error("Phantom wallet not found. Please install Phantom.");
      }

      const res = await provider.connect();
      const publicKey = res.publicKey?.toString() || "";
      setWallet(publicKey);

      return publicKey;
    } catch (error: any) {
      throw new Error(`Wallet connection failed: ${error?.message || String(error)}`);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const provider = (window as any)?.solana;
      if (provider?.isConnected) {
        await provider.disconnect();
      }
    } catch (error) {
      // Silently handle disconnect errors
      console.error("Disconnect error:", error);
    }
    setWallet("");
  }, []);

  return {
    wallet,
    connecting,
    connect,
    disconnect,
    isConnected: wallet !== "",
  };
}
