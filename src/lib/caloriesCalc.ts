/**
 * Daily calorie + macro recommendation.
 *
 * Uses the Mifflin-St Jeor equation for BMR (most accurate of the common
 * formulas — supersedes Harris-Benedict). TDEE = BMR × activity factor.
 *
 * Macros: default split is 30% protein / 45% carbs / 25% fat — sensible
 * baseline for general wellness. Active / strength users skew higher
 * protein; this returns the baseline and the UI can let users tweak.
 *
 *   1g protein = 4 kcal · 1g carb = 4 kcal · 1g fat = 9 kcal
 *
 * Source: Mifflin MD, et al. Am J Clin Nutr 1990;51(2):241-7.
 */

export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"        // desk job, little/no exercise
  | "light"            // 1–3 light sessions / week
  | "moderate"         // 3–5 sessions / week
  | "very"             // 6–7 sessions / week
  | "extra";           // hard physical job + training

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light:     1.375,
  moderate:  1.55,
  very:      1.725,
  extra:     1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job, little exercise)",
  light:     "Lightly active (1–3 days/week)",
  moderate:  "Moderately active (3–5 days/week)",
  very:      "Very active (6–7 days/week)",
  extra:     "Extra active (hard physical job + training)",
};

export interface RecommendationInput {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: Sex;
  activity: ActivityLevel;
  /** Goal modifier — "lose" cuts ~500 kcal/day, "gain" adds ~300 kcal/day,
   *  "maintain" returns TDEE unchanged. Capped to safe floors per WHO. */
  goal?: "lose" | "maintain" | "gain";
}

export interface Recommendation {
  bmr: number;      // Basal Metabolic Rate
  tdee: number;     // Total Daily Energy Expenditure (BMR × activity)
  calories: number; // Final daily target after goal modifier
  protein: number;  // grams
  carbs: number;    // grams
  fat: number;      // grams
  /** Floor / ceiling enforcement applied (true if we clamped). */
  clamped: boolean;
}

// Safety floors — never recommend below these regardless of math.
const MIN_CAL_FEMALE = 1200;
const MIN_CAL_MALE   = 1500;

/**
 * Compute BMR using Mifflin-St Jeor.
 *   Male:   10×kg + 6.25×cm − 5×age + 5
 *   Female: 10×kg + 6.25×cm − 5×age − 161
 */
export function bmr({ weightKg, heightCm, ageYears, sex }: Omit<RecommendationInput, "activity" | "goal">): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export function recommendDailyCalories(input: RecommendationInput): Recommendation {
  const rawBmr = bmr(input);
  const rawTdee = Math.round(rawBmr * ACTIVITY_MULTIPLIERS[input.activity]);

  let calories = rawTdee;
  switch (input.goal ?? "maintain") {
    case "lose":     calories -= 500; break;  // ~0.5 kg/week deficit
    case "gain":     calories += 300; break;  // lean gain rate
    case "maintain": default: /* no-op */ break;
  }

  // Enforce safety floors
  const floor = input.sex === "male" ? MIN_CAL_MALE : MIN_CAL_FEMALE;
  const clamped = calories < floor;
  if (clamped) calories = floor;

  // Macros: 30/45/25 baseline
  const protein = Math.round((calories * 0.30) / 4);
  const carbs   = Math.round((calories * 0.45) / 4);
  const fat     = Math.round((calories * 0.25) / 9);

  return { bmr: rawBmr, tdee: rawTdee, calories, protein, carbs, fat, clamped };
}

/** Compute age in years from an ISO date string (YYYY-MM-DD). Null on invalid input. */
export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob + (dob.length === 10 ? "T00:00:00Z" : ""));
  if (Number.isNaN(d.getTime())) return null;
  const ageMs = Date.now() - d.getTime();
  const years = ageMs / (365.2425 * 24 * 60 * 60 * 1000);
  return years > 0 && years < 130 ? Math.floor(years) : null;
}
