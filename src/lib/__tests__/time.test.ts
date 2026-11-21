import { formatRelativeTime } from "../time";

const now = Date.UTC(2026, 10, 20, 12, 0, 0);

describe("formatRelativeTime", () => {
  it.each([
    [now - 5_000, "just now"],
    [now - 5 * 60_000, "5 minutes ago"],
    [now - 60 * 60_000, "1 hour ago"],
    [now - 3 * 3_600_000, "3 hours ago"],
    [now - 24 * 3_600_000, "yesterday"],
    [now - 3 * 86_400_000, "3 days ago"],
    [now + 10_000, "just now"],
  ])("%s → %s", (timestamp, expected) => {
    expect(formatRelativeTime(timestamp, now)).toBe(expected);
  });
});
