import { SignalMeter } from "@/components/SignalMeter";

/** Kept for existing call sites — renders the signal meter. */
export function MatchBadge({ score }: { score: number }) {
  return <SignalMeter score={score} size="compact" />;
}
