export const MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPE = "application/pdf";

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateResumeFile(file: { type: string; size: number }): ValidationResult {
  if (file.type !== ACCEPTED_TYPE) return { ok: false, error: "Only PDF files are supported." };
  if (file.size === 0) return { ok: false, error: "File is empty." };
  if (file.size > MAX_SIZE_BYTES) return { ok: false, error: "File must be 5MB or smaller." };
  return { ok: true };
}
