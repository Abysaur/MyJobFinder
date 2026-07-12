"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { SignalMeter } from "@/components/SignalMeter";
import type { RankedJob } from "@/lib/rank";

function postedAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function JobCard({
  job,
  saved,
  onToggleSave,
  index = 0,
}: {
  job: RankedJob;
  saved: boolean;
  onToggleSave: (id: string) => void;
  index?: number;
}) {
  return (
    <motion.article
      className="panel"
      style={{ padding: "clamp(1.25rem, 3vw, 1.75rem)" }}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, delay: Math.min(index * 0.08, 0.6) }}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 22 } }}
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <Link
            href={`/job/${job.id}`}
            className="font-display t-h2 font-bold leading-snug tracking-tight text-[var(--ink)] transition-colors hover:text-[var(--signal-deep)]"
          >
            {job.title}
          </Link>
          <p className="mt-1 t-sm text-[var(--ink-soft)]">
            {job.company}
            <span className="mx-1.5 text-[var(--line-strong)]">·</span>
            {job.location}
            {job.remote && (
              <>
                <span className="mx-1.5 text-[var(--line-strong)]">·</span>
                <span className="font-semibold text-[var(--signal-deep)]">remote</span>
              </>
            )}
          </p>
        </div>
        <SignalMeter score={job.match.score} />
      </div>

      <p className="mt-4 rounded-[var(--r-sm)] bg-[var(--wash-teal)] px-4 py-3 t-sm leading-relaxed text-[var(--ink-soft)]">
        {job.match.reason}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        {job.salary && (
          <span className="num t-sm font-semibold text-[var(--ink)]">{job.salary}</span>
        )}
        {job.salary && job.tags.length > 0 && <span className="text-[var(--line-strong)]">·</span>}
        {job.tags.slice(0, 5).map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-4">
        <a href={job.url} target="_blank" rel="noreferrer" className="btn-signal">
          Apply
        </a>
        <button onClick={() => onToggleSave(job.id)} className="btn-ghost" aria-pressed={saved}>
          {saved ? "Saved ✓" : "Save"}
        </button>
        <span className="label-soft ml-auto">posted {postedAgo(job.postedDate)}</span>
      </div>
    </motion.article>
  );
}
