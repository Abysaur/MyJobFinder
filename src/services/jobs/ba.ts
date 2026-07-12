import { z } from "zod";
import type { Job } from "@/types";
import type { JobProvider, JobQuery } from "@/services/jobs/provider";
import { inferRemote, safeUrl, toIsoDate } from "@/services/jobs/shared";

/**
 * Bundesagentur für Arbeit (BA) Jobsuche API.
 * GET {baseUrl}/pc/v4/jobs?was&wo&page&size   — auth via `X-API-Key` header.
 * The search endpoint returns listing stubs (no full description), so the
 * detail page URL is derived from the reference number.
 */

const baJobSchema = z.object({
  refnr: z.string().optional(),
  titel: z.string().optional(),
  beruf: z.string().optional(),
  arbeitgeber: z.string().optional(),
  arbeitsort: z
    .object({
      ort: z.string().optional(),
      region: z.string().optional(),
      plz: z.string().optional(),
      land: z.string().optional(),
    })
    .optional(),
  aktuelleVeroeffentlichungsdatum: z.string().optional(),
  modifikationsTimestamp: z.string().optional(),
  externeUrl: z.string().optional(),
});

export const baResponseSchema = z.object({
  stellenangebote: z.array(baJobSchema).default([]),
  maxErgebnisse: z.number().optional(),
});

export type BaRawJob = z.infer<typeof baJobSchema>;

export const BA_DEFAULT_BASE_URL = "https://rest.arbeitsagentur.de/jobboerse/jobsuche-service";

export function normalizeBaJob(r: BaRawJob): Job | null {
  if (!r.refnr) return null;

  const title = (r.titel || r.beruf || "Untitled role").trim();
  const company = (r.arbeitgeber || "Unknown company").trim();
  const ort = r.arbeitsort?.ort?.trim();
  const region = r.arbeitsort?.region?.trim();
  const location =
    [ort, region && region !== ort ? region : undefined].filter(Boolean).join(", ") ||
    r.arbeitsort?.land?.trim() ||
    "";

  const externalOk = r.externeUrl && /^https?:\/\//i.test(r.externeUrl);
  const url = externalOk
    ? (r.externeUrl as string)
    : `https://www.arbeitsagentur.de/jobsuche/jobdetail/${encodeURIComponent(r.refnr)}`;

  return {
    id: `ba:${r.refnr}`,
    title,
    company,
    location,
    remote: inferRemote(`${title} ${r.beruf ?? ""}`),
    url: safeUrl(url),
    description: r.beruf?.trim() ?? "",
    postedDate: toIsoDate(r.aktuelleVeroeffentlichungsdatum ?? r.modifikationsTimestamp),
    tags: [r.beruf].filter(Boolean) as string[],
  };
}

export type BaConfig = {
  apiKey: string;
  baseUrl?: string;
};

export function createBaProvider(cfg: BaConfig): JobProvider {
  const baseUrl = (cfg.baseUrl ?? BA_DEFAULT_BASE_URL).replace(/\/$/, "");

  return {
    name: "bundesagentur",
    async search(q: JobQuery): Promise<Job[]> {
      const url = new URL(`${baseUrl}/pc/v4/jobs`);
      if (q.query) url.searchParams.set("was", q.query);
      if (q.location) url.searchParams.set("wo", q.location);
      url.searchParams.set("page", String(Math.max(1, q.page)));
      url.searchParams.set("size", String(q.pageSize));

      let res: Response;
      try {
        res = await fetch(url, {
          headers: { "X-API-Key": cfg.apiKey, accept: "application/json" },
        });
      } catch {
        throw new Error("BA: could not reach the job service.");
      }
      if (!res.ok) throw new Error(`BA: request failed (${res.status}).`);

      const json = await res.json();
      const parsed = baResponseSchema.parse(json);
      return parsed.stellenangebote
        .map(normalizeBaJob)
        .filter((j): j is Job => j !== null);
    },
  };
}
