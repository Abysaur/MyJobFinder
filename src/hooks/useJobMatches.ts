"use client";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { rankJobs, type RankedJob } from "@/lib/rank";
import { setLastResults } from "@/lib/jobStore";
import type { Resume } from "@/types";
import type { ProviderStatus } from "@/services/jobs/provider";

type Input = { resume: Resume; query: string; remote: boolean };
type Output = { jobs: RankedJob[]; sources: ProviderStatus[] };

export function useJobMatches() {
  return useMutation<Output, Error, Input>({
    mutationFn: async ({ resume, query, remote }) => {
      const { jobs, sources } = await api.searchJobs(query, remote);
      const matches = await api.matchJobs(resume, jobs);
      const ranked = rankJobs(jobs, matches);
      setLastResults(ranked);
      return { jobs: ranked, sources };
    },
  });
}
