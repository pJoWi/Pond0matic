/**
 * Referral link utilities
 *
 * Provides functions to extract and validate referral codes from URLs,
 * and to build Jupiter swap requests with both vault and referral support.
 */

import { PublicKey } from "@solana/web3.js";

/**
 * Result of referral code extraction
 */
export interface ReferralExtraction {
  /** Whether a referral code was found */
  hasReferral: boolean;

  /** The extracted referral address (if valid) */
  referralAddress?: string;

  /** Error message if extraction failed */
  error?: string;
}

/**
 * Extract referral code from a Jupiter referral link
 *
 * Supports various Jupiter URL formats:
 * - https://jup.ag/swap/SOL-USDC?referral=ADDRESS
 * - https://jup.ag/?referral=ADDRESS
 * - Direct address input
 *
 * @param referralLink - The referral link or address
 * @returns ReferralExtraction with referral info or error
 *
 * @example
 * ```typescript
 * const result = extractReferralCode("https://jup.ag/?referral=ABC123...");
 * if (result.hasReferral) {
 *   console.log(`Referral address: ${result.referralAddress}`);
 * }
 * ```
 */
export function extractReferralCode(referralLink: string): ReferralExtraction {
  if (!referralLink || referralLink.trim() === "") {
    return {
      hasReferral: false,
      error: "No referral link provided",
    };
  }

  const trimmed = referralLink.trim();

  try {
    // Try parsing as URL first
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);

      // Check for referral parameter
      const referralParam = url.searchParams.get("referral");

      if (referralParam) {
        // Validate the referral address
        if (isValidSolanaAddress(referralParam)) {
          return {
            hasReferral: true,
            referralAddress: referralParam,
          };
        } else {
          return {
            hasReferral: false,
            error: "Invalid Solana address in referral parameter",
          };
        }
      }

      return {
        hasReferral: false,
        error: "No referral parameter found in URL",
      };
    }

    // If not a URL, treat as direct address
    if (isValidSolanaAddress(trimmed)) {
      return {
        hasReferral: true,
        referralAddress: trimmed,
      };
    }

    return {
      hasReferral: false,
      error: "Invalid Solana address format",
    };
  } catch (error: any) {
    return {
      hasReferral: false,
      error: error?.message || "Failed to parse referral link",
    };
  }
}

/**
 * Validate if a string is a valid Solana address
 *
 * @param address - The address string to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```typescript
 * if (isValidSolanaAddress("ABC123...")) {
 *   console.log("Valid Solana address");
 * }
 * ```
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    // Basic length check (Solana addresses are typically 32-44 characters)
    if (address.length < 32 || address.length > 44) {
      return false;
    }

    // Try to create a PublicKey - will throw if invalid
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parameters for building a Jupiter swap request
 */
export interface JupiterSwapRequestParams {
  /** The quote response from Jupiter */
  quoteResponse: any;

  /** The user's public key as a string */
  userPublicKey: string;

  /** Optional vault address for platform fees */
  vaultAddress?: string;

  /** Optional referral address */
  referralAddress?: string;

  /** Whether to wrap/unwrap SOL automatically (default: true) */
  wrapAndUnwrapSol?: boolean;

  /** Whether to use dynamic compute unit limit (default: true) */
  dynamicComputeUnitLimit?: boolean;

  /** Prioritization fee in lamports (default: "auto") */
  prioritizationFeeLamports?: number | "auto";
}

/**
 * Build a Jupiter swap request body with vault and referral support
 *
 * This function handles the priority of fee accounts:
 * 1. If both vault and referral are provided, uses referral (user choice takes precedence)
 * 2. If only vault is provided, uses vault
 * 3. If only referral is provided, uses referral
 * 4. If neither is provided, no fee account is set
 *
 * @param params - Parameters for building the swap request
 * @returns The request body object for Jupiter swap API
 *
 * @example
 * ```typescript
 * const requestBody = buildJupiterSwapRequest({
 *   quoteResponse: quote,
 *   userPublicKey: wallet.publicKey.toBase58(),
 *   vaultAddress: "VaultAddress...",
 *   referralAddress: "ReferralAddress...",
 * });
 *
 * const response = await fetch("https://lite-api.jup.ag/swap/v1/swap", {
 *   method: "POST",
 *   headers: { "content-type": "application/json" },
 *   body: JSON.stringify(requestBody),
 * });
 * ```
 */
export function buildJupiterSwapRequest(params: JupiterSwapRequestParams): any {
  const {
    quoteResponse,
    userPublicKey,
    vaultAddress,
    referralAddress,
    wrapAndUnwrapSol = true,
    dynamicComputeUnitLimit = true,
    prioritizationFeeLamports = "auto",
  } = params;

  // Build base request body
  const body: any = {
    quoteResponse,
    userPublicKey,
    wrapAndUnwrapSol,
    dynamicComputeUnitLimit,
    prioritizationFeeLamports,
  };

  // Determine which fee account to use
  // Priority: referral > vault > none
  if (referralAddress) {
    body.feeAccount = referralAddress;
  } else if (vaultAddress) {
    body.feeAccount = vaultAddress;
  }

  return body;
}

/**
 * Format a referral link for display
 *
 * @param referralLink - The referral link or address
 * @returns Formatted string for display
 *
 * @example
 * ```typescript
 * const display = formatReferralForDisplay("https://jup.ag/?referral=ABC123...");
 * console.log(display); // "ABC...123"
 * ```
 */
export function formatReferralForDisplay(referralLink: string): string {
  const extraction = extractReferralCode(referralLink);

  if (extraction.hasReferral && extraction.referralAddress) {
    const addr = extraction.referralAddress;
    // Show first 3 and last 3 characters
    return `${addr.slice(0, 3)}...${addr.slice(-3)}`;
  }

  return "None";
}

/**
 * Get a descriptive message about the active fee routing
 *
 * @param vaultAddress - Optional vault address
 * @param referralAddress - Optional referral address
 * @returns Human-readable description of fee routing
 *
 * @example
 * ```typescript
 * const message = getFeeRoutingDescription(vaultAddress, referralAddress);
 * console.log(message); // "Fees routed to referral: ABC...123"
 * ```
 */
export function getFeeRoutingDescription(
  vaultAddress?: string,
  referralAddress?: string
): string {
  if (referralAddress) {
    return `Fees routed to referral: ${referralAddress.slice(0, 4)}...${referralAddress.slice(-4)}`;
  }

  if (vaultAddress) {
    return `Fees routed to vault: ${vaultAddress.slice(0, 4)}...${vaultAddress.slice(-4)}`;
  }

  return "No fee routing configured";
}
