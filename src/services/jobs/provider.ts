import type { Job } from "@/types";

/** How to order merged results. Providers map this to their own API params. */
export type JobSort = "relevance" | "date" | "salary";

/** A single, provider-agnostic search request. */
export type JobQuery = {
  query: string; // keyword(s)
  location?: string; // free-text location filter
  remote?: boolean; // remote-only filter
  salaryMin?: number; // minimum salary filter (best-effort per provider)
  page: number; // 1-based
  pageSize: number; // results per page
  sort: JobSort;
};

/**
 * Common contract every job source implements. `search` returns results already
 * normalized into the internal {@link Job} shape; merging, deduplication, and
 * cross-provider ranking happen in the aggregator.
 */
export interface JobProvider {
  readonly name: string;
  search(query: JobQuery): Promise<Job[]>;
}

const MAX_PAGE_SIZE = 50;

/** Coerce loose/partial input (e.g. a request body) into a valid JobQuery with defaults. */
export function normalizeQuery(input: {
  query?: unknown;
  location?: unknown;
  remote?: unknown;
  salaryMin?: unknown;
  page?: unknown;
  pageSize?: unknown;
  sort?: unknown;
}): JobQuery {
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const location = str(input.location);
  const salaryMin = num(input.salaryMin);
  const page = num(input.page);
  const pageSize = num(input.pageSize);
  const sort: JobSort =
    input.sort === "date" || input.sort === "salary" ? input.sort : "relevance";

  return {
    query: str(input.query),
    location: location || undefined,
    remote: input.remote === true,
    salaryMin: salaryMin && salaryMin > 0 ? Math.floor(salaryMin) : undefined,
    page: page && page > 0 ? Math.floor(page) : 1,
    pageSize: pageSize && pageSize > 0 ? Math.min(Math.floor(pageSize), MAX_PAGE_SIZE) : 20,
    sort,
  };
}

/** Log a provider failure without aborting the aggregate search. */
export function logProviderError(provider: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  // eslint-disable-next-line no-console
  console.error(`[jobs:${provider}] ${message}`);
}
