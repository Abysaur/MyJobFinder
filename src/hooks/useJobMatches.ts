"use client";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { rankJobs, type RankedJob } from "@/lib/rank";
import type { Resume } from "@/types";

type Input = { resume: Resume; query: string; remote: boolean };

export function useJobMatches() {
  return useMutation<RankedJob[], Error, Input>({
    mutationFn: async ({ resume, query, remote }) => {
      const jobs = await api.searchJobs(query, remote);
      const matches = await api.matchJobs(resume, jobs);
      return rankJobs(jobs, matches);
    },
  });
}
