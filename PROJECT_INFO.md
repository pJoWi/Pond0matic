# Pond0x Dashboard - Project Information

## Location in Workspace

**Path**: `E:\JowiBE\projects\fullstack\pond0x-dashboard\`

**Category**: Fullstack Project (Next.js App Router with frontend + API routes)

## Project Overview

Unified dashboard and control center for Pond0x protocol tools on Solana blockchain.

### Core Features

1. **AutoSwapper** - Jupiter-integrated automated token swaps
   - Normal, roundtrip, boost, and loop-return swap modes
   - Configurable slippage and platform fees
   - Affiliate fee routing (Pond0x / Aquavaults)
   - Auto-swap sequences with progress tracking

2. **Mining Rig Dashboard** - Pond0x protocol mining metrics
   - Real-time flywheel calculations
   - Boost tracking and session monitoring
   - Mining power percentage display
   - Priority queue position

3. **Void/Wetware Protocol** - Protocol operations interface
   - Condensation (0.001 SOL)
   - Lubrication (0.01 SOL)
   - Ionization (0.1 SOL)

4. **Compact Widget** - Embeddable minimal swapper
   - Mobile-optimized 400px interface
   - All swap modes supported
   - Can be embedded via iframe

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (cyberpunk theme)
- **Blockchain**: Solana (@solana/web3.js)
- **Swap Integration**: Jupiter Lite API
- **Wallet**: Phantom browser extension
- **Testing**: Vitest
- **State Management**: React Context API

## Repository Information

**Git Repository**: Independent git repo (polyrepo structure)

**Version**: 2.0.0

**Previous Name**: JwPond / pondx-auto-swapper

**Renamed**: November 2025 - migrated to polyrepo workspace structure

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Routes

- `/` - Main dashboard with full swapper interface
- `/compact` - Compact swapper widget (embeddable)
- Future routes:
  - `/mining` - Dedicated mining rig dashboard
  - `/void` - Void protocol interface
  - `/analytics` - Analytics and metrics

## Integration Points

### Pond0x Protocol Contracts

- Hashrate Booster: `4ngqDt821wV2C...`
- Swap Reward Distributor: `1orFCnFfgwPzS...`
- Mining Claims Distributor: `AYg4dKoZJudVk...`
- Treasury: `cPUtmyb7RZhCa...`

### Supported Tokens

- SOL, USDC, USDT
- wPOND (Warped POND)
- hSOL (Helius SOL)
- mSOL (Marinade SOL)
- PepeOnSOL

## Future Expansion

### Planned Features

1. **Analytics Dashboard** (`/analytics`)
   - Historical swap data
   - Mining performance tracking
   - ROI calculations

2. **Portfolio Tracker** (`/portfolio`)
   - Multi-wallet balance tracking
   - Position monitoring
   - PnL calculations

3. **Alert System** (`/alerts`)
   - Price alerts
   - Mining rig health notifications
   - Transaction confirmations

4. **API Routes** (`/api/*`)
   - Jupiter quote caching
   - User preferences storage
   - Webhook endpoints

### Potential Microservices

If tools grow complex enough to warrant separation:

- `pond0x-swap-executor` (agent) - Headless swap automation
- `pond0x-mining-monitor` (agent) - Mining rig monitoring service
- `pond0x-analytics-engine` (agent) - Data aggregation

These would be separate repos in `E:\JowiBE\agents\automation\`

## Workspace Context

Part of the **JowiBE polyrepo workspace** where:

- Each project is an independent git repository
- Projects can use different tech stacks
- Shared code distributed via npm packages or copy/paste
- Located in `projects/fullstack/` for Next.js fullstack apps

## Documentation

- Main README: [README.md](./README.md)
- Claude Code guidance: [CLAUDE.md](./CLAUDE.md)
- Migration history: [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md)
- Refactoring progress: [REFACTORING_PROGRESS.md](./REFACTORING_PROGRESS.md)

## Remote Repository

**Setup for GitHub**:

```bash
git remote add origin https://github.com/yourname/pond0x-dashboard.git
git branch -M main
git push -u origin main
```

## Security

⚠️ **Never commit**:

- `.env.local` - Contains RPC API keys
- Private keys or seed phrases
- Wallet credentials

✅ **Always**:

- Use your own RPC endpoint (Helius, Alchemy, QuickNode)
- Test with small amounts first
- Review transactions on Solscan before signing

## Links

- Jupiter Aggregator: <https://jup.ag>
- Pond0x Protocol: (add official links)
- Solana Explorer: <https://solscan.io>
- Phantom Wallet: <https://phantom.app>

---

**Last Updated**: November 2025
**Maintainer**: Jowi
**Status**: Active Development
