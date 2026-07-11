import { describe, it, expect, vi, beforeEach } from "vitest";

const completeJson = vi.fn();
vi.mock("@/ai/client", () => ({ completeJson: (...a: unknown[]) => completeJson(...a) }));

import { matchJobs } from "@/ai/matchJobs";
import type { Resume, Job } from "@/types";

const resume: Resume = {
  skills: ["ts"], jobTitles: ["dev"], yearsExperience: 2,
  education: [], location: null, contact: {},
};
const job: Job = {
  id: "j1", title: "Dev", company: "Acme", location: "Berlin", remote: true,
  url: "http://x", description: "TypeScript role", postedDate: "2026-01-01T00:00:00.000Z", tags: ["ts"],
};

beforeEach(() => completeJson.mockReset());

describe("matchJobs", () => {
  it("returns [] without calling the model when there are no jobs", async () => {
    const result = await matchJobs(resume, []);
    expect(result).toEqual([]);
    expect(completeJson).not.toHaveBeenCalled();
  });

  it("returns parsed match results", async () => {
    completeJson.mockResolvedValue([{ jobId: "j1", score: 80, missingSkills: [], reason: "ok" }]);
    const result = await matchJobs(resume, [job]);
    expect(result[0]).toEqual({ jobId: "j1", score: 80, missingSkills: [], reason: "ok" });
    expect(completeJson.mock.calls[0][0].user).toContain("j1");
  });
});
