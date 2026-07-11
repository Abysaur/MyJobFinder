"use client";
import Link from "next/link";
import { MatchBadge } from "@/components/MatchBadge";
import type { RankedJob } from "@/lib/rank";

export function JobCard({
  job, saved, onToggleSave,
}: { job: RankedJob; saved: boolean; onToggleSave: (id: string) => void }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/job/${job.id}`} className="text-lg font-semibold hover:underline">{job.title}</Link>
          <p className="text-sm text-gray-600">{job.company} · {job.location}{job.remote ? " · Remote" : ""}</p>
        </div>
        <MatchBadge score={job.match.score} />
      </div>
      {job.salary && <p className="mt-2 text-sm text-gray-700">{job.salary}</p>}
      <p className="mt-2 text-sm text-gray-700">{job.match.reason}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {job.tags.slice(0, 6).map((t) => (
          <span key={t} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{t}</span>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <a href={job.url} target="_blank" rel="noreferrer"
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white">Apply</a>
        <button onClick={() => onToggleSave(job.id)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm">
          {saved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </div>
  );
}
