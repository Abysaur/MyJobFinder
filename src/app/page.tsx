"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { UploadDropzone } from "@/components/UploadDropzone";
import { SearchForm } from "@/components/SearchForm";
import { JobCard } from "@/components/JobCard";
import { useResumeUpload } from "@/hooks/useResumeUpload";
import { useJobMatches } from "@/hooks/useJobMatches";
import type { Resume } from "@/types";
import type { ProviderStatus } from "@/services/jobs/provider";

const MIN_FIT = 50; // hide roles that score below this out of 100

function SearchedSources({ sources }: { sources: ProviderStatus[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-1">
      <span className="label-soft">searched</span>
      {sources.map((s) => (
        <span
          key={s.name}
          className="chip inline-flex items-center gap-1.5"
          title={s.ok ? `${s.count} listing${s.count === 1 ? "" : "s"} returned` : "Unavailable for this search"}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: s.ok ? "var(--signal)" : "var(--signal-weak)" }}
            aria-hidden
          />
          {s.label}
          {!s.ok && <span className="text-[var(--signal-weak)]">· unavailable</span>}
        </span>
      ))}
    </div>
  );
}

function ResumeReadout({
  resume,
  onChange,
  onReset,
}: {
  resume: Resume;
  onChange: (next: Resume) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState("");

  const readings: { label: string; value: string }[] = [
    { label: "experience", value: `${resume.yearsExperience} yr${resume.yearsExperience === 1 ? "" : "s"}` },
    { label: "location", value: resume.location ?? "any" },
    { label: "skills", value: String(resume.skills.length) },
  ];

  function setTargetRole(value: string) {
    const rest = resume.jobTitles.slice(1);
    onChange({ ...resume, jobTitles: [value, ...rest] });
  }

  function addSkill(raw: string) {
    const skill = raw.trim();
    if (!skill) return;
    const exists = resume.skills.some((s) => s.toLowerCase() === skill.toLowerCase());
    if (!exists) onChange({ ...resume, skills: [...resume.skills, skill] });
    setDraft("");
  }

  function removeSkill(skill: string) {
    onChange({ ...resume, skills: resume.skills.filter((s) => s !== skill) });
  }

  return (
    <motion.div
      className="panel"
      style={{ padding: "clamp(1rem, 2.5vw, 1.5rem)" }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
    >
      <div className="mb-3.5 flex items-center justify-between">
        <span className="eyebrow">résumé loaded · edit to sharpen matches</span>
        <button onClick={onReset} className="label-soft transition-colors hover:text-[var(--signal-deep)]">
          replace ×
        </button>
      </div>

      <div className="grid grid-cols-3 gap-x-4 gap-y-4">
        {readings.map((r) => (
          <div key={r.label} className="border-l-2 border-[var(--signal)] pl-3">
            <p className="label-soft">{r.label}</p>
            <p className="mt-0.5 truncate t-body font-semibold text-[var(--ink)]" title={r.value}>
              {r.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-[var(--line)] pt-4">
        <label htmlFor="target-role" className="label-soft">
          target role
        </label>
        <input
          id="target-role"
          value={resume.jobTitles[0] ?? ""}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g. Senior Frontend Engineer"
          className="input-field mt-1.5 w-full"
        />
      </div>

      <div className="mt-5 border-t border-[var(--line)] pt-4">
        <label className="label-soft">skills</label>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {resume.skills.map((s) => (
            <span key={s} className="chip inline-flex items-center gap-1.5">
              {s}
              <button
                type="button"
                onClick={() => removeSkill(s)}
                aria-label={`Remove ${s}`}
                className="grid h-3.5 w-3.5 place-items-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--signal)] hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addSkill(draft);
            }}
            className="inline-flex"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill(draft);
                }
              }}
              placeholder="+ add skill"
              aria-label="Add a skill"
              className="w-28 rounded-[var(--r-pill)] border border-dashed border-[var(--line-strong)] bg-transparent px-3 py-1 text-[length:var(--fs-xs)] text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--signal)]"
            />
          </form>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const upload = useResumeUpload();
  const matches = useJobMatches();

  const visible = useMemo(
    () => (matches.data?.jobs ?? []).filter((j) => j.match.score >= MIN_FIT),
    [matches.data],
  );
  const hidden = (matches.data?.jobs.length ?? 0) - visible.length;

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function reset() {
    setResume(null);
    matches.reset();
  }

  return (
    <main className="flex-1" style={{ paddingBlock: "var(--space-section)" }}>
      {!resume ? (
        <section className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
          >
            <p className="eyebrow mb-5">résumé → fit → ranked roles</p>
            <h1
              className="font-display font-bold leading-[1.02] tracking-tight text-[var(--ink)]"
              style={{ fontSize: "var(--fs-hero)" }}
            >
              Find where you
              <br />
              actually{" "}
              <span className="relative whitespace-nowrap text-[var(--signal-deep)]">
                fit
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 100 8"
                  preserveAspectRatio="none"
                  aria-hidden
                  style={{ height: "0.4em" }}
                >
                  <path
                    d="M1 5 Q 25 1 50 4 T 99 3"
                    fill="none"
                    stroke="var(--signal)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              .
            </h1>
            <p
              className="mt-6 max-w-lg leading-relaxed text-[var(--ink-soft)]"
              style={{ fontSize: "var(--fs-lead)" }}
            >
              Upload your résumé. We read your skills and experience, then score every job by how
              well it actually matches — with the reasons and the gaps, in plain terms.
            </p>
          </motion.div>

          <motion.div
            className="mt-9"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.12 }}
          >
            <UploadDropzone
              isLoading={upload.isPending}
              error={upload.error?.message}
              onFile={(file) => upload.mutate(file, { onSuccess: setResume })}
            />
          </motion.div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { n: "0–100", t: "One honest number", d: "How closely a role fits what you bring — not a keyword count." },
              { n: "why", t: "The reasoning", d: "A plain-language read on what lines up, per job." },
              { n: "gaps", t: "What to close", d: "The skills to highlight or learn before you apply." },
            ].map((c, i) => (
              <motion.div
                key={c.t}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 110, damping: 20, delay: 0.25 + i * 0.08 }}
              >
                <p className="num font-display t-h2 font-bold text-[var(--signal-deep)]">{c.n}</p>
                <p className="mt-1.5 font-display t-body font-bold text-[var(--ink)]">{c.t}</p>
                <p className="mt-1 t-sm leading-relaxed text-[var(--ink-soft)]">{c.d}</p>
              </motion.div>
            ))}
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-[var(--gap)]">
          <ResumeReadout resume={resume} onChange={setResume} onReset={reset} />
          <SearchForm
            isLoading={matches.isPending}
            onSearch={(query, remote) => matches.mutate({ resume, query, remote })}
          />

          {matches.isError && (
            <p className="panel px-4 py-3 t-sm font-medium text-[var(--signal-deep)]" role="alert">
              ⚠ {matches.error.message}
            </p>
          )}

          {matches.data && <SearchedSources sources={matches.data.sources} />}

          {matches.data && visible.length > 0 && (
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 px-1 pt-1">
              <span className="eyebrow">ranked by fit</span>
              <span className="label-soft">
                {visible.length} role{visible.length === 1 ? "" : "s"} at {MIN_FIT}%+
                {hidden > 0 && ` · ${hidden} below ${MIN_FIT}% hidden`}
              </span>
            </div>
          )}

          {matches.data && visible.length === 0 && (
            <div className="panel p-10 text-center">
              <p className="eyebrow mb-2">no strong matches</p>
              <p className="t-sm text-[var(--ink-soft)]">
                {matches.data.jobs.length === 0
                  ? "Nothing matched this search. Try a broader title or a different location."
                  : `No roles scored ${MIN_FIT}% or higher${hidden > 0 ? ` (${hidden} weaker match${hidden === 1 ? "" : "es"} hidden)` : ""}. Try a broader search, or add skills above to sharpen the read.`}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-[var(--gap)]">
            {visible.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                saved={saved.has(job.id)}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
