import type { Resume, Job, MatchResult } from "@/types";

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({ error: "Unexpected server response." }));
  if (!res.ok) throw new Error(json.error ?? "Request failed.");
  return json.data as T;
}

export const api = {
  async uploadResume(file: File): Promise<Resume> {
    const form = new FormData();
    form.append("file", file);
    return unwrap<Resume>(await fetch("/api/resume", { method: "POST", body: form }));
  },
  async searchJobs(query: string, remote: boolean): Promise<Job[]> {
    return unwrap<Job[]>(
      await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, remote }),
      }),
    );
  },
  async matchJobs(resume: Resume, jobs: Job[]): Promise<MatchResult[]> {
    return unwrap<MatchResult[]>(
      await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume, jobs }),
      }),
    );
  },
};
