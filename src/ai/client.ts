import Anthropic from "@anthropic-ai/sdk";
import type { ZodType } from "zod";

export const MODEL = "claude-sonnet-5";

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  return new Anthropic({ apiKey });
}

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

async function callOnce<T>(
  client: Anthropic,
  opts: { system: string; user: string; schema: ZodType<T>; maxTokens: number },
): Promise<T> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const block = res.content.find((b) => b.type === "text");
  const text = block && block.type === "text" ? block.text : "";
  const parsed = JSON.parse(stripFences(text));
  return opts.schema.parse(parsed);
}

export async function completeJson<T>(opts: {
  system: string;
  user: string;
  schema: ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const client = getAnthropic();
  const args = { ...opts, maxTokens: opts.maxTokens ?? 2048 };
  try {
    return await callOnce(client, args);
  } catch {
    try {
      return await callOnce(client, args);
    } catch {
      throw new Error("The AI returned an unexpected response. Please try again.");
    }
  }
}
