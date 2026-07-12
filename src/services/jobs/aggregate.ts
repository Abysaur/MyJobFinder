import type { Job } from "@/types";
import {
  logProviderError,
  type JobProvider,
  type JobQuery,
  type ProviderStatus,
} from "@/services/jobs/provider";
import { arbetnowProvider } from "@/services/jobs/arbetnow";
import { createAdzunaProvider } from "@/services/jobs/adzuna";
import { BA_DEFAULT_BASE_URL, createBaProvider } from "@/services/jobs/ba";

/** Friendly names for the boards we search. */
const PROVIDER_LABELS: Record<string, string> = {
  arbeitnow: "Arbeitnow",
  adzuna: "Adzuna",
  bundesagentur: "Bundesagentur für Arbeit",
};

/** Jobs plus a record of which boards were searched and how each fared. */
export type SearchResult = {
  jobs: Job[];
  sources: ProviderStatus[];
};

/** Build the active provider set from the environment. Providers without
 *  credentials are simply left out, so the app degrades gracefully. */
export function getProviders(): JobProvider[] {
  const providers: JobProvider[] = [arbetnowProvider];

  const { ADZUNA_APP_ID, ADZUNA_APP_KEY, ADZUNA_COUNTRY, BA_API_KEY, BA_BASE_URL } = process.env;

  if (ADZUNA_APP_ID && ADZUNA_APP_KEY) {
    providers.push(
      createAdzunaProvider({
        appId: ADZUNA_APP_ID,
        appKey: ADZUNA_APP_KEY,
        country: ADZUNA_COUNTRY,
      }),
    );
  }
  if (BA_API_KEY) {
    providers.push(createBaProvider({ apiKey: BA_API_KEY, baseUrl: BA_BASE_URL ?? BA_DEFAULT_BASE_URL }));
  }

  return providers;
}

/** Stable dedup key: same role at the same company is treated as one posting,
 *  even when it surfaces from more than one provider. */
function dedupeKey(job: Job): string {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return `${norm(job.company)}::${norm(job.title)}`;
}

export function dedupeJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  const out: Job[] = [];
  for (const job of jobs) {
    const key = dedupeKey(job);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(job);
  }
  return out;
}

/** Round-robin merge so no single provider dominates the top of the list. */
export function interleave(lists: Job[][]): Job[] {
  const out: Job[] = [];
  const max = lists.reduce((m, l) => Math.max(m, l.length), 0);
  for (let i = 0; i < max; i++) {
    for (const list of lists) {
      if (i < list.length) out.push(list[i]);
    }
  }
  return out;
}

function salaryValue(job: Job): number {
  const m = job.salary?.match(/\d[\d.,]*/);
  return m ? Number(m[0].replace(/[.,]/g, "")) : -1;
}

/** Order, filter, dedupe, and page a set of per-provider result lists. */
export function rankAndPaginate(lists: Job[][], query: JobQuery): Job[] {
  let merged = query.sort === "relevance" ? interleave(lists) : lists.flat();

  if (query.remote) merged = merged.filter((j) => j.remote);

  const deduped = dedupeJobs(merged);

  const sorted =
    query.sort === "date"
      ? [...deduped].sort(
          (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime(),
        )
      : query.sort === "salary"
        ? [...deduped].sort((a, b) => salaryValue(b) - salaryValue(a))
        : deduped;

  return sorted.slice(0, query.pageSize);
}

/** Query every provider concurrently; a failure in one is logged and skipped
 *  while the rest still contribute results. Always reports which boards were
 *  searched and whether each one succeeded. */
export async function runProviders(
  providers: JobProvider[],
  query: JobQuery,
  log: (provider: string, err: unknown) => void = logProviderError,
): Promise<SearchResult> {
  const settled = await Promise.allSettled(providers.map((p) => p.search(query)));

  const lists: Job[][] = [];
  const sources: ProviderStatus[] = settled.map((result, i) => {
    const name = providers[i].name;
    const label = PROVIDER_LABELS[name] ?? name;
    if (result.status === "fulfilled") {
      lists.push(result.value);
      return { name, label, ok: true, count: result.value.length };
    }
    log(name, result.reason);
    return { name, label, ok: false, count: 0 };
  });

  return { jobs: rankAndPaginate(lists, query), sources };
}

/** Entry point used by the API route. */
export function searchJobs(query: JobQuery): Promise<SearchResult> {
  return runProviders(getProviders(), query);
}
