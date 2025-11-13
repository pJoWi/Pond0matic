"use client";
import React, { useCallback, useEffect, useRef } from "react";
import { Connection, PublicKey, SystemProgram, Transaction, VersionedTransaction } from "@solana/web3.js";

// Context & Hooks
import { SwapperProvider, useSwapperContext } from "@/contexts/SwapperContext";
import { useSwapExecution } from "@/hooks/useSwapExecution";

// Components
import { TabNavigation } from "@/components/swapper/TabNavigation";
import { WalletPanel } from "@/components/swapper/WalletPanel";
import { StatusDashboard } from "@/components/swapper/StatusDashboard";
import { SwapConfigPanel } from "@/components/swapper/SwapConfigPanel";
import { MiningRigDashboard } from "@/components/swapper/MiningRigDashboard";
import { VoidTab } from "@/components/swapper/VoidTab";
import { ActivityLog } from "@/components/swapper/ActivityLog";

// Utils & Config
import { short, solscanTx } from "@/lib/utils";
import { b64ToUint8Array, getMintDecimals } from "@/lib/solana";
import { DEFAULT_RPC, TOKEN_NAMES, TOKEN_VAULTS_AFFILIATE_1, TOKEN_VAULTS_AFFILIATE_2 } from "@/lib/vaults";

// Constants
const JUP_QUOTE = "https://lite-api.jup.ag/swap/v1/quote";
const JUP_SWAP = "https://lite-api.jup.ag/swap/v1/swap";
const TOKEN_OPTIONS = Object.keys(TOKEN_NAMES);
const SOL_MINT = "So11111111111111111111111111111111111111112";
const WETWARE_ADDRESS = "9GjEVnpWiLe2uknUmtaH6DSfgcBvL66DtSKGREXDctZU";
const WETWARE_OPERATIONS = {
  condensation: { amount: 0.001, label: "Condensation" },
  lubrication: { amount: 0.01, label: "Lubrication" },
  ionization: { amount: 0.1, label: "Ionization" },
} as const;
const MIN_BOOSTBOT_USD = 0.01;

interface SwapperProps {
  theme: "dark" | "light";
}

// ==============================================================================
// SWAP LOGIC COMPONENT (Business Logic)
// ==============================================================================

function SwapperLogic() {
  const ctx = useSwapperContext();
  const { swapOnce, startAuto, stopAuto, getUsdValue } = useSwapExecution();

  // Prefetch Jupiter quote on token/settings change
  useEffect(() => {
    const ctl = new AbortController();
    (async () => {
      if (!ctx.fromMint || !ctx.toMint) return;
      try {
        const url = new URL(JUP_QUOTE);
        url.searchParams.set("inputMint", ctx.fromMint);
        url.searchParams.set("outputMint", ctx.toMint);
        url.searchParams.set("amount", "1000000");
        url.searchParams.set("slippageBps", String(ctx.slippageBps));
        url.searchParams.set("platformFeeBps", String(ctx.platformFeeBps));
        await fetch(url.toString(), { signal: ctl.signal });
      } catch {}
    })();
    return () => ctl.abort();
  }, [ctx.fromMint, ctx.toMint, ctx.slippageBps, ctx.platformFeeBps]);

  // ==============================================================================
  // WETWARE OPERATIONS
  // ==============================================================================

  const sendWetwareOperation = useCallback(
    async (operationKey: keyof typeof WETWARE_OPERATIONS) => {
      const provider = (window as any)?.solana;
      if (!provider?.publicKey) {
        ctx.log("Connect wallet first.");
        return;
      }

      const operation = WETWARE_OPERATIONS[operationKey];
      const amountLamports = Math.floor(operation.amount * 1_000_000_000);

      if (ctx.solBalance < operation.amount) {
        ctx.log(`Insufficient balance. Need ${operation.amount} SOL, have ${ctx.solBalance.toFixed(4)} SOL`);
        return;
      }

      try {
        ctx.log(`Wetware: Initiating ${operation.label} (${operation.amount} SOL)...`);

        const connection = new Connection(ctx.rpc, "confirmed");
        const fromPubkey = new PublicKey(provider.publicKey.toString());
        const toPubkey = new PublicKey(WETWARE_ADDRESS);

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: amountLamports,
          })
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromPubkey;

        let signedTx;
        if (provider.signTransaction) {
          signedTx = await provider.signTransaction(transaction);
        } else {
          ctx.log("Wallet does not support signing.");
          return;
        }

        const signature = await connection.sendRawTransaction(signedTx.serialize());
        ctx.log(`Wetware: Sent ${operation.label} → ${short(signature, 6)} | ${solscanTx(signature)}`);

        await connection.confirmTransaction(signature, "confirmed");
        ctx.log(`Wetware: Confirmed ${operation.label} (${operation.amount} SOL) → ${short(signature, 6)}`);

        ctx.setLastWetwareOp(operation.label);
        ctx.refetchBalances();
      } catch (e: any) {
        ctx.log(`Wetware error: ${e?.message || String(e)}`);
      }
    },
    [ctx]
  );

  // ==============================================================================
  // MINING RIG OPERATIONS
  // ==============================================================================

  const runBoostBot = useCallback(
    async (swapAmount: string, swapCount: number = 10) => {
      const provider = (window as any)?.solana;
      if (!provider?.publicKey) {
        ctx.log("Rig: Connect wallet first.");
        return;
      }

      const usdValue = await getUsdValue(ctx.fromMint, swapAmount);
      if (usdValue < MIN_BOOSTBOT_USD) {
        ctx.log(`Rig: BoostBot requires >${MIN_BOOSTBOT_USD} USD (current: ${usdValue.toFixed(4)} USD)`);
        return;
      }

      ctx.log(`Rig: Starting BoostBot (${swapCount} swaps to SOL)`);
      ctx.setBoostBotActive(true);

      for (let i = 1; i <= swapCount && ctx.wallet; i++) {
        ctx.log(`Rig: BoostBot swap ${i}/${swapCount}`);
        await swapOnce(ctx.fromMint, SOL_MINT, swapAmount);
        if (i < swapCount) {
          await new Promise((r) => setTimeout(r, ctx.autoDelayMs));
        }
      }

      ctx.setBoostBotActive(false);
      ctx.log(`Rig: BoostBot completed ${swapCount} swaps`);
    },
    [ctx, swapOnce, getUsdValue]
  );

  const sendPermanentBoost = useCallback(
    async (solAmount: number) => {
      const HASHRATE_BOOSTER = "4ngqDt821wV2CjxoZLCLcTAPZNt6ZqpswoqyQEztsU36";
      const provider = (window as any)?.solana;
      if (!provider?.publicKey) {
        ctx.log("Rig: Connect wallet first.");
        return;
      }

      if (ctx.solBalance < solAmount) {
        ctx.log(`Rig: Insufficient balance. Need ${solAmount} SOL, have ${ctx.solBalance.toFixed(4)} SOL`);
        return;
      }

      try {
        ctx.log(`Rig: Sending ${solAmount} SOL to Hashrate Booster...`);
        const connection = new Connection(ctx.rpc, "confirmed");
        const fromPubkey = new PublicKey(provider.publicKey.toString());
        const toPubkey = new PublicKey(HASHRATE_BOOSTER);

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: Math.floor(solAmount * 1_000_000_000),
          })
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromPubkey;

        const signedTx = await provider.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTx.serialize());
        ctx.log(`Rig: Sent → ${short(signature, 6)} | ${solscanTx(signature)}`);

        await connection.confirmTransaction(signature, "confirmed");
        ctx.log(`Rig: Permanent boost confirmed (${solAmount} SOL)`);

        ctx.addPermanentBoost(solAmount);
        ctx.refetchBalances();
      } catch (e: any) {
        ctx.log(`Rig: Permanent boost error: ${e?.message || String(e)}`);
      }
    },
    [ctx]
  );

  const sendLuckBurn = useCallback(
    async (solAmount: number) => {
      const SWAP_REWARD_DISTRIBUTOR = "1orFCnFfgwPzSgUaoK6Wr3MjgXZ7mtk8NGz9Hh4iWWL";
      const provider = (window as any)?.solana;
      if (!provider?.publicKey) {
        ctx.log("Rig: Connect wallet first.");
        return;
      }

      if (ctx.solBalance < solAmount) {
        ctx.log(`Rig: Insufficient balance. Need ${solAmount} SOL, have ${ctx.solBalance.toFixed(4)} SOL`);
        return;
      }

      try {
        ctx.log(`Rig: Sending ${solAmount} SOL for luck burn...`);
        const connection = new Connection(ctx.rpc, "confirmed");
        const fromPubkey = new PublicKey(provider.publicKey.toString());
        const toPubkey = new PublicKey(SWAP_REWARD_DISTRIBUTOR);

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: Math.floor(solAmount * 1_000_000_000),
          })
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromPubkey;

        const signedTx = await provider.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTx.serialize());
        ctx.log(`Rig: Sent → ${short(signature, 6)} | ${solscanTx(signature)}`);

        await connection.confirmTransaction(signature, "confirmed");
        ctx.log(`Rig: Luck burn confirmed (${solAmount} SOL)`);

        ctx.addLuckPoints(Math.floor(solAmount * 1000));
        ctx.refetchBalances();
      } catch (e: any) {
        ctx.log(`Rig: Luck burn error: ${e?.message || String(e)}`);
      }
    },
    [ctx]
  );

  // ==============================================================================
  // EVENT HANDLERS
  // ==============================================================================

  const handleSwap = useCallback(() => {
    if (ctx.mode === "normal" && !ctx.autoActive) {
      swapOnce(ctx.fromMint, ctx.toMint, ctx.amount);
      return;
    }
    startAuto();
  }, [ctx.mode, ctx.autoActive, ctx.fromMint, ctx.toMint, ctx.amount, swapOnce, startAuto]);

  const handleSwapDirection = useCallback(() => {
    const temp = ctx.fromMint;
    ctx.setFromMint(ctx.toMint);
    ctx.setToMint(temp);
    ctx.log("Switched route FROM<->TO");
  }, [ctx]);

  // ==============================================================================
  // RENDER
  // ==============================================================================

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      {/* Tab Navigation */}
      <TabNavigation activeTab={ctx.activeTab} onTabChange={ctx.setActiveTab} />

      {/* Status Dashboard */}
      <StatusDashboard
        wallet={ctx.wallet}
        tokenBalance={ctx.tokenBalance}
        solBalance={ctx.solBalance}
        fromMint={ctx.fromMint}
        mode={ctx.mode}
        running={ctx.running}
        autoCount={ctx.autoCount}
        currentSwapIndex={ctx.currentSwapIndex}
        platformFeeBps={ctx.platformFeeBps}
        slippageBps={ctx.slippageBps}
        currentVault={ctx.currentVault}
        affiliate={ctx.affiliate}
        lastWetwareOp={ctx.lastWetwareOp}
        networkStatus={ctx.networkStatus}
        rpc={ctx.rpc}
        activeTab={ctx.activeTab}
      />

      {/* Wallet Panel */}
      <WalletPanel
        wallet={ctx.wallet}
        connecting={ctx.connecting}
        rpc={ctx.rpc}
        onConnect={async () => {
          await ctx.connect();
        }}
        onDisconnect={ctx.disconnect}
        onRpcChange={ctx.setRpc}
      />

      {/* Autobot Tab Content */}
      {ctx.activeTab === "autobot" && (
        <>
          {/* Mining Rig Dashboard */}
          <MiningRigDashboard
            rigHealth={ctx.rigHealth}
            rigPower={ctx.rigPower}
            rigTemp={ctx.rigTemp}
            totalBoosts={ctx.totalBoosts}
            permanentBoostTotal={ctx.permanentBoostTotal}
            luckPoints={ctx.luckPoints}
            boostBotActive={ctx.boostBotActive}
            miningSessionsCount={ctx.miningSessionsCount}
            swapBoost={ctx.swapBoost}
            sessionPenalty={ctx.sessionPenalty}
            currentBoost={ctx.currentBoost}
            priority={ctx.priority}
            driftRisk={ctx.driftRisk}
            wallet={ctx.wallet}
            onRunBoostBot={runBoostBot}
            onSendPermanentBoost={sendPermanentBoost}
            onSendLuckBurn={sendLuckBurn}
            swapAmount={ctx.amount}
            autoCount={ctx.autoCount}
          />

          {/* Swap Config Panel */}
          <SwapConfigPanel
            fromMint={ctx.fromMint}
            toMint={ctx.toMint}
            tokenNames={TOKEN_NAMES}
            tokenOptions={TOKEN_OPTIONS}
            onFromMintChange={ctx.setFromMint}
            onToMintChange={ctx.setToMint}
            onSwapDirection={handleSwapDirection}
            amount={ctx.amount}
            onAmountChange={ctx.setAmount}
            maxAmount={ctx.maxAmount}
            onMaxAmountChange={ctx.setMaxAmount}
            tokenBalance={ctx.tokenBalance}
            wallet={ctx.wallet}
            mode={ctx.mode}
            onModeChange={ctx.setMode}
            autoActive={ctx.autoActive}
            onAutoActiveChange={ctx.setAutoActive}
            autoCount={ctx.autoCount}
            onAutoCountChange={ctx.setAutoCount}
            autoDelayMs={ctx.autoDelayMs}
            onAutoDelayChange={ctx.setAutoDelayMs}
            platformFeeBps={ctx.platformFeeBps}
            onPlatformFeeChange={ctx.setPlatformFeeBps}
            slippageBps={ctx.slippageBps}
            onSlippageChange={ctx.setSlippageBps}
            running={ctx.running}
            onSwap={handleSwap}
            onStop={stopAuto}
          />
        </>
      )}

      {/* Void Tab Content */}
      {ctx.activeTab === "void" && (
        <VoidTab wallet={ctx.wallet} solBalance={ctx.solBalance} lastWetwareOp={ctx.lastWetwareOp} onSendWetwareOperation={sendWetwareOperation} />
      )}

      {/* Activity Log */}
      <ActivityLog activities={ctx.activities} onClear={ctx.clearLog} />
    </div>
  );
}

// ==============================================================================
// MAIN COMPONENT WITH PROVIDER
// ==============================================================================

export default function SolanaJupiterSwapper({ theme }: SwapperProps) {
  return (
    <SwapperProvider
      initialRpc={DEFAULT_RPC}
      initialFromMint={SOL_MINT}
      initialToMint="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // USDC
      initialPlatformFeeBps={85}
      initialSlippageBps={50}
      tokenVaultsAffiliate1={TOKEN_VAULTS_AFFILIATE_1}
      tokenVaultsAffiliate2={TOKEN_VAULTS_AFFILIATE_2}
    >
      <SwapperLogic />
    </SwapperProvider>
  );
}
