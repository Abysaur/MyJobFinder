import { describe, it, expect } from "vitest";
import { resumeSchema, matchResultSchema } from "@/lib/schemas";

describe("resumeSchema", () => {
  it("parses a valid resume", () => {
    const parsed = resumeSchema.parse({
      skills: ["ts"], jobTitles: ["dev"], yearsExperience: 3,
      education: ["BSc"], location: "Berlin",
      contact: { name: "A", email: "a@b.com", phone: "123" },
    });
    expect(parsed.skills).toEqual(["ts"]);
  });

  it("rejects a resume missing skills", () => {
    expect(() => resumeSchema.parse({ jobTitles: [] })).toThrow();
  });
});

describe("matchResultSchema", () => {
  it("rejects a score above 100", () => {
    expect(() =>
      matchResultSchema.parse({ jobId: "1", score: 120, missingSkills: [], reason: "x" }),
    ).toThrow();
  });
});
