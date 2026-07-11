export function MatchBadge({ score }: { score: number }) {
  const color = score >= 75 ? "bg-green-100 text-green-800"
    : score >= 50 ? "bg-yellow-100 text-yellow-800"
    : "bg-gray-100 text-gray-700";
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${color}`}>{score}% match</span>;
}
