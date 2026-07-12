"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { getJobById } from "@/lib/jobStore";
import { SignalMeter } from "@/components/SignalMeter";

export default function JobDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const job = getJobById(id);

  if (!job) {
    return (
      <main className="flex-1" style={{ paddingBlock: "var(--space-section)" }}>
        <div className="panel p-10 text-center">
          <p className="eyebrow mb-2">not loaded</p>
          <p className="t-sm text-[var(--ink-soft)]">
            This job isn&rsquo;t loaded in this session.{" "}
            <Link href="/" className="font-semibold text-[var(--signal-deep)] underline underline-offset-2">
              Run a search first
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring" as const, stiffness: 110, damping: 20, delay },
  });

  return (
    <main className="flex-1" style={{ paddingBlock: "var(--space-section)" }}>
      <Link href="/" className="label-soft transition-colors hover:text-[var(--signal-deep)]">
        ← back to results
      </Link>

      <motion.div className="panel mt-4" style={{ padding: "clamp(1.5rem, 4vw, 2.25rem)" }} {...fade(0)}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1
              className="font-display font-bold leading-[1.05] tracking-tight text-[var(--ink)]"
              style={{ fontSize: "var(--fs-h1)" }}
            >
              {job.title}
            </h1>
            <p className="mt-2 t-body text-[var(--ink-soft)]">
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
            {job.salary && (
              <p className="num mt-2 t-body font-semibold text-[var(--ink)]">{job.salary}</p>
            )}
          </div>
          <div className="sm:w-56 sm:shrink-0">
            <SignalMeter score={job.match.score} size="full" />
          </div>
        </div>
      </motion.div>

      <div className="mt-[var(--gap)] grid grid-cols-1 gap-[var(--gap)] md:grid-cols-2">
        <motion.section className="panel" style={{ padding: "clamp(1.25rem, 3vw, 1.75rem)" }} {...fade(0.08)}>
          <p className="eyebrow mb-3">why this matches</p>
          <p className="t-sm leading-relaxed text-[var(--ink-soft)]">{job.match.reason}</p>
        </motion.section>

        <motion.section className="panel" style={{ padding: "clamp(1.25rem, 3vw, 1.75rem)" }} {...fade(0.16)}>
          <p className="eyebrow mb-3">skills to highlight or learn</p>
          {job.match.missingSkills.length > 0 ? (
            <ul className="space-y-2.5">
              {job.match.missingSkills.map((s) => (
                <li key={s} className="flex items-center gap-2.5 t-sm text-[var(--ink)]">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: "var(--signal)" }}
                    aria-hidden
                  />
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-sm text-[var(--ink-soft)]">
              Nothing obvious missing — your résumé already covers the essentials.
            </p>
          )}
        </motion.section>
      </div>

      <motion.section
        className="panel mt-[var(--gap)]"
        style={{ padding: "clamp(1.25rem, 3vw, 1.75rem)" }}
        {...fade(0.24)}
      >
        <p className="eyebrow mb-3">full description</p>
        <p className="whitespace-pre-line t-sm leading-relaxed text-[var(--ink-soft)]">
          {job.description}
        </p>
      </motion.section>

      <motion.div className="mt-6" {...fade(0.3)}>
        <a href={job.url} target="_blank" rel="noreferrer" className="btn-signal">
          Apply on site →
        </a>
      </motion.div>
    </main>
  );
}
