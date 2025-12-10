"use client";
import { useCallback, useRef } from "react";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { useSwapperContext } from "@/contexts/SwapperContext";
import { short, solscanTx } from "@/lib/utils";
import { b64ToUint8Array, getMintDecimals } from "@/lib/solana";
import { TOKEN_NAMES, TOKEN_VAULTS_AFFILIATE_1, TOKEN_VAULTS_AFFILIATE_2 } from "@/lib/vaults";
import { validateSwapTransaction, validateSwapAmount } from "@/lib/transactionValidation";
import { getPhantomProvider } from "@/lib/windowHelpers";
import { fetchTokenBalance, SOL_MINT } from "@/lib/tokenBalance";
import { extractReferralCode, buildJupiterSwapRequest, getFeeRoutingDescription } from "@/lib/referral";

// Jupiter API endpoints
const JUP_QUOTE = "https://lite-api.jup.ag/swap/v1/quote";
const JUP_SWAP = "https://lite-api.jup.ag/swap/v1/swap";

// Transaction settings
const TRANSACTION_CONFIRMATION_TIMEOUT_MS = 30000; // 30 seconds
const VERY_SMALL_AMOUNT_THRESHOLD = 1000; // Lamports threshold for warning
const MINIMUM_DECIMALS_FOR_WARNING = 6; // Minimum token decimals to check for small amounts

/**
 * Hook that provides swap execution functionality
 * Encapsulates all Jupiter swap logic and auto-swap sequences
 */
export function useSwapExecution() {
  const ctx = useSwapperContext();
  const runRef = useRef<boolean>(false);
  const pauseRef = useRef<boolean>(false);

  // Vault map based on current affiliate
  const vaultMap = ctx.affiliate === "pond0x" ? TOKEN_VAULTS_AFFILIATE_1 : TOKEN_VAULTS_AFFILIATE_2;

  /**
   * Get USD value of a token amount
   */
  const getUsdValue = useCallback(async (pairFrom: string, uiAmountStr: string): Promise<number> => {
    try {
      const usdc = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
      if (pairFrom === usdc) return Number(uiAmountStr) || 0;
      const inDec = await getMintDecimals(pairFrom);
      const raw = Math.floor((Number(uiAmountStr) || 0) * Math.pow(10, inDec));
      if (raw <= 0) return 0;
      const url = new URL(JUP_QUOTE);
      url.searchParams.set("inputMint", pairFrom);
      url.searchParams.set("outputMint", usdc);
      url.searchParams.set("amount", String(raw));
      url.searchParams.set("slippageBps", "0");
      url.searchParams.set("platformFeeBps", "0");
      const res = await fetch(url.toString());
      if (!res.ok) return 0;
      const q = await res.json();
      const outLamports = Number(q?.outAmount || q?.otherAmountThreshold || 0);
      return outLamports / 1_000_000;
    } catch {
      return 0;
    }
  }, []);

  /**
   * Fetch real-time balance for return swap
   * This fixes the bug where return swaps used ctx.amount instead of actual balance
   */
  const fetchReturnSwapAmount = useCallback(
    async (tokenMint: string): Promise<string> => {
      try {
        const balance = await fetchTokenBalance(ctx.wallet, tokenMint, ctx.rpc);
        if (balance.error) {
          ctx.log(`⚠️ Failed to fetch balance: ${balance.error}`);
          return "0";
        }
        // Return the full balance minus a small buffer for fees if SOL
        const amount = balance.uiAmount;
        ctx.log(`📊 Fetched ${TOKEN_NAMES[tokenMint] || "TOKEN"} balance: ${amount}`);
        return amount.toString();
      } catch (error: any) {
        ctx.log(`❌ Error fetching balance: ${error?.message || String(error)}`);
        return "0";
      }
    },
    [ctx]
  );

  /**
   * Execute a single Jupiter swap
   */
  const jupExecute = useCallback(
    async (pairFrom: string, pairTo: string, uiAmountStr: string, referralAddress?: string) => {
      const provider = getPhantomProvider();
      if (!provider?.publicKey) {
        ctx.log("Connect wallet first.");
        return;
      }
      const pk = new PublicKey(provider.publicKey.toString());

      // P0 FIX #3: Validate swap amount before execution
      const tokenSymbol = TOKEN_NAMES[pairFrom] || "TOKEN";
      // Determine current balance based on token type
      const SOL_MINT = "So11111111111111111111111111111111111111112";

      // Only validate for the original FROM token (not return swaps)
      // Return swaps use dynamically fetched balances which are already validated
      const isOriginalFromToken = pairFrom === ctx.fromMint;
      const currentBalance = pairFrom === SOL_MINT ? ctx.solBalance : ctx.tokenBalance;

      // Only validate if we have balance data AND it's the original from token
      if (currentBalance > 0 && isOriginalFromToken) {
        const amountValidation = validateSwapAmount(uiAmountStr, currentBalance, tokenSymbol);

        if (!amountValidation.isValid) {
          ctx.log(`❌ ${amountValidation.error}`);
          ctx.errorToast(amountValidation.error || "Invalid swap amount");
          return;
        }

        if (amountValidation.requiresConfirmation) {
          ctx.log(`⚠️ Large swap detected. ${amountValidation.error}`);
          ctx.warningToast(amountValidation.error || "Large swap requires confirmation");
          return;
        }
      }

      const dec = await getMintDecimals(pairFrom);
      const raw = Math.floor((Number(uiAmountStr) || 0) * Math.pow(10, dec));

      ctx.log(`💱 Swap: ${uiAmountStr} ${tokenSymbol} (${dec} decimals) → ${raw} lamports`);

      // Warn about potentially unintended very small amounts
      if (raw > 0 && raw < VERY_SMALL_AMOUNT_THRESHOLD && dec >= MINIMUM_DECIMALS_FOR_WARNING) {
        ctx.log(`⚠️ Warning: Very small amount detected (${raw} lamports). Check if this is intentional.`);
      }

      if (raw <= 0) {
        ctx.log("Enter a valid amount.");
        return;
      }

      const quoteUrl = new URL(JUP_QUOTE);
      quoteUrl.searchParams.set("inputMint", pairFrom);
      quoteUrl.searchParams.set("outputMint", pairTo);
      quoteUrl.searchParams.set("amount", String(raw));
      quoteUrl.searchParams.set("slippageBps", String(ctx.slippageBps));
      quoteUrl.searchParams.set("platformFeeBps", String(ctx.platformFeeBps));

      try {
        const quoteRes = await fetch(quoteUrl.toString());
        if (!quoteRes.ok) {
          ctx.log("Quote failed: " + quoteRes.status);
          return;
        }
        const quote = await quoteRes.json();

        // Use the new buildJupiterSwapRequest utility
        const vaultAddress = (vaultMap as any)[pairFrom];
        const body = buildJupiterSwapRequest({
          quoteResponse: quote,
          userPublicKey: pk.toBase58(),
          vaultAddress,
          referralAddress,
        });

        // Log fee routing for transparency
        const feeRouting = getFeeRoutingDescription(vaultAddress, referralAddress);
        ctx.log(`💰 ${feeRouting}`);

        const swapRes = await fetch(JUP_SWAP, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!swapRes.ok) {
          const t = await swapRes.text();
          ctx.log("Swap build failed: " + t.slice(0, 180));
          return;
        }
        const swapJson = await swapRes.json();
        const txBytes = b64ToUint8Array(swapJson.swapTransaction);
        const tx = VersionedTransaction.deserialize(txBytes);

        // P0 FIX #2: Validate transaction before signing
        const validation = validateSwapTransaction(tx, pk);

        if (!validation.isValid) {
          ctx.log(`❌ Transaction validation failed: ${validation.errors.join(', ')}`);
          return;
        }

        if (validation.warnings.length > 0) {
          ctx.log(`⚠️ Transaction warnings: ${validation.warnings.join(', ')}`);
        }

        let signature = "";
        if (provider.signAndSendTransaction) {
          const r = await provider.signAndSendTransaction(tx);
          signature = r.signature || r;
        } else if (provider.signTransaction) {
          const signed = await provider.signTransaction(tx);
          const connection = new Connection(ctx.rpc, {
            commitment: "confirmed",
            wsEndpoint: undefined, // Disable WebSocket to prevent connection errors
          });
          signature = await connection.sendRawTransaction(signed.serialize());
        } else {
          ctx.log("Wallet does not support signing.");
          return;
        }

        ctx.log("Sent → " + short(signature, 6) + " | " + solscanTx(signature));

        // Confirm transaction with timeout
        const connection = new Connection(ctx.rpc, {
          commitment: "confirmed",
          wsEndpoint: undefined, // Disable WebSocket to prevent connection errors
        });
        const confirmPromise = connection.confirmTransaction(signature, "confirmed");
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Transaction confirmation timeout")),
            TRANSACTION_CONFIRMATION_TIMEOUT_MS
          )
        );

        try {
          await Promise.race([confirmPromise, timeoutPromise]);
          ctx.log("Confirmed → " + short(signature, 6));
          // Show success feedback
          ctx.successToast("Swap confirmed!");
          ctx.triggerQuickConfetti();
        } catch (timeoutError: any) {
          if (timeoutError.message === "Transaction confirmation timeout") {
            ctx.log("⚠️ Confirmation timeout. Check manually: " + solscanTx(signature));
            ctx.warningToast("Confirmation timeout - check transaction manually");
          } else {
            throw timeoutError;
          }
        }

        // Increment mining rig boosts
        ctx.incrementBoosts();
      } catch (e: any) {
        const errorMsg = e?.message || String(e);
        ctx.log("Execute error: " + errorMsg);
        ctx.errorToast("Swap failed: " + errorMsg.slice(0, 50));
      }
    },
    [ctx, vaultMap]
  );

  /**
   * Execute a single swap with validation
   */
  const swapOnce = useCallback(
    async (pairFrom: string, pairTo: string, uiAmountStr: string, referralAddress?: string) => {
      if (!ctx.wallet) {
        ctx.log("Connect wallet first.");
        return;
      }
      if (!uiAmountStr || Number(uiAmountStr) <= 0) {
        ctx.log("Enter a valid amount.");
        return;
      }
      await jupExecute(pairFrom, pairTo, uiAmountStr, referralAddress);
    },
    [ctx, jupExecute]
  );

  /**
   * Generate a random amount between min and max for boost mode
   */
  const boostRandom = useCallback((min: number, max: number): string => {
    const minVal = Math.max(0, min);
    const maxVal = Math.max(minVal + Number.EPSILON, max || minVal);
    const v = Math.random() * (maxVal - minVal) + minVal;
    return String(Number(v.toFixed(12)));
  }, []);

  /**
   * Execute boost mode
   * Multiple swaps per round with randomized amounts
   */
  const executeBoostMode = useCallback(async () => {
    const provider = getPhantomProvider();
    if (!provider?.publicKey) {
      ctx.log("Connect wallet first.");
      return;
    }

    // Set running state
    runRef.current = true;
    ctx.setRunning(true);

    // Extract referral if present
    const referralExtraction = ctx.referralLink ? extractReferralCode(ctx.referralLink) : { hasReferral: false };
    const referralAddress = referralExtraction.hasReferral ? referralExtraction.referralAddress : undefined;

    if (ctx.referralLink && referralExtraction.error) {
      ctx.log(`⚠️ Referral link error: ${referralExtraction.error}`);
    }

    const totalRounds = ctx.numberOfRounds === 0 ? Infinity : ctx.numberOfRounds;
    const swapsPerRound = Math.max(1, ctx.swapsPerRound);
    let currentRound = 0;
    let totalSwapCount = 0; // Track total swaps across all rounds

    ctx.log(`🚀 Starting boost mode: ${swapsPerRound} swaps/round, ${totalRounds === Infinity ? '∞' : totalRounds} rounds`);

    try {

    while (runRef.current && currentRound < totalRounds) {
      currentRound++;
      const roundInfo = totalRounds === Infinity ? `∞` : `${currentRound}/${totalRounds}`;
      ctx.log(`🔄 Boost round ${roundInfo}`);

      // Get initial balance of TO token before swaps
      const initialBalance = await fetchTokenBalance(ctx.wallet, ctx.toMint, ctx.rpc);
      const initialAmount = initialBalance.uiAmount || 0;

      for (let i = 1; i <= swapsPerRound && runRef.current; i++) {
        // Check if paused - wait loop
        while (pauseRef.current && runRef.current) {
          await new Promise((r) => setTimeout(r, 100));
        }

        // Check if stopped
        if (!runRef.current) break;

        totalSwapCount++;
        ctx.setCurrentSwapIndex(totalSwapCount);
        const amt = boostRandom(Number(ctx.amount), Number(ctx.maxAmount));
        ctx.log(`💱 Swap ${i}/${swapsPerRound}: ${amt} ${TOKEN_NAMES[ctx.fromMint] || "TOKEN"} (randomized)`);
        await swapOnce(ctx.fromMint, ctx.toMint, amt, referralAddress);

        if (i < swapsPerRound && runRef.current) {
          ctx.log(`⏳ Waiting ${ctx.swapDelayMs}ms before next swap...`);
          await new Promise((r) => setTimeout(r, ctx.swapDelayMs));
        }
      }

      // Return swap after each round
      if (runRef.current) {
        // Calculate accumulated amount (current balance - initial balance)
        const finalBalance = await fetchTokenBalance(ctx.wallet, ctx.toMint, ctx.rpc);
        const finalAmount = finalBalance.uiAmount || 0;
        const accumulatedAmount = Math.max(0, finalAmount - initialAmount);

        // Use manual amount if set, otherwise use accumulated amount
        const returnAmt = ctx.loopReturnAmount || accumulatedAmount.toString();

        if (Number(returnAmt) <= 0) {
          ctx.log(`⚠️ No accumulated ${TOKEN_NAMES[ctx.toMint] || "TOKEN"} to return swap`);
        } else {
          if (ctx.loopReturnAmount) {
            ctx.log(`↩️ Return swap: ${returnAmt} ${TOKEN_NAMES[ctx.toMint] || "TOKEN"} (manual amount)`);
          } else {
            ctx.log(`↩️ Return swap: ${returnAmt} ${TOKEN_NAMES[ctx.toMint] || "TOKEN"} (accumulated: ${initialAmount.toFixed(6)} → ${finalAmount.toFixed(6)})`);
          }
          await swapOnce(ctx.toMint, ctx.fromMint, returnAmt, referralAddress);
        }
      }

      if (runRef.current && currentRound < totalRounds) {
        ctx.log(`⏳ Waiting ${ctx.autoDelayMs}ms before next round...`);
        await new Promise((r) => setTimeout(r, ctx.autoDelayMs));
      }
    }

    if (currentRound >= totalRounds && totalRounds !== Infinity) {
      ctx.log(`✅ Boost mode complete: ${totalRounds} round${totalRounds === 1 ? '' : 's'}`);
      ctx.successToast(`Boost mode complete! ${totalRounds} round${totalRounds === 1 ? '' : 's'} finished`);
      ctx.triggerConfetti();
    }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      ctx.log(`❌ Boost mode error: ${errorMsg}`);
      ctx.errorToast(`Boost mode error: ${errorMsg.slice(0, 50)}`);
    } finally {
      runRef.current = false;
      pauseRef.current = false;
      ctx.setRunning(false);
      ctx.setPaused(false);
      ctx.setStopping(false);
      ctx.setCurrentSwapIndex(0);
    }
  }, [ctx, runRef, boostRandom, swapOnce, fetchReturnSwapAmount]);

  /**
   * Execute rewards mode
   * Fixed amount swaps with return swaps to earn rewards
   */
  const executeRewardsMode = useCallback(async () => {
    const provider = getPhantomProvider();
    if (!provider?.publicKey) {
      ctx.log("Connect wallet first.");
      return;
    }

    // Set running state
    runRef.current = true;
    ctx.setRunning(true);

    // Extract referral if present
    const referralExtraction = ctx.referralLink ? extractReferralCode(ctx.referralLink) : { hasReferral: false };
    const referralAddress = referralExtraction.hasReferral ? referralExtraction.referralAddress : undefined;

    if (ctx.referralLink && referralExtraction.error) {
      ctx.log(`⚠️ Referral link error: ${referralExtraction.error}`);
    }

    const totalSwaps = ctx.numberOfSwaps === 0 ? Infinity : ctx.numberOfSwaps;
    let currentSwap = 0;

    ctx.log(`💎 Starting rewards mode: ${totalSwaps === Infinity ? '∞' : totalSwaps} round${totalSwaps === 1 ? '' : 's'} (forward + return swap each)`);

    try {
      while (runRef.current && currentSwap < totalSwaps) {
        // Check if paused - wait loop
        while (pauseRef.current && runRef.current) {
          await new Promise((r) => setTimeout(r, 100));
        }

        // Check if stopped
        if (!runRef.current) break;

        currentSwap++;
        ctx.setCurrentSwapIndex(currentSwap);

        const swapInfo = totalSwaps === Infinity ? `∞` : `${currentSwap}/${totalSwaps}`;

        // Forward swap
        ctx.log(`💱 Rewards round ${swapInfo} - Forward: ${ctx.amount} ${TOKEN_NAMES[ctx.fromMint] || "TOKEN"}`);
        await swapOnce(ctx.fromMint, ctx.toMint, ctx.amount, referralAddress);

        // Wait between forward and return swap
        if (runRef.current) {
          ctx.log(`⏳ Waiting ${ctx.swapDelayMs}ms before return swap...`);
          await new Promise((r) => setTimeout(r, ctx.swapDelayMs));
        }

        // Return swap - fetch actual balance
        if (runRef.current) {
          const returnAmount = await fetchReturnSwapAmount(ctx.toMint);

          if (Number(returnAmount) <= 0) {
            ctx.log(`⚠️ No ${TOKEN_NAMES[ctx.toMint] || "TOKEN"} balance to return swap`);
          } else {
            ctx.log(`↩️ Rewards round ${swapInfo} - Return: ${returnAmount} ${TOKEN_NAMES[ctx.toMint] || "TOKEN"}`);
            await swapOnce(ctx.toMint, ctx.fromMint, returnAmount, referralAddress);
          }
        }

        // Wait before next round
        if (currentSwap < totalSwaps && runRef.current) {
          ctx.log(`⏳ Waiting ${ctx.autoDelayMs}ms before next round...`);
          await new Promise((r) => setTimeout(r, ctx.autoDelayMs));
        }
      }

      if (currentSwap >= totalSwaps && totalSwaps !== Infinity) {
        ctx.log(`✅ Rewards mode complete: ${totalSwaps} round${totalSwaps === 1 ? '' : 's'}`);
        ctx.successToast(`Rewards mode complete! ${totalSwaps} round${totalSwaps === 1 ? '' : 's'} finished`);
        ctx.triggerConfetti();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      ctx.log(`❌ Rewards mode error: ${errorMsg}`);
      ctx.errorToast(`Rewards mode error: ${errorMsg.slice(0, 50)}`);
    } finally {
      runRef.current = false;
      pauseRef.current = false;
      ctx.setRunning(false);
      ctx.setPaused(false);
      ctx.setStopping(false);
      ctx.setCurrentSwapIndex(0);
    }
  }, [ctx, runRef, swapOnce, fetchReturnSwapAmount]);


  /**
   * Pause auto-swap sequence
   * Halts execution after current swap completes, preserving progress
   */
  const pauseAuto = useCallback(() => {
    pauseRef.current = true;
    ctx.setPaused(true);
    ctx.log("⏸️ Pausing swap sequence...");
  }, [ctx.setPaused, ctx.log]);

  /**
   * Resume auto-swap sequence
   * Continues from paused position
   */
  const resumeAuto = useCallback(() => {
    pauseRef.current = false;
    ctx.setPaused(false);
    ctx.log("▶️ Resuming swap sequence...");
  }, [ctx.setPaused, ctx.log]);

  /**
   * Stop auto-swap sequence completely
   * Shows stopping state, then resets when current swap completes
   */
  const stopAuto = useCallback(() => {
    runRef.current = false;
    pauseRef.current = false;
    ctx.setStopping(true);
    ctx.log("⏹️ Stopping swap sequence...");
  }, [ctx.setStopping, ctx.log]);

  /**
   * Execute normal mode - single swap
   */
  const executeNormalMode = useCallback(async () => {
    const provider = getPhantomProvider();
    if (!provider?.publicKey) {
      ctx.log("Connect wallet first.");
      return;
    }

    // Set running state
    runRef.current = true;
    ctx.setRunning(true);

    // Extract referral if present
    const referralExtraction = ctx.referralLink ? extractReferralCode(ctx.referralLink) : { hasReferral: false };
    const referralAddress = referralExtraction.hasReferral ? referralExtraction.referralAddress : undefined;

    if (ctx.referralLink && referralExtraction.error) {
      ctx.log(`Referral link error: ${referralExtraction.error}`);
    }

    ctx.log(`Executing single swap: ${ctx.amount} ${TOKEN_NAMES[ctx.fromMint] || "TOKEN"}`);

    try {
      ctx.setCurrentSwapIndex(1);
      await swapOnce(ctx.fromMint, ctx.toMint, ctx.amount, referralAddress);
      ctx.log(`Swap complete`);
      ctx.successToast("Swap complete!");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      ctx.log(`Swap error: ${errorMsg}`);
      ctx.errorToast(`Swap error: ${errorMsg.slice(0, 50)}`);
    } finally {
      runRef.current = false;
      pauseRef.current = false;
      ctx.setRunning(false);
      ctx.setPaused(false);
      ctx.setStopping(false);
      ctx.setCurrentSwapIndex(0);
    }
  }, [ctx, runRef, swapOnce]);

  return {
    jupExecute,
    swapOnce,
    pauseAuto,
    resumeAuto,
    stopAuto,
    boostRandom,
    getUsdValue,
    fetchReturnSwapAmount,
    executeBoostMode,
    executeRewardsMode,
    executeNormalMode,
  };
}
