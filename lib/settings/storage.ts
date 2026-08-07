/** Pure localStorage codec for app settings — safe against corrupt data. */
import { z } from "zod";

export const SETTINGS_STORAGE_KEY = "pond0matic:settings";

/** Lowest platform-fee bps Jupiter v1 accepts (from the vault-fee spike). */
export const JUPITER_MIN_FEE_BPS = 5;

const SettingsSchema = z.object({
  rpc: z.string(),
  jupiterApiKey: z.string(),
  rpcVerified: z.boolean(),
  apiKeyVerified: z.boolean(),
  theme: z.enum(["dark", "light", "system"]),
  slippageBps: z.number().int().min(0).max(500),
  platformFeeBps: z.number().int().min(0).max(10000),
  affiliate: z.enum(["pond0x", "aquavaults"]),
  // User-entered current rig boost (read from pond0x.com/mining); 0 = not set.
  // .default(0) so settings saved before this field existed still parse.
  rigBoost: z.number().min(0).max(10000).default(0),
});
export type StoredSettings = z.infer<typeof SettingsSchema>;
export type ThemeSetting = StoredSettings["theme"];

export const DEFAULT_SETTINGS: StoredSettings = {
  rpc: "",
  jupiterApiKey: "",
  rpcVerified: false,
  apiKeyVerified: false,
  theme: "system",
  slippageBps: Number(process.env.NEXT_PUBLIC_DEFAULT_SLIPPAGE_BPS) || 50,
  platformFeeBps: Number(process.env.NEXT_PUBLIC_DEFAULT_PLATFORM_FEE_BPS) || 100,
  affiliate: "pond0x",
  rigBoost: 0,
};

export function parseStoredSettings(raw: string | null): StoredSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const result = SettingsSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function serializeSettings(s: StoredSettings): string {
  return JSON.stringify(s);
}
