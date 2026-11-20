/**
 * Formats how long ago a timestamp was, e.g. "just now", "5 minutes ago", "2 days ago".
 */
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

export function formatRelativeTime(timestamp: number, now: number = Date.now(), locale = "en-AU"): string {
  const elapsed = now - timestamp;
  if (elapsed < 60_000) return "just now";
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, ms] of UNITS) {
    if (elapsed >= ms) return formatter.format(-Math.floor(elapsed / ms), unit);
  }
  return "just now";
}
