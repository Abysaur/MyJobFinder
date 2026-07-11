import type { Job, MatchResult } from "@/types";

export type RankedJob = Job & { match: MatchResult };

export function rankJobs(jobs: Job[], matches: MatchResult[]): RankedJob[] {
  const byId = new Map(matches.map((m) => [m.jobId, m]));
  const ranked: RankedJob[] = [];
  for (const job of jobs) {
    const match = byId.get(job.id);
    if (match) ranked.push({ ...job, match });
  }
  ranked.sort((a, b) => {
    if (b.match.score !== a.match.score) return b.match.score - a.match.score;
    return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
  });
  return ranked;
}
