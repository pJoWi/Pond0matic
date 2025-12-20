# Pond0matic User Manual

## Overview

Welcome to Pond0matic, your unified dashboard and control center for automated token swapping on the Solana blockchain. This manual will guide you through all features and functionality, from basic single swaps to advanced automated swap sequences.

**Application Version**: 2.0.0

---

## Table of Contents

1. [What is Pond0matic?](#what-is-pond0matic)
2. [Getting Started](#getting-started)
3. [Interface Overview](#interface-overview)
4. [Connecting Your Wallet](#connecting-your-wallet)
5. [Understanding Swap Modes](#understanding-swap-modes)
6. [Normal Mode - Single Swaps](#normal-mode---single-swaps)
7. [Boost Mode - Automated Mining](#boost-mode---automated-mining)
8. [Rewards Mode - Earning Points](#rewards-mode---earning-points)
9. [Monitoring Swap Progress](#monitoring-swap-progress)
10. [Viewing Balances and Statistics](#viewing-balances-and-statistics)
11. [Advanced Settings](#advanced-settings)
12. [Tips and Best Practices](#tips-and-best-practices)
13. [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)
14. [Troubleshooting](#troubleshooting)

---

## What is Pond0matic?

Pond0matic is a sophisticated web application designed for the Pond0x protocol ecosystem. It provides:

### Core Functionality

- **Automated Token Swapping**: Execute single or multiple token swaps on Solana
- **Mining Rig Dashboard**: Monitor your mining statistics and vault balances
- **Jupiter Integration**: Access best swap rates through Jupiter's aggregation
- **Multiple Swap Modes**: Choose from Normal, Boost, or Rewards modes based on your goals
- **Real-time Monitoring**: Track swap progress, balances, and transaction history

### Key Features

1. **Three Swap Modes**:
   - **Normal**: Execute a single token swap
   - **Boost**: Run automated swap sequences for liquidity mining
   - **Rewards**: Earn rewards points through qualifying swaps

2. **Smart Configuration**:
   - Customizable slippage tolerance
   - Adjustable platform fees
   - Randomized amounts for boost mode
   - Configurable delays between swaps

3. **User-Friendly Interface**:
   - Intuitive swap interface
   - Real-time activity feed
   - Visual progress indicators
   - Network status monitoring

4. **Security Features**:
   - Non-custodial (you control your wallet)
   - Transaction preview before signing
   - No private key storage

---

## Getting Started

### Prerequisites

Before using Pond0matic, ensure you have:

1. **Installed the application** - Follow the Installation & Setup Guide
2. **A Solana wallet** - Phantom, Solflare, or compatible browser extension
3. **Funded wallet** - SOL for transaction fees and tokens to swap
4. **Active internet connection** - Required for blockchain interactions

### First Time Setup

1. **Open the application** in your web browser at `http://localhost:3000`
2. **Connect your wallet** (see [Connecting Your Wallet](#connecting-your-wallet))
3. **Verify your connection** - Check that your wallet address appears in the top navigation bar
4. **Review available tokens** - The dashboard shows supported tokens and balances

---

## Interface Overview

Pond0matic features a clean, intuitive interface organized into several key areas:

### Top Navigation Bar

Located at the very top of the screen, the navigation bar contains:

- **Application Logo/Title**: "Pond0matic" branding
- **Navigation Links**:
  - **Dashboard**: View mining statistics and vault information
  - **Swapper**: Access the swap interface (default view)
  - **Compact**: Compact version of the swapper
  - **Unified**: Combined dashboard and swapper view
- **Wallet Controls**:
  - **Connect Wallet** button (when disconnected)
  - **Wallet Address** display (when connected)
  - **Disconnect** option (when connected)

### Status Bar

Below the navigation, the status bar displays:

- **Network Status**: Connection status to Solana network
  - Green: Connected
  - Yellow: Connecting
  - Red: Disconnected or error
- **Current Swap Mode**: Indicates active mode (Normal, Boost, or Rewards)
- **SOL Balance**: Your current SOL balance for transaction fees
- **API Key Status**: Jupiter API key configuration status (if applicable)

### Main Content Area

The main area changes based on the selected view:

#### Dashboard View

- **Mining Rig Statistics Card**:
  - SOL swaps count
  - BX swaps count
  - Total boosted amount
- **Token Price Cards**:
  - wPOND price (from Jupiter)
  - Market cap (from DexScreener)
  - Liquidity metrics
- **Vault Balance Card**:
  - Real-time vault SOL balance
  - Vault address information
- **Quick Actions**: Button to open swapper

#### Swapper View

- **Token Selection Panel**: Choose FROM and TO tokens
- **Amount Input**: Specify swap amount with balance display
- **Mode Selector**: Switch between Normal, Boost, and Rewards modes
- **Configuration Panels**: Mode-specific settings (collapsible)
- **Settings Panel**: Advanced swap settings (slippage, fees)
- **Action Button**: Execute or stop swaps
- **Activity Feed**: Real-time log of swap activities

### Footer/Activity Feed

Located at the bottom of the swapper interface:

- **Recent Activities**: Last 5 swap-related events
- **Timestamps**: When each activity occurred
- **Status Indicators**: Success, pending, or error states
- **Clear Log** button: Remove all activity entries

---

## Connecting Your Wallet

Pond0matic requires a Solana wallet connection to execute transactions. The application is non-custodial, meaning you maintain full control of your funds.

### Supported Wallets

- Phantom (Recommended)
- Solflare
- Backpack
- Any wallet compatible with Solana's wallet adapter

### Connection Process

#### Step 1: Install a Wallet

If you don't have a Solana wallet:

1. Visit [https://phantom.app/](https://phantom.app/) or [https://solflare.com/](https://solflare.com/)
2. Install the browser extension for your browser
3. Create a new wallet or import an existing one
4. Securely back up your seed phrase

**WARNING**: Never share your seed phrase with anyone. Pond0matic will never ask for your seed phrase.

#### Step 2: Connect to Pond0matic

1. Open Pond0matic in your browser
2. Locate the **Connect Wallet** button in the top-right corner
3. Click **Connect Wallet**
4. A popup will appear showing available wallets
5. Select your wallet (e.g., "Phantom")
6. Your wallet extension will prompt for permission
7. Review the connection request details
8. Click **Connect** or **Approve** in your wallet

**Expected Result**:

- The "Connect Wallet" button changes to show your wallet address
- Your wallet address appears truncated (e.g., "7xK9...3mPq")
- Network status indicator turns green
- Token balances load in the interface

#### Step 3: Verify Connection

Confirm successful connection by checking:

- Wallet address is displayed in the top navigation
- SOL balance appears in the status bar
- Token balances show in the swap interface
- Network status shows "Connected" (green indicator)

### Disconnecting Your Wallet

To disconnect your wallet:

1. Click on your **wallet address** in the top navigation
2. Select **Disconnect** from the dropdown menu
3. Confirm disconnection in your wallet if prompted

**Expected Result**:

- Interface returns to "Connect Wallet" button
- All balance information clears
- Swap functionality becomes disabled

### Connection Issues

If you experience connection problems, see the [Troubleshooting](#troubleshooting) section.

---

## Understanding Swap Modes

Pond0matic offers three distinct swap modes, each designed for different use cases. Understanding these modes is crucial for using the application effectively.

### Mode Comparison Table

| Feature | Normal Mode | Boost Mode | Rewards Mode |
|---------|-------------|------------|--------------|
| **Purpose** | Single swap | Liquidity mining | Earn rewards points |
| **Number of Swaps** | 1 | Multiple (configurable) | Multiple (configurable) |
| **Swap Direction** | Any | Typically USDC → SOL | Typically USDC → SOL |
| **Amount** | Fixed | Randomized range | Fixed |
| **Rounds** | N/A | Configurable | N/A |
| **Return Swaps** | No | Optional (A→B→A) | No |
| **Minimum USD** | None | None | $10 USD equivalent |
| **Best For** | Quick swaps | Mining rewards | Earning points |

### Mode Selection

Switch between modes using the **Mode Selector** in the swapper interface:

1. Locate the mode selector buttons below the token swap interface
2. Click the desired mode button:
   - **Normal**: Single lightning bolt icon
   - **Boost**: Rocket/boost icon
   - **Rewards**: Star/trophy icon
3. The interface will update with mode-specific configuration options

**NOTE**: When switching modes, default settings for that mode are automatically applied. You can customize these settings after mode selection.

---

## Normal Mode - Single Swaps

Normal mode is the simplest swap mode, designed for executing a single token swap transaction.

### When to Use Normal Mode

- Swapping between any two tokens
- One-time conversions
- Testing the application
- Quick portfolio rebalancing

### How to Execute a Normal Swap

#### Step 1: Select Normal Mode

1. Click the **Normal** button in the mode selector
2. Verify the mode indicator shows "Normal"

**Expected Result**:

- Configuration panels for Boost/Rewards modes disappear
- Default tokens set to SOL → wPOND
- Amount field shows default value (0.01)

#### Step 2: Configure Token Pair

**Select FROM Token**:

1. Click the **FROM token dropdown** (top token selector)
2. Choose your source token (e.g., "SOL")
3. Verify your balance displays below the dropdown

**Select TO Token**:

1. Click the **TO token dropdown** (bottom token selector)
2. Choose your destination token (e.g., "wPOND")

**TIP**: Click the **swap direction button** (⇅ icon) between token selectors to quickly reverse the FROM and TO tokens.

#### Step 3: Enter Swap Amount

1. Click in the **Amount** input field
2. Enter the amount of FROM token to swap
3. Review your available balance shown below the input

**Example**: To swap 0.5 SOL for wPOND:

```
FROM: SOL
TO: wPOND
Amount: 0.5
```

**Balance Check**: The application displays your available balance. For example:

```
Balance: 2.5 SOL
```

**WARNING**: Ensure you leave enough SOL for transaction fees (typically 0.001-0.01 SOL per transaction).

#### Step 4: Review Settings (Optional)

Expand the **Settings Panel** to review or adjust:

- **Slippage Tolerance**: Maximum acceptable price movement (default: 0.5%)
- **Platform Fee**: Fee percentage for the platform (default: 1%)

**TIP**: For volatile tokens or low liquidity pairs, increase slippage tolerance to 1-3%.

#### Step 5: Execute Swap

1. Click the **Swap** button (large button at the bottom)
2. Review the transaction details in your wallet popup
3. Verify the amounts and addresses are correct
4. Click **Approve** or **Confirm** in your wallet
5. Wait for transaction confirmation

**Expected Flow**:

1. Button shows "Swap" → "Processing..." → "Swap"
2. Activity feed shows "Swap initiated"
3. Wallet popup appears for approval
4. After approval: "Transaction submitted"
5. After confirmation: "Swap completed successfully"

#### Step 6: Verify Completion

Check that the swap completed successfully:

- Activity feed shows "Swap completed" with green checkmark
- Token balances update to reflect the swap
- Transaction signature appears in the activity feed (clickable link to Solscan)

**TIP**: Click the transaction signature in the activity feed to view full transaction details on Solscan blockchain explorer.

### Example: Swapping SOL to wPOND

**Scenario**: You want to convert 1 SOL to wPOND tokens.

**Steps**:

1. Select Normal mode
2. FROM: SOL
3. TO: wPOND (3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq)
4. Amount: 1
5. Review settings (slippage: 0.5%, platform fee: 1%)
6. Click "Swap"
7. Approve in wallet
8. Wait for confirmation (usually 5-30 seconds)

**Expected Outcome**:

- You receive wPOND tokens (amount depends on current exchange rate)
- Your SOL balance decreases by 1 SOL + transaction fees
- Activity feed shows successful swap

---

## Boost Mode - Automated Mining

Boost mode enables automated swap sequences designed for liquidity mining and earning boost rewards in the Pond0x ecosystem.

### What is Boost Mode?

Boost mode executes multiple swaps in a sequence with the following characteristics:

- **Randomized Amounts**: Each swap uses a random amount within your specified range
- **Multiple Rounds**: Swaps are organized into rounds for better tracking
- **Optional Return Swaps**: Can automatically swap back (e.g., USDC→SOL→USDC)
- **Configurable Delays**: Set time intervals between swaps
- **Infinite Mode**: Option to run continuously until manually stopped

### Boost Mode Flow

```
Round 1:
  Swap 1: USDC → SOL (random amount between min and max)
  [delay]
  Swap 2: USDC → SOL (random amount between min and max)
  [delay]
  ... (continues for swapsPerRound)

  [Optional: Return swap if loopReturnAmount > 0]
  Return: SOL → USDC (loopReturnAmount)

Round 2:
  [Same pattern repeats]

... (continues for numberOfRounds)
```

### When to Use Boost Mode

- Earning liquidity mining rewards
- Accumulating boost points in Pond0x protocol
- Automated trading strategies
- Volume generation for token pairs

### Configuring Boost Mode

#### Step 1: Select Boost Mode

1. Click the **Boost** button in the mode selector
2. Verify mode indicator shows "Boost"

**Expected Result**:

- Tokens automatically set to USDC → SOL
- Default boost configuration applied
- Configuration panel appears

#### Step 2: Expand Configuration Panel

1. Click the **Configuration** dropdown button
2. The Boost Mode Panel expands showing all settings

#### Step 3: Configure Amount Range

**Min Amount**:

- The minimum amount to swap per transaction
- Each swap will use at least this amount
- Default: 0.01 USDC

**Max Amount**:

- The maximum amount to swap per transaction
- Each swap will use at most this amount
- Default: 0.02 USDC

**How Randomization Works**:
For each swap, the application calculates:

```
swapAmount = random value between minAmount and maxAmount
```

**Example Configuration**:

```
Min Amount: 0.01 USDC
Max Amount: 0.05 USDC

Possible swap amounts:
Swap 1: 0.0234 USDC
Swap 2: 0.0467 USDC
Swap 3: 0.0123 USDC
... (each is random within range)
```

**TIP**: Use a larger range (e.g., min: 0.01, max: 0.1) to make swaps appear more natural and less automated.

#### Step 4: Configure Swaps Per Round

**Swaps Per Round**:

- Number of swaps to execute in each round
- Range: 1-100 (or more)
- Default: 18

**Example**:

```
Swaps Per Round: 18
Result: Each round executes 18 individual swaps
```

#### Step 5: Configure Number of Rounds

**Number of Rounds**:

- How many times to repeat the swap sequence
- Set to 0 for infinite rounds
- Default: 3

**Calculation**:

```
Total Swaps = Swaps Per Round × Number of Rounds
Example: 18 swaps/round × 3 rounds = 54 total swaps
```

**Infinite Rounds**:

```
Number of Rounds: 0
Result: Swaps continue until manually stopped
```

**WARNING**: Infinite mode will continue indefinitely. Ensure you have sufficient token balance and monitor progress regularly.

#### Step 6: Configure Loop Return Amount (Optional)

**Loop Return Amount**:

- Amount of TO token to swap back to FROM token after each round
- Set to 0 to disable return swaps
- Default: 0 (disabled)

**Use Case**: Maintain stable FROM token balance while earning rewards.

**Example Scenario**:

```
Configuration:
- FROM: USDC
- TO: SOL
- Swaps Per Round: 10
- Loop Return Amount: 0.5 SOL

Execution:
1. Execute 10 USDC → SOL swaps
2. After round completes, swap 0.5 SOL → USDC
3. Repeat for next round
```

**Balance Display**: The panel shows your current TO token balance to help you configure an appropriate return amount.

#### Step 7: Configure Swap Delay

**Swap Delay (milliseconds)**:

- Time to wait between individual swaps
- Prevents rate limiting and makes swaps appear more natural
- Range: 3000-30000 ms (3-30 seconds)
- Default: 6000 ms (6 seconds)

**Example**:

```
Swap Delay: 6000 ms
Result: 6 seconds between each swap transaction
```

**TIP**: Use longer delays (10-15 seconds) for larger amounts or during high network congestion.

### Executing Boost Mode

#### Step 1: Review Configuration

Before starting, verify all settings:

```
✓ Min Amount: 0.01 USDC
✓ Max Amount: 0.02 USDC
✓ Swaps Per Round: 18
✓ Number of Rounds: 3
✓ Loop Return Amount: 0
✓ Swap Delay: 6000 ms

Total Swaps: 54 (18 × 3)
Estimated Time: ~5-6 minutes
```

#### Step 2: Check Token Balance

Ensure you have sufficient balance:

**Calculation**:

```
Required Balance (worst case):
= Max Amount × Swaps Per Round × Number of Rounds
= 0.02 × 18 × 3
= 1.08 USDC minimum

Recommended Balance:
= Required Balance × 1.2 (20% buffer)
= 1.08 × 1.2
= ~1.3 USDC
```

**WARNING**: Always maintain extra balance for transaction fees and potential slippage.

#### Step 3: Start Boost Sequence

1. Click the **Start Boost** button
2. Activity feed shows "Boost mode initiated"
3. First swap transaction popup appears in wallet
4. Approve the first transaction

**Important**:

- You must approve EACH individual swap transaction in your wallet
- The application will pause and wait for approval between swaps
- Do not close the browser tab while boost mode is running

#### Step 4: Monitor Progress

The interface displays:

- **Progress Indicator**: Shows current swap / total swaps
  - Example: "Swap 5 of 54"
- **Current Round**: Shows current round / total rounds
  - Example: "Round 1 of 3"
- **Activity Feed**: Real-time log of each swap
- **Stop Button**: Appears during execution to halt the sequence

**Example Progress Display**:

```
BOOST MODE RUNNING
Round 1 of 3
Swap 5 of 18 (this round)
Total Progress: 5 of 54 swaps

[■■■■■□□□□□] 27%

[STOP] button
```

#### Step 5: Approve Each Transaction

For each swap:

1. Wallet popup appears
2. Review transaction details (amount, tokens, fees)
3. Click "Approve" in your wallet
4. Wait for confirmation
5. Next swap begins after the configured delay

**Automation Level**: Pond0matic automates the sequencing and timing, but you must manually approve each wallet transaction for security.

**TIP**: Keep your wallet window visible alongside Pond0matic for faster approvals.

**AUTOSWAP**
***Or use an autoclicker that clicks "confirm" or "cancel":  PyAutoGUI-> autoswap.py***
**AUTOSWAP**

#### Step 6: Completion

When all rounds complete:

- Progress indicator shows "54 of 54 swaps complete"
- Success message appears in activity feed
- Button changes back to "Start Boost"
- Statistics update with completed swaps

### Stopping Boost Mode Early

To stop an in-progress boost sequence:

1. Click the **Stop** button (appears during execution)
2. Current swap completes if already initiated
3. Remaining swaps are cancelled
4. Activity feed shows "Boost mode stopped by user"
5. Progress is saved (completed swaps count toward statistics)

**NOTE**: You cannot stop a transaction that's already been approved and submitted to the blockchain. The stop function prevents subsequent swaps from initiating.

### Example: 3-Round Boost Sequence

**Scenario**: Earn boost rewards by executing 54 swaps over 3 rounds.

**Configuration**:

```
Mode: Boost
FROM Token: USDC
TO Token: SOL
Min Amount: 0.01 USDC
Max Amount: 0.02 USDC
Swaps Per Round: 18
Number of Rounds: 3
Loop Return Amount: 0 (no return swaps)
Swap Delay: 6000 ms (6 seconds)
```

**Execution Plan**:

```
Total Swaps: 54
Estimated Duration: ~6-7 minutes
Required Balance: ~1.08 USDC + fees

Round 1: 18 swaps (USDC → SOL)
  ↓ 6 seconds delay between each
Round 2: 18 swaps (USDC → SOL)
  ↓ 6 seconds delay between each
Round 3: 18 swaps (USDC → SOL)
  ↓ 6 seconds delay between each

Result: 54 completed swaps, earned boost rewards
```

**Expected Outcome**:

- 54 individual swap transactions executed
- USDC balance decreased by ~0.54-1.08 USDC (depending on random amounts)
- SOL balance increased (amount varies by market rates)
- Boost rewards credited to your account
- Dashboard statistics updated

---

## Rewards Mode - Earning Points

Rewards mode is specifically designed for earning rewards points through qualifying swap transactions. This mode has specific requirements to ensure swaps qualify for rewards programs.

### What is Rewards Mode?

Rewards mode executes a series of fixed-amount swaps that meet minimum USD value requirements for earning rewards or points in referral/rewards programs.

**Key Characteristics**:

- **Fixed Amounts**: Each swap uses the same amount (no randomization)
- **Minimum USD Value**: $10 USD equivalent required per swap
- **Referral Link Support**: Optional referral link for tracking
- **Sequential Execution**: Swaps execute one after another with delays
- **Points Tracking**: Designed to maximize qualifying transactions

### Minimum Requirements

**IMPORTANT**: To qualify for rewards, each swap must meet the minimum USD value requirement:

```
Minimum USD Value per Swap: $10 USD
```

The application automatically calculates the USD value based on current token prices. If your configured amount is below $10 USD equivalent, the swap will be blocked.

**Example**:

```
Token: USDC (stable coin, 1 USDC ≈ $1 USD)
Minimum Amount: 10 USDC

Token: SOL (assuming $180/SOL)
Minimum Amount: ~0.055 SOL (to meet $10 USD minimum)
```

### When to Use Rewards Mode

- Participating in referral reward programs
- Earning points for promotions
- Qualifying for airdrop allocations
- Meeting volume requirements for bonuses

### Configuring Rewards Mode

#### Step 1: Select Rewards Mode

1. Click the **Rewards** button in the mode selector
2. Verify mode indicator shows "Rewards"

**Expected Result**:

- Tokens automatically set to USDC → SOL
- Default rewards configuration applied
- Rewards configuration panel appears

#### Step 2: Expand Configuration Panel

1. Click the **Configuration** dropdown button
2. The Rewards Mode Panel expands showing all settings

#### Step 3: Configure Swap Amount

**Swap Amount**:

- Fixed amount to swap for each transaction
- Must meet minimum $10 USD equivalent
- Default: 10 USDC

**USD Value Indicator**:
The panel displays the estimated USD value of your configured amount:

```
Swap Amount: 10 USDC
Estimated USD Value: ~$10.00 ✓

OR

Swap Amount: 0.05 SOL
Estimated USD Value: ~$9.00 ✗ (below minimum)
```

**Color Coding**:

- **Green**: Amount meets $10 minimum requirement
- **Red**: Amount is below $10 minimum (swap will be blocked)

**WARNING**: If the USD value indicator shows red, increase your swap amount before proceeding.

#### Step 4: Configure Number of Swaps

**Number of Swaps**:

- How many qualifying swaps to execute
- Set to 0 for infinite swaps
- Default: 5

**Calculation**:

```
Total USD Volume = Swap Amount × Number of Swaps
Example: $10 × 5 swaps = $50 total volume
```

**Use Case Examples**:

```
Scenario 1: Qualifying for Bronze tier (requires $50 volume)
Configuration: $10/swap × 5 swaps = $50 ✓

Scenario 2: Qualifying for Silver tier (requires $200 volume)
Configuration: $10/swap × 20 swaps = $200 ✓

Scenario 3: Continuous rewards earning
Configuration: $10/swap × 0 (infinite) = ongoing ✓
```

#### Step 5: Configure Referral Link (Optional)

**Referral Link**:

- Optional URL for tracking your swaps to a referral program
- Used by some rewards programs for attribution
- Leave blank if not using referral tracking

**How to Obtain a Referral Link**:

1. Visit the rewards program website (e.g., Jupiter referral program)
2. Sign up or log in to your account
3. Generate or copy your unique referral link
4. Paste into the Referral Link field in Pond0matic

**Example**:

```
Referral Link: https://jup.ag/swap?ref=YOUR_REFERRAL_CODE
```

**NOTE**: The referral link functionality depends on the specific rewards program. Consult the program's documentation for details.

### Executing Rewards Mode

#### Step 1: Review Configuration

Before starting, verify:

```
✓ Swap Amount: 10 USDC
✓ Estimated USD Value: $10.00 (green checkmark)
✓ Number of Swaps: 5
✓ Referral Link: (optional)
✓ Total Volume: $50

Estimated Time: ~30-60 seconds
```

#### Step 2: Check Balance

Ensure sufficient balance:

```
Required Balance:
= Swap Amount × Number of Swaps
= 10 USDC × 5
= 50 USDC minimum

Recommended Balance:
= Required Balance × 1.1 (10% buffer)
= 55 USDC
```

#### Step 3: Start Rewards Sequence

1. Verify the estimated USD value is green (≥$10)
2. Click the **Start Rewards** button
3. Activity feed shows "Rewards mode initiated"
4. First swap transaction appears in wallet
5. Approve the transaction

#### Step 4: Monitor Progress

The interface displays:

- **Progress Indicator**: "Swap X of Y"
  - Example: "Swap 2 of 5"
- **Total Volume**: Cumulative USD value
  - Example: "$20 of $50 completed"
- **Activity Feed**: Each qualifying swap logged
- **Stop Button**: Option to halt early

**Example Progress Display**:

```
REWARDS MODE RUNNING
Swap 2 of 5
Total Volume: $20 / $50

[■■■■□□□□□□] 40%

Each swap qualifies for rewards ✓

[STOP] button
```

#### Step 5: Approve Transactions

For each swap:

1. Review transaction in wallet popup
2. Verify amount meets qualifying criteria
3. Approve transaction
4. Wait for confirmation (~5-30 seconds)
5. Next swap initiates automatically after delay

#### Step 6: Completion

When all swaps complete:

- Progress shows "5 of 5 swaps complete"
- Success message: "Rewards sequence completed successfully"
- Total volume achieved: "$50"
- Button returns to "Start Rewards"

**Rewards Crediting**:
Depending on the rewards program, points may credit:

- Immediately after each transaction
- After a delay (24-48 hours)
- At the end of a rewards period

Consult the specific rewards program for crediting timelines.

### Example: Qualifying for Rewards Program

**Scenario**: You want to qualify for a rewards program that requires $100 USD in swap volume.

**Configuration**:

```
Mode: Rewards
FROM Token: USDC
TO Token: SOL
Swap Amount: 10 USDC
Number of Swaps: 10
Referral Link: https://jup.ag/swap?ref=YOUR_CODE
```

**Execution Plan**:

```
Total Swaps: 10
Per Swap: $10 USD
Total Volume: $100 USD
Estimated Duration: ~2-3 minutes
Required Balance: 100 USDC + fees

Swap 1: 10 USDC → SOL ($10 qualified) ✓
  ↓ 3 seconds delay
Swap 2: 10 USDC → SOL ($10 qualified) ✓
  ↓ 3 seconds delay
... continues for 10 swaps ...
Swap 10: 10 USDC → SOL ($10 qualified) ✓

Result: $100 total volume, qualified for rewards tier
```

**Expected Outcome**:

- 10 completed qualifying swaps
- $100 USD total volume
- USDC balance decreased by 100 USDC
- SOL balance increased
- Rewards points credited per program rules
- Potential rewards: tokens, NFTs, or tier benefits

---

## Monitoring Swap Progress

Effective monitoring ensures your swaps execute successfully and helps you catch any issues early.

### Progress Indicators

Pond0matic provides multiple visual indicators to track swap progress:

#### 1. Action Button State

The main action button changes to reflect current status:

**Before Starting**:

```
[Swap] (Normal mode)
[Start Boost] (Boost mode)
[Start Rewards] (Rewards mode)
```

**During Execution**:

```
[Processing...] (with animated spinner)
```

**After Completion**:

```
[Swap] (returns to ready state)
```

**To Stop**:

```
[Stop] (red button, available during execution)
```

#### 2. Progress Counter

During multi-swap modes (Boost/Rewards):

```
Swap X of Y
Example: Swap 15 of 54
```

**Additional Details**:

- **Boost Mode**: Also shows "Round X of Y"
- **Rewards Mode**: Shows "Volume: $X of $Y"

#### 3. Progress Bar

Visual percentage completion:

```
[■■■■■■■■□□] 75%
```

- **Filled portion**: Completed swaps
- **Empty portion**: Remaining swaps
- **Percentage**: Numerical completion rate

#### 4. Network Status Indicator

Located in the status bar:

- **Green**: Connected and ready
- **Yellow**: Transaction in progress
- **Red**: Error or disconnected

### Activity Feed

The activity feed provides a detailed, real-time log of all events.

#### Activity Entry Format

Each entry includes:

```
[Timestamp] [Status Icon] [Message]

Example entries:
[14:23:45] ✓ Swap completed successfully (Tx: 5xK9...3mPq)
[14:23:38] ⏳ Swap initiated: 0.01 USDC → SOL
[14:23:30] ℹ Boost mode started: 18 swaps × 3 rounds
```

#### Status Icons

- **✓** (Green Checkmark): Success
- **⏳** (Hourglass): In progress / pending
- **ℹ** (Info): Informational message
- **✗** (Red X): Error or failure
- **⚠** (Warning): Warning or caution

#### Viewing Transaction Details

Click on any transaction signature in the activity feed to:

1. Open Solscan blockchain explorer in new tab
2. View complete transaction details
3. See transaction status on-chain
4. Review all transaction accounts and instructions

**Example**:

```
Activity Entry:
[14:23:45] ✓ Swap completed (Tx: 5xK9dQw3mPq...)
              ↑ click this
Opens: https://solscan.io/tx/5xK9dQw3mPq...
```

#### Clearing the Activity Feed

To clear all activity entries:

1. Scroll to the bottom of the activity feed
2. Click the **Clear Log** button
3. Confirm if prompted

**NOTE**: Clearing the log only removes the visual display. Transaction history remains on the blockchain.

### Balance Updates

Token balances update automatically after each swap:

#### Real-Time Balance Display

Located below token dropdowns:

```
FROM Token (USDC):
Balance: 245.50 USDC
         ↓ (decreases after swap)
Balance: 235.40 USDC

TO Token (SOL):
Balance: 1.25 SOL
         ↓ (increases after swap)
Balance: 1.31 SOL
```

**Refresh Behavior**:

- Balances update automatically after transaction confirmation
- Manual refresh: Disconnect and reconnect wallet
- Background polling: Every 30 seconds (configurable)

#### SOL Balance (Status Bar)

Transaction fee balance displays in status bar:

```
SOL: 0.5 SOL
```

**Warning Thresholds**:

- **Green**: >0.1 SOL (sufficient)
- **Yellow**: 0.01-0.1 SOL (low, refill soon)
- **Red**: <0.01 SOL (critically low, swaps may fail)

**TIP**: Always maintain at least 0.1 SOL for transaction fees. Each transaction consumes 0.001-0.01 SOL depending on network congestion.

### Error Detection

The interface provides clear error messages when issues occur:

#### Common Error Messages

**Insufficient Balance**:

```
✗ Error: Insufficient balance
  Required: 10 USDC
  Available: 5.5 USDC
  Solution: Add more USDC to your wallet
```

**Slippage Exceeded**:

```
✗ Error: Slippage tolerance exceeded
  Requested: 0.5%
  Required: 1.2%
  Solution: Increase slippage tolerance in settings
```

**Transaction Failed**:

```
✗ Error: Transaction failed
  Reason: Blockhash not found
  Solution: Retry the transaction
```

**RPC Error**:

```
✗ Error: RPC request failed
  Reason: Connection timeout
  Solution: Check internet connection or change RPC endpoint
```

#### Error Recovery

When an error occurs:

1. **Read the error message** carefully
2. **Check the suggested solution** in the message
3. **Address the underlying issue** (add balance, adjust settings, etc.)
4. **Retry the operation** using the same button
5. **If error persists**, see [Troubleshooting](#troubleshooting) section

---

## Viewing Balances and Statistics

The Dashboard view provides comprehensive information about your mining rig performance, token prices, and vault balances.

### Accessing the Dashboard

1. Click **Dashboard** in the top navigation
2. The dashboard loads with multiple information cards

### Mining Rig Statistics

Located in the top section of the dashboard:

#### SOL Swaps Card

```
┌─────────────────────────┐
│   SOL Swaps             │
│   1,234                 │
│   Total SOL-based swaps │
└─────────────────────────┘
```

**Displays**:

- Total number of SOL swaps executed
- Includes all swap modes
- Updates in real-time after each swap

#### BX Swaps Card

```
┌─────────────────────────┐
│   BX Swaps              │
│   567                   │
│   Total BX-based swaps  │
└─────────────────────────┘
```

**Displays**:

- Total number of BX token swaps
- Separate tracking from SOL swaps
- Real-time updates

#### Total Boosted Amount Card

```
┌─────────────────────────┐
│   Total Boosted         │
│   42.5 SOL              │
│   Cumulative boost amt  │
└─────────────────────────┘
```

**Displays**:

- Cumulative amount boosted through all swaps
- Measured in SOL equivalent
- Key metric for mining rewards

### Token Price Information

Real-time price data fetched from external APIs:

#### wPOND Price Card

```
┌─────────────────────────┐
│   wPOND Price           │
│   $0.002345             │
│   From Jupiter          │
│   ↑ 12.5% (24h)         │
└─────────────────────────┘
```

**Data Source**: Jupiter Price API
**Refresh Rate**: Every 30 seconds
**Shows**:

- Current wPOND/USD price
- 24-hour price change (percentage and direction)
- Last update timestamp

#### Market Cap Card

```
┌─────────────────────────┐
│   Market Cap            │
│   $2,400,000            │
│   From DexScreener      │
└─────────────────────────┘
```

**Data Source**: DexScreener API
**Shows**:

- Current market capitalization
- Based on circulating supply and price
- Updates every 30 seconds

#### Liquidity Card

```
┌─────────────────────────┐
│   Liquidity             │
│   $156,000              │
│   Available in pools    │
└─────────────────────────┘
```

**Data Source**: DexScreener API
**Shows**:

- Total liquidity across trading pools
- Important for understanding trade impact
- Higher liquidity = lower slippage

### Vault Balance

Real-time balance of the boost vault:

```
┌───────────────────────────────────┐
│   Boost Vault Balance              │
│   42.5 SOL                         │
│                                    │
│   Address:                         │
│   4ngqDt821wV2CjxoZLCjcTAPZ...     │
│                                    │
│   [Fetch Balance]                  │
└───────────────────────────────────┘
```

**Data Source**: Solana RPC (on-chain balance query)
**Displays**:

- Current SOL balance in boost vault
- Vault wallet address (truncated, click to copy)
- Manual refresh button

**Manual Refresh**:

1. Click **Fetch Balance** button
2. Loading indicator appears
3. Balance updates with latest on-chain data

### Understanding the Data

#### Loading States

When data is being fetched:

```
┌─────────────────────────┐
│   wPOND Price           │
│   ⏳ Loading...         │
│                         │
└─────────────────────────┘
```

**Shimmer Effect**: Animated loading skeleton provides visual feedback during data fetch.

#### Error States

If data fetch fails:

```
┌─────────────────────────┐
│   wPOND Price           │
│   ✗ Failed to load      │
│   [Retry]               │
└─────────────────────────┘
```

**Common Causes**:

- API rate limiting
- Network connectivity issues
- API service downtime

**Solution**: Click **Retry** button or wait for automatic refresh.

#### Auto-Refresh

The dashboard automatically refreshes data every 30 seconds to keep information current.

**Manual Refresh**:

- Reload the page in your browser
- Click individual **Fetch** buttons where available
- Disconnect and reconnect wallet

---

## Advanced Settings

Advanced settings allow you to fine-tune swap behavior for optimal results.

### Accessing Settings

The Settings Panel is located below the swap interface in all modes:

1. Scroll down in the swapper view
2. Locate the **Settings** panel (always expanded)
3. Adjust slippage and platform fee values

### Slippage Tolerance

Slippage is the difference between expected and actual swap rates due to market movement.

#### What is Slippage?

When you initiate a swap, the exchange rate may change slightly before the transaction confirms. Slippage tolerance defines the maximum acceptable difference.

**Example**:

```
Expected: 1 USDC = 0.0055 SOL
Actual: 1 USDC = 0.0054 SOL
Slippage: ~1.8%

If your slippage tolerance is 2%, the swap succeeds.
If your slippage tolerance is 1%, the swap fails and reverts.
```

#### Configuring Slippage

**Slippage field** (in basis points):

- 1 basis point = 0.01%
- 100 basis points = 1%
- Default: 50 bps (0.5%)

**Common Values**:

| Basis Points | Percentage | Use Case |
|--------------|------------|----------|
| 10 | 0.1% | Very stable pairs, high liquidity |
| 50 | 0.5% | Default, most scenarios |
| 100 | 1% | Moderate volatility |
| 300 | 3% | High volatility or low liquidity |
| 500 | 5% | Extreme volatility (use with caution) |

**Setting Slippage**:

1. Click in the **Slippage (bps)** input field
2. Enter desired value (e.g., 100 for 1%)
3. The change applies immediately to subsequent swaps

#### Slippage Recommendations

**For Stable Pairs** (USDC/USDT):

```
Recommended: 10-50 bps (0.1-0.5%)
Reason: Very low price volatility
```

**For Major Tokens** (SOL, BTC, ETH):

```
Recommended: 50-100 bps (0.5-1%)
Reason: Moderate liquidity, stable pricing
```

**For Smaller Tokens** (wPOND, smaller cap tokens):

```
Recommended: 100-300 bps (1-3%)
Reason: Lower liquidity, higher volatility
```

**For Volatile Conditions**:

```
Recommended: 300-500 bps (3-5%)
Reason: Rapid price changes, network congestion
```

**WARNING**: Higher slippage tolerance increases the risk of unfavorable exchange rates. Only increase slippage when necessary.

#### Slippage Failures

If a swap fails due to slippage:

```
✗ Error: Slippage tolerance exceeded
  Your setting: 0.5%
  Required: 1.2%
```

**Solutions**:

1. Increase slippage tolerance to 1.5-2%
2. Wait for market to stabilize
3. Reduce swap amount (less price impact)
4. Retry the transaction

### Platform Fee

Platform fee is a percentage taken from each swap to support platform development and operations.

#### Understanding Platform Fee

**Platform Fee (in basis points)**:

- Percentage of swap amount charged as fee
- Deducted from output amount
- Default: 100 bps (1%)

**Example Calculation**:

```
Swap: 10 USDC → SOL
Expected output (no fee): 0.055 SOL
Platform fee (1%): 0.00055 SOL
Actual output: 0.05445 SOL
```

#### Configuring Platform Fee

**Platform Fee field** (in basis points):

- Range: 0-500 bps (0-5%)
- Default: 100 bps (1%)

**Setting Platform Fee**:

1. Click in the **Platform Fee (bps)** input field
2. Enter desired value (e.g., 100 for 1%)
3. Change applies to subsequent swaps

**Common Values**:

| Basis Points | Percentage | Description |
|--------------|------------|-------------|
| 0 | 0% | No platform fee |
| 50 | 0.5% | Reduced fee |
| 100 | 1% | Standard fee (default) |
| 200 | 2% | Higher fee |

**NOTE**: Platform fee is separate from blockchain transaction fees (gas fees). Both are deducted from swaps.

#### Total Fee Calculation

**Total cost of swap**:

```
Total Fees = Platform Fee + Gas Fee + Jupiter Fee (if any)

Example:
Input: 10 USDC
Platform Fee (1%): 0.10 USDC
Gas Fee: ~0.001-0.01 SOL
Jupiter Fee: Varies by route

Total Cost: ~0.10 USDC + gas in SOL
```

### Settings Best Practices

1. **Start with defaults** - Use default settings initially (50 bps slippage, 100 bps fee)
2. **Adjust as needed** - Increase slippage only if swaps fail
3. **Monitor gas fees** - Keep 0.1+ SOL for transaction fees
4. **Test before production** - Use small amounts to verify settings
5. **Document changes** - Note custom settings for future reference

---

## Tips and Best Practices

### General Best Practices

#### 1. Start Small

**Always test with minimal amounts first**:

```
First swap: 0.01 SOL or $1 USDC
Verify: Swap completes successfully
Then: Increase to desired amounts
```

**Why**: Ensures configuration is correct and prevents loss of large amounts due to misconfiguration.

#### 2. Monitor Gas Fees

**Check SOL balance regularly**:

```
Minimum recommended: 0.1 SOL
Per transaction cost: ~0.001-0.01 SOL
Safe buffer: 0.2+ SOL for extended sessions
```

**Low balance warning**: If SOL balance drops below 0.05, refill before continuing.

#### 3. Verify Transaction Details

**Before approving in wallet**:

- Check FROM and TO token addresses
- Verify amounts are correct
- Review fees (platform + gas)
- Confirm destination is your wallet

**Red flags**:

- Unknown token addresses
- Unusually high fees
- Unexpected amounts
- Suspicious transaction messages

#### 4. Use Appropriate Slippage

**Match slippage to market conditions**:

**Stable markets**: 0.5-1%
**Volatile markets**: 1-3%
**Low liquidity tokens**: 2-5%

**Monitor failed swaps**: If multiple swaps fail with "slippage exceeded", increase tolerance incrementally (e.g., 0.5% → 1% → 1.5%).

#### 5. Secure Your Setup

**Security checklist**:

- ✓ Never share your seed phrase
- ✓ Keep `.env.local` file private
- ✓ Use dedicated wallet for automated swaps
- ✓ Enable wallet security features (password, biometrics)
- ✓ Verify Pond0matic URL before entering sensitive data
- ✓ Keep only necessary funds in hot wallet

### Mode-Specific Tips

#### Normal Mode Tips

**Optimize single swaps**:

1. **Check current prices** - View dashboard before swapping
2. **Consider timing** - Swap during stable market periods
3. **Verify liquidity** - Higher liquidity = better rates
4. **Use low slippage** - Single swaps can use tighter slippage (0.5%)

#### Boost Mode Tips

**Maximize boost effectiveness**:

1. **Randomize intelligently**:

   ```
   Good: Min 0.01, Max 0.05 (5x range)
   Better: Min 0.01, Max 0.10 (10x range)
   Why: Larger range appears more natural
   ```

2. **Balance speed vs. cost**:

   ```
   Fast: 3-5 second delays (more gas fees)
   Efficient: 6-10 second delays (lower fees, more natural)
   Safe: 10-15 second delays (maximum naturalness)
   ```

3. **Use return swaps strategically**:

   ```
   Scenario: Want consistent USDC balance
   Config: Loop return amount = average SOL acquired per round
   Result: USDC balance remains relatively stable
   ```

4. **Monitor during execution**:
   - Keep browser tab active
   - Watch for wallet approval prompts
   - Check balances periodically
   - Ensure sufficient balance for all swaps

5. **Plan for interruptions**:

   ```
   If you must stop early:
   1. Wait for current swap to complete
   2. Click "Stop" button
   3. Progress is saved
   4. Resume later by starting boost again
   ```

#### Rewards Mode Tips

**Maximize rewards earning**:

1. **Ensure qualification**:

   ```
   Always verify: Estimated USD ≥ $10.00 (green checkmark)
   If below: Increase swap amount
   Example: 0.05 SOL @ $180 = $9 (below minimum)
            Increase to 0.06 SOL = $10.80 ✓
   ```

2. **Track total volume**:

   ```
   Target: Specific rewards tier (e.g., $500 volume)
   Calculate: $10/swap × 50 swaps = $500
   Configure: Number of Swaps = 50
   ```

3. **Use referral links**:
   - Double-check referral URL is correct
   - Test one swap first to verify tracking
   - Keep referral dashboard open to monitor attribution

4. **Batch for efficiency**:

   ```
   Instead of: Multiple sessions of 5 swaps
   Do: One session of 25-50 swaps
   Benefits: Less manual intervention, better tracking
   ```

### Network and Performance Tips

#### 1. Choose Quality RPC

**RPC comparison**:

**Public RPC** (api.mainnet.solana.com):

- Free
- Rate limited
- Slower
- Less reliable
- **Use for**: Testing only

**Helius RPC** (helius-rpc.com):

- Free tier: 100 req/s
- Fast response
- High reliability
- **Use for**: Production, daily use

**Premium RPC** (QuickNode, Alchemy):

- Paid plans
- Highest performance
- Advanced features
- **Use for**: High-volume trading, commercial use

#### 2. Optimize Browser Performance

**For best performance**:

- Use latest Chrome, Firefox, or Edge
- Close unnecessary tabs
- Disable heavy extensions temporarily
- Ensure good internet connection
- Clear browser cache if experiencing issues

#### 3. Handle Network Congestion

**During high congestion**:

1. Increase swap delays (10-15 seconds)
2. Increase slippage tolerance (1-2%)
3. Consider using priority fees (if available)
4. Swap during off-peak hours (early morning UTC)

### Troubleshooting Tips

#### Transaction Fails Repeatedly

**Systematic debugging**:

1. **Check balance**: Ensure sufficient FROM token + SOL for fees
2. **Verify settings**: Review slippage, amount, token addresses
3. **Test RPC**: Try different RPC endpoint
4. **Reduce amount**: Try smaller swap amount
5. **Wait and retry**: Network might be congested

#### Wallet Won't Connect

**Connection troubleshooting**:

1. **Wallet extension**: Ensure wallet extension is installed and unlocked
2. **Permissions**: Grant site permissions in wallet settings
3. **Network**: Verify wallet is set to Solana mainnet
4. **Browser**: Try different browser or incognito mode
5. **Refresh**: Reload page and retry connection

#### Swaps Are Slow

**Performance optimization**:

1. **Check RPC**: Switch to faster RPC endpoint (Helius recommended)
2. **Network status**: Verify Solana network is not congested ([status.solana.com](https://status.solana.com))
3. **Reduce delay**: Lower swap delay to 5-6 seconds
4. **Browser**: Close other tabs, disable extensions

---

## Frequently Asked Questions (FAQ)

### General Questions

**Q: What is Pond0matic?**
A: Pond0matic is a web application for automated token swapping on Solana. It supports single swaps, automated boost sequences, and rewards-earning swaps.

**Q: Is Pond0matic safe to use?**
A: Yes, Pond0matic is non-custodial (you control your wallet and keys). However, always review transactions before approving and start with small amounts to test.

**Q: Does Pond0matic charge fees?**
A: Yes, there's a configurable platform fee (default 1%). You also pay Solana transaction fees (gas) and potential Jupiter routing fees.

**Q: Do I need an account to use Pond0matic?**
A: No, you only need a Solana wallet (Phantom, Solflare, etc.). No registration or account creation required.

### Wallet and Connection

**Q: Which wallets are supported?**
A: Any Solana wallet compatible with the Solana wallet adapter: Phantom, Solflare, Backpack, and others.

**Q: Can I use a hardware wallet?**
A: Yes, if your hardware wallet (Ledger) is connected through a compatible software wallet (Phantom, Solflare).

**Q: Why won't my wallet connect?**
A: Common issues:

- Wallet extension not installed or locked
- Site permissions not granted
- Wrong network (ensure Solana mainnet)
- Browser incompatibility (try Chrome or Firefox)

**Q: Is my seed phrase safe?**
A: Pond0matic never requests or stores your seed phrase. Only approve connection requests, never share your seed phrase with anyone.

### Swap Modes

**Q: Which mode should I use?**
A:

- **Normal**: Quick, one-time swaps
- **Boost**: Earning liquidity mining rewards through multiple swaps
- **Rewards**: Qualifying for rewards programs (requires $10+ per swap)

**Q: Can I stop a swap sequence in progress?**
A: Yes, click the "Stop" button during execution. The current swap completes, but subsequent swaps are cancelled.

**Q: What's the difference between Boost and Rewards modes?**
A:

- **Boost**: Randomized amounts, multiple rounds, optional return swaps, no minimum
- **Rewards**: Fixed amounts, requires $10 USD minimum, designed for qualifying swaps

**Q: Can I run multiple modes simultaneously?**
A: No, only one mode can run at a time. Finish or stop the current sequence before starting another.

### Boost Mode

**Q: Why use randomized amounts in Boost mode?**
A: Randomization makes swap patterns appear more natural and less automated, which may be beneficial for some protocols.

**Q: What happens if I run out of balance mid-boost?**
A: The current swap will fail with an "insufficient balance" error. The boost sequence stops, and completed swaps are saved.

**Q: Can I use Boost mode with any token pair?**
A: Yes, but it's typically configured for USDC → SOL for liquidity mining purposes. You can change tokens as needed.

**Q: What are "loop return swaps"?**
A: After each round, optionally swap some TO tokens back to FROM tokens. Helps maintain FROM token balance for subsequent rounds.

**Example**:

```
Round 1: Do 18 USDC → SOL swaps
Loop return: Swap 0.5 SOL → USDC
Round 2: Continue with replenished USDC balance
```

### Rewards Mode

**Q: Why is there a $10 minimum for Rewards mode?**
A: Many rewards programs only count swaps above a minimum USD value (typically $10) to prevent spam and ensure meaningful trading volume.

**Q: How do I know if my swap qualifies for rewards?**
A: The estimated USD value indicator must show green (≥$10). If red, increase your swap amount.

**Q: Do I need a referral link to use Rewards mode?**
A: No, the referral link is optional. It's only needed if you're participating in a specific referral program that requires tracking.

**Q: How long until I receive rewards?**
A: Reward crediting depends on the specific program. Some are immediate, others may take 24-48 hours or longer. Check the program's documentation.

### Technical

**Q: What is slippage tolerance?**
A: The maximum acceptable difference between expected and actual swap rates. Higher slippage allows more price movement but may result in worse rates.

**Q: Why do my swaps fail with "slippage exceeded"?**
A: The market price moved more than your tolerance allows. Solution: Increase slippage tolerance or reduce swap amount.

**Q: What is an RPC endpoint?**
A: A Remote Procedure Call (RPC) endpoint is a server that connects you to the Solana blockchain. Better RPC = faster, more reliable swaps.

**Q: Can I use Pond0matic on mobile?**
A: Yes, if you access from a mobile browser with a compatible wallet (Phantom mobile, Solflare mobile). The interface is responsive but may be easier to use on desktop.

**Q: Does Pond0matic work on Solana testnet?**
A: No, Pond0matic is configured for Solana mainnet only. Testnet support would require code modifications.

### Fees and Costs

**Q: How much SOL do I need for transaction fees?**
A: Minimum 0.01 SOL, recommended 0.1+ SOL. Each transaction costs ~0.001-0.01 SOL depending on network congestion.

**Q: Can I reduce or eliminate the platform fee?**
A: Yes, you can set platform fee to 0 bps in settings. However, platform fees support development and maintenance.

**Q: Are there hidden fees?**
A: No hidden fees. You pay:

1. Platform fee (configurable, default 1%)
2. Solana transaction fees (gas)
3. Jupiter routing fees (if any, usually minimal)

All fees are disclosed before you approve transactions.

### Troubleshooting

**Q: Why is the dashboard showing "Failed to load" for price data?**
A: Common causes:

- API rate limiting
- Network connectivity issue
- API service temporary downtime

Solution: Wait 30 seconds for auto-refresh or click "Retry".

**Q: My balance isn't updating after a swap**
A:

1. Wait 30 seconds for automatic refresh
2. Manually refresh: Disconnect and reconnect wallet
3. Check blockchain explorer (Solscan) to verify on-chain balance

**Q: Can I recover a failed transaction?**
A: Failed transactions don't deduct token balances (only minimal gas fee). Simply retry the swap with adjusted settings (higher slippage, lower amount, etc.).

**Q: The application is slow or unresponsive**
A: Try:

1. Use a better RPC endpoint (Helius recommended)
2. Close other browser tabs
3. Clear browser cache
4. Check Solana network status ([status.solana.com](https://status.solana.com))

---

## Troubleshooting

### Connection Issues

#### Problem: Wallet Won't Connect

**Symptoms**:

- "Connect Wallet" button does nothing
- No wallet popup appears
- Error: "No wallet adapter found"

**Solutions**:

1. **Verify wallet extension is installed**:
   - Check browser extensions list
   - Ensure wallet (Phantom, Solflare, etc.) is present
   - Reinstall wallet extension if missing

2. **Unlock your wallet**:
   - Click wallet extension icon
   - Enter password to unlock
   - Ensure wallet is active

3. **Grant site permissions**:
   - Open wallet settings
   - Check connected sites/dApps
   - Add Pond0matic if not listed
   - Or disconnect and reconnect to reset permissions

4. **Check wallet network**:
   - Ensure wallet is set to Solana mainnet (not devnet/testnet)
   - Switch network in wallet settings if needed

5. **Try different browser**:
   - Test in Chrome, Firefox, or Edge
   - Disable browser extensions temporarily
   - Try incognito/private mode

#### Problem: Connection Drops Frequently

**Symptoms**:

- Wallet disconnects during use
- "Wallet disconnected" errors mid-swap
- Must reconnect frequently

**Solutions**:

1. **Check wallet settings**:
   - Increase auto-lock timeout in wallet settings
   - Disable any VPN or proxy that might interfere

2. **Keep wallet active**:
   - Don't minimize or close wallet extension
   - Keep Pond0matic tab in focus during swaps

3. **Network stability**:
   - Ensure stable internet connection
   - Check WiFi signal strength
   - Consider wired connection for critical operations

### Swap Execution Issues

#### Problem: Swap Fails with "Insufficient Balance"

**Symptoms**:

- Error: "Insufficient balance for transaction"
- Swap rejected before wallet approval

**Solutions**:

1. **Check token balance**:

   ```
   Required: Swap amount + buffer
   Example: Swapping 10 USDC
   Need: 10 USDC + 0.5 USDC (buffer) = 10.5 USDC minimum
   ```

2. **Check SOL balance for fees**:

   ```
   Minimum: 0.01 SOL
   Recommended: 0.1 SOL
   Each transaction: ~0.001-0.01 SOL
   ```

3. **Reduce swap amount**:
   - Try swapping smaller amount
   - Leave 10-20% buffer in balance

4. **Verify correct token**:
   - Ensure FROM token matches balance you're checking
   - Some tokens have similar names but different addresses

#### Problem: Swap Fails with "Slippage Tolerance Exceeded"

**Symptoms**:

- Error: "Slippage tolerance exceeded"
- Transaction reverts after submission
- Occurs during high volatility

**Solutions**:

1. **Increase slippage tolerance**:

   ```
   Current: 50 bps (0.5%)
   Increase to: 100 bps (1%)
   If still fails: 200 bps (2%)
   Maximum reasonable: 500 bps (5%)
   ```

2. **Reduce swap amount**:
   - Smaller amounts = less price impact
   - Try 50% of original amount

3. **Wait for market stability**:
   - Pause during extreme volatility
   - Check token price charts
   - Retry when prices stabilize

4. **Check liquidity**:
   - View liquidity metric on dashboard
   - Low liquidity = higher slippage
   - Consider swapping during higher liquidity periods

#### Problem: Transaction Stuck "Pending"

**Symptoms**:

- Swap shows "Processing..." for >2 minutes
- Activity feed shows pending status indefinitely
- No wallet popup or confirmation

**Solutions**:

1. **Check blockchain status**:
   - Visit [status.solana.com](https://status.solana.com)
   - Look for network congestion warnings
   - Check transaction on Solscan

2. **Wait for timeout**:
   - Transactions auto-timeout after 60-90 seconds
   - Don't submit duplicate transactions
   - Wait for failure message before retrying

3. **Verify RPC connection**:
   - Check network status indicator (should be green)
   - If yellow/red, RPC may be unresponsive
   - Change RPC endpoint in `.env.local`

4. **Refresh and retry**:
   - Reload the page
   - Reconnect wallet
   - Retry the swap

#### Problem: Boost Mode Stops Mid-Sequence

**Symptoms**:

- Boost sequence halts before completion
- No error message
- Progress shows partial completion (e.g., "12 of 54")

**Solutions**:

1. **Check remaining balance**:

   ```
   Completed: 12 swaps
   Remaining: 42 swaps
   Required balance: Max amount × 42
   ```

   - If insufficient, add balance and restart

2. **Review error messages**:
   - Check activity feed for specific error
   - Address root cause (slippage, balance, etc.)

3. **Wallet approval timeout**:
   - Ensure wallet is unlocked
   - Approve transactions promptly
   - Increase wallet auto-lock timeout

4. **Resume from where stopped**:
   - Adjust "Number of Rounds" to remaining rounds
   - Restart boost mode
   - Or start fresh sequence

### Performance Issues

#### Problem: Slow Transaction Confirmations

**Symptoms**:

- Each swap takes 1-2 minutes to confirm
- Long delays between swaps
- Overall sequence much slower than expected

**Solutions**:

1. **Upgrade RPC endpoint**:

   ```
   From: Public RPC (api.mainnet.solana.com)
   To: Helius free tier or QuickNode

   Update in .env.local:
   NEXT_PUBLIC_DEFAULT_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
   ```

2. **Check network congestion**:
   - Visit [status.solana.com](https://status.solana.com)
   - If congested, wait or increase delays
   - Consider swapping during off-peak hours (early morning UTC)

3. **Optimize swap delays**:
   - If network is fast, reduce delay to 4-5 seconds
   - If slow, increase to 10-15 seconds to avoid overlaps

4. **Clear browser cache**:
   - Clear cache and reload
   - Disable heavy browser extensions
   - Close other tabs

#### Problem: High Memory Usage / Browser Lag

**Symptoms**:

- Browser tab becomes unresponsive
- Computer fans spin up
- Lag between clicks and actions

**Solutions**:

1. **Restart browser**:
   - Close all tabs
   - Restart browser application
   - Open only Pond0matic

2. **Clear activity feed**:
   - Long activity feeds consume memory
   - Click "Clear Log" regularly
   - Especially after long boost sequences

3. **Reduce visual effects** (if laggy):
   - Use Compact view instead of full Swapper view
   - Disable browser hardware acceleration as test

4. **System resources**:
   - Close other applications
   - Ensure sufficient RAM available
   - Consider upgrading hardware if persistent

### Data Display Issues

#### Problem: Dashboard Shows "Failed to Load"

**Symptoms**:

- Price cards show error messages
- "Failed to load" in data fields
- Missing statistics

**Solutions**:

1. **Wait for auto-refresh**:
   - Dashboard auto-refreshes every 30 seconds
   - Wait briefly and check if data loads

2. **Manual refresh**:
   - Click "Retry" button on failed cards
   - Or reload page (F5 or Cmd+R)

3. **Check API status**:
   - Jupiter API: [status.jup.ag](https://status.jup.ag)
   - DexScreener: [dexscreener.com](https://dexscreener.com)
   - If APIs are down, data won't load

4. **Network connection**:
   - Verify internet connectivity
   - Check firewall/VPN isn't blocking API requests
   - Try different network (mobile hotspot as test)

#### Problem: Balances Not Updating

**Symptoms**:

- Token balance shows old value after swap
- SOL balance doesn't decrease after transaction
- Dashboard statistics don't increment

**Solutions**:

1. **Manual balance refresh**:
   - Disconnect wallet
   - Reconnect wallet
   - Balances should update

2. **Verify on blockchain**:
   - Copy your wallet address
   - Visit [solscan.io](https://solscan.io)
   - Paste address to see actual on-chain balance
   - If different from displayed, issue is display only

3. **Clear cache**:
   - Browser cache may show stale data
   - Hard reload: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

4. **Wait for confirmation**:
   - Balances update after transaction confirms
   - Confirmation time: 5-30 seconds typically
   - Check activity feed for "confirmed" status

### Error Messages

#### "RPC Request Failed"

**Meaning**: Unable to connect to Solana blockchain via RPC endpoint

**Solutions**:

1. Check internet connection
2. Verify RPC endpoint in `.env.local` is correct
3. Try different RPC endpoint (Helius, QuickNode)
4. Check [status.solana.com](https://status.solana.com) for network status

#### "Transaction Failed: Blockhash Not Found"

**Meaning**: Transaction blockhash expired before confirmation

**Solutions**:

1. Normal occurrence, simply retry
2. Use faster RPC endpoint
3. Reduce swap delays if in boost mode
4. Check network congestion

#### "Jupiter Quote Failed"

**Meaning**: Unable to get swap quote from Jupiter aggregator

**Solutions**:

1. Verify token addresses are correct
2. Check if tokens have liquidity
3. Try different amount
4. Wait and retry (Jupiter API may be rate-limited)

#### "Minimum USD Value Not Met"

**Meaning**: Rewards mode swap is below $10 USD minimum

**Solutions**:

1. Increase swap amount
2. Wait for estimated USD value to show green checkmark
3. Verify token price estimate is reasonable
4. Use different token with higher value

### Getting Additional Help

If issues persist after trying the above solutions:

1. **Check GitHub Issues**:
   - Visit [https://github.com/pJoWi/Pond0matic/issues](https://github.com/pJoWi/Pond0matic/issues)
   - Search for similar issues
   - Review solutions in closed issues

2. **Open New Issue**:
   - If your problem is unique, open a new issue
   - Include:
     - Operating system and browser
     - Node.js version (`node --version`)
     - Error messages (full text)
     - Steps to reproduce
     - Screenshots if applicable

3. **Community Resources**:
   - Solana Discord: [https://discord.gg/solana](https://discord.gg/solana)
   - Jupiter Discord: [https://discord.gg/jup](https://discord.gg/jup)

---

## Appendix: Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + R` | Reload page |
| `Ctrl/Cmd + Shift + R` | Hard reload (clear cache) |
| `F5` | Reload page |

### Navigation

| Shortcut | Action |
|----------|--------|
| `Alt + D` | Navigate to Dashboard |
| `Alt + S` | Navigate to Swapper |

**NOTE**: Keyboard shortcuts may vary by browser and OS.

---

## Appendix: Token Addresses

Common tokens in the Pond0x ecosystem:

| Token | Symbol | Mint Address |
|-------|--------|--------------|
| Solana | SOL | So11111111111111111111111111111111111111112 |
| USD Coin | USDC | EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v |
| Wrapped POND | wPOND | 3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq |

**TIP**: Copy token addresses carefully. Incorrect addresses can result in failed swaps or loss of funds.

---

## Appendix: Glossary

**Basis Point (bps)**: 1/100th of a percent (e.g., 100 bps = 1%)

**Blockchain Explorer**: Website for viewing blockchain transactions (e.g., Solscan)

**Boost Mode**: Automated swap sequence with randomized amounts for liquidity mining

**Gas Fee**: Transaction fee paid to blockchain validators (in SOL)

**Jupiter**: Solana DEX aggregator providing best swap rates

**Liquidity**: Available tokens in trading pools; higher liquidity = better rates

**Non-Custodial**: You control your wallet and private keys (Pond0matic never has access)

**Platform Fee**: Percentage fee charged by Pond0matic for swap services

**Rewards Mode**: Swap mode designed for earning points/rewards with minimum USD requirements

**RPC Endpoint**: Server providing connection to Solana blockchain

**Slippage**: Difference between expected and actual swap rates due to market movement

**Swap**: Exchange of one token for another

**Vault**: Smart contract holding tokens for specific purposes (e.g., boost vault)

**wPOND**: Wrapped POND token on Solana blockchain

---

**User Manual Version**: 2.0.0
**Last Updated**: December 2025
**For Application Version**: 2.0.0

---

**Need help?** Open an issue on GitHub: [https://github.com/pJoWi/Pond0matic/issues](https://github.com/pJoWi/Pond0matic/issues)
