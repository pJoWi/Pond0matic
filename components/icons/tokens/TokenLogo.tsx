"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface TokenLogoProps {
  symbol: string;
  size?: number;
  className?: string;
  fallback?: React.ReactNode;
}

// Token metadata mapping
const TOKEN_METADATA: Record<string, { chain: string; fileName: string }> = {
  'SOL': { chain: 'solana', fileName: 'sol.png' },
  'USDC': { chain: 'solana', fileName: 'usdc.png' },
  'USDT': { chain: 'solana', fileName: 'usdt.png' },
  'wPOND': { chain: 'solana', fileName: 'wpond.png' },
  'hSOL': { chain: 'solana', fileName: 'hsol.png' },
  'mSOL': { chain: 'solana', fileName: 'msol.png' },
  'PepeOnSOL': { chain: 'solana', fileName: 'pepesol.png' },
  'PNDC': { chain: 'ethereum', fileName: 'pndc.png' },
  'PORK': { chain: 'ethereum', fileName: 'pork.png' },
};

export function TokenLogo({
  symbol,
  size = 32,
  className,
  fallback
}: TokenLogoProps) {
  const [error, setError] = useState(false);

  // Get token metadata
  const metadata = TOKEN_METADATA[symbol];

  if (!metadata || (error && fallback)) {
    return <>{fallback}</>;
  }

  const logoPath = `/tokens/${metadata.chain}/${metadata.fileName}`;

  return (
    <img
      src={logoPath}
      alt={`${symbol} logo`}
      width={size}
      height={size}
      className={cn("rounded-full", className)}
      onError={() => setError(true)}
    />
  );
}
