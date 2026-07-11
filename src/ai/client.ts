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

async function requestText(
  client: Anthropic,
  opts: { system: string; user: string; maxTokens: number },
): Promise<string> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

export async function completeJson<T>(opts: {
  system: string;
  user: string;
  schema: ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const client = getAnthropic();
  const args = { system: opts.system, user: opts.user, maxTokens: opts.maxTokens ?? 2048 };
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await requestText(client, args); // API/network errors propagate as-is
    try {
      return opts.schema.parse(JSON.parse(stripFences(text)));
    } catch {
      if (attempt === 1) {
        throw new Error("The AI returned an unexpected response. Please try again.");
      }
    }
  }
  // unreachable, satisfies the type checker
  throw new Error("The AI returned an unexpected response. Please try again.");
}
