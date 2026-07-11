import { describe, it, expect } from "vitest";
import { validateResumeFile } from "@/resume/validate";

describe("validateResumeFile", () => {
  it("accepts a small PDF", () => {
    expect(validateResumeFile({ type: "application/pdf", size: 1000 })).toEqual({ ok: true });
  });
  it("rejects non-PDF", () => {
    const r = validateResumeFile({ type: "image/png", size: 1000 });
    expect(r).toEqual({ ok: false, error: "Only PDF files are supported." });
  });
  it("rejects files over 5MB", () => {
    const r = validateResumeFile({ type: "application/pdf", size: 6 * 1024 * 1024 });
    expect(r).toEqual({ ok: false, error: "File must be 5MB or smaller." });
  });
  it("rejects empty files", () => {
    const r = validateResumeFile({ type: "application/pdf", size: 0 });
    expect(r).toEqual({ ok: false, error: "File is empty." });
  });
});
