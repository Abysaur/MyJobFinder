import type { RawJob } from "@/services/jobs/arbetnow";
import type { Job } from "@/types";

export function normalizeJobs(raw: RawJob[]): Job[] {
  const seen = new Set<string>();
  const jobs: Job[] = [];
  for (const r of raw) {
    if (seen.has(r.slug)) continue;
    seen.add(r.slug);
    jobs.push({
      id: r.slug,
      title: r.title,
      company: r.company_name,
      location: r.location,
      remote: r.remote,
      url: r.url,
      description: r.description,
      postedDate: new Date(r.created_at * 1000).toISOString(),
      tags: r.tags,
    });
  }
  return jobs;
}
