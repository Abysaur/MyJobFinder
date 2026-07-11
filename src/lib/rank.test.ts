import { describe, it, expect } from "vitest";
import { rankJobs } from "@/lib/rank";
import type { Job, MatchResult } from "@/types";

const job = (id: string, postedDate: string): Job => ({
  id, title: "T", company: "C", location: "L", remote: false,
  url: "u", description: "d", postedDate, tags: [],
});
const match = (jobId: string, score: number): MatchResult =>
  ({ jobId, score, missingSkills: [], reason: "" });

describe("rankJobs", () => {
  it("sorts by score desc, then postedDate desc", () => {
    const jobs = [
      job("a", "2026-01-01T00:00:00.000Z"),
      job("b", "2026-02-01T00:00:00.000Z"),
      job("c", "2026-03-01T00:00:00.000Z"),
    ];
    const matches = [match("a", 90), match("b", 90), match("c", 50)];
    const ranked = rankJobs(jobs, matches);
    expect(ranked.map((j) => j.id)).toEqual(["b", "a", "c"]);
  });

  it("drops jobs without a match", () => {
    const ranked = rankJobs([job("a", "2026-01-01T00:00:00.000Z")], []);
    expect(ranked).toEqual([]);
  });
});
