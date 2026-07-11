"use client";
import Link from "next/link";
import { getJobById } from "@/lib/jobStore";
import { MatchBadge } from "@/components/MatchBadge";

export default function JobDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const job = getJobById(id);

  if (!job) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-gray-600">This job isn’t loaded.{" "}
          <Link href="/" className="text-blue-600 underline">Open the dashboard first</Link>.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/" className="text-sm text-blue-600 underline">← Back</Link>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-gray-600">{job.company} · {job.location}{job.remote ? " · Remote" : ""}</p>
        </div>
        <MatchBadge score={job.match.score} />
      </div>
      {job.salary && <p className="mt-2 text-gray-700">{job.salary}</p>}
      <p className="mt-4 font-semibold">Why this matches</p>
      <p className="text-gray-700">{job.match.reason}</p>
      {job.match.missingSkills.length > 0 && (
        <>
          <p className="mt-4 font-semibold">Skills to highlight or learn</p>
          <ul className="list-inside list-disc text-gray-700">
            {job.match.missingSkills.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </>
      )}
      <p className="mt-4 font-semibold">Description</p>
      <p className="whitespace-pre-line text-gray-700">{job.description}</p>
      <a href={job.url} target="_blank" rel="noreferrer"
        className="mt-6 inline-block rounded bg-blue-600 px-4 py-2 text-white">Apply on site</a>
    </main>
  );
}
