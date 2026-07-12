import { describe, expect, it, vi } from "vitest";
import {
  dedupeJobs,
  interleave,
  rankAndPaginate,
  runProviders,
} from "@/services/jobs/aggregate";
import type { JobProvider, JobQuery } from "@/services/jobs/provider";
import type { Job } from "@/types";

const job = (over: Partial<Job>): Job => ({
  id: "id",
  title: "Engineer",
  company: "Acme",
  location: "Berlin",
  remote: false,
  url: "https://x",
  description: "",
  postedDate: "2024-01-01T00:00:00.000Z",
  tags: [],
  ...over,
});

const query = (over: Partial<JobQuery> = {}): JobQuery => ({
  query: "",
  page: 1,
  pageSize: 20,
  sort: "relevance",
  ...over,
});

const provider = (name: string, result: Job[] | Error): JobProvider => ({
  name,
  search: () => (result instanceof Error ? Promise.reject(result) : Promise.resolve(result)),
});

describe("dedupeJobs", () => {
  it("treats same company + title as one posting, keeping the first", () => {
    const jobs = dedupeJobs([
      job({ id: "ba:1", company: "Acme", title: "Backend  Engineer" }),
      job({ id: "adzuna:2", company: "ACME", title: "backend engineer" }),
    ]);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe("ba:1");
  });
});

describe("interleave", () => {
  it("round-robins across provider lists so neither dominates", () => {
    const a = [job({ id: "a1" }), job({ id: "a2" })];
    const b = [job({ id: "b1" })];
    expect(interleave([a, b]).map((j) => j.id)).toEqual(["a1", "b1", "a2"]);
  });
});

describe("rankAndPaginate", () => {
  it("sorts by date, newest first", () => {
    const lists = [
      [job({ id: "old", title: "Old", postedDate: "2023-01-01T00:00:00.000Z" })],
      [job({ id: "new", title: "New", postedDate: "2024-06-01T00:00:00.000Z" })],
    ];
    expect(rankAndPaginate(lists, query({ sort: "date" })).map((j) => j.id)).toEqual(["new", "old"]);
  });

  it("sorts by salary, highest first, with unpriced roles last", () => {
    const lists = [
      [
        job({ id: "low", title: "Low", salary: "€40,000" }),
        job({ id: "none", title: "None" }),
        job({ id: "high", title: "High", salary: "€90,000–€120,000" }),
      ],
    ];
    expect(rankAndPaginate(lists, query({ sort: "salary" })).map((j) => j.id)).toEqual([
      "high",
      "low",
      "none",
    ]);
  });

  it("applies the remote-only filter", () => {
    const lists = [[job({ id: "r", title: "R", remote: true }), job({ id: "o", title: "O" })]];
    expect(rankAndPaginate(lists, query({ remote: true })).map((j) => j.id)).toEqual(["r"]);
  });

  it("paginates to pageSize", () => {
    const lists = [[job({ id: "1", title: "A" }), job({ id: "2", title: "B" }), job({ id: "3", title: "C" })]];
    expect(rankAndPaginate(lists, query({ pageSize: 2 }))).toHaveLength(2);
  });
});

describe("runProviders", () => {
  it("queries providers concurrently and merges their results", async () => {
    const jobs = await runProviders(
      [
        provider("p1", [job({ id: "p1", title: "One" })]),
        provider("p2", [job({ id: "p2", title: "Two" })]),
      ],
      query(),
    );
    expect(jobs.map((j) => j.id).sort()).toEqual(["p1", "p2"]);
  });

  it("keeps results from healthy providers when one fails, and logs the error", async () => {
    const log = vi.fn();
    const jobs = await runProviders(
      [
        provider("broken", new Error("boom")),
        provider("healthy", [job({ id: "ok", title: "OK" })]),
      ],
      query(),
      log,
    );
    expect(jobs.map((j) => j.id)).toEqual(["ok"]);
    expect(log).toHaveBeenCalledWith("broken", expect.any(Error));
  });

  it("returns an empty list when every provider fails", async () => {
    const log = vi.fn();
    const jobs = await runProviders(
      [provider("a", new Error("x")), provider("b", new Error("y"))],
      query(),
      log,
    );
    expect(jobs).toEqual([]);
    expect(log).toHaveBeenCalledTimes(2);
  });
});
