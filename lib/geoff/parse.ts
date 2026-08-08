/**
 * Pure parsers for Geoff chat responses. No network, no React — the whole
 * point is that the fragile part (someone else's JSON shape, a model's
 * free-form text) is testable in isolation.
 */
import { GeoffInsightSchema, type GeoffInsight } from "./types";

/**
 * Pull the assistant's text out of a Geoff chat response.
 *
 * Geoff wraps payloads in `{ data, trace_id, extra_info }` and is drop-in
 * compatible with both the OpenAI and Anthropic message shapes, so the text
 * can legitimately arrive in several places. Probe them in order rather than
 * betting on one — and throw a useful error instead of returning "" when the
 * body is something we have never seen.
 */
export function extractMessageText(payload: unknown): string {
  const roots = [
    (payload as { data?: unknown })?.data,
    payload,
  ].filter((r): r is Record<string, unknown> => isRecord(r));

  for (const root of roots) {
    const text =
      fromChoices(root) ??
      fromContent(root.content) ??
      fromContent(isRecord(root.message) ? root.message.content : undefined) ??
      asText(root.text) ??
      asText(root.output_text);
    if (text != null && text.trim() !== "") return text;
  }

  throw new Error(
    `Unrecognized Geoff chat response shape: ${truncate(JSON.stringify(payload) ?? "undefined", 300)}`
  );
}

/** OpenAI-compatible: { choices: [{ message: { content } }] }. */
function fromChoices(root: Record<string, unknown>): string | null {
  if (!Array.isArray(root.choices)) return null;
  const first = root.choices[0];
  if (!isRecord(first)) return null;
  const message = isRecord(first.message) ? first.message.content : undefined;
  return fromContent(message) ?? asText(first.text);
}

/**
 * Anthropic-compatible content: either a plain string or an array of blocks
 * `[{ type: "text", text }]`. Text blocks are concatenated; other block types
 * (tool use, images) are skipped.
 */
function fromContent(content: unknown): string | null {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;
  const parts = content
    .map((block) =>
      isRecord(block) && typeof block.text === "string" ? block.text : ""
    )
    .filter(Boolean);
  return parts.length > 0 ? parts.join("") : null;
}

function asText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

/**
 * Parse the model's reply into a validated insight.
 *
 * Models wrap JSON in prose or ```json fences even when told not to, so strip
 * fences and fall back to the outermost brace pair before parsing. Zod then
 * decides whether the result is usable — never cast.
 */
export function parseInsight(replyText: string): GeoffInsight {
  return GeoffInsightSchema.parse(JSON.parse(extractJsonObject(replyText)));
}

/** Isolate the JSON object in a model reply. Throws when there is none. */
export function extractJsonObject(replyText: string): string {
  const withoutFences = replyText
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  if (withoutFences.startsWith("{") && withoutFences.endsWith("}")) {
    return withoutFences;
  }
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error(
      `Geoff reply contained no JSON object: ${truncate(replyText.trim(), 200)}`
    );
  }
  return withoutFences.slice(start, end + 1);
}
