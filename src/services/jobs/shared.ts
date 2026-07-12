/** Shared normalization helpers used by every job provider. */

/** Only allow http(s) links through; anything else becomes a safe placeholder. */
export function safeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : "#";
}

/** Parse a provider date (ISO, yyyy-mm-dd, unix-ish) into an ISO string, falling back to now. */
export function toIsoDate(input?: string | number | null): string {
  if (input !== undefined && input !== null && input !== "") {
    const d = typeof input === "number" ? new Date(input) : new Date(input);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

/** Heuristic remote detection — providers rarely expose a reliable flag. */
export function inferRemote(text: string): boolean {
  return /\bremote\b|home[\s-]?office|work from home|telearbeit|mobiles arbeiten/i.test(text);
}

/** Format a salary range into a display string, or undefined when nothing is known. */
export function formatSalary(
  min: number | undefined,
  max: number | undefined,
  symbol = "€",
): string | undefined {
  const lo = typeof min === "number" && Number.isFinite(min) ? min : undefined;
  const hi = typeof max === "number" && Number.isFinite(max) ? max : undefined;
  if (lo === undefined && hi === undefined) return undefined;
  const fmt = (n: number) => `${symbol}${Math.round(n).toLocaleString("en-US")}`;
  if (lo !== undefined && hi !== undefined && lo !== hi) return `${fmt(lo)}–${fmt(hi)}`;
  return fmt((lo ?? hi) as number);
}
