# PondX Auto-Swapper 🌊

A Next.js application for automated Solana token swaps via Jupiter aggregator, integrated with the Pond0x protocol mining rig and flywheel mechanics.

## Features

### 🔄 Pond0x Mining Rig
- **BoostBot**: Automated micro-swaps for temporary boost accumulation
- **Permanent Boost**: SOL deposits to Hashrate Booster contract
- **Luck Burn**: Token burns routed to Swap Reward Distributor
- **Real-time Flywheel Metrics**: Live calculation of boost formula (swaps × 1/6 - sessions × -3)
- **Mining Health**: Track rig health, power, and temperature
- **Priority Queue**: Monitor position in claims distribution

### 🌀 The Void - Wetware Protocol
- **Condensation**: 0.001 SOL micro-transactions
- **Lubrication**: 0.01 SOL operations
- **Ionization**: 0.1 SOL quantum transactions

### 💱 Jupiter Swap Integration
- **Full Swapper**: Advanced interface with mining rig and wetware controls
- **Compact Swapper**: Minimal, mobile-optimized swap widget (400px wide)
- Multiple swap modes: Normal, Roundtrip, Boost (randomized), Loop-return
- Affiliate fee routing (Pond0x / Aquavaults)
- Configurable slippage and platform fees
- Real-time balance tracking
- Auto-swap sequences with countdown progress

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Phantom wallet browser extension
- Solana mainnet tokens (SOL, USDC, wPOND, etc.)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd JwPond
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your configuration
# IMPORTANT: Add your own RPC endpoint with API key
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Full Swapper (Main Interface)
Access the complete interface with mining rig and wetware controls:
- Navigate to `/` (root page)
- Click "📱 COMPACT" button in header to toggle between full and compact views

### Compact Swapper (Standalone Widget)
Access the minimal, mobile-optimized swapper:
- Navigate to `/compact`
- Perfect for embedding in iframes or mobile-first experiences
- Features:
  - Clean, centered layout with 400px max width
  - All swap modes (normal, roundtrip, boost, loopreturn)
  - Auto-swap with progress tracking
  - Mini activity feed with LED indicators
  - GPU-accelerated animations

**Embed as Widget**:
```html
<iframe
  src="http://localhost:3000/compact"
  width="440"
  height="720"
  frameborder="0"
></iframe>
```

## Environment Configuration

The application uses environment variables for default configuration. All variables are optional and have sensible defaults.

### RPC Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_DEFAULT_RPC` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `NEXT_PUBLIC_REFERRAL_PROGRAM_ID` | Jupiter referral program | `JUP6LkbZ...` |

**⚠️ Important**: For production use, replace the default RPC with a reliable provider (Helius, Alchemy, QuickNode) and your own API key.

### AutoBot Swapper Defaults

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_DEFAULT_PLATFORM_FEE_BPS` | Platform fee in basis points (100 = 1%) | `100` |
| `NEXT_PUBLIC_DEFAULT_SLIPPAGE_BPS` | Slippage tolerance in basis points | `100` |
| `NEXT_PUBLIC_DEFAULT_FROM_MINT` | Default source token address | `USDC` |
| `NEXT_PUBLIC_DEFAULT_TO_MINT` | Default destination token address | `SOL` |
| `NEXT_PUBLIC_DEFAULT_AMOUNT` | Default swap amount | `0.1` |
| `NEXT_PUBLIC_DEFAULT_MAX_AMOUNT` | Max amount for micro swaps | `0.2` |
| `NEXT_PUBLIC_DEFAULT_AUTO_COUNT` | Number of swaps in sequence | `10` |
| `NEXT_PUBLIC_DEFAULT_AUTO_DELAY_MS` | Delay between swaps (milliseconds) | `10000` |
| `NEXT_PUBLIC_DEFAULT_AFFILIATE` | Default affiliate (`pond0x` or `aquavaults`) | `pond0x` |

### Example Configuration

**.env.local**
```bash
# Use Helius RPC for better reliability
NEXT_PUBLIC_DEFAULT_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY

# Lower fees for frequent trading
NEXT_PUBLIC_DEFAULT_PLATFORM_FEE_BPS=50
NEXT_PUBLIC_DEFAULT_SLIPPAGE_BPS=50

# Start with wPOND → SOL swaps
NEXT_PUBLIC_DEFAULT_FROM_MINT=3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq
NEXT_PUBLIC_DEFAULT_TO_MINT=So11111111111111111111111111111111111111112

# Faster auto-swaps (5 second delay)
NEXT_PUBLIC_DEFAULT_AUTO_DELAY_MS=5000
```

## Supported Tokens

The application supports the following Solana tokens:

| Token | Symbol | Decimals | Mint Address |
|-------|--------|----------|--------------|
| Solana | SOL | 9 | `So11111111111111111111111111111111111111112` |
| USD Coin | USDC | 6 | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| Tether | USDT | 6 | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` |
| Warped POND | wPOND | 3 | `3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq` |
| Helius SOL | hSOL | 9 | `he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A` |
| Marinade SOL | mSOL | 9 | `mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZ7ytfqcJm7So` |
| Pepe on SOL | PepeOnSOL | 6 | `B5WTLaRwaUQpKk7ir1wniNB6m5o8GgMrimhKMYan2R6B` |

## Pond0x Protocol Integration

The application integrates with official Pond0x Solana contracts:

| Contract | Address | Purpose |
|----------|---------|---------|
| Hashrate Booster | `4ngqDt821wV2C...` | Permanent SOL boosts |
| Swap Reward Distributor | `1orFCnFfgwPzS...` | Luck burn routing |
| Mining Claims Distributor | `AYg4dKoZJudVk...` | Claims distribution |
| Treasury | `cPUtmyb7RZhCa...` | Protocol treasury |

### Pond0x Flywheel Mechanics

The mining rig implements real Pond0x protocol formulas:

- **Swap Boost** = Total Swaps × (1/6)
- **Session Penalty** = Sessions × (-3)
- **Current Boost** = Swap Boost + Session Penalty
- **Mining Power** = (Current Boost / 615) × 100%

Target: **615 boost** = **100% mining power**

## Scripts

```bash
# Development
npm run dev          # Start dev server (localhost:3000)

# Production
npm run build        # Create optimized production build
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## Project Structure

```
JwPond/
├── app/
│   ├── (utils)/
│   │   ├── bubbles.ts      # Canvas animation logic
│   │   └── mount.tsx       # Animation mount component
│   ├── compact/
│   │   └── page.tsx        # Standalone compact swapper page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page with theme toggle
├── components/
│   ├── CompactSwapper/     # Compact swapper components
│   │   ├── index.tsx       # Main compact swapper container
│   │   └── components/     # Subcomponents (ActionButton, ProgressBar, etc.)
│   ├── swapper/            # Full swapper components (modular)
│   │   ├── SwapConfigPanel.tsx
│   │   ├── StatusDashboard.tsx
│   │   ├── MiningRigDashboard.tsx
│   │   └── ...
│   ├── SolanaJupiterSwapper.tsx  # Main swap + mining rig orchestrator
│   ├── StatusBadge.tsx           # Status indicator component
│   └── ui/
│       └── button.tsx      # Button component
├── contexts/
│   └── SwapperContext.tsx  # Global state management
├── hooks/
│   ├── useSwapExecution.ts # Shared swap execution logic
│   ├── useWallet.ts        # Wallet connection hook
│   ├── useBalances.ts      # Balance fetching hook
│   ├── useActivityLog.ts   # Activity logging hook
│   └── useMiningRig.ts     # Mining rig state hook
├── lib/
│   ├── utils.ts            # Utility functions
│   ├── vaults.ts           # Vault mappings and constants
│   ├── solana.ts           # Solana helpers
│   └── jupiter.ts          # Jupiter API helpers
├── styles/
│   ├── globals.css         # Global styles + cyberpunk theme
│   └── theme-cyberpunk.css # Additional theme utilities
├── tests/
│   └── utils.test.ts       # Unit tests
├── .env.example            # Environment template
├── .env.local              # Local config (not in git)
└── tailwind.config.ts      # Tailwind + custom animations
```

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Solana (@solana/web3.js)
- **Swap Aggregator**: Jupiter Lite API
- **Wallet**: Phantom browser extension
- **Testing**: Vitest

## Security Notes

⚠️ **Important Security Considerations**:

1. **Never commit `.env.local`** - Contains sensitive API keys
2. **Use your own RPC endpoint** - Default public RPC has rate limits
3. **Test with small amounts first** - Verify swaps work correctly
4. **Review transactions** - Always check Solscan before signing
5. **Protect your wallet** - Never share seed phrases or private keys

## Contributing

This is a personal project for Pond0x protocol interaction. If you find bugs or have suggestions, feel free to open an issue.

## License

MIT License - See LICENSE file for details

## Disclaimer

This software is provided "as is" without warranty. Use at your own risk. Always verify transactions before signing. The authors are not responsible for any losses incurred through use of this application.

---

Built with ❤️ for the Pond0x community
