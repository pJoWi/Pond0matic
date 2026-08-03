"use client";
/**
 * Swap session orchestrator. Owns every side effect on the swap path:
 * orders, transaction validation, signing, execution via Jupiter, balances,
 * event dispatch and progress state. All sequencing decisions come from the
 * pure planner in lib/swap/sessionPlanner.
 *
 * Uses Jupiter Swap API v2 order-and-execute: /order builds the transaction,
 * the wallet signs it, /execute lets Jupiter land and confirm it. The client
 * never submits to the network itself.
 *
 * Behavior parity target: hooks/useSwapExecution.ts (legacy engine).
 */
import { useCallback } from "react";
import { VersionedTransaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { useSwapConfig } from "@/contexts/SwapConfigContext";
import { useSession } from "@/contexts/SessionContext";
import { useActivity } from "@/contexts/ActivityContext";
import { useRig } from "@/contexts/RigContext";
import { useBalances } from "@/hooks/useBalances";
import {
  planRound,
  hasNextRound,
  totalRounds,
  type SessionConfig,
  type SessionStep,
} from "@/lib/swap/sessionPlanner";
import {
  buildOrderUrl,
  buildExecuteBody,
  jupiterHeaders,
  jupiterErrorMessage,
  parseOrder,
  parseExecuteResponse,
  clampReferralFeeBps,
  bytesToBase64,
  feeAccountForOrder,
  extractJupiterError,
  JUP_EXECUTE,
  USDC_MINT,
} from "@/lib/swap/orders";
import { validateSwapTransaction, validateSwapAmount } from "@/lib/transactionValidation";
import { extractReferralCode, getFeeRoutingDescription } from "@/lib/referral";
import { fetchTokenBalance, SOL_MINT } from "@/lib/tokenBalance";
import { b64ToUint8Array, getMintDecimals } from "@/lib/solana";
import { short, solscanTx } from "@/lib/utils";
import { dispatchSwapEvent, makeInternalSwapId } from "@/lib/portfolio/swapEventBus";
import { TOKEN_NAMES } from "@/lib/vaults";
import type { SwapMode } from "@/types/swapModes";

const VERY_SMALL_AMOUNT_THRESHOLD = 1000; // base units (legacy parity)
const MIN_DECIMALS_FOR_WARNING = 6;

function symbolFor(mint: string): string {
  return TOKEN_NAMES[mint] || mint.slice(0, 4);
}

export function useSwapEngine() {
  const { settings } = useSettings();
  const config = useSwapConfig();
  const session = useSession();
  const { log } = useActivity();
  const { incrementSwap } = useRig();
  const { publicKey, signTransaction } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? "";
  const { solBalance, tokenBalance } = useBalances(walletAddress, settings.rpc, config.fromMint);

  // Shared across all engine instances (desktop panel + mobile sheet) so a
  // session started in one place can be stopped/paused from the other.
  const { runRef, pauseRef } = session;

  /** Interruptible sleep — wakes early when the session is stopped. */
  const sleep = useCallback(async (ms: number) => {
    const end = Date.now() + ms;
    while (runRef.current && Date.now() < end) {
      await new Promise((r) => setTimeout(r, Math.min(100, end - Date.now())));
    }
  }, []);

  const waitWhilePaused = useCallback(async () => {
    while (pauseRef.current && runRef.current) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }, []);

  /** USD value via a price-only /order to USDC (no taker → transaction null). */
  const getUsdValue = useCallback(
    async (mint: string, uiAmountStr: string): Promise<number> => {
      try {
        if (mint === USDC_MINT) return Number(uiAmountStr) || 0;
        const decimals = await getMintDecimals(mint);
        const raw = Math.floor((Number(uiAmountStr) || 0) * Math.pow(10, decimals));
        if (raw <= 0) return 0;
        const res = await fetch(
          buildOrderUrl({ inputMint: mint, outputMint: USDC_MINT, amountRaw: String(raw) }),
          { headers: jupiterHeaders(settings.jupiterApiKey) }
        );
        if (!res.ok) return 0;
        const order = parseOrder(await res.json());
        return Number(order.outAmount || 0) / 1_000_000;
      } catch {
        return 0;
      }
    },
    [settings.jupiterApiKey]
  );

  /**
   * One swap: quote → build → validate → sign → send → confirm.
   * Port of the legacy jupExecute. Errors are logged and swallowed so a
   * session continues after an individual failed swap (legacy parity).
   */
  const executeSwap = useCallback(
    async (
      pairFrom: string,
      pairTo: string,
      uiAmountStr: string,
      referralAddress: string | undefined,
      mode: SwapMode
    ): Promise<void> => {
      const internalId = makeInternalSwapId();
      let dispatchedStart = false;
      if (!publicKey) {
        log("Connect wallet first.");
        return;
      }
      const tokenSymbol = symbolFor(pairFrom);

      // Amount sanity check against live balance — only for the configured
      // fromMint (return swaps use freshly fetched balances).
      const isOriginalFromToken = pairFrom === config.fromMint;
      const currentBalance = pairFrom === SOL_MINT ? solBalance : tokenBalance;
      if (currentBalance > 0 && isOriginalFromToken) {
        const check = validateSwapAmount(uiAmountStr, currentBalance, tokenSymbol);
        if (!check.isValid) {
          log(`❌ ${check.error}`);
          toast.error(check.error || "Invalid swap amount");
          return;
        }
        if (check.requiresConfirmation) {
          log(`⚠️ Large swap detected. ${check.error}`);
          toast.warning(check.error || "Large swap requires confirmation");
          return;
        }
      }

      const decimals = await getMintDecimals(pairFrom);
      const raw = Math.floor((Number(uiAmountStr) || 0) * Math.pow(10, decimals));
      log(`💱 Swap: ${uiAmountStr} ${tokenSymbol} (${decimals} decimals) → ${raw} raw`);
      if (raw > 0 && raw < VERY_SMALL_AMOUNT_THRESHOLD && decimals >= MIN_DECIMALS_FOR_WARNING) {
        log(`⚠️ Very small amount (${raw} raw units). Check if intentional.`);
      }
      if (raw <= 0) {
        log("Enter a valid amount.");
        return;
      }

      try {
        // Fee routing: forward ONLY an explicitly configured Jupiter referral
        // account (from the referral link). The legacy affiliate vault ATAs are
        // not valid v2 referralAccounts — Jupiter 400s the whole order if one
        // is sent — so they are never used here. A configured fee of 0 also
        // omits the account (true 0%). See feeAccountForOrder.
        const feeAccount = feeAccountForOrder(settings.platformFeeBps, referralAddress);
        const orderRes = await fetch(
          buildOrderUrl({
            inputMint: pairFrom,
            outputMint: pairTo,
            amountRaw: String(raw),
            taker: publicKey.toBase58(),
            referralAccount: feeAccount,
            referralFee: feeAccount ? clampReferralFeeBps(settings.platformFeeBps) : undefined,
            slippageBps: settings.slippageBps,
          }),
          { headers: jupiterHeaders(settings.jupiterApiKey) }
        );
        if (!orderRes.ok) {
          const detail = extractJupiterError(await orderRes.json().catch(() => null));
          const msg = jupiterErrorMessage(orderRes.status, detail);
          log(`⚠️ ${msg}`);
          toast.error(msg.slice(0, 120));
          return;
        }
        const order = parseOrder(await orderRes.json());
        if (!order.transaction) {
          // "" = router could not build a tx; null should not happen (taker set)
          log(
            `❌ No swap transaction (router: ${order.router ?? "?"}, code: ${order.errorCode ?? "?"}): ${order.errorMessage ?? "unknown"}`
          );
          toast.error("Jupiter could not build the swap transaction");
          return;
        }
        log(
          feeAccount
            ? `💰 ${getFeeRoutingDescription(undefined, referralAddress)}`
            : "💰 No platform fee"
        );

        const tx = VersionedTransaction.deserialize(b64ToUint8Array(order.transaction));
        const validation = validateSwapTransaction(tx, publicKey);
        if (!validation.isValid) {
          log(`❌ Transaction validation failed: ${validation.errors.join(", ")}`);
          return;
        }
        if (validation.warnings.length > 0) {
          log(`⚠️ Transaction warnings: ${validation.warnings.join(", ")}`);
        }

        const outputDecimals = await getMintDecimals(pairTo);
        dispatchSwapEvent({
          type: "swap-started",
          internalId,
          mode,
          fromMint: pairFrom,
          fromSymbol: symbolFor(pairFrom),
          fromAmount: Number(uiAmountStr) || 0,
          toMint: pairTo,
          toSymbol: symbolFor(pairTo),
          toAmount: Number(order.outAmount ?? 0) / Math.pow(10, outputDecimals) || 0,
        });
        dispatchedStart = true;

        if (!signTransaction) {
          log("Wallet does not support signing.");
          dispatchSwapEvent({ type: "swap-failed", internalId, reason: "Wallet does not support signing" });
          return;
        }
        // Sign immediately — the order goes stale as on-chain prices move.
        const signed = await signTransaction(tx);

        const execRes = await fetch(JUP_EXECUTE, {
          method: "POST",
          headers: jupiterHeaders(settings.jupiterApiKey, true),
          body: buildExecuteBody(bytesToBase64(signed.serialize()), order.requestId),
        });
        if (!execRes.ok) {
          const detail = extractJupiterError(await execRes.json().catch(() => null));
          const msg = jupiterErrorMessage(execRes.status, detail);
          log(`⚠️ ${msg}`);
          toast.error(msg.slice(0, 120));
          dispatchSwapEvent({ type: "swap-failed", internalId, reason: msg });
          return;
        }
        const result = parseExecuteResponse(await execRes.json());
        if (result.signature) {
          dispatchSwapEvent({ type: "swap-sent", internalId, signature: result.signature });
          log("Sent → " + short(result.signature, 6) + " | " + solscanTx(result.signature));
        }
        if (result.status === "Success") {
          log("Confirmed → " + (result.signature ? short(result.signature, 6) : "(no signature)"));
          dispatchSwapEvent({ type: "swap-confirmed", internalId });
          toast.success("Swap confirmed");
          incrementSwap();
        } else {
          const reason = `Execute failed (code ${result.code ?? "?"})${result.error ? `: ${result.error.slice(0, 120)}` : ""}`;
          log(`❌ ${reason}${result.signature ? " — check " + solscanTx(result.signature) : ""}`);
          toast.error(reason.slice(0, 80));
          dispatchSwapEvent({ type: "swap-failed", internalId, reason });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        log("Execute error: " + msg);
        toast.error("Swap failed: " + msg.slice(0, 50));
        if (dispatchedStart) {
          dispatchSwapEvent({ type: "swap-failed", internalId, reason: msg });
        }
      }
    },
    [publicKey, signTransaction, settings, config.fromMint,
     solBalance, tokenBalance, log, incrementSwap]
  );

  /** Run one planned step. Returns false when the session should stop. */
  const executeStep = useCallback(
    async (
      step: SessionStep,
      referralAddress: string | undefined,
      mode: SwapMode,
      roundStartBalance: number,
      swapCounter: { count: number }
    ): Promise<void> => {
      if (step.kind === "delay") {
        log(`⏳ Waiting ${step.ms}ms...`);
        await sleep(step.ms);
        return;
      }
      if (step.kind === "swap") {
        swapCounter.count++;
        session.setCurrentSwapIndex(swapCounter.count);
        log(`💱 Swap ${step.swapInRound}/${step.swapsInRound}: ${step.amountUi} ${symbolFor(config.fromMint)}`);
        await executeSwap(config.fromMint, config.toMint, step.amountUi, referralAddress, mode);
        return;
      }
      // return-swap: manual amount or accumulated toMint balance since round start
      const finalBalance = await fetchTokenBalance(walletAddress, config.toMint, settings.rpc);
      const finalAmount = finalBalance.uiAmount || 0;
      const accumulated = Math.max(0, finalAmount - roundStartBalance);
      const returnAmount = step.manualAmountUi ?? String(accumulated);
      if (Number(returnAmount) <= 0) {
        log(`⚠️ No accumulated ${symbolFor(config.toMint)} to return swap`);
        return;
      }
      // Accumulated return swaps are BY DESIGN ~100% of the freshly-built
      // balance (roundStartBalance ≈ 0 at round start → accumulated ≈ finalAmount).
      // The default 90% cap would block them every time, so we disable it by
      // passing 100 (the > 100 branch is unreachable — the balance guard fires
      // first). Manual amounts (user-typed) keep the default cap as fat-finger
      // protection.
      const returnCheck = step.manualAmountUi
        ? validateSwapAmount(returnAmount, finalAmount, symbolFor(config.toMint))
        : validateSwapAmount(returnAmount, finalAmount, symbolFor(config.toMint), 100);
      if (!returnCheck.isValid) {
        log(`❌ Return swap blocked: ${returnCheck.error}`);
        return;
      }
      if (returnCheck.requiresConfirmation) {
        log(`⚠️ Return swap skipped (needs confirmation): ${returnCheck.error}`);
        return;
      }
      log(
        step.manualAmountUi
          ? `↩️ Return swap: ${returnAmount} ${symbolFor(config.toMint)} (manual amount)`
          : `↩️ Return swap: ${returnAmount} ${symbolFor(config.toMint)} (accumulated: ${roundStartBalance.toFixed(6)} → ${finalAmount.toFixed(6)})`
      );
      await executeSwap(config.toMint, config.fromMint, returnAmount, referralAddress, mode);
    },
    [config.fromMint, config.toMint, executeSwap, log, session, settings.rpc, sleep, walletAddress]
  );

  const startSession = useCallback(async () => {
    if (!publicKey) {
      log("Connect wallet first.");
      return;
    }
    if (runRef.current) return;

    const cfg: SessionConfig = {
      mode: config.swapMode,
      amount: config.amount,
      maxAmount: config.maxAmount,
      loopReturnAmount: config.loopReturnAmount,
      swapsPerRound: config.swapsPerRound,
      numberOfRounds: config.numberOfRounds,
      numberOfSwaps: config.numberOfSwaps,
      swapDelayMs: config.swapDelayMs,
      autoDelayMs: config.autoDelayMs,
    };

    runRef.current = true;
    session.setRunning(true);

    const extraction = config.referralLink
      ? extractReferralCode(config.referralLink)
      : { hasReferral: false as const };
    const referralAddress = extraction.hasReferral ? extraction.referralAddress : undefined;
    if (config.referralLink && "error" in extraction && extraction.error) {
      log(`⚠️ Referral link error: ${extraction.error}`);
    }

    const rounds = totalRounds(cfg);
    const roundsLabel = rounds === Infinity ? "∞" : String(rounds);
    log(`🚀 Starting ${cfg.mode} session (${roundsLabel} round${rounds === 1 ? "" : "s"})`);

    const swapCounter = { count: 0 };
    let completedRounds = 0;
    try {
      while (runRef.current && hasNextRound(completedRounds, cfg)) {
        const round = completedRounds + 1;
        session.setCurrentRound(round);
        if (cfg.mode !== "normal") {
          log(`🔄 Round ${rounds === Infinity ? "∞" : `${round}/${roundsLabel}`}`);
        }
        // Snapshot toMint balance for accumulated return-swap math
        let roundStartBalance = 0;
        if (cfg.mode !== "normal") {
          const initial = await fetchTokenBalance(walletAddress, config.toMint, settings.rpc);
          roundStartBalance = initial.uiAmount || 0;
        }
        for (const step of planRound(cfg, round, Math.random)) {
          await waitWhilePaused();
          if (!runRef.current) break;
          await executeStep(step, referralAddress, cfg.mode, roundStartBalance, swapCounter);
        }
        completedRounds = round;
      }
      if (runRef.current && rounds !== Infinity) {
        log(`✅ ${cfg.mode} session complete: ${roundsLabel} round${rounds === 1 ? "" : "s"}`);
        toast.success(`Session complete — ${roundsLabel} round${rounds === 1 ? "" : "s"} finished`);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      log(`❌ Session error: ${msg}`);
      toast.error(`Session error: ${msg.slice(0, 50)}`);
    } finally {
      runRef.current = false;
      pauseRef.current = false;
      session.setRunning(false);
      session.setPaused(false);
      session.setStopping(false);
      session.setCurrentSwapIndex(0);
      session.setCurrentRound(0);
    }
  }, [publicKey, config, session, settings.rpc, log, executeStep, waitWhilePaused, walletAddress]);

  const stopSession = useCallback(() => {
    runRef.current = false;
    pauseRef.current = false;
    session.setStopping(true);
    log("⏹️ Stopping session...");
  }, [session, log]);

  const pauseSession = useCallback(() => {
    pauseRef.current = true;
    session.setPaused(true);
    log("⏸️ Pausing session...");
  }, [session, log]);

  const resumeSession = useCallback(() => {
    pauseRef.current = false;
    session.setPaused(false);
    log("▶️ Resuming session...");
  }, [session, log]);

  return { startSession, stopSession, pauseSession, resumeSession, getUsdValue };
}
