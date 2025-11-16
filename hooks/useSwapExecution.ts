"use client";
import { useCallback, useRef } from "react";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { useSwapperContext } from "@/contexts/SwapperContext";
import { short, solscanTx } from "@/lib/utils";
import { b64ToUint8Array, getMintDecimals } from "@/lib/solana";
import { TOKEN_NAMES, TOKEN_VAULTS_AFFILIATE_1, TOKEN_VAULTS_AFFILIATE_2 } from "@/lib/vaults";

// Constants
const JUP_QUOTE = "https://lite-api.jup.ag/swap/v1/quote";
const JUP_SWAP = "https://lite-api.jup.ag/swap/v1/swap";

/**
 * Hook that provides swap execution functionality
 * Encapsulates all Jupiter swap logic and auto-swap sequences
 */
export function useSwapExecution() {
  const ctx = useSwapperContext();
  const runRef = useRef<boolean>(false);

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
   * Execute a single Jupiter swap
   */
  const jupExecute = useCallback(
    async (pairFrom: string, pairTo: string, uiAmountStr: string) => {
      const provider = (window as any)?.solana;
      if (!provider?.publicKey) {
        ctx.log("Connect wallet first.");
        return;
      }
      const pk = new PublicKey(provider.publicKey.toString());
      const dec = await getMintDecimals(pairFrom);
      const raw = Math.floor((Number(uiAmountStr) || 0) * Math.pow(10, dec));

      ctx.log(`💱 Swap: ${uiAmountStr} ${TOKEN_NAMES[pairFrom] || "TOKEN"} (${dec} decimals) → ${raw} lamports`);

      if (raw > 0 && raw < 1000 && dec >= 6) {
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

        const referralVault = (vaultMap as any)[pairFrom];
        const body: any = {
          quoteResponse: quote,
          userPublicKey: pk.toBase58(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto",
        };
        if (referralVault) body.feeAccount = referralVault;

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

        // Validate transaction structure
        if (!tx.message || tx.message.staticAccountKeys.length === 0) {
          ctx.log("Invalid transaction structure from Jupiter");
          return;
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

        // Confirm with timeout (30 seconds)
        const connection = new Connection(ctx.rpc, {
          commitment: "confirmed",
          wsEndpoint: undefined, // Disable WebSocket to prevent connection errors
        });
        const confirmPromise = connection.confirmTransaction(signature, "confirmed");
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Transaction confirmation timeout")), 30000)
        );

        try {
          await Promise.race([confirmPromise, timeoutPromise]);
          ctx.log("Confirmed → " + short(signature, 6));
        } catch (timeoutError: any) {
          if (timeoutError.message === "Transaction confirmation timeout") {
            ctx.log("⚠️ Confirmation timeout. Check manually: " + solscanTx(signature));
          } else {
            throw timeoutError;
          }
        }

        // Increment mining rig boosts
        ctx.incrementBoosts();
      } catch (e: any) {
        ctx.log("Execute error: " + (e?.message || String(e)));
      }
    },
    [ctx, vaultMap]
  );

  /**
   * Execute a single swap with validation
   */
  const swapOnce = useCallback(
    async (pairFrom: string, pairTo: string, uiAmountStr: string) => {
      if (!ctx.wallet) {
        ctx.log("Connect wallet first.");
        return;
      }
      if (!uiAmountStr || Number(uiAmountStr) <= 0) {
        ctx.log("Enter a valid amount.");
        return;
      }
      const referralVault = vaultMap[pairFrom];
      ctx.log("Route fees → " + (referralVault ? short(referralVault, 6) : "none") + " (affiliate: " + ctx.affiliate + ")");
      await jupExecute(pairFrom, pairTo, uiAmountStr);
    },
    [ctx, vaultMap, jupExecute]
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
   * Start auto-swap sequence
   */
  const startAuto = useCallback(async () => {
    const provider = (window as any)?.solana;
    if (!provider?.publicKey) {
      ctx.log("Connect wallet first.");
      return;
    }
    // Atomic check-and-set to prevent race conditions
    if (ctx.running || runRef.current) {
      ctx.log("Auto-swap already running");
      return;
    }
    runRef.current = true;
    ctx.setRunning(true);

    try {
      if (ctx.mode === "loopreturn") {
        while (runRef.current) {
          const N = Math.max(1, ctx.autoCount);
          ctx.log(`🔁 Loop mode: ${N} swaps → return`);
          for (let i = 1; i <= N && runRef.current; i++) {
            ctx.setCurrentSwapIndex(i);
            const amt = ctx.mode === "boost" ? boostRandom(Number(ctx.amount), Number(ctx.maxAmount)) : ctx.amount;
            ctx.log(`Loop swap ${i}/${N}: swapping ${amt}`);
            await swapOnce(ctx.fromMint, ctx.toMint, amt);
            if (i < N && runRef.current) await new Promise((r) => setTimeout(r, ctx.autoDelayMs));
          }
          if (!runRef.current) break;
          ctx.log("Return swap...");
          await swapOnce(ctx.toMint, ctx.fromMint, ctx.amount);
          if (runRef.current) await new Promise((r) => setTimeout(r, ctx.autoDelayMs));
        }
      } else {
        const total = Math.max(1, ctx.autoCount);
        for (let i = 1; i <= total && runRef.current; i++) {
          ctx.setCurrentSwapIndex(i);

          if (ctx.mode === "roundtrip") {
            const usd = await getUsdValue(ctx.fromMint, ctx.amount);
            if (usd < 10) {
              ctx.log("⚠️ Round-trip requires >$10 value");
              break;
            }
            ctx.log(`🔄 Round-trip ${i}/${total}: ${ctx.amount}`);
            await swapOnce(ctx.fromMint, ctx.toMint, ctx.amount);
            if (!runRef.current) break;
            await new Promise((r) => setTimeout(r, ctx.autoDelayMs));
            ctx.log("↩️ Return swap...");
            await swapOnce(ctx.toMint, ctx.fromMint, ctx.amount);
          } else if (ctx.mode === "boost") {
            const amt = boostRandom(Number(ctx.amount), Number(ctx.maxAmount));
            ctx.log(`🚀 Boost ${i}/${total}: swapping ${amt} (randomized between ${ctx.amount} and ${ctx.maxAmount})`);
            await swapOnce(ctx.fromMint, ctx.toMint, amt);
          } else {
            ctx.log(`Single swap ${i}/${total}: ${ctx.amount}`);
            await swapOnce(ctx.fromMint, ctx.toMint, ctx.amount);
          }

          if (i < total && runRef.current) {
            await new Promise((r) => setTimeout(r, ctx.autoDelayMs));
          }
        }
      }
    } finally {
      // Always reset state on completion/stop
      runRef.current = false;
      ctx.setRunning(false);
      ctx.setCurrentSwapIndex(0);
      ctx.log(runRef.current ? "Auto-swap stopped" : "Auto-swap complete");
    }
  }, [ctx, swapOnce, boostRandom, getUsdValue]);

  /**
   * Stop auto-swap sequence
   */
  const stopAuto = useCallback(() => {
    ctx.log("Stopping auto-swap...");
    runRef.current = false;
    ctx.setRunning(false);
    ctx.setCurrentSwapIndex(0);
  }, [ctx]);

  return {
    jupExecute,
    swapOnce,
    startAuto,
    stopAuto,
    boostRandom,
    getUsdValue,
  };
}
