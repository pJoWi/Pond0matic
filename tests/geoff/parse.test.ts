import { describe, expect, it } from "vitest";
import {
  extractJsonObject,
  extractMessageText,
  parseInsight,
} from "@/lib/geoff/parse";

const validInsight = {
  headline: "Rig is healthy but boost is stalling",
  status: "warning",
  findings: [{ label: "Boost", detail: "412 of 615 (67%)." }],
  nextAction: "Run one 18x3 boost session.",
  confidence: "medium",
};

describe("extractMessageText", () => {
  it("reads the OpenAI-compatible shape inside the data envelope", () => {
    const text = extractMessageText({
      data: { choices: [{ message: { content: "hello" } }] },
      trace_id: "t1",
    });
    expect(text).toBe("hello");
  });

  it("reads the OpenAI-compatible shape without an envelope", () => {
    expect(
      extractMessageText({ choices: [{ message: { content: "hello" } }] })
    ).toBe("hello");
  });

  it("joins Anthropic-style text blocks and skips non-text blocks", () => {
    const text = extractMessageText({
      data: {
        content: [
          { type: "text", text: "part one " },
          { type: "tool_use", id: "x" },
          { type: "text", text: "part two" },
        ],
      },
    });
    expect(text).toBe("part one part two");
  });

  it("falls back to data.text and data.message.content", () => {
    expect(extractMessageText({ data: { text: "plain" } })).toBe("plain");
    expect(
      extractMessageText({ data: { message: { content: "nested" } } })
    ).toBe("nested");
  });

  it("skips an empty envelope candidate and keeps probing", () => {
    expect(
      extractMessageText({ data: { text: "  " }, choices: [{ text: "outer" }] })
    ).toBe("outer");
  });

  it("throws on a shape it does not recognize", () => {
    expect(() => extractMessageText({ data: { unexpected: 1 } })).toThrow(
      /Unrecognized Geoff chat response shape/
    );
    expect(() => extractMessageText(null)).toThrow(/Unrecognized/);
  });
});

describe("extractJsonObject", () => {
  it("returns bare JSON untouched", () => {
    expect(extractJsonObject('{"a":1}')).toBe('{"a":1}');
  });

  it("strips ```json fences", () => {
    expect(extractJsonObject('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(extractJsonObject('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("recovers an object wrapped in prose", () => {
    expect(extractJsonObject('Sure! {"a":1} Hope that helps.')).toBe('{"a":1}');
  });

  it("throws when there is no object at all", () => {
    expect(() => extractJsonObject("I cannot help with that.")).toThrow(
      /no JSON object/
    );
  });
});

describe("parseInsight", () => {
  it("parses and validates a well-formed reply", () => {
    const insight = parseInsight(JSON.stringify(validInsight));
    expect(insight.status).toBe("warning");
    expect(insight.findings).toHaveLength(1);
  });

  it("parses a fenced reply", () => {
    expect(
      parseInsight("```json\n" + JSON.stringify(validInsight) + "\n```").headline
    ).toBe(validInsight.headline);
  });

  it("rejects an unknown status instead of passing it to the UI", () => {
    expect(() =>
      parseInsight(JSON.stringify({ ...validInsight, status: "amazing" }))
    ).toThrow();
  });

  it("rejects an empty findings list", () => {
    expect(() =>
      parseInsight(JSON.stringify({ ...validInsight, findings: [] }))
    ).toThrow();
  });

  it("rejects malformed JSON", () => {
    expect(() => parseInsight("{ not json ")).toThrow();
  });
});
