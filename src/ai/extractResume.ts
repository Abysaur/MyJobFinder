import { completeJson } from "@/ai/client";
import { resumeSchema } from "@/lib/schemas";
import type { Resume } from "@/types";

const SYSTEM = `You extract structured data from resumes. Respond with ONLY a JSON object matching:
{ "skills": string[], "jobTitles": string[], "yearsExperience": number,
  "education": string[], "location": string | null,
  "contact": { "name"?: string, "email"?: string, "phone"?: string } }
Use [] or null when a field is absent. Do not invent data.`;

export async function extractResume(resumeText: string): Promise<Resume> {
  return completeJson({
    system: SYSTEM,
    user: `Resume text:\n\n${resumeText}`,
    schema: resumeSchema,
    maxTokens: 1500,
  });
}
