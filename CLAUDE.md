# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PondX Auto-Swapper is a Next.js application for executing Solana token swaps via Jupiter aggregator. It supports manual swaps, automated swap sequences, round-trip swaps, and micro-randomized bot operations with configurable affiliate routing.

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Architecture

### Core Structure

- **Next.js 15** with App Router (`app/` directory)
- **Client-side only**: All components use `"use client"` directive
- **Solana integration**: Uses `@solana/web3.js` for transaction signing and wallet integration
- **Jupiter API**: Swaps executed via Jupiter Lite API (quote + swap endpoints)

### Key Components

**SolanaJupiterSwapper** (`components/SolanaJupiterSwapper.tsx`)
- Main swap interface component (340+ lines)
- Handles wallet connection (Phantom wallet integration)
- Manages 4 swap modes: normal, roundtrip, micro (randomized), loopreturn
- Implements auto-swap sequences with configurable delays and counts
- Routes fees to affiliate vaults based on selected affiliate (pond0x or aquavaults)
- Jupiter quote/swap flow: fetch quote → build swap transaction → sign with Phantom → send + confirm

**Vault Configuration** (`lib/vaults.ts`)
- Two affiliate vault mappings: `TOKEN_VAULTS_AFFILIATE_1` (pond0x) and `TOKEN_VAULTS_AFFILIATE_2` (aquavaults)
- Each vault maps token mints to fee account addresses
- Supported tokens: SOL, USDC, USDT, wPOND, hSOL, mSOL, PepeOnSOL
- Vault addresses are passed as `feeAccount` in Jupiter swap requests to route platform fees

**Visual Effects** (`app/(utils)/bubbles.ts` and `mount.tsx`)
- Canvas-based animated bubble background
- Mounted via `Mount` component in main page
- Toggleable via UI button

### Important Patterns

**Wallet Integration**
- Expects `window.solana` (Phantom provider)
- Uses `signAndSendTransaction` or fallback to `signTransaction` + manual send
- All swaps require connected wallet with `publicKey`

**Transaction Flow**
1. Fetch quote from Jupiter with input/output mints, amount, slippage, platform fee
2. Build swap transaction with quote response, user pubkey, optional fee account
3. Deserialize base64 transaction → `VersionedTransaction`
4. Sign via Phantom provider
5. Send to RPC and confirm with "confirmed" commitment

**Auto-Swap Modes**
- `normal`: Single swap execution
- `roundtrip`: Swap A→B then B→A (requires >10 USD value)
- `micro`: Randomized amounts between base and max (10-100% of base)
- `loopreturn`: N swaps in one direction, then one return swap

**Environment Variables**
- `NEXT_PUBLIC_REFERRAL_PROGRAM_ID`: Jupiter referral program ID (default: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4")
- `NEXT_PUBLIC_DEFAULT_RPC`: Solana RPC URL (default: "https://api.mainnet-beta.solana.com")

### Testing

- **Vitest** for unit tests
- Test coverage for utility functions (`lib/utils.ts`) in `tests/utils.test.ts`
- Focus on pure functions: string formatting (`short`), URL generation (`solscanTx`), classname merging (`cn`)

### Styling

- **TailwindCSS** with custom theme
- Two theme files: `globals.css` and `theme-neon.css`
- Custom "glass" and "neon-border" classes for UI elements
- Dark/light mode via `data-theme` attribute on `<html>`
- Monospace fonts for addresses, signatures, and technical data

### Path Aliases

- `@/*` maps to repository root via `tsconfig.json` baseUrl
- Example: `@/components/ui/button` → `components/ui/button.tsx`
