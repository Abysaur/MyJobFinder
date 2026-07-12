"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { validateResumeFile } from "@/resume/validate";

export function UploadDropzone({
  onFile,
  isLoading,
  error,
}: {
  onFile: (file: File) => void;
  isLoading: boolean;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | undefined>();
  const [dragging, setDragging] = useState(false);

  function handle(file: File | undefined) {
    if (!file) return;
    const check = validateResumeFile({ type: file.type, size: file.size });
    if (!check.ok) {
      setLocalError(check.error);
      return;
    }
    setLocalError(undefined);
    onFile(file);
  }

  const shownError = localError ?? error;

  return (
    <motion.div
      className="panel text-center transition-colors"
      style={{
        padding: "clamp(2rem, 6vw, 3.25rem)",
        borderColor: dragging ? "var(--signal)" : undefined,
        background: dragging ? "var(--wash-amber)" : undefined,
      }}
      animate={dragging ? { scale: 1.01 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!isLoading) handle(e.dataTransfer.files?.[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />

      <p className="eyebrow mb-3">PDF résumé</p>
      <p className="mx-auto mb-6 max-w-sm t-sm leading-relaxed text-[var(--ink-soft)]">
        {isLoading
          ? "Reading your résumé — pulling out skills, titles, and experience."
          : "Drop your résumé here, or browse. We read it once to measure fit; it never leaves this session."}
      </p>

      <button onClick={() => inputRef.current?.click()} disabled={isLoading} className="btn-signal">
        {isLoading ? "Reading résumé…" : "Upload PDF résumé"}
      </button>

      {shownError && (
        <p className="mt-4 t-sm font-medium text-[var(--signal-deep)]" role="alert">
          ⚠ {shownError}
        </p>
      )}
    </motion.div>
  );
}
