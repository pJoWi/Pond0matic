/** Pure localStorage codec for app settings — safe against corrupt data. */
import { z } from "zod";

export const SETTINGS_STORAGE_KEY = "pond0matic:settings";

const SettingsSchema = z.object({
  rpc: z.string(),
  jupiterApiKey: z.string(),
  rpcVerified: z.boolean(),
  apiKeyVerified: z.boolean(),
  theme: z.enum(["dark", "light", "system"]),
  slippageBps: z.number().int().min(0).max(10000),
  platformFeeBps: z.number().int().min(0).max(10000),
  affiliate: z.enum(["pond0x", "aquavaults"]),
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
