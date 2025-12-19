"use client";
import { SwapperProvider } from "@/contexts/SwapperContext";
import { TOKEN_VAULTS_AFFILIATE_1, TOKEN_VAULTS_AFFILIATE_2, DEFAULT_RPC } from "@/lib/vaults";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const WPOND_MINT = "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SwapperProvider
      initialRpc={DEFAULT_RPC}
      initialFromMint={SOL_MINT}
      initialToMint={WPOND_MINT}
      initialPlatformFeeBps={Number(process.env.NEXT_PUBLIC_DEFAULT_PLATFORM_FEE_BPS) || 100}
      initialSlippageBps={Number(process.env.NEXT_PUBLIC_DEFAULT_SLIPPAGE_BPS) || 50}
      tokenVaultsAffiliate1={TOKEN_VAULTS_AFFILIATE_1}
      tokenVaultsAffiliate2={TOKEN_VAULTS_AFFILIATE_2}
    >
      {children}
    </SwapperProvider>
  );
}
