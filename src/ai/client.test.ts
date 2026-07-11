import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const create = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create };
      constructor(_opts: { apiKey: string }) {}
    },
  };
});

import { completeJson } from "@/ai/client";

function textResult(text: string) {
  return { content: [{ type: "text", text }] };
}

beforeEach(() => {
  create.mockReset();
  process.env.ANTHROPIC_API_KEY = "test";
});

describe("completeJson", () => {
  it("strips code fences and parses valid JSON", async () => {
    create.mockResolvedValueOnce(textResult('```json\n{"a":1}\n```'));
    const result = await completeJson({
      system: "sys",
      user: "usr",
      schema: z.object({ a: z.number() }),
    });
    expect(result).toEqual({ a: 1 });
  });

  it("retries once after malformed JSON and then succeeds", async () => {
    create.mockResolvedValueOnce(textResult("not json"));
    create.mockResolvedValueOnce(textResult('{"a":2}'));
    const result = await completeJson({
      system: "sys",
      user: "usr",
      schema: z.object({ a: z.number() }),
    });
    expect(result).toEqual({ a: 2 });
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("throws a generic error after two malformed responses", async () => {
    create.mockResolvedValueOnce(textResult("not json"));
    create.mockResolvedValueOnce(textResult("still not json"));
    await expect(
      completeJson({ system: "sys", user: "usr", schema: z.object({ a: z.number() }) }),
    ).rejects.toThrow("The AI returned an unexpected response. Please try again.");
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("propagates API errors without masking them", async () => {
    create.mockRejectedValueOnce(new Error("401 unauthorized"));
    await expect(
      completeJson({ system: "sys", user: "usr", schema: z.object({ a: z.number() }) }),
    ).rejects.toThrow("401 unauthorized");
    expect(create).toHaveBeenCalledTimes(1);
  });
});
