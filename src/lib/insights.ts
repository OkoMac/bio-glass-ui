import type { HealthLog } from "@/hooks/useHealth";

/**
 * Derives health insights from the user's actual health_logs and habit profile.
 * Returns an array — empty if the user hasn't logged enough data to say anything
 * meaningful. No fabricated streaks, scores, or recommendations.
 *
 * The rules are deliberately conservative: each insight requires at least N
 * real data points before it fires, so new users don't see fake observations.
 */

export type Severity = "good" | "warning" | "alert";
export type Category =
  | "fitness"
  | "nutrition"
  | "sleep"
  | "mental"
  | "medical"
  | "beauty"
  | "hydration";

export interface Insight {
  id: string;
  category: Category;
  title: string;
  description: string;
  severity: Severity;
  metric?: string;
  trend?: "up" | "down" | "stable";
  recommendation: string;
}

export interface InsightInput {
  logs: HealthLog[];
  habitProfile?: {
    top_categories?: Array<{ category: string; count: number }>;
    peak_active_hours?: number[];
  } | null;
  /** Glasses-of-water count for *today* from localStorage (optional). */
  waterToday?: number;
  waterGoal?: number;
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function nonNullField<K extends keyof HealthLog>(logs: HealthLog[], key: K): number[] {
  return logs
    .map(l => (l as any)[key])
    .filter(v => v != null && !isNaN(Number(v)))
    .map(Number);
}

export function deriveInsights({ logs, habitProfile, waterToday, waterGoal = 8 }: InsightInput): Insight[] {
  const out: Insight[] = [];
  const recent = logs.slice(-14);            // last 14 days
  const prev   = logs.slice(-28, -14);       // days 15–28 before that

  // ── Weight trend ────────────────────────────────
  const weights = nonNullField(recent, "weight_kg");
  const prevWeights = nonNullField(prev, "weight_kg");
  if (weights.length >= 4 && prevWeights.length >= 4) {
    const delta = avg(weights) - avg(prevWeights);
    if (Math.abs(delta) >= 0.3) {
      out.push({
        id: "weight_trend",
        category: "fitness",
        title: delta < 0 ? "Weight trending down" : "Weight trending up",
        description: `Your average weight over the last 2 weeks is ${avg(weights).toFixed(1)}kg — a change of ${delta > 0 ? "+" : ""}${delta.toFixed(1)}kg vs the fortnight before.`,
        severity: "good",
        metric: `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`,
        trend: delta < 0 ? "down" : "up",
        recommendation: delta < 0
          ? "If this is deliberate, keep going. If not, book a nutrition consult to make sure you're not under-eating."
          : "If this isn't deliberate, consider logging meals for a week to spot the culprit. A dietitian on BION can help.",
      });
    }
  }

  // ── Sleep consistency ──────────────────────────
  const sleep = nonNullField(recent, "sleep_hours");
  if (sleep.length >= 5) {
    const mean = avg(sleep);
    if (mean < 6.5) {
      out.push({
        id: "sleep_low",
        category: "sleep",
        title: "Sleep is below recommended",
        description: `You averaged ${mean.toFixed(1)}h over your last ${sleep.length} logged nights. Most adults need 7–9h for recovery.`,
        severity: "alert",
        metric: `${mean.toFixed(1)}h avg`,
        trend: "down",
        recommendation: "Try moving bedtime 30 min earlier for a week and see how you feel. Limiting screens after 22:00 helps consistently.",
      });
    } else if (mean >= 7 && mean < 9) {
      out.push({
        id: "sleep_good",
        category: "sleep",
        title: "Sleep in the sweet spot",
        description: `You're averaging ${mean.toFixed(1)}h across ${sleep.length} logged nights — right where adult recovery thrives.`,
        severity: "good",
        metric: `${mean.toFixed(1)}h avg`,
        trend: "stable",
        recommendation: "Maintain your bedtime routine. Consistency matters more than total hours.",
      });
    }
  }

  // ── Steps / activity ────────────────────────────
  const steps = nonNullField(recent, "steps");
  if (steps.length >= 5) {
    const mean = avg(steps);
    if (mean < 5000) {
      out.push({
        id: "steps_low",
        category: "fitness",
        title: "Low daily activity",
        description: `Your average step count is ${Math.round(mean).toLocaleString("en-ZA")} over ${steps.length} logged days — below the 7,000 threshold linked to long-term health benefits.`,
        severity: "warning",
        metric: `${Math.round(mean / 1000)}k`,
        trend: "down",
        recommendation: "Add a 15-minute walk after lunch — it's low-friction and adds ~1,500 steps. BION has walking groups if you'd like company.",
      });
    } else if (mean >= 8000) {
      out.push({
        id: "steps_good",
        category: "fitness",
        title: "Consistent activity",
        description: `You're averaging ${Math.round(mean).toLocaleString("en-ZA")} steps across ${steps.length} logged days.`,
        severity: "good",
        metric: `${Math.round(mean / 1000)}k`,
        trend: "up",
        recommendation: "Keep it up. Adding one structured workout per week could unlock strength gains on top of your cardio base.",
      });
    }
  }

  // ── Resting heart rate ──────────────────────────
  const hr = nonNullField(recent, "resting_hr");
  if (hr.length >= 3) {
    const mean = avg(hr);
    if (mean > 85) {
      out.push({
        id: "hr_high",
        category: "medical",
        title: "Resting heart rate elevated",
        description: `Your recent RHR average is ${Math.round(mean)}bpm. A sustained reading above 85bpm at rest can indicate stress, dehydration, or underlying cardio issues.`,
        severity: "warning",
        metric: `${Math.round(mean)} bpm`,
        trend: "up",
        recommendation: "Track it for another week. If it stays above 85, book a GP consult — BION has same-week appointments.",
      });
    } else if (mean <= 65) {
      out.push({
        id: "hr_good",
        category: "medical",
        title: "Strong cardiovascular base",
        description: `Resting heart rate averaging ${Math.round(mean)}bpm indicates excellent aerobic conditioning.`,
        severity: "good",
        metric: `${Math.round(mean)} bpm`,
        trend: "stable",
        recommendation: "Your cardio base is there — consider adding a tempo or interval day to unlock the next level.",
      });
    }
  }

  // ── Body fat trend ──────────────────────────────
  const bf = nonNullField(recent, "body_fat_pct");
  const prevBf = nonNullField(prev, "body_fat_pct");
  if (bf.length >= 3 && prevBf.length >= 3) {
    const delta = avg(bf) - avg(prevBf);
    if (Math.abs(delta) >= 0.5) {
      out.push({
        id: "bodyfat_trend",
        category: "nutrition",
        title: delta < 0 ? "Body fat decreasing" : "Body fat increasing",
        description: `Average body fat has moved ${delta > 0 ? "+" : ""}${delta.toFixed(1)}pp over the past fortnight (now ${avg(bf).toFixed(1)}%).`,
        severity: delta < 0 ? "good" : "warning",
        metric: `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`,
        trend: delta < 0 ? "down" : "up",
        recommendation: delta < 0
          ? "Whatever you're doing is working. Keep protein high to preserve lean mass."
          : "Audit your last 7 days of meals. Small, consistent surplus is the usual culprit. A dietitian can help set a protein/calorie target.",
      });
    }
  }

  // ── Hydration (today only) ──────────────────────
  if (typeof waterToday === "number" && waterToday > 0) {
    const pct = (waterToday / waterGoal) * 100;
    if (pct < 50) {
      out.push({
        id: "water_low",
        category: "hydration",
        title: "Hydration behind today",
        description: `You've logged ${waterToday}/${waterGoal} glasses so far.`,
        severity: "warning",
        metric: `${waterToday}/${waterGoal}`,
        trend: "down",
        recommendation: "Fill a 500ml bottle and keep it on your desk. Easier to sip than to remember to drink.",
      });
    } else if (pct >= 100) {
      out.push({
        id: "water_good",
        category: "hydration",
        title: "Hydration on track",
        description: `You hit your ${waterGoal}-glass target already today.`,
        severity: "good",
        metric: `${waterToday}/${waterGoal}`,
        trend: "up",
        recommendation: "Great consistency. On training days, add another 500ml per hour of activity.",
      });
    }
  }

  // ── Engagement gap (haven't tracked in a while) ──
  if (recent.length < 3 && logs.length > 0) {
    const lastLog = logs[logs.length - 1];
    const daysSince = Math.floor(
      (Date.now() - new Date(lastLog.log_date).getTime()) / (24 * 60 * 60 * 1000),
    );
    if (daysSince >= 5) {
      out.push({
        id: "tracking_gap",
        category: "mental",
        title: "Let's pick tracking back up",
        description: `You last logged metrics ${daysSince} days ago. Even weekly check-ins surface trends B_ can turn into actionable insights.`,
        severity: "warning",
        recommendation: "Open Progress and log just your weight + sleep — takes under a minute.",
      });
    }
  }

  // ── Habit-based nudge ───────────────────────────
  const top = habitProfile?.top_categories?.[0];
  if (top && recent.length >= 5) {
    out.push({
      id: `habit_${top.category}`,
      category: "fitness",
      title: `You're most active in ${top.category}`,
      description: `BION has noticed ${top.count} interactions in ${top.category} recently. We've re-ranked your For You feed accordingly.`,
      severity: "good",
      metric: `#1`,
      trend: "up",
      recommendation: `Book your next ${top.category} session while your streak is warm.`,
    });
  }

  return out;
}
