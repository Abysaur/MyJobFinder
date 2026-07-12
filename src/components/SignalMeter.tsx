"use client";
import { motion } from "framer-motion";

/**
 * The signature element. A job's match score as a rising liquid level — the
 * gauge fills with a spring, an amber gradient with a flowing surface sheen.
 * Bright when the fit runs high, cooling to muted grey-teal when it's low.
 */

function tone(score: number) {
  if (score >= 70)
    return { fill: "linear-gradient(90deg, var(--signal-deep), var(--signal))", color: "var(--signal)", label: "strong" };
  if (score >= 45)
    return { fill: "linear-gradient(90deg, var(--signal-deep), var(--signal-deep))", color: "var(--signal-deep)", label: "moderate" };
  return { fill: "linear-gradient(90deg, var(--signal-weak), var(--signal-weak))", color: "var(--signal-weak)", label: "faint" };
}

export function SignalMeter({
  score,
  size = "compact",
}: {
  score: number;
  size?: "compact" | "full";
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const t = tone(clamped);
  const full = size === "full";

  return (
    <div
      className={full ? "w-full" : "w-[132px] shrink-0"}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Fit ${clamped} of 100, ${t.label}`}
    >
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="label-soft">{full ? "fit level" : "fit"}</span>
        <span className="flex items-baseline gap-0.5">
          <motion.span
            className="num font-display font-bold leading-none"
            style={{ fontSize: full ? "clamp(2rem, 5vw, 2.75rem)" : "1.3rem", color: t.color }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {clamped}
          </motion.span>
          <span className="num label-soft">/100</span>
        </span>
      </div>

      <div className="gauge-track" style={full ? { height: 16 } : undefined}>
        <motion.div
          className="gauge-fill"
          style={{ background: t.fill }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18, mass: 0.9 }}
        />
      </div>

      {full && (
        <div className="mt-1.5 flex justify-between">
          <span className="num label-soft">0</span>
          <span className="num label-soft">50</span>
          <span className="num label-soft">100</span>
        </div>
      )}
    </div>
  );
}
