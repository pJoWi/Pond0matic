# Pond0matic - Quick Start Guide

Get up and running in 5 minutes.

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **Phantom Wallet** browser extension ([Install](https://phantom.app/))

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/pJOWI/Pond0matic.git
cd Pond0matic
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Or manually create `.env.local` with this content:

```env
# Required: Solana RPC Endpoint
NEXT_PUBLIC_DEFAULT_RPC=https://api.mainnet.solana.com

# Optional: For better performance, get a free API key from https://helius.dev
# NEXT_PUBLIC_DEFAULT_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY_HERE
```

### 4. Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Use

1. **Connect Wallet**: Click "Connect Wallet" and approve in Phantom
2. **Select Tokens**: Choose tokens to swap (e.g., SOL → USDC)
3. **Configure Swap**:
   - Enter amount or click "50%"/"MAX"
   - Choose swap mode (Normal/Boost/Rewards)
4. **Execute**: Click "Execute Swap" and approve in Phantom

## Swap Modes Quick Reference

| Mode | Purpose | Best For |
|------|---------|----------|
| **Normal** | Standard token swaps | Single swaps, any token pair |
| **Boost** | Accumulate tokens with multiple swaps | Building positions over time |
| **Rewards** | Earn fees by routing through affiliate vaults | Power users, frequent swappers |

## Common Issues

**"Transaction failed"**
- Ensure you have enough SOL for transaction fees (~0.001 SOL)
- Check your RPC endpoint is working

**"Wallet not connected"**
- Refresh the page
- Unlock Phantom wallet
- Check Phantom is set to Mainnet

**Slow loading**
- Using public RPC? Get a free Helius key for faster speeds
- Check your internet connection

## Next Steps

- Read the full [User Manual](./USER_MANUAL.md) for detailed features
- See [Installation Manual](./INSTALLATION_MANUAL.md) for advanced setup
- Configure custom RPC endpoints for better performance

## Support

- Report issues: [GitHub Issues](https://github.com/YOUR_USERNAME/Pond0matic/issues)
- Documentation: See USER_MANUAL.md for detailed instructions

---

**Need help?** Check the [FAQ section](./USER_MANUAL.md#faq) in the User Manual.
