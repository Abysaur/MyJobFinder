import { afterEach, describe, expect, it, vi } from "vitest";
import { createBaProvider, normalizeBaJob } from "@/services/jobs/ba";
import type { JobQuery } from "@/services/jobs/provider";

const query = (over: Partial<JobQuery> = {}): JobQuery => ({
  query: "entwickler",
  page: 1,
  pageSize: 20,
  sort: "relevance",
  ...over,
});

function mockFetch(payload: unknown, ok = true, status = 200) {
  const fn = vi.fn().mockResolvedValue({ ok, status, json: async () => payload });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const sampleStelle = {
  refnr: "10000-1234567890-S",
  titel: "Java Entwickler (m/w/d)",
  beruf: "Softwareentwickler",
  arbeitgeber: "Acme GmbH",
  arbeitsort: { ort: "Berlin", region: "Berlin", plz: "10115", land: "Deutschland" },
  aktuelleVeroeffentlichungsdatum: "2024-01-10",
};

afterEach(() => vi.unstubAllGlobals());

describe("normalizeBaJob", () => {
  it("maps raw BA fields into the internal Job shape", () => {
    const job = normalizeBaJob(sampleStelle);
    expect(job).toMatchObject({
      id: "ba:10000-1234567890-S",
      title: "Java Entwickler (m/w/d)",
      company: "Acme GmbH",
      location: "Berlin",
      description: "Softwareentwickler",
      tags: ["Softwareentwickler"],
    });
    expect(job?.salary).toBeUndefined();
    expect(job?.postedDate).toBe(new Date("2024-01-10").toISOString());
  });

  it("derives the detail URL from the reference number when no external URL exists", () => {
    const job = normalizeBaJob(sampleStelle);
    expect(job?.url).toBe(
      "https://www.arbeitsagentur.de/jobsuche/jobdetail/10000-1234567890-S",
    );
  });

  it("prefers a valid external URL", () => {
    const job = normalizeBaJob({ ...sampleStelle, externeUrl: "https://jobs.acme.de/42" });
    expect(job?.url).toBe("https://jobs.acme.de/42");
  });

  it("combines city and region, avoiding duplicates", () => {
    expect(normalizeBaJob({ ...sampleStelle, arbeitsort: { ort: "München", region: "Bayern" } })?.location).toBe(
      "München, Bayern",
    );
  });

  it("drops records without a reference number", () => {
    expect(normalizeBaJob({ titel: "No ref" })).toBeNull();
  });
});

describe("createBaProvider", () => {
  it("sends the API key header and maps query params", async () => {
    const fetchMock = mockFetch({ stellenangebote: [sampleStelle] });
    const provider = createBaProvider({ apiKey: "secret-key", baseUrl: "https://ba.example/svc/" });

    const jobs = await provider.search(query({ page: 3, pageSize: 15, location: "Berlin" }));

    const [calledUrl, init] = fetchMock.mock.calls[0];
    const url = String(calledUrl);
    expect(url).toContain("https://ba.example/svc/pc/v4/jobs");
    expect(url).toContain("was=entwickler");
    expect(url).toContain("wo=Berlin");
    expect(url).toContain("page=3");
    expect(url).toContain("size=15");
    expect((init as RequestInit).headers).toMatchObject({ "X-API-Key": "secret-key" });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe("ba:10000-1234567890-S");
  });

  it("returns an empty list when there are no listings", async () => {
    mockFetch({ stellenangebote: [] });
    const provider = createBaProvider({ apiKey: "k" });
    expect(await provider.search(query())).toEqual([]);
  });

  it("throws a labelled error on a non-ok response", async () => {
    mockFetch({}, false, 401);
    const provider = createBaProvider({ apiKey: "k" });
    await expect(provider.search(query())).rejects.toThrow(/BA: request failed \(401\)/);
  });
});
