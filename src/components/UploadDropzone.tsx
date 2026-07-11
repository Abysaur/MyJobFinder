"use client";
import { useRef, useState } from "react";
import { validateResumeFile } from "@/resume/validate";

export function UploadDropzone({
  onFile, isLoading, error,
}: { onFile: (file: File) => void; isLoading: boolean; error?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | undefined>();

  function handle(file: File | undefined) {
    if (!file) return;
    const check = validateResumeFile({ type: file.type, size: file.size });
    if (!check.ok) { setLocalError(check.error); return; }
    setLocalError(undefined);
    onFile(file);
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
        onChange={(e) => handle(e.target.files?.[0])} />
      <button onClick={() => inputRef.current?.click()} disabled={isLoading}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
        {isLoading ? "Reading resume…" : "Upload PDF resume"}
      </button>
      {(localError ?? error) && <p className="mt-3 text-sm text-red-600">{localError ?? error}</p>}
    </div>
  );
}
