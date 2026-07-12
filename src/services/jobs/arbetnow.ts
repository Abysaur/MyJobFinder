import { arbetnowResponseSchema } from "@/lib/schemas";
import type { z } from "zod";
import type { Job } from "@/types";
import type { JobProvider, JobQuery } from "@/services/jobs/provider";
import { normalizeJobs } from "@/services/jobs/normalize";

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

/**
 * Arbeitnow adapted to the common provider contract. The board returns the full
 * listing at once, so keyword/remote filtering and pagination are applied here.
 */
export const arbetnowProvider: JobProvider = {
  name: "arbeitnow",
  async search(q: JobQuery): Promise<Job[]> {
    const jobs = normalizeJobs(await searchArbetnow(q.query, { remote: q.remote }));
    const start = (Math.max(1, q.page) - 1) * q.pageSize;
    return jobs.slice(start, start + q.pageSize);
  },
};
