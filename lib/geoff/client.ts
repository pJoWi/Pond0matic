/**
 * Server-only Geoff (geoff.ai) chat client.
 *
 * SERVER ONLY. This module reads GEOFF_API_KEY — a secret with no
 * NEXT_PUBLIC_ prefix — so it must never be imported from a "use client"
 * module. The browser talks to /api/geoff/* instead, which is the only place
 * the key is used.
 *
 * Uses the native chat endpoint (POST {baseUrl}/v1/text/chat) over plain
 * fetch: one endpoint, no extra dependency in a Next.js app. Response shapes
 * are handled by the pure parsers in ./parse.
 */
import { extractMessageText } from "./parse";
import type { GeoffChatMessage } from "./insights";

const DEFAULT_BASE_URL = "https://geoff.ai/api";
const DEFAULT_MODEL = "preview";
const DEFAULT_TIMEOUT_MS = 30_000;

export interface GeoffConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class GeoffNotConfiguredError extends Error {
  constructor() {
    super(
      "GEOFF_API_KEY is not set. Add it to .env.local (server-side only, no NEXT_PUBLIC_ prefix) to enable Geoff insights."
    );
    this.name = "GeoffNotConfiguredError";
  }
}

export class GeoffApiError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`Geoff API error ${status}: ${body}`);
    this.name = "GeoffApiError";
  }
}

/** Read + validate Geoff env. Throws GeoffNotConfiguredError when unset. */
export function loadGeoffConfig(): GeoffConfig {
  const apiKey = process.env.GEOFF_API_KEY?.trim();
  if (!apiKey) throw new GeoffNotConfiguredError();
  return {
    apiKey,
    baseUrl: (process.env.GEOFF_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, ""),
    model: process.env.GEOFF_MODEL?.trim() || DEFAULT_MODEL,
  };
}

/** True when a key is configured — lets routes answer "unavailable" cheaply. */
export function isGeoffConfigured(): boolean {
  return Boolean(process.env.GEOFF_API_KEY?.trim());
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * Send a chat completion and return the assistant's text.
 * Throws GeoffApiError on a non-2xx response (including 429 rate limits —
 * the caller decides whether to surface or retry).
 */
export async function geoffChat(
  messages: GeoffChatMessage[],
  options: ChatOptions = {}
): Promise<{ text: string; model: string }> {
  const config = loadGeoffConfig();
  const model = options.model || config.model;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${config.baseUrl}/v1/text/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: false,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new GeoffApiError(
        response.status,
        (await response.text().catch(() => "")).slice(0, 500)
      );
    }

    return { text: extractMessageText(await response.json()), model };
  } finally {
    clearTimeout(timeout);
  }
}
