import { describe, it, expect } from "vitest";
import { formatRelativeTime, localDateKey } from "./relativeTime";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;

function isoAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

describe("formatRelativeTime — buckets", () => {
  it("returns 'just now' for < 60 seconds", () => {
    expect(formatRelativeTime(isoAgo(5 * SECOND))).toBe("just now");
    expect(formatRelativeTime(isoAgo(59 * SECOND))).toBe("just now");
  });

  it("returns 'N min ago' for < 60 minutes", () => {
    expect(formatRelativeTime(isoAgo(5 * MINUTE))).toBe("5 min ago");
    expect(formatRelativeTime(isoAgo(59 * MINUTE))).toBe("59 min ago");
  });

  it("returns 'Nh ago' for < 24 hours", () => {
    expect(formatRelativeTime(isoAgo(3 * HOUR))).toBe("3h ago");
    expect(formatRelativeTime(isoAgo(23 * HOUR))).toBe("23h ago");
  });

  it("returns 'Nd ago' for 1..7 days", () => {
    expect(formatRelativeTime(isoAgo(1 * DAY + 1000))).toBe("1d ago");
    expect(formatRelativeTime(isoAgo(7 * DAY))).toBe("7d ago");
  });

  it("returns an absolute YYYY-MM-DD for > 7 days", () => {
    const out = formatRelativeTime(isoAgo(30 * DAY));
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(out).not.toMatch(/ago/);
  });
});

describe("formatRelativeTime — boundary edges", () => {
  it("at the 60-second boundary flips from 'just now' to '1 min ago'", () => {
    expect(formatRelativeTime(isoAgo(60 * SECOND))).toBe("1 min ago");
  });

  it("at the 60-minute boundary flips to '1h ago'", () => {
    expect(formatRelativeTime(isoAgo(60 * MINUTE))).toBe("1h ago");
  });

  it("at the 24-hour boundary flips to '1d ago'", () => {
    expect(formatRelativeTime(isoAgo(24 * HOUR))).toBe("1d ago");
  });
});

describe("formatRelativeTime — defensive cases", () => {
  it("returns '' for an empty string", () => {
    expect(formatRelativeTime("")).toBe("");
  });

  it("returns '' for an unparseable date", () => {
    expect(formatRelativeTime("not-a-date")).toBe("");
  });

  it("clock skew / future timestamp returns 'just now', not a negative bucket", () => {
    const futureIso = new Date(Date.now() + 60 * SECOND).toISOString();
    expect(formatRelativeTime(futureIso)).toBe("just now");
  });
});

describe("localDateKey", () => {
  it("returns YYYY-MM-DD for a known local Date", () => {
    const d = new Date(2026, 4, 21); // May 21 2026 local — month is 0-indexed
    expect(localDateKey(d)).toBe("2026-05-21");
  });

  it("pads single-digit month and day", () => {
    const d = new Date(2026, 0, 5); // Jan 5
    expect(localDateKey(d)).toBe("2026-01-05");
  });
});
