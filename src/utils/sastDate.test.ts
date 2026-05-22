import { describe, it, expect } from "vitest";
import { getSASTDateKey, getSASTToday, getSASTEndOfDay } from "./sastDate";

describe("getSASTDateKey — UTC+2 civil date", () => {
  it("returns YYYY-MM-DD for a known UTC instant", () => {
    // 2026-05-21 10:00:00 UTC == 12:00 SAST, civil date 2026-05-21
    const d = new Date("2026-05-21T10:00:00Z");
    expect(getSASTDateKey(d)).toBe("2026-05-21");
  });

  it("rolls over to next civil date at 22:00 UTC (00:00 SAST)", () => {
    // 23:00 UTC on May 21 == 01:00 SAST on May 22 — the SAST civil date
    // must be May 22, NOT May 21. This is the exact bug the helper was
    // written to fix (water/streak tile showing stale day).
    const d = new Date("2026-05-21T23:00:00Z");
    expect(getSASTDateKey(d)).toBe("2026-05-22");
  });

  it("does NOT roll over at 21:59 UTC (still 23:59 SAST same day)", () => {
    const d = new Date("2026-05-21T21:59:00Z");
    expect(getSASTDateKey(d)).toBe("2026-05-21");
  });

  it("crosses year boundary correctly (31 Dec 23:00 UTC → 1 Jan)", () => {
    const d = new Date("2026-12-31T23:30:00Z");
    expect(getSASTDateKey(d)).toBe("2027-01-01");
  });

  it("crosses month boundary correctly (30 Apr 23:00 UTC → 1 May)", () => {
    const d = new Date("2026-04-30T23:00:00Z");
    expect(getSASTDateKey(d)).toBe("2026-05-01");
  });
});

describe("getSASTToday — midnight SAST as a Date", () => {
  it("produces an instant whose SAST civil date matches today's SAST date key", () => {
    const today = getSASTToday();
    expect(getSASTDateKey(today)).toBe(getSASTDateKey());
  });

  it("is at or before now", () => {
    expect(getSASTToday().getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("is within the last 24 hours", () => {
    const diff = Date.now() - getSASTToday().getTime();
    expect(diff).toBeGreaterThanOrEqual(0);
    expect(diff).toBeLessThan(24 * 60 * 60 * 1000);
  });
});

describe("getSASTEndOfDay", () => {
  it("returns an ISO timestamp on the same SAST civil date as the input", () => {
    const d = new Date("2026-05-21T10:00:00Z");
    const end = getSASTEndOfDay(d);
    expect(getSASTDateKey(new Date(end))).toBe("2026-05-21");
  });

  it("end-of-day is strictly later than the input", () => {
    const d = new Date("2026-05-21T10:00:00Z");
    expect(new Date(getSASTEndOfDay(d)).getTime()).toBeGreaterThan(d.getTime());
  });
});
