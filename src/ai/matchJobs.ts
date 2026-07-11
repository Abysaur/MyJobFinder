import { completeJson } from "@/ai/client";
import { matchResultsSchema } from "@/lib/schemas";
import type { Resume, Job, MatchResult } from "@/types";

const SYSTEM = `You compare a candidate resume against job listings.
For EACH job, output an object: { "jobId": string, "score": integer 0-100,
"missingSkills": string[], "reason": string (one sentence) }.
Respond with ONLY a JSON array of these objects, one per job, using the given jobId values.`;

const MAX_MATCH_JOBS = 25;

export async function matchJobs(resume: Resume, jobs: Job[]): Promise<MatchResult[]> {
  if (jobs.length === 0) return [];
  const capped = jobs.slice(0, MAX_MATCH_JOBS);
  const compactJobs = capped.map((j) => ({
    jobId: j.id, title: j.title, company: j.company, tags: j.tags,
    description: j.description.slice(0, 600),
  }));
  const user = `Candidate:\n${JSON.stringify({
    skills: resume.skills, jobTitles: resume.jobTitles, yearsExperience: resume.yearsExperience,
  })}\n\nJobs:\n${JSON.stringify(compactJobs)}`;

  return completeJson({ system: SYSTEM, user, schema: matchResultsSchema, maxTokens: 4096 });
}
