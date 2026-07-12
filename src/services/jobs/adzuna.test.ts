import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdzunaProvider, normalizeAdzunaJob } from "@/services/jobs/adzuna";
import type { JobQuery } from "@/services/jobs/provider";

const query = (over: Partial<JobQuery> = {}): JobQuery => ({
  query: "developer",
  page: 1,
  pageSize: 20,
  sort: "relevance",
  ...over,
});

function mockFetch(payload: unknown, ok = true, status = 200) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => payload,
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const sampleResult = {
  id: 123,
  title: "Senior Frontend Engineer",
  description: "Build UIs. Remote friendly.",
  created: "2024-01-15T10:00:00Z",
  redirect_url: "https://www.adzuna.de/details/123",
  company: { display_name: "Acme GmbH" },
  location: { display_name: "Berlin, Germany", area: ["Germany", "Berlin"] },
  salary_min: 60000,
  salary_max: 80000,
  category: { label: "IT Jobs" },
  contract_time: "full_time",
};

afterEach(() => vi.unstubAllGlobals());

describe("normalizeAdzunaJob", () => {
  it("maps raw Adzuna fields into the internal Job shape", () => {
    const job = normalizeAdzunaJob(sampleResult, "de");
    expect(job).toMatchObject({
      id: "adzuna:123",
      title: "Senior Frontend Engineer",
      company: "Acme GmbH",
      location: "Berlin, Germany",
      url: "https://www.adzuna.de/details/123",
      salary: "€60,000–€80,000",
      tags: ["IT Jobs", "full_time"],
    });
    expect(job?.postedDate).toBe(new Date("2024-01-15T10:00:00Z").toISOString());
  });

  it("infers remote from the listing text", () => {
    expect(normalizeAdzunaJob(sampleResult)?.remote).toBe(true);
    expect(normalizeAdzunaJob({ ...sampleResult, description: "On-site only" })?.remote).toBe(false);
  });

  it("uses the country currency symbol and single-value salary", () => {
    const job = normalizeAdzunaJob({ ...sampleResult, salary_max: undefined }, "gb");
    expect(job?.salary).toBe("£60,000");
  });

  it("fills sensible defaults and drops records without an id", () => {
    expect(normalizeAdzunaJob({ title: "X" })).toBeNull();
    const job = normalizeAdzunaJob({ id: "9" });
    expect(job).toMatchObject({ title: "Untitled role", company: "Unknown company", salary: undefined });
  });

  it("sanitizes unsafe redirect URLs", () => {
    const job = normalizeAdzunaJob({ id: "1", redirect_url: "javascript:alert(1)" });
    expect(job?.url).toBe("#");
  });
});

describe("createAdzunaProvider", () => {
  it("builds the request URL with credentials, paging, and sort", async () => {
    const fetchMock = mockFetch({ results: [sampleResult] });
    const provider = createAdzunaProvider({ appId: "id1", appKey: "key1", country: "de" });

    const jobs = await provider.search(query({ page: 2, pageSize: 10, location: "Berlin", sort: "date", salaryMin: 50000 }));

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/jobs/de/search/2");
    expect(url).toContain("app_id=id1");
    expect(url).toContain("app_key=key1");
    expect(url).toContain("results_per_page=10");
    expect(url).toContain("what=developer");
    expect(url).toContain("where=Berlin");
    expect(url).toContain("salary_min=50000");
    expect(url).toContain("sort_by=date");
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe("adzuna:123");
  });

  it("returns an empty list when the payload has no results", async () => {
    mockFetch({ count: 0 });
    const provider = createAdzunaProvider({ appId: "a", appKey: "b" });
    expect(await provider.search(query())).toEqual([]);
  });

  it("throws a labelled error on a non-ok response", async () => {
    mockFetch({}, false, 429);
    const provider = createAdzunaProvider({ appId: "a", appKey: "b" });
    await expect(provider.search(query())).rejects.toThrow(/Adzuna: request failed \(429\)/);
  });
});
