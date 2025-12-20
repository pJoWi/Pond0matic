# Pond0matic Installation & Setup Guide

## Overview

This guide will walk you through the complete installation and setup process for Pond0matic, a Next.js-based web application for automated token swapping on the Solana blockchain. The application provides three swap modes: Normal (single swap), Boost (multiple randomized swaps), and Rewards (points-earning swaps).

**Estimated Time to Complete**: 15-30 minutes
**Skill Level Required**: Intermediate (basic knowledge of Node.js, command line, and git)
**Application Version**: 2.0.0

---

## Table of Contents

1. [Before You Begin](#before-you-begin)
2. [Prerequisites](#prerequisites)
3. [Installation Steps](#installation-steps)
4. [Environment Configuration](#environment-configuration)
5. [Starting the Application](#starting-the-application)
6. [Troubleshooting](#troubleshooting)
7. [Next Steps](#next-steps)

---

## Before You Begin

### What You'll Need

- A computer running Windows, macOS, or Linux
- Internet connection
- A code editor (optional, but recommended: VS Code, Sublime Text, etc.)
- Basic familiarity with command line/terminal operations
- A Solana wallet (Phantom, Solflare, or compatible wallet browser extension)

### System Requirements

**Minimum Requirements**:
- Node.js: v18.17.0 or higher
- npm: v9.0.0 or higher (comes with Node.js)
- RAM: 4GB minimum
- Storage: 500MB free space for dependencies

**Recommended Requirements**:
- Node.js: v20.x (LTS version)
- RAM: 8GB or more
- Modern browser: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+

### Important Warnings

**WARNING**: This application interacts with the Solana blockchain and handles real cryptocurrency transactions. Always:
- Test with small amounts first
- Never commit your wallet's private keys to version control
- Use a dedicated RPC endpoint for production use
- Keep your `.env.local` file secure and private

---

## Prerequisites

### Step 1: Install Node.js and npm

Node.js is a JavaScript runtime required to run the application. npm (Node Package Manager) comes bundled with Node.js.

#### On Windows:

1. Visit [https://nodejs.org/](https://nodejs.org/)
2. Download the LTS (Long Term Support) version
3. Run the installer and follow the installation wizard
4. Accept all default settings

#### On macOS:

**Option A - Using Official Installer**:
1. Visit [https://nodejs.org/](https://nodejs.org/)
2. Download the LTS version for macOS
3. Run the `.pkg` file and follow the installation wizard

**Option B - Using Homebrew** (if installed):
```bash
brew install node
```

#### On Linux (Ubuntu/Debian):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Verify Installation:

Open a terminal/command prompt and run:

```bash
node --version
npm --version
```

**Expected Output**:
```
v20.x.x
9.x.x
```

The exact version numbers may vary, but they should meet the minimum requirements listed above.

### Step 2: Install Git (if not already installed)

Git is required to clone the repository from GitHub.

#### On Windows:

1. Visit [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Download and run the installer
3. Use default settings during installation

#### On macOS:

Git usually comes pre-installed. If not:
```bash
brew install git
```

#### On Linux (Ubuntu/Debian):

```bash
sudo apt-get update
sudo apt-get install git
```

#### Verify Installation:

```bash
git --version
```

**Expected Output**:
```
git version 2.x.x
```

---

## Installation Steps

### Step 1: Clone the Repository

Open your terminal/command prompt and navigate to the directory where you want to install Pond0matic.

**Example**: To install in your Documents folder:

**On Windows**:
```bash
cd C:\Users\YourUsername\Documents
```

**On macOS/Linux**:
```bash
cd ~/Documents
```

Clone the repository from GitHub:

```bash
git clone https://github.com/pJoWi/Pond0matic.git
```

**Expected Output**:
```
Cloning into 'Pond0matic'...
remote: Enumerating objects: 150, done.
remote: Counting objects: 100% (150/150), done.
remote: Compressing objects: 100% (100/100), done.
remote: Total 150 (delta 50), reused 150 (delta 50), pack-reused 0
Receiving objects: 100% (150/150), 1.50 MiB | 2.00 MiB/s, done.
Resolving deltas: 100% (50/50), done.
```

Navigate into the project directory:

```bash
cd Pond0matic
```

**NOTE**: You should now be inside the `Pond0matic` directory. All subsequent commands should be run from this directory.

### Step 2: Install Dependencies

Install all required Node.js packages using npm:

```bash
npm install
```

**Expected Output**: You'll see a progress bar and package installation messages. This process may take 2-5 minutes depending on your internet connection.

```
added 450 packages, and audited 451 packages in 2m

150 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

**TIP**: If you encounter any errors during installation, try deleting the `node_modules` folder and `package-lock.json` file, then run `npm install` again.

### Step 3: Verify Installation

Check that all dependencies were installed correctly:

```bash
npm list --depth=0
```

**Expected Output**: A list of installed packages without any error messages. You should see packages like:
- `next@15.x.x`
- `react@18.x.x`
- `@solana/web3.js@1.x.x`
- And many others

---

## Environment Configuration

The application requires environment variables to configure RPC endpoints, API keys, and default settings.

### Step 1: Create Environment File

Copy the example environment file to create your local configuration:

**On Windows (Command Prompt)**:
```bash
copy .env.example .env.local
```

**On Windows (PowerShell)**:
```bash
Copy-Item .env.example .env.local
```

**On macOS/Linux**:
```bash
cp .env.example .env.local
```

**Expected Result**: You should now have a file named `.env.local` in your project root directory.

**WARNING**: The `.env.local` file contains sensitive configuration. This file is automatically ignored by git and should NEVER be committed to version control.

### Step 2: Configure RPC Endpoint

Open `.env.local` in your text editor. The most important setting is the Solana RPC endpoint.

#### Option A: Use Free Public RPC (Not Recommended for Production)

The default configuration uses the public Solana RPC:

```bash
NEXT_PUBLIC_DEFAULT_RPC=https://api.mainnet.solana.com
```

**WARNING**: The public RPC is rate-limited and unreliable. It's suitable only for testing.

#### Option B: Use Helius RPC (Recommended)

Helius offers a free tier with 100 requests per second, which is more than sufficient for most users.

1. Visit [https://www.helius.dev/](https://www.helius.dev/)
2. Sign up for a free account
3. Create a new API key
4. Copy your API key

Update your `.env.local` file:

```bash
NEXT_PUBLIC_DEFAULT_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY_HERE
```

Replace `YOUR_API_KEY_HERE` with your actual Helius API key.

#### Option C: Use Other RPC Providers

Alternative RPC providers include:
- **QuickNode**: [https://www.quicknode.com/](https://www.quicknode.com/)
- **Alchemy**: [https://www.alchemy.com/](https://www.alchemy.com/)
- **Triton**: [https://triton.one/](https://triton.one/)

Follow their documentation to obtain an RPC endpoint URL and update your `.env.local` accordingly.

### Step 3: Configure Jupiter API Key (Optional)

Jupiter is the swap aggregator used by Pond0matic. While the Jupiter API can be used without authentication, providing an API key may improve rate limits and reliability.

**NOTE**: As of version 2.0.0, Jupiter API key configuration is handled internally. No action is required for basic functionality.

### Step 4: Review and Adjust Default Settings

The `.env.local` file contains many configurable defaults. Here are the most important ones:

#### Swap Defaults

```bash
# Default slippage tolerance (50 = 0.5%, 100 = 1%)
NEXT_PUBLIC_DEFAULT_SLIPPAGE_BPS=50

# Default platform fee (100 = 1%)
NEXT_PUBLIC_DEFAULT_PLATFORM_FEE_BPS=100

# Default swap amount
NEXT_PUBLIC_DEFAULT_AMOUNT=0.01
```

#### Boost Mode Defaults

```bash
# Number of rounds (how many times to repeat the swap sequence)
NEXT_PUBLIC_DEFAULT_ROUNDS=3

# Swaps per round (how many swaps in each round)
NEXT_PUBLIC_DEFAULT_SWAPS_PER_ROUND=18

# Minimum and maximum amounts for randomization
NEXT_PUBLIC_DEFAULT_MIN_AMOUNT=0.01
NEXT_PUBLIC_DEFAULT_MAX_AMOUNT=0.02

# Delay between swaps in milliseconds (6000 = 6 seconds)
NEXT_PUBLIC_DEFAULT_SWAP_DELAY_MS=6000
```

#### Rewards Mode Defaults

```bash
# Default swap amount for rewards mode (in USD)
NEXT_PUBLIC_DEFAULT_REWARDS_AMOUNT=10

# Number of swaps for rewards mode
NEXT_PUBLIC_DEFAULT_REWARDS_SWAPS=5
```

**TIP**: For your first run, keep all defaults as-is. You can adjust these later based on your needs.

### Step 5: Verify Configuration

Ensure your `.env.local` file has at minimum:

```bash
NEXT_PUBLIC_DEFAULT_RPC=<your-rpc-endpoint>
NEXT_PUBLIC_REFERRAL_PROGRAM_ID=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4
```

**NOTE**: The `NEXT_PUBLIC_REFERRAL_PROGRAM_ID` is pre-configured and should not be changed unless you have a specific Jupiter referral program ID.

---

## Starting the Application

### Development Mode

Development mode includes hot-reloading, which means the application will automatically refresh when you make code changes.

#### Step 1: Build the Application (First Time Only)

Before starting the development server for the first time, build the application:

```bash
npm run build
```

**Expected Output**:
```
> pond0matic@2.0.0 build
> next build

   ▲ Next.js 15.0.3

   Creating an optimized production build ...
 ✓ Compiled successfully
 ✓ Linting and checking validity of types
 ✓ Collecting page data
 ✓ Generating static pages (5/5)
 ✓ Collecting build traces
 ✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    142 B          87.5 kB
├ ○ /compact                             142 B          87.5 kB
├ ○ /swapper                             142 B          87.5 kB
└ ○ /unified                             142 B          87.5 kB
```

This process may take 30-60 seconds.

#### Step 2: Start Development Server

```bash
npm run dev
```

**Expected Output**:
```
> pond0matic@2.0.0 dev
> next dev

   ▲ Next.js 15.0.3
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.100:3000

 ✓ Ready in 2.5s
```

#### Step 3: Access the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

**Expected Result**: You should see the Pond0matic dashboard interface.

**TIP**: The "Network" URL shown in the terminal output allows you to access the application from other devices on your local network (useful for testing on mobile devices).

### Production Mode

For production deployment, use the production server:

#### Step 1: Build for Production

```bash
npm run build
```

#### Step 2: Start Production Server

```bash
npm start
```

**Expected Output**:
```
> pond0matic@2.0.0 start
> next start

   ▲ Next.js 15.0.3
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.100:3000

 ✓ Ready in 1.2s
```

**NOTE**: Production mode does not include hot-reloading. You must rebuild and restart the server after code changes.

### Changing the Port

If port 3000 is already in use, you can specify a different port:

```bash
# Development
npm run dev -- -p 3001

# Production
npm start -- -p 3001
```

Replace `3001` with your desired port number.

---

## Troubleshooting

### Issue: "Command not found: node" or "Command not found: npm"

**Diagnosis**: Node.js is not installed or not in your system PATH.

**Solution**:
1. Verify Node.js installation by running `node --version`
2. If the command is not found, reinstall Node.js
3. On Windows, ensure the Node.js installation directory is added to your system PATH
4. Restart your terminal/command prompt after installation

### Issue: "npm install" fails with permission errors

**Diagnosis**: Insufficient permissions to write to the node_modules directory.

**Solution**:

**On Windows**: Run Command Prompt or PowerShell as Administrator

**On macOS/Linux**: Either:
- Fix npm permissions (recommended): [https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)
- Or use sudo (not recommended): `sudo npm install`

### Issue: Port 3000 is already in use

**Diagnosis**: Another application is using port 3000.

**Solution**:
1. Find and stop the application using port 3000
2. Or use a different port: `npm run dev -- -p 3001`

**Finding the process using port 3000**:

**On Windows**:
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**On macOS/Linux**:
```bash
lsof -i :3000
kill -9 <PID>
```

### Issue: ".env.local file not found" error

**Diagnosis**: The `.env.local` file was not created properly.

**Solution**:
1. Verify `.env.example` exists in the project root
2. Manually create `.env.local` by copying `.env.example`
3. Ensure you're running the copy command from the project root directory

### Issue: "Failed to fetch" errors when using the application

**Diagnosis**: RPC endpoint is not configured or unreachable.

**Solution**:
1. Check your `.env.local` file has a valid `NEXT_PUBLIC_DEFAULT_RPC` value
2. Verify your internet connection
3. Try using a different RPC endpoint (Helius recommended)
4. Check if the RPC endpoint URL is correct and accessible

### Issue: Build fails with TypeScript errors

**Diagnosis**: Type checking errors in the code.

**Solution**:
1. Ensure you have the latest version from GitHub: `git pull origin main`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Clear Next.js cache: `rm -rf .next`
4. Try building again: `npm run build`

### Issue: Wallet connection fails

**Diagnosis**: Browser wallet extension not installed or not configured correctly.

**Solution**:
1. Install a compatible Solana wallet (Phantom, Solflare, etc.)
2. Ensure the wallet is unlocked
3. Grant permission when the wallet prompts for connection
4. Try refreshing the page and reconnecting
5. Check browser console for specific error messages

### Issue: "Module not found" errors

**Diagnosis**: Dependencies were not installed correctly.

**Solution**:
1. Delete `node_modules` folder
2. Delete `package-lock.json` file
3. Run `npm install` again
4. If the error persists, try `npm cache clean --force` then `npm install`

---

## Next Steps

Congratulations! You've successfully installed and configured Pond0matic. Here's what to do next:

### 1. Connect Your Wallet

- Open the application in your browser
- Click the "Connect Wallet" button in the top navigation
- Select your wallet provider (Phantom, Solflare, etc.)
- Approve the connection request

### 2. Familiarize Yourself with the Interface

- Explore the Dashboard view to see mining rig statistics
- Navigate to the Swapper view to access swap functionality
- Review the different swap modes (Normal, Boost, Rewards)

### 3. Test with Small Amounts

**WARNING**: Before executing large swaps, always test with small amounts to ensure everything works correctly.

- Start with the Normal mode
- Use a minimal amount (0.01 SOL or equivalent)
- Verify the swap executes successfully
- Check your wallet balance after the swap

### 4. Read the User Manual

Refer to the **Pond0matic User Manual** for detailed information on:
- Understanding each swap mode
- Configuring swap parameters
- Monitoring swap progress
- Best practices and tips

### 5. Configure Advanced Settings

Once comfortable with the basics, explore:
- Adjusting slippage tolerance
- Customizing platform fees
- Setting up Boost mode for automated swapping
- Configuring Rewards mode for points earning

### 6. Join the Community

- Report issues on GitHub: [https://github.com/pJoWi/Pond0matic/issues](https://github.com/pJoWi/Pond0matic/issues)
- Stay updated with the latest releases

---

## Additional Resources

### Documentation Files

The following documentation files are included in the project:

- `USER_MANUAL.md` - Comprehensive user guide for using Pond0matic
- `DASHBOARD_README.md` - Technical documentation for the dashboard features
- `UI_STYLE_GUIDE.md` - UI design and styling guidelines

### External Documentation

- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Solana Documentation**: [https://docs.solana.com/](https://docs.solana.com/)
- **Jupiter API Documentation**: [https://station.jup.ag/docs/apis/swap-api](https://station.jup.ag/docs/apis/swap-api)
- **Solana Web3.js**: [https://solana-labs.github.io/solana-web3.js/](https://solana-labs.github.io/solana-web3.js/)

### Useful Commands

```bash
# Development server with hot-reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linting checks
npm run lint

# Run tests
npm test

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

---

## Security Best Practices

1. **Never commit `.env.local`** - This file contains sensitive configuration and is automatically git-ignored
2. **Use dedicated RPC endpoints** - Don't rely on public RPCs for production use
3. **Start with small amounts** - Always test swaps with minimal funds first
4. **Keep software updated** - Regularly pull the latest changes: `git pull origin main`
5. **Review transactions** - Always verify transaction details before signing in your wallet
6. **Backup configurations** - Keep a backup of your `.env.local` file in a secure location
7. **Monitor API usage** - If using paid RPC services, monitor your API usage to avoid unexpected charges

---

## Support

If you encounter issues not covered in this guide:

1. Check the **Troubleshooting** section above
2. Review the GitHub Issues page: [https://github.com/pJoWi/Pond0matic/issues](https://github.com/pJoWi/Pond0matic/issues)
3. Open a new issue with detailed information:
   - Your operating system
   - Node.js and npm versions
   - Complete error messages
   - Steps to reproduce the issue

---

**Version**: 2.0.0
**Last Updated**: December 2025
**Maintained By**: Pond0matic Development Team

---

## Appendix A: Directory Structure

Understanding the project structure:

```
Pond0matic/
├── app/                    # Next.js app directory (pages and routes)
│   ├── page.tsx           # Home page (Dashboard)
│   ├── layout.tsx         # Root layout component
│   ├── swapper/           # Swapper page
│   ├── compact/           # Compact swapper page
│   └── unified/           # Unified view page
├── components/            # React components
│   ├── CompactSwapper/    # Compact swapper components
│   ├── Dashboard.tsx      # Main dashboard component
│   ├── layout/            # Layout components
│   ├── swapper/           # Swapper-specific components
│   └── ui/                # Reusable UI components
├── contexts/              # React context providers
│   └── SwapperContext.tsx # Swap state management
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── jupiter.ts         # Jupiter API integration
│   ├── solana.ts          # Solana blockchain utilities
│   └── vaults.ts          # Token vault configurations
├── public/                # Static assets
├── styles/                # CSS and styling files
├── types/                 # TypeScript type definitions
├── .env.example           # Example environment configuration
├── .env.local             # Your local environment (create this)
├── package.json           # Project dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── tailwind.config.ts     # Tailwind CSS configuration
```

## Appendix B: Environment Variables Reference

Complete list of available environment variables:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_DEFAULT_RPC` | URL | Public Solana RPC | Solana RPC endpoint |
| `NEXT_PUBLIC_REFERRAL_PROGRAM_ID` | String | Jupiter ID | Jupiter referral program ID |
| `NEXT_PUBLIC_DEFAULT_PLATFORM_FEE_BPS` | Number | 100 | Platform fee (1%) |
| `NEXT_PUBLIC_DEFAULT_SLIPPAGE_BPS` | Number | 50 | Slippage tolerance (0.5%) |
| `NEXT_PUBLIC_DEFAULT_AMOUNT` | Number | 0.01 | Default swap amount |
| `NEXT_PUBLIC_DEFAULT_MAX_AMOUNT` | Number | 0.015 | Max amount for randomization |
| `NEXT_PUBLIC_DEFAULT_ROUNDS` | Number | 3 | Boost mode rounds |
| `NEXT_PUBLIC_DEFAULT_SWAPS_PER_ROUND` | Number | 18 | Swaps per boost round |
| `NEXT_PUBLIC_DEFAULT_MIN_AMOUNT` | Number | 0.01 | Min boost amount |
| `NEXT_PUBLIC_DEFAULT_SWAP_DELAY_MS` | Number | 6000 | Delay between swaps (ms) |
| `NEXT_PUBLIC_DEFAULT_REWARDS_AMOUNT` | Number | 10 | Rewards mode amount (USD) |
| `NEXT_PUBLIC_DEFAULT_REWARDS_SWAPS` | Number | 5 | Number of rewards swaps |

**NOTE**: All variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put sensitive secrets in these variables.
