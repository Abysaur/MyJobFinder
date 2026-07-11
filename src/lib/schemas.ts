import { z } from "zod";

export const resumeSchema = z.object({
  skills: z.array(z.string()),
  jobTitles: z.array(z.string()),
  yearsExperience: z.number().min(0),
  education: z.array(z.string()),
  location: z.string().nullable(),
  contact: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }),
});

export const matchResultSchema = z.object({
  jobId: z.string(),
  score: z.number().int().min(0).max(100),
  missingSkills: z.array(z.string()),
  reason: z.string(),
});

export const matchResultsSchema = z.array(matchResultSchema);

export const arbetnowResponseSchema = z.object({
  data: z.array(
    z.object({
      slug: z.string(),
      company_name: z.string(),
      title: z.string(),
      description: z.string(),
      remote: z.boolean(),
      url: z.string(),
      tags: z.array(z.string()),
      job_types: z.array(z.string()),
      location: z.string(),
      created_at: z.number(), // unix seconds
    }),
  ),
});
