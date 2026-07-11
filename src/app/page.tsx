"use client";
import { useState } from "react";
import { UploadDropzone } from "@/components/UploadDropzone";
import { SearchForm } from "@/components/SearchForm";
import { JobCard } from "@/components/JobCard";
import { useResumeUpload } from "@/hooks/useResumeUpload";
import { useJobMatches } from "@/hooks/useJobMatches";
import type { Resume } from "@/types";

export default function Home() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const upload = useResumeUpload();
  const matches = useJobMatches();

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">AI Job Finder</h1>

      {!resume ? (
        <UploadDropzone
          isLoading={upload.isPending}
          error={upload.error?.message}
          onFile={(file) => upload.mutate(file, { onSuccess: setResume })}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600">
            Resume loaded · {resume.skills.slice(0, 5).join(", ")}
          </p>
          <SearchForm
            isLoading={matches.isPending}
            onSearch={(query, remote) => matches.mutate({ resume, query, remote })}
          />
          {matches.isError && <p className="mt-4 text-sm text-red-600">{matches.error.message}</p>}
          <div className="mt-6 space-y-4">
            {matches.data?.length === 0 && <p className="text-gray-600">No matching jobs found.</p>}
            {matches.data?.map((job) => (
              <JobCard key={job.id} job={job} saved={saved.has(job.id)} onToggleSave={toggleSave} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
