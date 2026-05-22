import { describe, it, expect } from "vitest";
import {
  bmr,
  recommendDailyCalories,
  ageFromDob,
  ACTIVITY_MULTIPLIERS,
} from "./caloriesCalc";

describe("bmr — Mifflin-St Jeor", () => {
  it("computes BMR for a 30y/180cm/75kg male", () => {
    // 10*75 + 6.25*180 − 5*30 + 5 = 750 + 1125 − 150 + 5 = 1730
    expect(bmr({ weightKg: 75, heightCm: 180, ageYears: 30, sex: "male" })).toBe(1730);
  });

  it("computes BMR for a 30y/165cm/60kg female", () => {
    // 10*60 + 6.25*165 − 5*30 − 161 = 600 + 1031.25 − 150 − 161 = 1320.25 -> rounded 1320
    expect(bmr({ weightKg: 60, heightCm: 165, ageYears: 30, sex: "female" })).toBe(1320);
  });

  it("sex difference is exactly 166 kcal at identical inputs (5 − (−161))", () => {
    const m = bmr({ weightKg: 70, heightCm: 175, ageYears: 25, sex: "male" });
    const f = bmr({ weightKg: 70, heightCm: 175, ageYears: 25, sex: "female" });
    expect(m - f).toBe(166);
  });
});

describe("recommendDailyCalories — TDEE & goal modifiers", () => {
  it("applies the sedentary multiplier (1.2) when activity=sedentary", () => {
    const r = recommendDailyCalories({
      weightKg: 75, heightCm: 180, ageYears: 30, sex: "male", activity: "sedentary",
    });
    // BMR 1730 * 1.2 = 2076
    expect(r.bmr).toBe(1730);
    expect(r.tdee).toBe(2076);
    expect(r.calories).toBe(2076);
    expect(r.clamped).toBe(false);
  });

  it("cuts 500 kcal for 'lose' goal", () => {
    const r = recommendDailyCalories({
      weightKg: 75, heightCm: 180, ageYears: 30, sex: "male", activity: "moderate", goal: "lose",
    });
    // 1730 * 1.55 = 2682 (rounded), − 500 = 2182
    expect(r.tdee).toBe(2682);
    expect(r.calories).toBe(2182);
  });

  it("adds 300 kcal for 'gain' goal", () => {
    const r = recommendDailyCalories({
      weightKg: 75, heightCm: 180, ageYears: 30, sex: "male", activity: "moderate", goal: "gain",
    });
    expect(r.calories).toBe(2682 + 300);
  });

  it("maintain is a no-op", () => {
    const r = recommendDailyCalories({
      weightKg: 75, heightCm: 180, ageYears: 30, sex: "male", activity: "moderate", goal: "maintain",
    });
    expect(r.calories).toBe(r.tdee);
  });
});

describe("recommendDailyCalories — safety floors", () => {
  it("clamps female below-floor calories to 1200 and sets clamped=true", () => {
    // Tiny female, extreme deficit — math would go below 1200.
    const r = recommendDailyCalories({
      weightKg: 40, heightCm: 150, ageYears: 70, sex: "female", activity: "sedentary", goal: "lose",
    });
    expect(r.calories).toBe(1200);
    expect(r.clamped).toBe(true);
  });

  it("clamps male below-floor calories to 1500 and sets clamped=true", () => {
    const r = recommendDailyCalories({
      weightKg: 50, heightCm: 160, ageYears: 80, sex: "male", activity: "sedentary", goal: "lose",
    });
    expect(r.calories).toBe(1500);
    expect(r.clamped).toBe(true);
  });

  it("does not clamp when above the floor", () => {
    const r = recommendDailyCalories({
      weightKg: 75, heightCm: 180, ageYears: 30, sex: "male", activity: "moderate", goal: "lose",
    });
    expect(r.clamped).toBe(false);
  });
});

describe("recommendDailyCalories — macros sum approximately to calories", () => {
  it("protein*4 + carbs*4 + fat*9 is within 5 kcal of the calorie target", () => {
    const r = recommendDailyCalories({
      weightKg: 75, heightCm: 180, ageYears: 30, sex: "male", activity: "moderate",
    });
    const kcalFromMacros = r.protein * 4 + r.carbs * 4 + r.fat * 9;
    expect(Math.abs(kcalFromMacros - r.calories)).toBeLessThanOrEqual(5);
  });
});

describe("ACTIVITY_MULTIPLIERS — fixed clinical constants", () => {
  it("matches the published Mifflin/Katch-McArdle activity multipliers", () => {
    expect(ACTIVITY_MULTIPLIERS).toEqual({
      sedentary: 1.2,
      light:     1.375,
      moderate:  1.55,
      very:      1.725,
      extra:     1.9,
    });
  });
});

describe("ageFromDob", () => {
  it("returns null on missing/empty input", () => {
    expect(ageFromDob(null)).toBeNull();
    expect(ageFromDob(undefined)).toBeNull();
    expect(ageFromDob("")).toBeNull();
  });

  it("returns null on garbage input", () => {
    expect(ageFromDob("not-a-date")).toBeNull();
  });

  it("computes age correctly for a DOB known to be ~30 years ago", () => {
    const thirtyYearsAgo = new Date();
    thirtyYearsAgo.setUTCFullYear(thirtyYearsAgo.getUTCFullYear() - 30);
    thirtyYearsAgo.setUTCMonth(0, 1);  // Jan 1, definitely well past
    const iso = thirtyYearsAgo.toISOString().slice(0, 10);
    const age = ageFromDob(iso);
    // Allow ±1 year tolerance for the floor/leap interaction.
    expect(age === 30 || age === 29 || age === 31).toBe(true);
  });

  it("returns null for an absurd far-future date", () => {
    expect(ageFromDob("2200-01-01")).toBeNull();
  });
});
