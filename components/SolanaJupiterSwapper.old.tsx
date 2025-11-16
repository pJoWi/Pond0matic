"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Connection, PublicKey, SystemProgram, Transaction, VersionedTransaction } from "@solana/web3.js";

// Components
import { StatusBadge } from "@/components/StatusBadge";

// Utils
import { cn, now, short, solscanTx } from "@/lib/utils";
import { DEFAULT_RPC, REFERRAL_PROGRAM_ID, TOKEN_NAMES, TOKEN_VAULTS_AFFILIATE_1, TOKEN_VAULTS_AFFILIATE_2 } from "@/lib/vaults";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type Affiliate = "pond0x" | "aquavaults";
type AppTab = "autobot" | "void";
type Mode = "normal" | "roundtrip" | "micro" | "loopreturn";

interface SwapperProps {
  theme: 'dark' | 'light';
}

// Wetware Protocol Configuration (for The Void tab)
const WETWARE_ADDRESS = "9GjEVnpWiLe2uknUmtaH6DSfgcBvL66DtSKGREXDctZU";
const WETWARE_OPERATIONS = {
  condensation: { amount: 0.001, label: "Condensation" },
  lubrication: { amount: 0.01, label: "Lubrication" },
  ionization: { amount: 0.1, label: "Ionization" }
} as const;

// Pond0x Protocol Addresses (Official Solana Mainnet)
const POND0X_ADDRESSES = {
  wPOND_MINT: "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq",
  MINING_CLAIMS_DISTRIBUTOR: "AYg4dKoZJudVkD7Eu3ZaJjkzfoaATUqfiv8w8pS53opT",
  TREASURY: "cPUtmyb7RZhCaTusCb4qnPJjVTbwpJ6SpXUCvnBDU4a",
  SWAP_REWARD_DISTRIBUTOR: "1orFCnFfgwPzSgUaoK6Wr3MjgXZ7mtk8NGz9Hh4iWWL",
  HASHRATE_BOOSTER: "4ngqDt821wV2CjxoZLCLcTAPZNt6ZqpswoqyQEztsU36",
  MINING_RIG_ACTIVATOR: "4bTrXA7iNcqcXobcRkVMCF1f47dXn2vuRtDZYQQYRN2M",
  POND_PRO: "2bsXHfqzWS3kgcgGifmffNCRokzgV1K9RMEiTcL6zQRF",
  PONDSOL_DEPLOYER: "Bpj1Gqdtt4gpPZMHyzqq2rfwoSwMJPySGmCZ3QgLMETn"
} as const;

// Mining Rig Configuration
const MIN_BOOSTBOT_USD = 0.01;
const MIN_PERMANENT_BOOST_SOL = 0.1;
const MIN_LUCK_SOL = 0.001;
const OPTIMAL_BOOST_THRESHOLD = 615; // Target boost for 100% power

// Jupiter API endpoints
const JUP_QUOTE = "https://lite-api.jup.ag/swap/v1/quote";
const JUP_SWAP = "https://lite-api.jup.ag/swap/v1/swap";

const TOKEN_OPTIONS = Object.keys(TOKEN_NAMES);

// Token decimals for each supported token
const TOKEN_DECIMALS: Record<string, number> = {
  "So11111111111111111111111111111111111111112": 9,  // SOL
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": 6,  // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": 6,  // USDT
  "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq": 3,  // wPOND
  "he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A": 9,   // hSOL
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": 9,    // mSOL
  "B5WTLaRwaUQpKk7ir1wniNB6m5o8GgMrimhKMYan2R6B": 6,    // PepeOnSOL
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Convert base64 to Uint8Array for transaction deserialization
function b64ToUint8Array(b64: string): Uint8Array {
  const bin = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Cache for token decimals fetched from Jupiter API
const decimalsCache = new Map<string, number>();

// Get token decimals with fallback to Jupiter API
async function getMintDecimals(mint: string): Promise<number> {
  if (TOKEN_DECIMALS[mint] !== undefined) return TOKEN_DECIMALS[mint];
  if (decimalsCache.has(mint)) return decimalsCache.get(mint)!;

  try {
    const res = await fetch("https://token.jup.ag/all");
    const list = await res.json();
    const found = Array.isArray(list) ? list.find((t: any) => t.address === mint) : null;
    const d = found?.decimals ?? 6;
    decimalsCache.set(mint, d);
    return d;
  } catch {
    const fallback = 6;
    decimalsCache.set(mint, fallback);
    return fallback;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Swapper({ theme }: SwapperProps) {
  const [rpc, setRpc] = useState<string>(DEFAULT_RPC);
  const [tempRpc, setTempRpc] = useState<string>(DEFAULT_RPC);
  const [wallet, setWallet] = useState<string>("");
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("autobot");
  const [affiliate, setAffiliate] = useState<Affiliate>(
    (process.env.NEXT_PUBLIC_DEFAULT_AFFILIATE as Affiliate) || "pond0x"
  );
  const [platformFeeBps, setPlatformFeeBps] = useState<number>(
    parseInt(process.env.NEXT_PUBLIC_DEFAULT_PLATFORM_FEE_BPS || "100")
  );
  const [slippageBps, setSlippageBps] = useState<number>(
    parseInt(process.env.NEXT_PUBLIC_DEFAULT_SLIPPAGE_BPS || "100")
  );
  const [fromMint, setFromMint] = useState<string>(
    process.env.NEXT_PUBLIC_DEFAULT_FROM_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  );
  const [toMint, setToMint] = useState<string>(
    process.env.NEXT_PUBLIC_DEFAULT_TO_MINT || "So11111111111111111111111111111111111111112"
  );
  const [amount, setAmount] = useState<string>(
    process.env.NEXT_PUBLIC_DEFAULT_AMOUNT || "0.1"
  );
  const [maxAmount, setMaxAmount] = useState<string>(
    process.env.NEXT_PUBLIC_DEFAULT_MAX_AMOUNT || "0.2"
  );
  const [autoActive, setAutoActive] = useState(false);
  const [autoCount, setAutoCount] = useState<number>(
    parseInt(process.env.NEXT_PUBLIC_DEFAULT_AUTO_COUNT || "10")
  );
  const [autoDelayMs, setAutoDelayMs] = useState<number>(
    parseInt(process.env.NEXT_PUBLIC_DEFAULT_AUTO_DELAY_MS || "10000")
  );
  const [running, setRunning] = useState(false);
  const runRef = useRef(false);
  const [activity, setActivity] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [mode, setMode] = useState<Mode>("normal");
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [fetchingBalances, setFetchingBalances] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">("online");
  const [lastWetwareOp, setLastWetwareOp] = useState<string>("");

  // Mining Rig State (Pond0x Real Data)
  const [rigHealth, setRigHealth] = useState<number>(75); // 0-100 (converted from 1-9 scale)
  const [rigPower, setRigPower] = useState<number>(50); // 0-100 (based on boost calculation)
  const [rigTemp, setRigTemp] = useState<number>(68); // Temperature in celsius
  const [totalBoosts, setTotalBoosts] = useState<number>(0); // Total swaps executed
  const [permanentBoostTotal, setPermanentBoostTotal] = useState<number>(0); // Total SOL deposited
  const [luckPoints, setLuckPoints] = useState<number>(0); // Burned tokens for luck
  const [boostBotActive, setBoostBotActive] = useState(false);

  // Pond0x Flywheel Data
  const [miningSessionsCount, setMiningSessionsCount] = useState<number>(0);
  const [swapBoost, setSwapBoost] = useState<number>(0); // Swap Count × 1/6
  const [sessionPenalty, setSessionPenalty] = useState<number>(0); // Sessions × -3
  const [currentBoost, setCurrentBoost] = useState<number>(0); // Swap Boost - Session Penalty
  const [priority, setPriority] = useState<number>(50); // 1-100 (position on claims list)
  const [driftRisk, setDriftRisk] = useState<number>(0); // At-risk sessions
  const [estimatedSolUsd, setEstimatedSolUsd] = useState<number>(0);
  const [estimatedWpondUsd, setEstimatedWpondUsd] = useState<number>(0);
  const [lastHealthUpdate, setLastHealthUpdate] = useState<number>(0);

  const vaultMap = useMemo(() => (affiliate === 'pond0x' ? TOKEN_VAULTS_AFFILIATE_1 : TOKEN_VAULTS_AFFILIATE_2), [affiliate]);
  const currentVault = vaultMap[fromMint];

  const log = (line: string) => setActivity((p) => ["[" + now() + "] " + line, ...p].slice(0, 500));
  const clearLog = () => setActivity([]);

  // Pond0x Boost Calculation (based on flywheel mechanics)
  const calculateBoost = useCallback((swaps: number, sessions: number) => {
    const swapBoostValue = swaps * (1 / 6); // Each swap = +1/6 boost
    const sessionPenaltyValue = sessions * -3; // Each session = -3 boost
    const totalBoost = swapBoostValue + sessionPenaltyValue;

    setSwapBoost(swapBoostValue);
    setSessionPenalty(sessionPenaltyValue);
    setCurrentBoost(totalBoost);

    // Convert boost to power percentage (615 boost = 100% power)
    const powerPercent = Math.max(0, Math.min(100, (totalBoost / 615) * 100));
    setRigPower(powerPercent);

    return { swapBoostValue, sessionPenaltyValue, totalBoost, powerPercent };
  }, []);

  const fetchBalances = useCallback(async () => {
    if (!wallet) return;
    try {
      setFetchingBalances(true);
      const connection = new Connection(rpc, "confirmed");
      const publicKey = new PublicKey(wallet);

      const solBal = await connection.getBalance(publicKey);
      setSolBalance(solBal / 1e9);

      if (fromMint === "So11111111111111111111111111111111111111112") {
        setTokenBalance(solBal / 1e9);
      } else {
        try {
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            mint: new PublicKey(fromMint)
          });
          if (tokenAccounts.value.length > 0) {
            const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
            setTokenBalance(balance || 0);
          } else {
            setTokenBalance(0);
          }
        } catch {
          setTokenBalance(0);
        }
      }
      setNetworkStatus("online");
    } catch (e: any) {
      log("Balance fetch error: " + (e?.message || String(e)));
      setNetworkStatus("offline");
    } finally {
      setFetchingBalances(false);
    }
  }, [wallet, rpc, fromMint]);

  const connectWallet = useCallback(async () => {
    try {
      setConnecting(true);
      const provider = (window as any)?.solana;
      if (!provider?.isPhantom) {
        alert("Phantom wallet not found.");
        return;
      }
      const res = await provider.connect();
      setWallet(res.publicKey?.toString() || "");
      log("Wallet connected: " + (res.publicKey?.toString() || ""));
    } catch (e: any) {
      log("Wallet connect error: " + (e?.message || String(e)));
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      const provider = (window as any)?.solana;
      if (provider?.isConnected) await provider.disconnect();
    } catch { }
    setWallet("");
    setSolBalance(0);
    setTokenBalance(0);
    log("Wallet disconnected");
  }, []);

  const confirmRpc = useCallback(() => {
    setRpc(tempRpc);
    log("RPC endpoint updated: " + tempRpc);
  }, [tempRpc]);

  useEffect(() => {
    const ctl = new AbortController();
    (async () => {
      if (!fromMint || !toMint) return;
      try {
        const url = new URL(JUP_QUOTE);
        url.searchParams.set("inputMint", fromMint);
        url.searchParams.set("outputMint", toMint);
        url.searchParams.set("amount", "1000000");
        url.searchParams.set("slippageBps", String(slippageBps));
        url.searchParams.set("platformFeeBps", String(platformFeeBps));
        await fetch(url.toString(), { signal: ctl.signal });
      } catch { }
    })();
    return () => ctl.abort();
  }, [fromMint, toMint, slippageBps, platformFeeBps]);

  useEffect(() => {
    if (wallet) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 15000);
      return () => clearInterval(interval);
    }
  }, [wallet, fetchBalances]);

  async function getUsdValue(pairFrom: string, uiAmountStr: string) {
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
  }

  async function jupExecute(pairFrom: string, pairTo: string, uiAmountStr: string) {
    const provider = (window as any)?.solana;
    if (!provider?.publicKey) {
      log("Connect wallet first.");
      return;
    }
    const pk = new PublicKey(provider.publicKey.toString());
    const dec = await getMintDecimals(pairFrom);
    const raw = Math.floor((Number(uiAmountStr) || 0) * Math.pow(10, dec));

    // Debug logging to track amount transformations
    const uiAmount = Number(uiAmountStr);
    log(`💱 Swap: ${uiAmountStr} ${TOKEN_NAMES[pairFrom] || 'TOKEN'} (${dec} decimals) → ${raw} lamports`);

    // Validation: warn if amount seems suspiciously small
    if (raw > 0 && raw < 1000 && dec >= 6) {
      log(`⚠️ Warning: Very small amount detected (${raw} lamports). Check if this is intentional.`);
    }

    if (raw <= 0) {
      log("Enter a valid amount.");
      return;
    }

    const quoteUrl = new URL(JUP_QUOTE);
    quoteUrl.searchParams.set("inputMint", pairFrom);
    quoteUrl.searchParams.set("outputMint", pairTo);
    quoteUrl.searchParams.set("amount", String(raw));
    quoteUrl.searchParams.set("slippageBps", String(slippageBps));
    quoteUrl.searchParams.set("platformFeeBps", String(platformFeeBps));

    try {
      const quoteRes = await fetch(quoteUrl.toString());
      if (!quoteRes.ok) {
        log("Quote failed: " + quoteRes.status);
        return;
      }
      const quote = await quoteRes.json();

      const referralVault = (vaultMap as any)[pairFrom];
      const body: any = {
        quoteResponse: quote,
        userPublicKey: pk.toBase58(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto"
      };
      if (referralVault) body.feeAccount = referralVault;

      const swapRes = await fetch(JUP_SWAP, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!swapRes.ok) {
        const t = await swapRes.text();
        log("Swap build failed: " + t.slice(0, 180));
        return;
      }
      const swapJson = await swapRes.json();
      const txBytes = b64ToUint8Array(swapJson.swapTransaction);
      const tx = VersionedTransaction.deserialize(txBytes);

      let signature = "";
      if (provider.signAndSendTransaction) {
        const r = await provider.signAndSendTransaction(tx);
        signature = r.signature || r;
      } else if (provider.signTransaction) {
        const signed = await provider.signTransaction(tx);
        const connection = new Connection(rpc, "confirmed");
        signature = await connection.sendRawTransaction(signed.serialize());
      } else {
        log("Wallet does not support signing.");
        return;
      }

      log("Sent → " + short(signature, 6) + " | " + solscanTx(signature));
      const connection = new Connection(rpc, "confirmed");
      await connection.confirmTransaction(signature, "confirmed");
      log("Confirmed → " + short(signature, 6));
    } catch (e: any) {
      log("Execute error: " + (e?.message || String(e)));
    }
  }

  async function swapOnce(pairFrom: string, pairTo: string, uiAmountStr: string) {
    if (!wallet) {
      log("Connect wallet first.");
      return;
    }
    if (!uiAmountStr || Number(uiAmountStr) <= 0) {
      log("Enter a valid amount.");
      return;
    }
    const referralVault = vaultMap[pairFrom];
    log("Route fees → " + (referralVault ? short(referralVault, 6) : 'none') + " (affiliate: " + affiliate + ")");
    await jupExecute(pairFrom, pairTo, uiAmountStr);
  }

  function microRandom(base: number, cap: number) {
    const min = Math.max(0, base * 0.1);
    const max = Math.max(min + Number.EPSILON, cap || base);
    const v = Math.random() * (max - min) + min;
    // Use toFixed(12) instead of toFixed(6) to preserve precision for 9-decimal tokens
    // toPrecision would use scientific notation for small numbers, which we want to avoid
    return String(Number(v.toFixed(12)));
  }

  async function startAuto() {
    const provider = (window as any)?.solana;
    if (!provider?.publicKey) {
      log('Connect wallet first.');
      return;
    }
    if (running) return;
    setRunning(true);
    runRef.current = true;

    if (mode === 'loopreturn') {
      while (runRef.current) {
        const N = Math.max(1, autoCount);
        for (let i = 1; i <= N && runRef.current; i++) {
          const useAmt = amount;
          log(`🔁 Loop ${i}/${N}: swapping ${useAmt} ${TOKEN_NAMES[fromMint] || 'TOKEN'} → ${TOKEN_NAMES[toMint] || 'TOKEN'}`);
          await swapOnce(fromMint, toMint, useAmt);
          if (i < N && runRef.current) {
            log("Delay " + autoDelayMs + " ms");
            await new Promise(r => setTimeout(r, autoDelayMs));
          }
        }
        if (!runRef.current) break;
        log(`↩️ Return swap: ${amount} ${TOKEN_NAMES[toMint] || 'TOKEN'} → ${TOKEN_NAMES[fromMint] || 'TOKEN'}`);
        await swapOnce(toMint, fromMint, amount);
      }
      setRunning(false);
      log('Autoswap finished or stopped.');
      return;
    }

    const N = Math.max(1, autoCount);
    for (let i = 1; i <= N && runRef.current; i++) {
      let useAmt = amount;
      if (mode === 'micro') {
        const baseAmt = Number(amount) || 0.01;
        const maxAmt = Number(maxAmount) || baseAmt;
        useAmt = microRandom(baseAmt, maxAmt);
        log(`🎲 Micro: randomized ${baseAmt} to ${useAmt} (range: ${(baseAmt * 0.1).toFixed(12)} - ${maxAmt})`);
      }
      if (mode === 'roundtrip') {
        const usd = await getUsdValue(fromMint, useAmt);
        if (!(usd > 10)) {
          log('Round-trip requires > 10 USD (now ~ ' + usd.toFixed(2) + ' USD)');
          break;
        }
        log('Round-trip ~ ' + usd.toFixed(2) + ' USD');
        await swapOnce(fromMint, toMint, useAmt);
        await swapOnce(toMint, fromMint, useAmt);
      } else {
        await swapOnce(fromMint, toMint, useAmt);
      }
      if (i < N && runRef.current) {
        log("Delay " + autoDelayMs + " ms");
        await new Promise(r => setTimeout(r, autoDelayMs));
      }
    }
    runRef.current = false;
    setRunning(false);
    log('Autoswap finished or stopped.');
  }

  function stopAuto() {
    runRef.current = false;
    setRunning(false);
    log('Autoswap stopped by user.');
  }

  async function sendWetwareOperation(operationKey: keyof typeof WETWARE_OPERATIONS) {
    const provider = (window as any)?.solana;
    if (!provider?.publicKey) {
      log('Connect wallet first.');
      return;
    }

    const operation = WETWARE_OPERATIONS[operationKey];
    const amountLamports = Math.floor(operation.amount * 1_000_000_000); // Convert SOL to lamports

    // Check balance
    if (solBalance < operation.amount) {
      log(`Insufficient balance. Need ${operation.amount} SOL, have ${solBalance.toFixed(4)} SOL`);
      return;
    }

    try {
      log(`Wetware: Initiating ${operation.label} (${operation.amount} SOL)...`);

      const connection = new Connection(rpc, "confirmed");
      const fromPubkey = new PublicKey(provider.publicKey.toString());
      const toPubkey = new PublicKey(WETWARE_ADDRESS);

      // Create transfer instruction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: amountLamports
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      // Sign transaction
      let signedTx;
      if (provider.signTransaction) {
        signedTx = await provider.signTransaction(transaction);
      } else {
        log('Wallet does not support signing.');
        return;
      }

      // Send transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      log(`Wetware: Sent ${operation.label} → ${short(signature, 6)} | ${solscanTx(signature)}`);

      // Confirm transaction
      await connection.confirmTransaction(signature, "confirmed");
      log(`Wetware: Confirmed ${operation.label} (${operation.amount} SOL) → ${short(signature, 6)}`);

      setLastWetwareOp(operation.label);

      // Refresh balance
      fetchBalances();
    } catch (e: any) {
      log(`Wetware error: ${e?.message || String(e)}`);
    }
  }

  // Mining Rig Functions
  async function runBoostBot(swapAmount: string, swapCount: number = 10) {
    const provider = (window as any)?.solana;
    if (!provider?.publicKey) {
      log('Rig: Connect wallet first.');
      return;
    }

    // Validate minimum USD value
    const usdValue = await getUsdValue(fromMint, swapAmount);
    if (usdValue < MIN_BOOSTBOT_USD) {
      log(`Rig: BoostBot requires minimum ${MIN_BOOSTBOT_USD} USD value (got ${usdValue.toFixed(4)} USD)`);
      return;
    }

    setBoostBotActive(true);
    log(`Rig: BoostBot activated - ${swapCount} micro swaps to SOL`);

    // Run micro swaps to SOL
    for (let i = 1; i <= swapCount && boostBotActive; i++) {
      log(`Rig: BoostBot swap ${i}/${swapCount}`);
      await swapOnce(fromMint, "So11111111111111111111111111111111111111112", swapAmount);

      // Update swap count and recalculate boost using Pond0x formula
      const newSwapCount = totalBoosts + i;
      const boostCalc = calculateBoost(newSwapCount, miningSessionsCount);
      setTotalBoosts(newSwapCount);
      setRigHealth(prev => Math.min(100, prev + 1));

      log(`Rig: Boost +${(1 / 6).toFixed(3)} → Total: ${boostCalc.totalBoost.toFixed(2)} (Power: ${boostCalc.powerPercent.toFixed(1)}%)`);

      if (i < swapCount && boostBotActive) {
        await new Promise(r => setTimeout(r, autoDelayMs));
      }
    }

    setBoostBotActive(false);
    log(`Rig: BoostBot completed - Power: ${rigPower}% | Health: ${rigHealth}%`);
  }

  async function sendPermanentBoost(solAmount: number) {
    const provider = (window as any)?.solana;
    if (!provider?.publicKey) {
      log('Rig: Connect wallet first.');
      return;
    }

    if (solAmount < MIN_PERMANENT_BOOST_SOL) {
      log(`Rig: Permanent boost requires minimum ${MIN_PERMANENT_BOOST_SOL} SOL`);
      return;
    }

    if (solBalance < solAmount) {
      log(`Rig: Insufficient balance. Need ${solAmount} SOL, have ${solBalance.toFixed(4)} SOL`);
      return;
    }

    try {
      log(`Rig: Sending permanent boost (${solAmount} SOL)...`);

      const connection = new Connection(rpc, "confirmed");
      const fromPubkey = new PublicKey(provider.publicKey.toString());
      const toPubkey = new PublicKey(POND0X_ADDRESSES.HASHRATE_BOOSTER);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: Math.floor(solAmount * 1_000_000_000)
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      let signedTx;
      if (provider.signTransaction) {
        signedTx = await provider.signTransaction(transaction);
      } else {
        log('Rig: Wallet does not support signing.');
        return;
      }

      const signature = await connection.sendRawTransaction(signedTx.serialize());
      log(`Rig: Permanent boost sent → ${short(signature, 6)} | ${solscanTx(signature)}`);

      await connection.confirmTransaction(signature, "confirmed");
      log(`Rig: Permanent boost confirmed! (${solAmount} SOL) → ${short(signature, 6)}`);

      setPermanentBoostTotal(prev => prev + solAmount);
      setRigPower(prev => Math.min(100, prev + 10));
      setRigHealth(prev => Math.min(100, prev + 15));
      setRigTemp(prev => Math.max(40, prev - 5)); // Cooler rig

      fetchBalances();
    } catch (e: any) {
      log(`Rig: Permanent boost error: ${e?.message || String(e)}`);
    }
  }

  async function sendLuckBurn(solAmount: number) {
    const provider = (window as any)?.solana;
    if (!provider?.publicKey) {
      log('Rig: Connect wallet first.');
      return;
    }

    if (solAmount < MIN_LUCK_SOL) {
      log(`Rig: Luck burn requires minimum ${MIN_LUCK_SOL} SOL`);
      return;
    }

    if (solBalance < solAmount) {
      log(`Rig: Insufficient balance. Need ${solAmount} SOL, have ${solBalance.toFixed(4)} SOL`);
      return;
    }

    try {
      log(`Rig: Burning for luck (${solAmount} SOL)...`);

      const connection = new Connection(rpc, "confirmed");
      const fromPubkey = new PublicKey(provider.publicKey.toString());
      const toPubkey = new PublicKey(POND0X_ADDRESSES.SWAP_REWARD_DISTRIBUTOR);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: Math.floor(solAmount * 1_000_000_000)
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      let signedTx;
      if (provider.signTransaction) {
        signedTx = await provider.signTransaction(transaction);
      } else {
        log('Rig: Wallet does not support signing.');
        return;
      }

      const signature = await connection.sendRawTransaction(signedTx.serialize());
      log(`Rig: Luck burn sent → ${short(signature, 6)} | ${solscanTx(signature)}`);

      await connection.confirmTransaction(signature, "confirmed");
      log(`Rig: Luck burn confirmed! +${Math.floor(solAmount * 1000)} luck points → ${short(signature, 6)}`);

      setLuckPoints(prev => prev + Math.floor(solAmount * 1000));
      setRigHealth(prev => Math.min(100, prev + 5));

      fetchBalances();
    } catch (e: any) {
      log(`Rig: Luck burn error: ${e?.message || String(e)}`);
    }
  }

  function onPrimarySwap() {
    if (mode === 'normal' && !autoActive) {
      swapOnce(fromMint, toMint, amount);
      return;
    }
    startAuto();
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      {/* Tab Navigation */}
      <section
        className="bg-cyber-darker/60 backdrop-blur-md border border-ember-orange/30 rounded-xl shadow-ember-orange-md overflow-hidden"
        role="tablist"
        aria-label="Main navigation"
      >
        <div className="flex items-center">
          <button
            role="tab"
            aria-selected={activeTab === "autobot"}
            aria-controls="autobot-panel"
            onClick={() => setActiveTab("autobot")}
            className={cn(
              "flex-1 px-6 py-4 text-center font-bold text-sm uppercase tracking-wider transition-all duration-300 relative",
              activeTab === "autobot"
                ? "bg-gradient-to-br from-ember-orange/30 to-ember-amber/20 text-ember-orange-light border-b-2 border-ember-orange shadow-ember-orange-sm"
                : "bg-cyber-black/30 text-gray-400 hover:text-gray-300 hover:bg-cyber-black/50 border-b-2 border-transparent",
              "focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-inset"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <span aria-hidden="true">⚙️</span>
              <span>Pond0x Mining Rig</span>
            </span>
            {activeTab === "autobot" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-ember-orange via-ember-amber to-ember-gold animate-gradient-shift" style={{ backgroundSize: "200% 200%" }}></div>
            )}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "void"}
            aria-controls="void-panel"
            onClick={() => setActiveTab("void")}
            className={cn(
              "flex-1 px-6 py-4 text-center font-bold text-sm uppercase tracking-wider transition-all duration-300 relative",
              activeTab === "void"
                ? "bg-gradient-to-br from-ember-gold/30 to-ember-orange/20 text-ember-gold border-b-2 border-ember-gold shadow-ember-gold-sm"
                : "bg-cyber-black/30 text-gray-400 hover:text-gray-300 hover:bg-cyber-black/50 border-b-2 border-transparent",
              "focus:outline-none focus:ring-2 focus:ring-ember-gold focus:ring-inset"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <span aria-hidden="true">🌌</span>
              <span>The Void</span>
            </span>
            {activeTab === "void" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-ember-gold via-ember-amber to-ember-orange animate-gradient-shift" style={{ backgroundSize: "200% 200%" }}></div>
            )}
          </button>
        </div>
      </section>

      {/* Status Badges Row */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3"
        role="region"
        aria-label="Status indicators"
      >
        <StatusBadge
          label="Token Balance"
          value={wallet ? `${tokenBalance.toFixed(4)} ${TOKEN_NAMES[fromMint]}` : "—"}
          ledStatus={wallet ? (tokenBalance > 0 ? "green" : "yellow") : "gray"}
          flyoutContent={
            wallet ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-400">Selected Token</div>
                <div className="font-mono text-ember-orange-light">{TOKEN_NAMES[fromMint]}</div>
                <div className="text-xs text-gray-400 mt-2">Balance</div>
                <div className="font-mono text-white text-lg">{tokenBalance.toFixed(6)}</div>
              </div>
            ) : (
              <div className="text-gray-400">Connect wallet to view balance</div>
            )
          }
        />

        <StatusBadge
          label="SOL Balance"
          value={wallet ? `${solBalance.toFixed(4)} SOL` : "—"}
          ledStatus={wallet ? (solBalance > 0.01 ? "green" : "red") : "gray"}
          flyoutContent={
            wallet ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-400">Solana Balance</div>
                <div className="font-mono text-neon-pink-light text-lg">{solBalance.toFixed(6)} SOL</div>
                <div className="text-xs text-gray-400 mt-2">Estimated USD</div>
                <div className="font-mono text-white">${(solBalance * 150).toFixed(2)}</div>
              </div>
            ) : (
              <div className="text-gray-400">Connect wallet to view balance</div>
            )
          }
        />

        <StatusBadge
          label="Mode"
          value={mode.toUpperCase()}
          ledStatus={mode !== "normal" ? "blue" : "gray"}
          flyoutContent={
            <div className="space-y-2">
              <div className="text-xs text-gray-400">Swap Mode</div>
              <div className="font-semibold text-neon-rose">{mode}</div>
              <div className="text-xs text-gray-400 mt-2">Description</div>
              <div className="text-xs">
                {mode === "normal" && "Standard single swap execution"}
                {mode === "roundtrip" && "Swap both ways (requires >$10)"}
                {mode === "micro" && "Random amounts within range"}
                {mode === "loopreturn" && "Loop swaps then return"}
              </div>
            </div>
          }
        />

        <StatusBadge
          label="Status"
          value={running ? "RUNNING" : "IDLE"}
          ledStatus={running ? "green" : "gray"}
          flyoutContent={
            <div className="space-y-2">
              <div className="text-xs text-gray-400">Swap Status</div>
              <div className={cn("font-semibold", running ? "text-neon-pink-light" : "text-gray-400")}>
                {running ? "Active" : "Idle"}
              </div>
              {running && (
                <>
                  <div className="text-xs text-gray-400 mt-2">Auto Count</div>
                  <div className="font-mono text-white">{autoCount} swaps</div>
                </>
              )}
            </div>
          }
        />

        <StatusBadge
          label="Fee"
          value={`${(platformFeeBps / 100).toFixed(2)}%`}
          ledStatus="blue"
          flyoutContent={
            <div className="space-y-2">
              <div className="text-xs text-gray-400">Platform Fee</div>
              <div className="font-mono text-neon-rose text-lg">{(platformFeeBps / 100).toFixed(2)}%</div>
              <div className="text-xs text-gray-400 mt-2">Basis Points</div>
              <div className="font-mono text-white">{platformFeeBps} bps</div>
            </div>
          }
        />

        <StatusBadge
          label="Slippage"
          value={`${(slippageBps / 100).toFixed(2)}%`}
          ledStatus="yellow"
          flyoutContent={
            <div className="space-y-2">
              <div className="text-xs text-gray-400">Slippage Tolerance</div>
              <div className="font-mono text-neon-red-light text-lg">{(slippageBps / 100).toFixed(2)}%</div>
              <div className="text-xs text-gray-400 mt-2">Basis Points</div>
              <div className="font-mono text-white">{slippageBps} bps</div>
            </div>
          }
        />

        {activeTab === "autobot" && (
          <StatusBadge
            label="Vault"
            value={currentVault ? short(currentVault, 4) : "NONE"}
            ledStatus={currentVault ? "green" : "gray"}
            flyoutContent={
              <div className="space-y-2">
                <div className="text-xs text-gray-400">Connected Vault</div>
                {currentVault ? (
                  <>
                    <div className="font-mono text-neon-pink-light text-xs break-all">{currentVault}</div>
                    <div className="text-xs text-gray-400 mt-2">Affiliate</div>
                    <div className="font-semibold text-white">{affiliate === "pond0x" ? "Pond0x" : "AquaVaults"}</div>
                  </>
                ) : (
                  <div className="text-gray-400">No vault for this token</div>
                )}
              </div>
            }
          />
        )}

        {activeTab === "void" && (
          <StatusBadge
            label="Wetware"
            value={lastWetwareOp || "READY"}
            ledStatus={lastWetwareOp ? "green" : "gray"}
            flyoutContent={
              <div className="space-y-2">
                <div className="text-xs text-gray-400">Wetware Protocol</div>
                {lastWetwareOp ? (
                  <>
                    <div className="font-semibold text-ember-orange-light text-lg">{lastWetwareOp}</div>
                    <div className="text-xs text-gray-400 mt-2">Last Operation</div>
                    <div className="font-mono text-white text-xs">{WETWARE_OPERATIONS[lastWetwareOp.toLowerCase() as keyof typeof WETWARE_OPERATIONS]?.amount} SOL</div>
                    <div className="text-xs text-gray-400 mt-2">Target Address</div>
                    <div className="font-mono text-ember-amber-light text-xs break-all">{short(WETWARE_ADDRESS, 6)}</div>
                  </>
                ) : (
                  <div className="text-gray-400">Ready for operations</div>
                )}
              </div>
            }
          />
        )}

        <StatusBadge
          label="Network"
          value={networkStatus.toUpperCase()}
          ledStatus={networkStatus === "online" ? "green" : "red"}
          flyoutContent={
            <div className="space-y-2">
              <div className="text-xs text-gray-400">Network Status</div>
              <div className={cn("font-semibold", networkStatus === "online" ? "text-neon-pink-light" : "text-neon-red")}>
                {networkStatus === "online" ? "Connected" : "Disconnected"}
              </div>
              <div className="text-xs text-gray-400 mt-2">RPC Endpoint</div>
              <div className="font-mono text-xs text-white break-all">{rpc.slice(0, 40)}...</div>
            </div>
          }
        />
      </section>

      {/* PLUG Card - Wallet Connection */}
      <section
        className="bg-cyber-darker/60 backdrop-blur-md border border-ember-orange/30 rounded-xl shadow-ember-orange-sm overflow-hidden transition-all duration-300 hover:border-ember-orange/50"
        role="region"
        aria-label="Wallet connection"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ember-orange/20 bg-ember-glow">
          <h2 className="text-xl font-bold bg-gradient-to-r from-ember-orange via-ember-amber to-ember-gold bg-clip-text text-transparent">
            PLUG
          </h2>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all duration-300",
            wallet ? "bg-ember-orange/10 text-ember-orange-light border border-ember-orange/40 shadow-ember-orange-sm" : "bg-gray-700/50 text-gray-400 border border-gray-600"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              wallet ? "bg-ember-orange-light animate-led-pulse shadow-ember-orange-sm" : "bg-gray-500"
            )}></div>
            {wallet ? "Connected" : "Disconnected"}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wallet Section */}
          <div className="space-y-3">
            <label
              className="text-xs uppercase tracking-wider text-gray-400 font-semibold"
              htmlFor="wallet-connection"
            >
              Wallet
            </label>
            {!wallet ? (
              <button
                id="wallet-connection"
                onClick={connectWallet}
                disabled={connecting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-ember-orange via-ember-amber to-ember-gold rounded-lg font-semibold text-sm text-white hover:shadow-ember-orange hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-black"
                aria-label={connecting ? "Connecting to wallet" : "Connect wallet"}
              >
                <span className="text-lg" aria-hidden="true">🔌</span>
                {connecting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Connecting...</span>
                  </>
                ) : (
                  "CONNECT WALLET"
                )}
              </button>
            ) : (
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-ember-orange/10 border border-ember-orange/40 rounded-lg shadow-ember-orange-sm transition-all duration-300 hover:border-ember-orange/60">
                <span className="font-mono text-sm text-ember-orange-light truncate" aria-label={`Wallet address: ${wallet}`}>
                  {short(wallet, 6)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="px-3 py-1 bg-red-500/20 border border-red-500/40 rounded text-xs text-red-400 hover:bg-red-500/30 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-cyber-black"
                  aria-label="Disconnect wallet"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {/* RPC Section */}
          <div className="space-y-3">
            <label
              htmlFor="rpc-endpoint"
              className="text-xs uppercase tracking-wider text-gray-400 font-semibold"
            >
              RPC Endpoint
            </label>
            <div className="flex gap-2">
              <input
                id="rpc-endpoint"
                type="url"
                className="flex-1 px-3 py-2 bg-cyber-black/50 border border-ember-orange/30 rounded-lg text-sm font-mono text-white placeholder-gray-500 focus:border-ember-orange/60 focus:shadow-ember-orange-sm focus:outline-none focus:ring-2 focus:ring-ember-orange/40 transition-all"
                placeholder={DEFAULT_RPC}
                value={tempRpc}
                onChange={(e) => setTempRpc(e.target.value)}
                aria-describedby="rpc-hint"
              />
              <button
                onClick={confirmRpc}
                disabled={tempRpc === rpc}
                className="px-4 py-2 bg-neon-red/20 border border-neon-red/40 rounded-lg text-sm font-semibold text-neon-red hover:bg-neon-red/30 hover:shadow-neon-red-sm hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-neon-red focus:ring-offset-2 focus:ring-offset-cyber-black"
                aria-label="Set RPC endpoint"
              >
                Set
              </button>
            </div>
            <p id="rpc-hint" className="sr-only">
              Enter a custom Solana RPC endpoint URL
            </p>
          </div>

          {/* Affiliate Section - Only in Autobot Tab */}
          {activeTab === "autobot" && (
            <div className="space-y-3">
              <label
                id="affiliate-label"
                className="text-xs uppercase tracking-wider text-gray-400 font-semibold"
              >
                Referral Program
              </label>
              <div className="flex gap-2" role="group" aria-labelledby="affiliate-label">
                <button
                  onClick={() => setAffiliate('pond0x')}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 border",
                    affiliate === 'pond0x'
                      ? "bg-ember-orange/20 border-ember-orange text-ember-orange-light shadow-ember-orange-sm scale-105"
                      : "bg-cyber-black/30 border-gray-600 text-gray-400 hover:border-ember-orange/40 hover:text-gray-300 hover:scale-[1.02]",
                    "active:scale-95 focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-black"
                  )}
                  aria-pressed={affiliate === 'pond0x'}
                >
                  Pond0x
                </button>
                <button
                  onClick={() => setAffiliate('aquavaults')}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 border",
                    affiliate === 'aquavaults'
                      ? "bg-ember-orange/20 border-ember-orange text-ember-orange-light shadow-ember-orange-sm scale-105"
                      : "bg-cyber-black/30 border-gray-600 text-gray-400 hover:border-ember-orange/40 hover:text-gray-300 hover:scale-[1.02]",
                    "active:scale-95 focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-black"
                  )}
                  aria-pressed={affiliate === 'aquavaults'}
                >
                  AquaVaults
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Autobot Swapper Tab Content */}
      {activeTab === "autobot" && (
        <>
          {/* Mining Rig Status Panel */}
          <section className="bg-cyber-darker/60 backdrop-blur-md border border-ember-orange/30 rounded-xl shadow-ember-orange-md overflow-hidden transition-all duration-300 hover:border-ember-orange/50">
            <div className="px-6 py-4 border-b border-ember-orange/20 bg-gradient-to-br from-ember-orange/10 to-ember-gold/5">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-ember-orange via-ember-amber to-ember-gold bg-clip-text text-transparent text-center flex items-center justify-center gap-3">
                <span>⚙️</span>
                <span>POND0X MINING RIG</span>
                <span>⚙️</span>
              </h2>
              <p className="text-center text-sm text-gray-400 mt-2">
                Boost your rig • Maximize mining power • Increase luck
              </p>
            </div>
            
            {/* Rig Status Display */}
            <div className="p-6 space-y-6">
              {/* Status Meters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Health */}
                <div className="space-y-3 p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Health</span>
                    <span className="text-lg font-bold text-green-400">{rigHealth}%</span>
                  </div>
                  <div className="w-full h-3 bg-cyber-black/50 rounded-full overflow-hidden border border-green-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                      style={{ width: `${rigHealth}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">Boost to maintain rig health</p>
                </div>

                {/* Power */}
                <div className="space-y-3 p-4 bg-gradient-to-br from-ember-orange/10 to-ember-amber/5 border border-ember-orange/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Power (Boost)</span>
                    <span className="text-lg font-bold text-ember-orange-light">{rigPower.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-3 bg-cyber-black/50 rounded-full overflow-hidden border border-ember-orange/30">
                    <div
                      className="h-full bg-gradient-to-r from-ember-orange to-ember-amber transition-all duration-1000 shadow-ember-orange-sm"
                      style={{ width: `${rigPower}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {currentBoost > 0 ? `+${currentBoost.toFixed(1)}` : currentBoost.toFixed(1)} boost
                    {currentBoost >= 615 ? ' ✓' : ` (need ${(615 - currentBoost).toFixed(0)})`}
                  </p>
                </div>

                {/* Temperature */}
                <div className="space-y-3 p-4 bg-gradient-to-br from-red-500/10 to-orange-600/5 border border-red-500/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Temperature</span>
                    <span className="text-lg font-bold text-red-400">{rigTemp}°C</span>
                  </div>
                  <div className="w-full h-3 bg-cyber-black/50 rounded-full overflow-hidden border border-red-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                      style={{ width: `${(rigTemp / 100) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">Optimal: 40-70°C</p>
                </div>
              </div>

              {/* Flywheel Mechanics Info */}
              <div className="bg-gradient-to-br from-ember-gold/10 to-ember-orange/5 border-2 border-ember-gold/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">🌀</div>
                  <div>
                    <h3 className="text-lg font-bold text-ember-gold">Pond0x Flywheel</h3>
                    <p className="text-xs text-gray-400">Real-time boost calculation</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-cyber-black/50 border border-green-500/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Swap Boost</div>
                    <div className="text-xl font-bold text-green-400">+{swapBoost.toFixed(2)}</div>
                    <div className="text-[10px] text-gray-600 mt-1">{totalBoosts} swaps × 1/6</div>
                  </div>
                  <div className="bg-cyber-black/50 border border-red-500/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Session Penalty</div>
                    <div className="text-xl font-bold text-red-400">{sessionPenalty.toFixed(0)}</div>
                    <div className="text-[10px] text-gray-600 mt-1">{miningSessionsCount} sessions × -3</div>
                  </div>
                  <div className="bg-cyber-black/50 border border-ember-orange/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Current Boost</div>
                    <div className={cn("text-xl font-bold", currentBoost >= 615 ? "text-ember-orange-light" : currentBoost > 0 ? "text-yellow-400" : "text-red-400")}>
                      {currentBoost > 0 ? '+' : ''}{currentBoost.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-gray-600 mt-1">Target: 615</div>
                  </div>
                  <div className="bg-cyber-black/50 border border-purple-500/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Priority</div>
                    <div className="text-xl font-bold text-purple-400">{priority}/100</div>
                    <div className="text-[10px] text-gray-600 mt-1">Claims list</div>
                  </div>
                </div>
              </div>

              {/* Rig Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-cyber-black/50 border border-ember-orange/30 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Total Swaps</div>
                  <div className="text-2xl font-bold text-ember-orange-light">{totalBoosts}</div>
                </div>
                <div className="bg-cyber-black/50 border border-ember-gold/30 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Permanent SOL</div>
                  <div className="text-2xl font-bold text-ember-gold">{permanentBoostTotal.toFixed(2)}</div>
                </div>
                <div className="bg-cyber-black/50 border border-purple-500/30 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Luck Points</div>
                  <div className="text-2xl font-bold text-purple-400">{luckPoints}</div>
                </div>
                <div className="bg-cyber-black/50 border border-blue-500/30 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="text-lg font-bold text-blue-400">{boostBotActive ? "BOOSTING" : "IDLE"}</div>
                </div>
              </div>

              {/* Boost Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* BoostBot */}
                <div className="bg-gradient-to-br from-ember-orange/20 to-ember-amber/10 border-2 border-ember-orange/40 rounded-xl p-6 space-y-4">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🤖</div>
                    <h3 className="text-xl font-bold text-ember-orange-light mb-2">BoostBot</h3>
                    <p className="text-xs text-gray-400 mb-4">Micro swaps to SOL for temporary boost (&gt;{MIN_BOOSTBOT_USD} USD)</p>
                  </div>
                  <button
                    onClick={() => runBoostBot(amount, autoCount)}
                    disabled={!wallet || boostBotActive}
                    className="w-full px-4 py-3 bg-gradient-to-r from-ember-orange to-ember-amber rounded-lg font-bold text-sm text-white hover:shadow-ember-orange hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 transition-all"
                  >
                    {boostBotActive ? "BOOSTING..." : "START BOOSTBOT"}
                  </button>
                  <p className="text-xs text-gray-500 text-center">+1/6 boost per swap • 615 boost = 100% power</p>
                </div>

                {/* Permanent Boost */}
                <div className="bg-gradient-to-br from-ember-gold/20 to-ember-orange/10 border-2 border-ember-gold/40 rounded-xl p-6 space-y-4">
                  <div className="text-center">
                    <div className="text-4xl mb-2">⚡</div>
                    <h3 className="text-xl font-bold text-ember-gold mb-2">Permanent Boost</h3>
                    <p className="text-xs text-gray-400 mb-4">
                      Deposit SOL to Hashrate Booster (min {MIN_PERMANENT_BOOST_SOL} SOL)
                    </p>
                    <p className="text-[10px] text-gray-600 font-mono mb-2">→ {short(POND0X_ADDRESSES.HASHRATE_BOOSTER, 6)}</p>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min={MIN_PERMANENT_BOOST_SOL}
                    placeholder={`${MIN_PERMANENT_BOOST_SOL} SOL`}
                    className="w-full px-3 py-2 bg-cyber-black/50 border border-ember-gold/30 rounded-lg text-sm font-mono text-white text-center focus:border-ember-gold/60 focus:outline-none"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val >= MIN_PERMANENT_BOOST_SOL) {
                        e.target.dataset.value = val.toString();
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      const val = parseFloat(input?.value || '0');
                      if (val >= MIN_PERMANENT_BOOST_SOL) {
                        sendPermanentBoost(val);
                      }
                    }}
                    disabled={!wallet}
                    className="w-full px-4 py-3 bg-gradient-to-r from-ember-gold to-ember-amber rounded-lg font-bold text-sm text-white hover:shadow-ember-gold hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 transition-all"
                  >
                    DEPOSIT PERMANENT BOOST
                  </button>
                  <p className="text-xs text-gray-500 text-center">+10% power +15% health</p>
                </div>

                {/* Luck Burn */}
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/10 border-2 border-purple-500/40 rounded-xl p-6 space-y-4">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🍀</div>
                    <h3 className="text-xl font-bold text-purple-400 mb-2">Luck Burn</h3>
                    <p className="text-xs text-gray-400 mb-4">
                      Send to Swap Reward Distributor for luck (min {MIN_LUCK_SOL} SOL)
                    </p>
                    <p className="text-[10px] text-gray-600 font-mono mb-2">→ {short(POND0X_ADDRESSES.SWAP_REWARD_DISTRIBUTOR, 6)}</p>
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    min={MIN_LUCK_SOL}
                    placeholder={`${MIN_LUCK_SOL} SOL`}
                    className="w-full px-3 py-2 bg-cyber-black/50 border border-purple-500/30 rounded-lg text-sm font-mono text-white text-center focus:border-purple-500/60 focus:outline-none"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val >= MIN_LUCK_SOL) {
                        e.target.dataset.value = val.toString();
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      const val = parseFloat(input?.value || '0');
                      if (val >= MIN_LUCK_SOL) {
                        sendLuckBurn(val);
                      }
                    }}
                    disabled={!wallet}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg font-bold text-sm text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 transition-all"
                  >
                    BURN FOR LUCK
                  </button>
                  <p className="text-xs text-gray-500 text-center">+1000 points per SOL</p>
                </div>
              </div>
            </div>
          </section>

          {/* Swap Interface Section */}
          <section
            id="autobot-panel"
            role="tabpanel"
            aria-labelledby="autobot-tab"
            className="bg-cyber-darker/60 backdrop-blur-md border border-ember-orange/30 rounded-xl shadow-ember-orange-md overflow-hidden transition-all duration-300 hover:border-ember-orange/50"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-ember-orange/20 bg-ember-glow">
              <h2 className="text-xl font-bold bg-gradient-to-r from-ember-orange via-ember-amber to-ember-gold bg-clip-text text-transparent">
                SWAP INTERFACE
              </h2>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  id="swap-mode"
                  className="flex-1 sm:flex-initial px-3 py-2 bg-cyber-black/50 border border-ember-orange/30 rounded-lg text-sm font-semibold text-white focus:border-ember-orange/60 focus:shadow-ember-orange-sm focus:outline-none focus:ring-2 focus:ring-ember-orange/40 transition-all cursor-pointer"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as Mode)}
                  aria-label="Select swap mode"
                >
                  <option value="normal">Normal</option>
                  <option value="roundtrip">Round-Trip</option>
                  <option value="micro">MicroSwaps</option>
                  <option value="loopreturn">Loop Return</option>
                </select>
                <button
                  onClick={() => setShowConfig(v => !v)}
                  className="px-4 py-2 bg-ember-amber/20 border border-ember-amber/40 rounded-lg text-sm font-semibold text-ember-amber hover:bg-ember-amber/30 hover:shadow-ember-amber-sm hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-ember-amber focus:ring-offset-2 focus:ring-offset-cyber-black"
                  aria-expanded={showConfig}
                  aria-controls="config-panel"
                >
                  <span aria-hidden="true">⚙️</span> {showConfig ? "Hide" : "Show"} Config
                </button>
              </div>
            </div>

            {/* Configuration Panel */}
            {showConfig && (
              <div
                id="config-panel"
                className="px-6 py-4 bg-cyber-black/30 border-b border-ember-orange/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-slide-down"
                role="form"
                aria-label="Swap configuration settings"
              >
                <div className="col-span-full">
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={autoActive}
                      onChange={e => setAutoActive(e.target.checked)}
                      className="w-4 h-4 accent-ember-orange cursor-pointer focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-black"
                      aria-describedby="auto-swap-desc"
                    />
                    <span className="font-semibold group-hover:text-ember-orange-light transition-colors">
                      Enable Auto-Swaps
                    </span>
                  </label>
                  <p id="auto-swap-desc" className="sr-only">
                    Enable automatic execution of multiple swaps in sequence
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="platform-fee" className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    Platform Fee (bps)
                  </label>
                  <input
                    id="platform-fee"
                    type="number"
                    min={0}
                    max={10000}
                    value={platformFeeBps}
                    onChange={e => setPlatformFeeBps(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-cyber-black/50 border border-ember-orange/30 rounded-lg text-sm font-mono text-white focus:border-ember-orange/60 focus:shadow-ember-orange-sm focus:outline-none focus:ring-2 focus:ring-ember-orange/40 transition-all"
                    aria-describedby="platform-fee-display"
                  />
                  <div id="platform-fee-display" className="text-xs text-ember-orange-light font-semibold">
                    {(platformFeeBps / 100).toFixed(2)}%
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="slippage" className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    Slippage (bps)
                  </label>
                  <input
                    id="slippage"
                    type="number"
                    min={0}
                    max={10000}
                    value={slippageBps}
                    onChange={e => setSlippageBps(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-cyber-black/50 border border-ember-orange/30 rounded-lg text-sm font-mono text-white focus:border-ember-orange/60 focus:shadow-ember-orange-sm focus:outline-none focus:ring-2 focus:ring-ember-orange/40 transition-all"
                    aria-describedby="slippage-display"
                  />
                  <div id="slippage-display" className="text-xs text-ember-orange-light font-semibold">
                    {(slippageBps / 100).toFixed(2)}%
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="swap-delay" className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    Swap Delay (ms)
                  </label>
                  <input
                    id="swap-delay"
                    type="number"
                    min={0}
                    value={autoDelayMs}
                    onChange={e => setAutoDelayMs(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-cyber-black/50 border border-ember-orange/30 rounded-lg text-sm font-mono text-white focus:border-ember-orange/60 focus:shadow-ember-orange-sm focus:outline-none focus:ring-2 focus:ring-ember-orange/40 transition-all"
                    aria-describedby="delay-display"
                  />
                  <div id="delay-display" className="text-xs text-ember-orange-light font-semibold">
                    {(autoDelayMs / 1000).toFixed(1)}s
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="auto-count" className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    Auto Count
                  </label>
                  <input
                    id="auto-count"
                    type="number"
                    min={1}
                    value={autoCount}
                    onChange={e => setAutoCount(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-cyber-black/50 border border-ember-orange/30 rounded-lg text-sm font-mono text-white focus:border-ember-orange/60 focus:shadow-ember-orange-sm focus:outline-none focus:ring-2 focus:ring-ember-orange/40 transition-all"
                    aria-label="Number of automatic swaps"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="max-amount" className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    Max Amount
                  </label>
                  <input
                    id="max-amount"
                    type="text"
                    value={maxAmount}
                    onChange={e => setMaxAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-cyber-black/50 border border-ember-orange/30 rounded-lg text-sm font-mono text-white focus:border-ember-orange/60 focus:shadow-ember-orange-sm focus:outline-none focus:ring-2 focus:ring-ember-orange/40 transition-all"
                    placeholder="0.0"
                    aria-label="Maximum swap amount for micro mode"
                  />
                </div>
              </div>
            )}

            {/* Swap Container */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center mb-6">
                {/* FROM Token */}
                <div className="space-y-3 p-4 bg-ember-orange/5 border border-ember-orange/30 rounded-xl hover:border-ember-orange/50 hover:shadow-ember-orange-sm transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <label htmlFor="from-token" className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                      From
                    </label>
                    <span className="px-2 py-1 bg-ember-orange/20 border border-ember-orange/40 rounded text-xs font-bold text-ember-orange-light shadow-ember-orange-sm">
                      {TOKEN_NAMES[fromMint]}
                    </span>
                  </div>
                  <select
                    id="from-token"
                    className="w-full px-3 py-2 bg-cyber-black/50 border border-ember-orange/30 rounded-lg text-sm font-mono text-white focus:border-ember-orange/60 focus:shadow-ember-orange-sm focus:outline-none focus:ring-2 focus:ring-ember-orange/40 transition-all cursor-pointer hover:border-ember-orange/50"
                    value={fromMint}
                    onChange={(e) => setFromMint(e.target.value)}
                    aria-label="Select token to swap from"
                  >
                    {TOKEN_OPTIONS.map(m => (
                      <option key={m} value={m}>
                        {TOKEN_NAMES[m]} - {m.slice(0, 8)}...
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <input
                      id="from-amount"
                      type="text"
                      className="w-full px-3 py-3 bg-cyber-black/50 border border-ember-orange/30 rounded-lg text-xl font-mono font-bold text-right text-white focus:border-ember-orange/60 focus:shadow-ember-orange-sm focus:outline-none focus:ring-2 focus:ring-ember-orange/40 transition-all placeholder-gray-600"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      aria-label="Amount to swap"
                    />
                    {wallet && tokenBalance > 0 && (
                      <button
                        onClick={() => setAmount(tokenBalance.toString())}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-ember-orange/20 border border-ember-orange/40 rounded text-xs font-semibold text-ember-orange hover:bg-ember-orange/30 hover:scale-105 active:scale-95 transition-all"
                        aria-label="Set to maximum balance"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                </div>

                {/* Swap Icon */}
                <div className="flex items-center justify-center my-4 md:my-0">
                  <button
                    onClick={() => {
                      const a = fromMint;
                      setFromMint(toMint);
                      setToMint(a);
                      log('Switched route FROM<->TO');
                    }}
                    className="group p-4 bg-gradient-to-br from-ember-orange/20 to-ember-amber/20 border-2 border-ember-orange/40 rounded-full hover:border-ember-amber/60 hover:shadow-ember-orange hover:rotate-180 hover:scale-110 active:scale-95 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-darker"
                    aria-label="Switch token direction"
                  >
                    <svg className="w-6 h-6 text-ember-orange-light group-hover:text-ember-amber transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                </div>

                {/* TO Token */}
                <div className="space-y-3 p-4 bg-ember-amber/5 border border-ember-amber/30 rounded-xl hover:border-ember-amber/50 hover:shadow-ember-amber-sm transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <label htmlFor="to-token" className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                      To
                    </label>
                    <span className="px-2 py-1 bg-ember-amber/20 border border-ember-amber/40 rounded text-xs font-bold text-ember-amber-light shadow-ember-amber-sm">
                      {TOKEN_NAMES[toMint]}
                    </span>
                  </div>
                  <select
                    id="to-token"
                    className="w-full px-3 py-2 bg-cyber-black/50 border border-ember-amber/30 rounded-lg text-sm font-mono text-white focus:border-ember-amber/60 focus:shadow-ember-amber-sm focus:outline-none focus:ring-2 focus:ring-ember-amber/40 transition-all cursor-pointer hover:border-ember-amber/50"
                    value={toMint}
                    onChange={(e) => setToMint(e.target.value)}
                    aria-label="Select token to swap to"
                  >
                    {TOKEN_OPTIONS.map(m => (
                      <option key={m} value={m}>
                        {TOKEN_NAMES[m]} - {m.slice(0, 8)}...
                      </option>
                    ))}
                  </select>
                  <div className="px-3 py-3 bg-cyber-black/50 border-2 border-dashed border-ember-amber/30 rounded-lg text-center text-sm text-gray-500 flex items-center justify-center gap-2 group-hover:border-ember-amber/50 transition-all">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>Estimated output</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-ember-orange/20">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-cyber-black/50 border border-ember-orange/40 rounded-lg text-xs font-semibold text-ember-orange-light uppercase shadow-ember-orange-sm">
                    {mode}
                  </span>
                  {autoActive && (
                    <span className="px-3 py-1.5 bg-ember-amber/20 border border-ember-amber/40 rounded-lg text-xs font-semibold text-ember-amber uppercase shadow-ember-amber-sm animate-pulse">
                      Auto-Enabled
                    </span>
                  )}
                  {running && (
                    <span className="px-3 py-1.5 bg-green-500/20 border border-green-500/40 rounded-lg text-xs font-semibold text-green-400 uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Running
                    </span>
                  )}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={onPrimarySwap}
                    disabled={running || !wallet}
                    className={cn(
                      "flex-1 sm:flex-initial px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300",
                      "bg-gradient-to-r from-ember-orange via-ember-amber to-ember-gold text-white",
                      "hover:shadow-ember-orange hover:scale-105 active:scale-95",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
                      "focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-darker",
                      "flex items-center justify-center gap-2"
                    )}
                    aria-label={mode === 'normal' && !autoActive ? "Execute swap" : "Start automatic swap"}
                  >
                    {running ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden="true">{mode === 'normal' && !autoActive ? '⚡' : '🚀'}</span>
                        <span>{mode === 'normal' && !autoActive ? 'Execute Swap' : 'Start Auto Swap'}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={stopAuto}
                    disabled={!running}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 rounded-lg font-bold text-sm text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-cyber-darker flex items-center gap-2"
                    aria-label="Stop automatic swap"
                  >
                    <span aria-hidden="true">🛑</span>
                    <span>Stop</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* The Void Tab Content */}
      {activeTab === "void" && (
        <section
          id="void-panel"
          role="tabpanel"
          aria-labelledby="void-tab"
          className="bg-cyber-darker/60 backdrop-blur-md border border-ember-gold/30 rounded-xl shadow-ember-gold-md overflow-hidden transition-all duration-300 hover:border-ember-gold/50 animate-fade-in"
        >
          <div className="px-6 py-4 border-b border-ember-gold/20 bg-gradient-to-br from-ember-gold/10 to-ember-orange/5">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-ember-gold via-ember-amber to-ember-orange bg-clip-text text-transparent text-center">
              🌌 THE VOID 🌌
            </h2>
            <p className="text-center text-sm text-gray-400 mt-2">
              Wetware Protocol • Fixed SOL Operations
            </p>
          </div>

          <div className="p-8 space-y-6">
            {/* Wetware Protocol Operations */}
            <div className="space-y-4">
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-lg font-bold text-ember-orange-light uppercase tracking-wider">
                  Select Operation
                </h3>
                <p className="text-xs text-gray-500">
                  Send fixed amounts of SOL to {short(WETWARE_ADDRESS, 6)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Condensation */}
                <button
                  onClick={() => sendWetwareOperation('condensation')}
                  disabled={!wallet || solBalance < 0.001}
                  className={cn(
                    "group relative flex flex-col items-center justify-center p-8 rounded-xl text-sm font-semibold transition-all duration-300 border-2",
                    "bg-gradient-to-br from-ember-orange/20 to-ember-amber/10 border-ember-orange/40",
                    "hover:border-ember-orange hover:shadow-ember-orange hover:scale-105 hover:-translate-y-1",
                    "active:scale-95 focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-offset-2 focus:ring-offset-cyber-black",
                    "disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 disabled:translate-y-0"
                  )}
                  aria-label="Send 0.001 SOL for Condensation operation"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">💧</div>
                  <div className="text-xl font-bold text-ember-orange-light mb-2">Condensation</div>
                  <div className="text-2xl font-mono font-bold text-white mb-1">0.001 SOL</div>
                  <div className="text-xs text-gray-400">Entry-level operation</div>
                </button>

                {/* Lubrication */}
                <button
                  onClick={() => sendWetwareOperation('lubrication')}
                  disabled={!wallet || solBalance < 0.01}
                  className={cn(
                    "group relative flex flex-col items-center justify-center p-8 rounded-xl text-sm font-semibold transition-all duration-300 border-2",
                    "bg-gradient-to-br from-ember-amber/20 to-ember-orange/10 border-ember-amber/40",
                    "hover:border-ember-amber hover:shadow-ember-amber hover:scale-105 hover:-translate-y-1",
                    "active:scale-95 focus:outline-none focus:ring-2 focus:ring-ember-amber focus:ring-offset-2 focus:ring-offset-cyber-black",
                    "disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 disabled:translate-y-0"
                  )}
                  aria-label="Send 0.01 SOL for Lubrication operation"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 group-hover:rotate-180 transition-all duration-300">⚙️</div>
                  <div className="text-xl font-bold text-ember-amber-light mb-2">Lubrication</div>
                  <div className="text-2xl font-mono font-bold text-white mb-1">0.01 SOL</div>
                  <div className="text-xs text-gray-400">Standard operation</div>
                </button>

                {/* Ionization */}
                <button
                  onClick={() => sendWetwareOperation('ionization')}
                  disabled={!wallet || solBalance < 0.1}
                  className={cn(
                    "group relative flex flex-col items-center justify-center p-8 rounded-xl text-sm font-semibold transition-all duration-300 border-2",
                    "bg-gradient-to-br from-ember-gold/20 to-ember-orange/10 border-ember-gold/40",
                    "hover:border-ember-gold hover:shadow-ember-gold hover:scale-105 hover:-translate-y-1",
                    "active:scale-95 focus:outline-none focus:ring-2 focus:ring-ember-gold focus:ring-offset-2 focus:ring-offset-cyber-black",
                    "disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 disabled:translate-y-0"
                  )}
                  aria-label="Send 0.1 SOL for Ionization operation"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 group-hover:animate-pulse transition-all duration-300">⚡</div>
                  <div className="text-xl font-bold text-ember-gold mb-2">Ionization</div>
                  <div className="text-2xl font-mono font-bold text-white mb-1">0.1 SOL</div>
                  <div className="text-xs text-gray-400">Advanced operation</div>
                </button>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-cyber-black/50 border border-ember-orange/30 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl">ℹ️</div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-bold text-ember-orange-light">About Wetware Protocol</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    The Wetware Protocol uses fixed SOL amounts to trigger different operations. All transactions are sent directly to the protocol address <span className="font-mono text-ember-amber-light">{short(WETWARE_ADDRESS, 8)}</span>.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    <div className="bg-ember-orange/10 border border-ember-orange/30 rounded px-3 py-2">
                      <div className="text-xs text-gray-500 mb-1">Required Balance</div>
                      <div className="font-mono font-bold text-ember-orange-light">{solBalance.toFixed(4)} SOL</div>
                    </div>
                    <div className="bg-ember-amber/10 border border-ember-amber/30 rounded px-3 py-2">
                      <div className="text-xs text-gray-500 mb-1">Last Operation</div>
                      <div className="font-mono font-bold text-ember-amber-light">{lastWetwareOp || "None"}</div>
                    </div>
                    <div className="bg-ember-gold/10 border border-ember-gold/30 rounded px-3 py-2">
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <div className="font-mono font-bold text-ember-gold">{wallet ? "Ready" : "Connect Wallet"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Activity Monitor Card */}
      <section
        className="bg-cyber-darker/60 backdrop-blur-md border border-ember-gold/30 rounded-xl shadow-ember-gold overflow-hidden transition-all duration-300 hover:border-ember-gold/50"
        role="region"
        aria-label="Activity monitor"
        aria-live="polite"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-ember-gold/20 bg-ember-glow">
          <h2 className="text-xl font-bold bg-gradient-to-r from-ember-gold via-ember-amber to-ember-orange bg-clip-text text-transparent">
            ACTIVITY MONITOR
          </h2>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                running ? "bg-ember-orange-light animate-led-pulse shadow-ember-orange-sm" : "bg-gray-500"
              )}></div>
              <span className="font-mono" aria-label={`${activity.length} activity events`}>
                {activity.length} events
              </span>
            </div>
            <button
              onClick={clearLog}
              disabled={activity.length === 0}
              className="px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-cyber-black"
              aria-label="Clear activity log"
            >
              <span aria-hidden="true">🗑️</span> Clear
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 bg-cyber-black/30">
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-lg font-semibold text-gray-400 mb-1">No activity yet</div>
              <div className="text-sm text-gray-500">Swap transactions will appear here</div>
            </div>
          ) : (
            <div className="space-y-2">
              {activity.map((line, i) => {
                const isError = /error|failed/i.test(line);
                const isWetware = /wetware:/i.test(line);
                const isSuccess = /confirmed|success/i.test(line);
                const isSent = /sent/i.test(line);
                const m = line.match(/(https:\/\/solscan\.io\/tx\/[^\s]+)/i);

                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 rounded-lg border transition-all duration-300 hover:scale-[1.01]",
                      isError && "bg-red-500/10 border-red-500/30 hover:border-red-500/50",
                      isWetware && isSuccess && "bg-ember-gold/10 border-ember-gold/30 hover:border-ember-gold/50 shadow-ember-gold-sm",
                      isWetware && !isSuccess && "bg-ember-amber/10 border-ember-amber/30 hover:border-ember-amber/50",
                      !isWetware && isSuccess && "bg-ember-orange/10 border-ember-orange/30 hover:border-ember-orange/50",
                      !isWetware && isSent && !isSuccess && "bg-ember-amber/10 border-ember-amber/30 hover:border-ember-amber/50",
                      !isError && !isSuccess && !isSent && !isWetware && "bg-cyber-black/50 border-gray-700 hover:border-gray-600"
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-all duration-300",
                        isError && "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]",
                        isWetware && isSuccess && "bg-ember-gold shadow-ember-gold-sm animate-pulse",
                        isWetware && !isSuccess && "bg-ember-amber shadow-ember-amber-sm",
                        !isWetware && isSuccess && "bg-ember-orange-light shadow-ember-orange-sm animate-pulse",
                        !isWetware && isSent && !isSuccess && "bg-ember-amber shadow-ember-amber-sm",
                        !isError && !isSuccess && !isSent && !isWetware && "bg-gray-500"
                      )}
                    ></div>
                    <div className="flex-1 font-mono text-xs text-gray-300 leading-relaxed break-all">
                      {!m ? line : (
                        <>
                          {line.split(m[1])[0]}
                          <a
                            href={m[1]}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              "underline font-semibold transition-all",
                              isWetware ? "text-ember-gold hover:text-ember-amber" : "text-ember-orange-light hover:text-ember-gold"
                            )}
                          >
                            View on Solscan
                          </a>
                          {line.split(m[1])[1]}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {activity.length > 0 && (
          <div className="px-6 py-3 border-t border-ember-gold/20 bg-cyber-black/30">
            <div className="font-mono text-xs text-gray-500 text-center flex items-center justify-center gap-2">
              <span className="text-ember-orange-light">Referral Program ID:</span>
              <span className="text-gray-400">{REFERRAL_PROGRAM_ID.slice(0, 8)}...{REFERRAL_PROGRAM_ID.slice(-8)}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
