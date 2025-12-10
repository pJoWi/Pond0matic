"use client";
import { SwapperProvider } from "@/contexts/SwapperContext";
import { TOKEN_VAULTS_AFFILIATE_1, TOKEN_VAULTS_AFFILIATE_2, DEFAULT_RPC } from "@/lib/vaults";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SwapperProvider
      initialRpc={DEFAULT_RPC}
      initialFromMint={SOL_MINT}
      initialToMint={USDC_MINT}
      initialPlatformFeeBps={85}
      initialSlippageBps={50}
      tokenVaultsAffiliate1={TOKEN_VAULTS_AFFILIATE_1}
      tokenVaultsAffiliate2={TOKEN_VAULTS_AFFILIATE_2}
    >
      {children}
    </SwapperProvider>
  );
}
