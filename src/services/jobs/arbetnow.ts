import { arbetnowResponseSchema } from "@/lib/schemas";
import type { z } from "zod";

export type RawJob = z.infer<typeof arbetnowResponseSchema>["data"][number];

const ENDPOINT = "https://www.arbeitnow.com/api/job-board-api";

export async function searchArbetnow(
  query: string,
  opts: { remote?: boolean } = {},
): Promise<RawJob[]> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, { headers: { accept: "application/json" } });
  } catch {
    throw new Error("Could not reach the job service.");
  }
  if (!res.ok) throw new Error("Could not reach the job service.");
  const json = await res.json();
  const { data } = arbetnowResponseSchema.parse(json);

  const q = query.trim().toLowerCase();
  return data.filter((job) => {
    if (opts.remote && !job.remote) return false;
    if (!q) return true;
    const haystack = `${job.title} ${job.description} ${job.tags.join(" ")}`.toLowerCase();
    return haystack.includes(q);
  });
}
