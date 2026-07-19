import { z } from "zod";

// ---------- Files written by the Python clicker (snake_case on disk) ----------

export const ClickerStatusSchema = z.object({
  state: z.enum(["armed", "paused", "stopped"]),
  reason: z.string(),
  clicks_used: z.number().int().min(0),
  click_budget: z.number().int().min(1),
  session_deadline: z.number(), // unix seconds
  last_scan_ts: z.number(),     // unix seconds
  pid: z.number().int(),
  dry_run: z.boolean(),
});
export type ClickerStatus = z.infer<typeof ClickerStatusSchema>;

export const ClickerEventSchema = z.object({
  ts: z.number(), // unix seconds
  kind: z.enum(["start", "click", "pause", "resume", "auto_stop"]),
  template: z.string().optional(),
  action: z.enum(["confirm", "cancel"]).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  reason: z.string().optional(),
});
export type ClickerEvent = z.infer<typeof ClickerEventSchema>;

// ---------- API request bodies ----------

export const StartRequestSchema = z.object({
  scanIntervalS: z.number().int().min(1).max(30),
  sessionMinutes: z.number().int().min(5).max(240),
  clickBudget: z.number().int().min(1).max(500),
  dryRun: z.boolean().default(false),
});
export type StartRequest = z.infer<typeof StartRequestSchema>;

export const ControlRequestSchema = z.object({
  paused: z.boolean(),
});
export type ControlRequest = z.infer<typeof ControlRequestSchema>;

// ---------- API responses ----------

export interface ClickerStatusResponse {
  status: ClickerStatus | null;
  processAlive: boolean;
  events: ClickerEvent[];
}
