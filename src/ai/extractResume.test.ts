import { describe, it, expect, vi, beforeEach } from "vitest";

const completeJson = vi.fn();
vi.mock("@/ai/client", () => ({ completeJson: (...a: unknown[]) => completeJson(...a) }));

import { extractResume } from "@/ai/extractResume";

beforeEach(() => completeJson.mockReset());

describe("extractResume", () => {
  it("passes resume text to the model and returns the parsed resume", async () => {
    const fake = {
      skills: ["ts"], jobTitles: ["dev"], yearsExperience: 2,
      education: [], location: null, contact: {},
    };
    completeJson.mockResolvedValue(fake);
    const result = await extractResume("John Doe, TypeScript developer");
    expect(result).toEqual(fake);
    const arg = completeJson.mock.calls[0][0];
    expect(arg.user).toContain("John Doe");
    expect(arg.schema).toBeDefined();
  });
});
