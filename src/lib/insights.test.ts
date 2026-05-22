/**
 * Health insights — pure-function tests against deriveInsights().
 *
 * Tests verify each rule's data-quantity floor (4 samples for weight trend,
 * 5 for sleep/steps, 3 for HR/body fat) and the exact threshold boundaries
 * (±0.3 kg delta, 6.5/8 h sleep, 5000/8000 steps, 65/85 bpm, ±0.5pp body fat,
 * 50%/100% hydration).
 *
 * No mocks — real HealthLog shapes, real deriveInsights, real arithmetic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deriveInsights } from "./insights";
import type { HealthLog } from "@/hooks/useHealth";

function log(date: string, fields: Partial<HealthLog> = {}): HealthLog {
  return {
    id: `log-${date}`,
    user_id: "u",
    log_date: date,
    weight_kg: null,
    body_fat_pct: null,
    lean_mass_kg: null,
    resting_hr: null,
    steps: null,
    sleep_hours: null,
    water_ml: null,
    food_calories_kcal: null,
    meal_log: null,
    notes: null,
    ...fields,
  };
}

/**
 * Build N logs at consecutive dates ending on `today`, each with the given field.
 * Used for filling `recent` (last 14) and `prev` (14–28).
 */
function nLogs(n: number, field: keyof HealthLog, values: number[], startDate: string): HealthLog[] {
  const out: HealthLog[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < n; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    out.push(log(d, { [field]: values[i % values.length] } as Partial<HealthLog>));
  }
  return out;
}

describe("deriveInsights — empty/insufficient data", () => {
  it("returns empty array for no logs", () => {
    expect(deriveInsights({ logs: [] })).toEqual([]);
  });

  it("ignores rules when sample size is below the floor (3 weights ≠ trend)", () => {
    const logs = [
      log("2026-05-01", { weight_kg: 80 }),
      log("2026-05-02", { weight_kg: 80 }),
      log("2026-05-03", { weight_kg: 80 }),
    ];
    const r = deriveInsights({ logs });
    expect(r.find(i => i.id === "weight_trend")).toBeUndefined();
  });
});

describe("deriveInsights — weight trend (>= 0.3kg delta with 4+ samples in both windows)", () => {
  it("fires a clear +0.5kg trend with trend=up", () => {
    // Threshold is Math.abs(delta) >= 0.3. We pick 0.5 to clear the IEEE-754
    // imprecision around exact 0.3 (80.3 - 80 = 0.299999... in FP).
    const logs: HealthLog[] = [];
    for (let i = 0; i < 14; i++) logs.push(log(`prev-${i}`, { weight_kg: 80 }));
    for (let i = 0; i < 14; i++) logs.push(log(`rec-${i}`, { weight_kg: 80.5 }));
    const r = deriveInsights({ logs });
    const wt = r.find(i => i.id === "weight_trend");
    expect(wt).toBeDefined();
    expect(wt?.trend).toBe("up");
    expect(wt?.title).toMatch(/up/i);
  });

  it("does NOT fire at 0.2kg delta (clearly below 0.3 threshold)", () => {
    const logs: HealthLog[] = [];
    for (let i = 0; i < 14; i++) logs.push(log(`prev-${i}`, { weight_kg: 80 }));
    for (let i = 0; i < 14; i++) logs.push(log(`rec-${i}`, { weight_kg: 80.2 }));
    const r = deriveInsights({ logs });
    expect(r.find(i => i.id === "weight_trend")).toBeUndefined();
  });

  it("downward trend fires with trend=down and weight-loss copy", () => {
    const logs: HealthLog[] = [];
    for (let i = 0; i < 14; i++) logs.push(log(`prev-${i}`, { weight_kg: 81 }));
    for (let i = 0; i < 14; i++) logs.push(log(`rec-${i}`, { weight_kg: 80 }));
    const r = deriveInsights({ logs });
    const wt = r.find(i => i.id === "weight_trend");
    expect(wt?.trend).toBe("down");
    expect(wt?.title).toMatch(/down/i);
  });
});

describe("deriveInsights — sleep buckets (5+ samples, mean < 6.5 vs 7–9)", () => {
  it("mean 5.5h fires sleep_low alert", () => {
    const logs = nLogs(5, "sleep_hours", [5, 6, 5, 6, 6], "2026-05-15");
    const r = deriveInsights({ logs });
    const s = r.find(i => i.id === "sleep_low");
    expect(s).toBeDefined();
    expect(s?.severity).toBe("alert");
  });

  it("mean 8h fires sleep_good", () => {
    const logs = nLogs(5, "sleep_hours", [8, 8, 8, 8, 8], "2026-05-15");
    const r = deriveInsights({ logs });
    expect(r.find(i => i.id === "sleep_good")).toBeDefined();
  });

  it("mean exactly 6.5 is in NEITHER bucket (low needs < 6.5, good needs >= 7)", () => {
    const logs = nLogs(5, "sleep_hours", [6.5, 6.5, 6.5, 6.5, 6.5], "2026-05-15");
    const r = deriveInsights({ logs });
    expect(r.find(i => i.id === "sleep_low")).toBeUndefined();
    expect(r.find(i => i.id === "sleep_good")).toBeUndefined();
  });

  it("only 4 sleep samples is below the 5-sample floor → no insight", () => {
    const logs = nLogs(4, "sleep_hours", [5, 5, 5, 5], "2026-05-15");
    const r = deriveInsights({ logs });
    expect(r.find(i => i.id === "sleep_low")).toBeUndefined();
  });
});

describe("deriveInsights — steps thresholds (< 5000 warning, >= 8000 good)", () => {
  it("mean 3000 steps fires steps_low warning", () => {
    const logs = nLogs(5, "steps", [3000, 3000, 3000, 3000, 3000], "2026-05-15");
    const r = deriveInsights({ logs });
    expect(r.find(i => i.id === "steps_low")?.severity).toBe("warning");
  });

  it("mean 10000 steps fires steps_good", () => {
    const logs = nLogs(5, "steps", [10000, 10000, 10000, 10000, 10000], "2026-05-15");
    const r = deriveInsights({ logs });
    expect(r.find(i => i.id === "steps_good")).toBeDefined();
  });

  it("mean 6000 is in the dead zone — no insight either way", () => {
    const logs = nLogs(5, "steps", [6000, 6000, 6000, 6000, 6000], "2026-05-15");
    const r = deriveInsights({ logs });
    expect(r.find(i => i.id === "steps_low")).toBeUndefined();
    expect(r.find(i => i.id === "steps_good")).toBeUndefined();
  });
});

describe("deriveInsights — resting heart rate (> 85 warning, <= 65 good)", () => {
  it("HR 95bpm fires hr_high warning", () => {
    const logs = nLogs(3, "resting_hr", [95, 95, 95], "2026-05-18");
    const r = deriveInsights({ logs });
    expect(r.find(i => i.id === "hr_high")?.severity).toBe("warning");
  });

  it("HR 60bpm fires hr_good", () => {
    const logs = nLogs(3, "resting_hr", [60, 60, 60], "2026-05-18");
    const r = deriveInsights({ logs });
    expect(r.find(i => i.id === "hr_good")).toBeDefined();
  });

  it("HR 85 exactly does NOT fire high (rule is > 85, not >=)", () => {
    const logs = nLogs(3, "resting_hr", [85, 85, 85], "2026-05-18");
    const r = deriveInsights({ logs });
    expect(r.find(i => i.id === "hr_high")).toBeUndefined();
  });
});

describe("deriveInsights — body fat trend (>= 0.5pp delta)", () => {
  it("+0.5pp fires bodyfat_trend with warning severity", () => {
    const logs: HealthLog[] = [];
    for (let i = 0; i < 14; i++) logs.push(log(`prev-${i}`, { body_fat_pct: 20 }));
    for (let i = 0; i < 14; i++) logs.push(log(`rec-${i}`, { body_fat_pct: 20.5 }));
    const r = deriveInsights({ logs });
    const bf = r.find(i => i.id === "bodyfat_trend");
    expect(bf).toBeDefined();
    expect(bf?.severity).toBe("warning");
  });

  it("-0.5pp fires with severity good", () => {
    const logs: HealthLog[] = [];
    for (let i = 0; i < 14; i++) logs.push(log(`prev-${i}`, { body_fat_pct: 21 }));
    for (let i = 0; i < 14; i++) logs.push(log(`rec-${i}`, { body_fat_pct: 20.5 }));
    const r = deriveInsights({ logs });
    expect(r.find(i => i.id === "bodyfat_trend")?.severity).toBe("good");
  });
});

describe("deriveInsights — hydration (today only, < 50% warning, >= 100% good)", () => {
  it("3 of 8 glasses (< 50%) fires water_low warning", () => {
    const r = deriveInsights({ logs: [], waterToday: 3, waterGoal: 8 });
    expect(r.find(i => i.id === "water_low")?.severity).toBe("warning");
  });

  it("8 of 8 glasses (>= 100%) fires water_good", () => {
    const r = deriveInsights({ logs: [], waterToday: 8, waterGoal: 8 });
    expect(r.find(i => i.id === "water_good")).toBeDefined();
  });

  it("50% exactly falls in the dead zone (rule is strictly < 50%)", () => {
    const r = deriveInsights({ logs: [], waterToday: 4, waterGoal: 8 });
    expect(r.find(i => i.id === "water_low")).toBeUndefined();
    expect(r.find(i => i.id === "water_good")).toBeUndefined();
  });

  it("waterToday 0 or undefined → no hydration insight (gate at line 191)", () => {
    expect(deriveInsights({ logs: [], waterToday: 0 }).find(i => i.id === "water_low")).toBeUndefined();
    expect(deriveInsights({ logs: [] }).find(i => i.id === "water_low")).toBeUndefined();
  });
});

describe("deriveInsights — engagement gap (recent < 3 logs and last log >= 5 days ago)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires when only 1 log and that log is 7 days old", () => {
    const logs = [log("2026-05-14", { weight_kg: 80 })];
    const r = deriveInsights({ logs });
    expect(r.find(i => i.id === "tracking_gap")).toBeDefined();
  });

  it("does NOT fire when last log is only 3 days old", () => {
    const logs = [log("2026-05-18", { weight_kg: 80 })];
    const r = deriveInsights({ logs });
    expect(r.find(i => i.id === "tracking_gap")).toBeUndefined();
  });
});

describe("deriveInsights — habit-based nudge (top category)", () => {
  it("fires when habitProfile.top_categories[0] is set AND recent.length >= 5", () => {
    const logs = nLogs(5, "weight_kg", [80, 80, 80, 80, 80], "2026-05-15");
    const r = deriveInsights({
      logs,
      habitProfile: { top_categories: [{ category: "running", count: 12 }] },
    });
    const h = r.find(i => i.id === "habit_running");
    expect(h).toBeDefined();
    expect(h?.description).toContain("12");
  });

  it("does NOT fire with only 4 recent logs (below the 5-floor)", () => {
    const logs = nLogs(4, "weight_kg", [80, 80, 80, 80], "2026-05-15");
    const r = deriveInsights({
      logs,
      habitProfile: { top_categories: [{ category: "yoga", count: 8 }] },
    });
    expect(r.find(i => i.id === "habit_yoga")).toBeUndefined();
  });
});
