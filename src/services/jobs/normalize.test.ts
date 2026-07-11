import { describe, it, expect } from "vitest";
import { normalizeJobs } from "@/services/jobs/normalize";
import type { RawJob } from "@/services/jobs/arbetnow";

const raw = (over: Partial<RawJob>): RawJob => ({
  slug: "a", company_name: "Acme", title: "Dev", description: "desc",
  remote: true, url: "http://x", tags: ["ts"], job_types: ["full_time"],
  location: "Berlin", created_at: 1_700_000_000, ...over,
});

describe("normalizeJobs", () => {
  it("maps raw fields to the common Job shape", () => {
    const [job] = normalizeJobs([raw({})]);
    expect(job).toMatchObject({
      id: "a", title: "Dev", company: "Acme", location: "Berlin",
      remote: true, url: "http://x", description: "desc", tags: ["ts"],
    });
    expect(job.postedDate).toBe(new Date(1_700_000_000 * 1000).toISOString());
  });

  it("dedupes by slug, keeping the first", () => {
    const jobs = normalizeJobs([raw({ title: "First" }), raw({ title: "Second" })]);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe("First");
  });
});
