import { z } from "zod";
import type { Job } from "@/types";
import type { JobProvider, JobQuery } from "@/services/jobs/provider";
import { formatSalary, inferRemote, safeUrl, toIsoDate } from "@/services/jobs/shared";

/**
 * Adzuna Jobs API — https://developer.adzuna.com/
 * GET {baseUrl}/jobs/{country}/search/{page}?app_id&app_key&what&where&…
 */

const adzunaJobSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  created: z.string().optional(),
  redirect_url: z.string().optional(),
  company: z.object({ display_name: z.string().optional() }).optional(),
  location: z
    .object({ display_name: z.string().optional(), area: z.array(z.string()).optional() })
    .optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  category: z.object({ label: z.string().optional() }).optional(),
  contract_time: z.string().optional(),
});

export const adzunaResponseSchema = z.object({
  count: z.number().optional(),
  results: z.array(adzunaJobSchema).default([]),
});

export type AdzunaRawJob = z.infer<typeof adzunaJobSchema>;

const CURRENCY: Record<string, string> = { gb: "£", us: "$", ca: "$", au: "$" };

export function normalizeAdzunaJob(r: AdzunaRawJob, country = "de"): Job | null {
  const id = r.id != null ? String(r.id) : undefined;
  if (!id) return null;

  const title = r.title?.trim() || "Untitled role";
  const company = r.company?.display_name?.trim() || "Unknown company";
  const location =
    r.location?.display_name?.trim() || r.location?.area?.slice(-1)[0]?.trim() || "";
  const description = r.description ?? "";
  const tags = [r.category?.label, r.contract_time].filter(Boolean) as string[];

  return {
    id: `adzuna:${id}`,
    title,
    company,
    location,
    remote: inferRemote(`${title} ${description} ${location}`),
    salary: formatSalary(r.salary_min, r.salary_max, CURRENCY[country] ?? "€"),
    url: safeUrl(r.redirect_url ?? "#"),
    description,
    postedDate: toIsoDate(r.created),
    tags,
  };
}

export type AdzunaConfig = {
  appId: string;
  appKey: string;
  country?: string;
  baseUrl?: string;
};

export function createAdzunaProvider(cfg: AdzunaConfig): JobProvider {
  const baseUrl = (cfg.baseUrl ?? "https://api.adzuna.com/v1/api").replace(/\/$/, "");
  const country = (cfg.country ?? "de").toLowerCase();

  return {
    name: "adzuna",
    async search(q: JobQuery): Promise<Job[]> {
      const page = Math.max(1, q.page);
      const url = new URL(`${baseUrl}/jobs/${country}/search/${page}`);
      url.searchParams.set("app_id", cfg.appId);
      url.searchParams.set("app_key", cfg.appKey);
      url.searchParams.set("results_per_page", String(q.pageSize));
      url.searchParams.set("content-type", "application/json");
      if (q.query) url.searchParams.set("what", q.query);
      if (q.location) url.searchParams.set("where", q.location);
      if (q.salaryMin) url.searchParams.set("salary_min", String(q.salaryMin));
      url.searchParams.set("sort_by", q.sort === "date" ? "date" : q.sort === "salary" ? "salary" : "relevance");

      let res: Response;
      try {
        res = await fetch(url, { headers: { accept: "application/json" } });
      } catch {
        throw new Error("Adzuna: could not reach the job service.");
      }
      if (!res.ok) throw new Error(`Adzuna: request failed (${res.status}).`);

      const json = await res.json();
      const parsed = adzunaResponseSchema.parse(json);
      return parsed.results
        .map((r) => normalizeAdzunaJob(r, country))
        .filter((j): j is Job => j !== null);
    },
  };
}
