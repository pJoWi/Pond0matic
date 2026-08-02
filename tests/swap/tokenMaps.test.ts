import { describe, it, expect } from "vitest";
import { TOKEN_NAMES, TOKEN_VAULTS_AFFILIATE_1, TOKEN_VAULTS_AFFILIATE_2 } from "@/lib/vaults";
import { TOKEN_DECIMALS } from "@/lib/solana";

describe("token map consistency", () => {
  it("every UI-selectable token has static decimals (no network fallback on the money path)", () => {
    for (const mint of Object.keys(TOKEN_NAMES)) {
      expect(TOKEN_DECIMALS[mint], `missing decimals for ${TOKEN_NAMES[mint]} (${mint})`).toBeDefined();
    }
  });
  it("vault map keys are known mints", () => {
    for (const mint of [...Object.keys(TOKEN_VAULTS_AFFILIATE_1), ...Object.keys(TOKEN_VAULTS_AFFILIATE_2)]) {
      expect(TOKEN_NAMES[mint], `vault key ${mint} not in TOKEN_NAMES`).toBeDefined();
    }
  });
});
