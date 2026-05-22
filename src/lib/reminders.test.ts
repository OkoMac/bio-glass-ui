/**
 * Reminder engine tests — time-window logic, localStorage round-trips,
 * dismissal persistence.
 *
 * The reminder engine uses local hours from new Date().getHours() (system
 * timezone, not SAST), but date keys come from getSASTDateKey which
 * resolves SAST date. Tests run under jsdom (vitest env "jsdom") so
 * localStorage is real. We control the clock with vi.setSystemTime.
 *
 * Each test resets localStorage so reminders state doesn't leak between
 * assertions. We test the boundary hours where the rules switch on/off,
 * since that's where off-by-one bugs hide.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateReminders, getActiveReminders, dismissReminder } from "./reminders";

/**
 * Override the local hour by fixing the wall-clock UTC moment such that
 * the local timezone (Africa/Johannesburg under jsdom or whatever the
 * test machine reports) sees the desired hour. We default to 02:00 UTC
 * offset adjustment for SAST-like behaviour.
 *
 * Simpler approach: use Date constructor injection — vi.setSystemTime
 * accepts any Date and getHours() is local. We pick local-clock instants
 * so getHours() returns what we want regardless of machine tz.
 */
function setLocalHour(hour: number, opts: { dayOfWeek?: number; minute?: number } = {}) {
  // Construct a Date whose LOCAL time-of-day matches `hour`.
  // dayOfWeek 0=Sun, 1=Mon, ... 6=Sat. Default to Monday.
  const targetDow = opts.dayOfWeek ?? 1;
  // Anchor: 2026-05-18 was a Monday. Walk to targetDow.
  const anchor = new Date(2026, 4, 18); // Monday 2026-05-18 local
  const diff = (targetDow - 1 + 7) % 7;
  anchor.setDate(anchor.getDate() + diff);
  anchor.setHours(hour, opts.minute ?? 0, 0, 0);
  vi.setSystemTime(anchor);
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("generateReminders — medication time windows", () => {
  it("morning meds fire at local hour 6 (window start)", () => {
    localStorage.setItem("bion_routines", JSON.stringify([{ type: "medication", title: "Vitamin D" }]));
    setLocalHour(6);
    const rs = generateReminders();
    expect(rs.some(r => r.type === "medication" && r.title === "Morning Medication")).toBe(true);
  });

  it("morning meds do NOT fire at hour 5 (one hour before window)", () => {
    localStorage.setItem("bion_routines", JSON.stringify([{ type: "medication", title: "Vitamin D" }]));
    setLocalHour(5);
    const rs = generateReminders();
    expect(rs.some(r => r.type === "medication" && r.title === "Morning Medication")).toBe(false);
  });

  it("morning meds do NOT fire at hour 10 (window end is exclusive)", () => {
    localStorage.setItem("bion_routines", JSON.stringify([{ type: "medication", title: "Vitamin D" }]));
    setLocalHour(10);
    const rs = generateReminders();
    expect(rs.some(r => r.type === "medication" && r.title === "Morning Medication")).toBe(false);
  });

  it("evening meds fire at hour 19, not at 22", () => {
    localStorage.setItem("bion_routines", JSON.stringify([{ type: "medication", title: "Magnesium" }]));
    setLocalHour(19);
    expect(generateReminders().some(r => r.title === "Evening Medication")).toBe(true);
    setLocalHour(22);
    expect(generateReminders().some(r => r.title === "Evening Medication")).toBe(false);
  });
});

describe("generateReminders — workout schedule", () => {
  it("fires on a scheduled day during 6-17 local time", () => {
    // Day-of-week 1 = Monday → dayNames[1] = "Mon"
    localStorage.setItem("bion_routines", JSON.stringify([
      { id: "w1", type: "workout", title: "Upper body", schedule: ["Mon", "Wed", "Fri"] },
    ]));
    setLocalHour(12, { dayOfWeek: 1 }); // Monday noon
    const rs = generateReminders();
    expect(rs.some(r => r.type === "workout" && r.title === "Upper body")).toBe(true);
  });

  it("does NOT fire on a non-scheduled day", () => {
    localStorage.setItem("bion_routines", JSON.stringify([
      { id: "w1", type: "workout", title: "Upper body", schedule: ["Mon", "Wed", "Fri"] },
    ]));
    setLocalHour(12, { dayOfWeek: 2 }); // Tuesday → "Tue" not in schedule
    expect(generateReminders().some(r => r.type === "workout")).toBe(false);
  });

  it("does NOT fire at hour 18 (window end is exclusive)", () => {
    localStorage.setItem("bion_routines", JSON.stringify([
      { id: "w1", type: "workout", title: "Upper body", schedule: ["Mon"] },
    ]));
    setLocalHour(18, { dayOfWeek: 1 });
    expect(generateReminders().some(r => r.type === "workout")).toBe(false);
  });
});

describe("generateReminders — beauty (Sun/Wed only, 18-20)", () => {
  it("fires Wednesday at 19:00", () => {
    localStorage.setItem("bion_routines", JSON.stringify([{ type: "beauty", title: "Face mask" }]));
    setLocalHour(19, { dayOfWeek: 3 });
    expect(generateReminders().some(r => r.type === "beauty")).toBe(true);
  });

  it("does NOT fire Monday at 19:00", () => {
    localStorage.setItem("bion_routines", JSON.stringify([{ type: "beauty", title: "Face mask" }]));
    setLocalHour(19, { dayOfWeek: 1 });
    expect(generateReminders().some(r => r.type === "beauty")).toBe(false);
  });
});

describe("generateReminders — sleep reminder fires at hour >= 22", () => {
  it("fires at 22:00", () => {
    setLocalHour(22);
    expect(generateReminders().some(r => r.type === "sleep")).toBe(true);
  });

  it("does NOT fire at 21:59 (local hour is still 21)", () => {
    setLocalHour(21, { minute: 59 });
    expect(generateReminders().some(r => r.type === "sleep")).toBe(false);
  });

  it("still fires at 23:00", () => {
    setLocalHour(23);
    expect(generateReminders().some(r => r.type === "sleep")).toBe(true);
  });
});

describe("dismissReminder + getActiveReminders — round trip via localStorage", () => {
  it("dismissed reminder is marked dismissed: true in the next generateReminders call", () => {
    setLocalHour(22);
    const before = generateReminders().find(r => r.type === "sleep")!;
    expect(before.dismissed).toBe(false);

    dismissReminder(before.id);

    const after = generateReminders().find(r => r.type === "sleep")!;
    expect(after.dismissed).toBe(true);
  });

  it("getActiveReminders filters out dismissed ones", () => {
    setLocalHour(22);
    const all1 = generateReminders();
    const sleepRem = all1.find(r => r.type === "sleep")!;

    expect(getActiveReminders().some(r => r.id === sleepRem.id)).toBe(true);
    dismissReminder(sleepRem.id);
    expect(getActiveReminders().some(r => r.id === sleepRem.id)).toBe(false);
  });

  it("dismissals are scoped to the SAST date (a new day shows the reminder again)", () => {
    // Day 1 at 22:00 local — but the dismissal key uses SAST date.
    // We just need two different SAST date keys.
    setLocalHour(22);
    const day1Reminder = generateReminders().find(r => r.type === "sleep")!;
    dismissReminder(day1Reminder.id);
    expect(getActiveReminders().some(r => r.type === "sleep")).toBe(false);

    // Advance the clock by 25 hours — definitely a new SAST date.
    const next = new Date(Date.now() + 25 * 60 * 60 * 1000);
    vi.setSystemTime(next);
    // The id includes the SAST date, so a new day = new id = not in dismissed set
    expect(getActiveReminders().some(r => r.type === "sleep")).toBe(true);
  });
});

describe("generateReminders — degrades gracefully on bad localStorage", () => {
  it("malformed JSON in bion_routines does not throw", () => {
    localStorage.setItem("bion_routines", "{not valid json");
    setLocalHour(8);
    expect(() => generateReminders()).not.toThrow();
  });

  it("no routines key at all → returns whatever non-routine reminders fire (or empty)", () => {
    setLocalHour(13); // outside med/sleep/skincare/wellness windows
    const rs = generateReminders();
    expect(Array.isArray(rs)).toBe(true);
  });
});
