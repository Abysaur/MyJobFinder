import type { RankedJob } from "@/lib/rank";

let lastResults: RankedJob[] = [];

export function setLastResults(jobs: RankedJob[]) { lastResults = jobs; }
export function getJobById(id: string): RankedJob | undefined {
  return lastResults.find((j) => j.id === id);
}
