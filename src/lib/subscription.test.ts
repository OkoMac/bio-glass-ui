/**
 * Subscription pure-logic tests.
 *
 * Covers:
 *   - hasFeature(): tier × feature gate matrix
 *   - isSubscriptionActive(): status + trialEnd compare
 *   - getTrialDaysRemaining(): ms→day math, never-negative floor
 *   - getTierDisplayName(): label resolution per user type
 *   - createDefaultSubscription / createTrialSubscription: shape + features wiring
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  hasFeature,
  isSubscriptionActive,
  getTrialDaysRemaining,
  getTierDisplayName,
  createDefaultSubscription,
  createTrialSubscription,
  PROVIDER_TIER_FEATURES,
  CLIENT_TIER_FEATURES,
  PROVIDER_TIER_PRICING,
  CLIENT_TIER_PRICING,
  type Subscription,
} from "./subscription";

function sub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    userType: "provider",
    tier: "free",
    status: "active",
    currentPeriodEnd: null,
    trialEnd: null,
    features: PROVIDER_TIER_FEATURES.free,
    ...overrides,
  };
}

describe("hasFeature — null/missing subscription", () => {
  it("returns false when subscription is null (logged-out users get nothing)", () => {
    expect(hasFeature(null, "messaging")).toBe(false);
    expect(hasFeature(null, "advancedAnalytics")).toBe(false);
    expect(hasFeature(null, "healthTracking")).toBe(false);
  });
});

describe("hasFeature — provider tier gating", () => {
  it("free provider: only booking + management, no messaging/analytics", () => {
    const s = sub({ tier: "free", features: PROVIDER_TIER_FEATURES.free });
    expect(hasFeature(s, "advanceBooking")).toBe(true);
    expect(hasFeature(s, "bookingManagement")).toBe(true);
    expect(hasFeature(s, "messaging")).toBe(false);
    expect(hasFeature(s, "advancedAnalytics")).toBe(false);
    expect(hasFeature(s, "whiteLabel")).toBe(false);
  });

  it("pro provider: messaging + basic analytics, but NOT advanced analytics or white-label", () => {
    const s = sub({ tier: "pro", features: PROVIDER_TIER_FEATURES.pro });
    expect(hasFeature(s, "messaging")).toBe(true);
    expect(hasFeature(s, "basicAnalytics")).toBe(true);
    expect(hasFeature(s, "advancedAnalytics")).toBe(false);
    expect(hasFeature(s, "whiteLabel")).toBe(false);
    expect(hasFeature(s, "apiAccess")).toBe(false);
  });

  it("elite provider: all advanced + white-label + API access", () => {
    const s = sub({ tier: "elite", features: PROVIDER_TIER_FEATURES.elite });
    expect(hasFeature(s, "advancedAnalytics")).toBe(true);
    expect(hasFeature(s, "whiteLabel")).toBe(true);
    expect(hasFeature(s, "apiAccess")).toBe(true);
    expect(hasFeature(s, "dedicatedAccountManager")).toBe(true);
  });

  it("maxListings: free=1, pro=5, elite=0 (unlimited sentinel)", () => {
    expect(PROVIDER_TIER_FEATURES.free.maxListings).toBe(1);
    expect(PROVIDER_TIER_FEATURES.pro.maxListings).toBe(5);
    expect(PROVIDER_TIER_FEATURES.elite.maxListings).toBe(0); // 0 = unlimited
  });
});

describe("hasFeature — client tier gating", () => {
  it("free client: basic health tracking only, no advanced metrics", () => {
    const s = sub({ userType: "client", tier: "free", features: CLIENT_TIER_FEATURES.free });
    expect(hasFeature(s, "healthTracking")).toBe(true);
    expect(hasFeature(s, "advancedMetrics")).toBe(false);
    expect(hasFeature(s, "mealPlanTracking")).toBe(false);
    expect(hasFeature(s, "biometricTracking")).toBe(false);
  });

  it("premium client: all health features unlocked", () => {
    const s = sub({ userType: "client", tier: "premium", features: CLIENT_TIER_FEATURES.premium });
    expect(hasFeature(s, "healthTracking")).toBe(true);
    expect(hasFeature(s, "advancedMetrics")).toBe(true);
    expect(hasFeature(s, "mealPlanTracking")).toBe(true);
    expect(hasFeature(s, "biometricTracking")).toBe(true);
    expect(hasFeature(s, "unlimitedHealthHistory")).toBe(true);
  });
});

describe("isSubscriptionActive — status + trialEnd date compare", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("null subscription is not active", () => {
    expect(isSubscriptionActive(null)).toBe(false);
  });

  it("active status without dates is active", () => {
    expect(isSubscriptionActive(sub({ status: "active" }))).toBe(true);
  });

  it("trial ending in 1 day is still active", () => {
    const tomorrow = new Date("2026-05-22T12:00:00Z");
    expect(isSubscriptionActive(sub({ status: "trial", trialEnd: tomorrow }))).toBe(true);
  });

  it("trial that ended yesterday is NOT active (the silent-grant guard)", () => {
    const yesterday = new Date("2026-05-20T12:00:00Z");
    expect(isSubscriptionActive(sub({ status: "trial", trialEnd: yesterday }))).toBe(false);
  });

  it("canceled / past_due / expired are not active regardless of dates", () => {
    expect(isSubscriptionActive(sub({ status: "canceled" }))).toBe(false);
    expect(isSubscriptionActive(sub({ status: "past_due" }))).toBe(false);
    expect(isSubscriptionActive(sub({ status: "expired" }))).toBe(false);
  });
});

describe("getTrialDaysRemaining — ms→day math, never below 0", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for non-trial subscriptions", () => {
    expect(getTrialDaysRemaining(null)).toBeNull();
    expect(getTrialDaysRemaining(sub({ status: "active" }))).toBeNull();
    expect(getTrialDaysRemaining(sub({ status: "trial", trialEnd: null }))).toBeNull();
  });

  it("rounds UP partial days (Math.ceil) so a 25h trial reads 2 days, not 1", () => {
    const trialEnd = new Date("2026-05-22T13:00:00Z"); // 25h from now
    expect(getTrialDaysRemaining(sub({ status: "trial", trialEnd }))).toBe(2);
  });

  it("ended trial returns 0 (clamped, never negative)", () => {
    const yesterday = new Date("2026-05-20T12:00:00Z");
    expect(getTrialDaysRemaining(sub({ status: "trial", trialEnd: yesterday }))).toBe(0);
  });

  it("14-day trial reads 14 days", () => {
    const fourteenDays = new Date("2026-06-04T12:00:00Z");
    expect(getTrialDaysRemaining(sub({ status: "trial", trialEnd: fourteenDays }))).toBe(14);
  });
});

describe("getTierDisplayName — labels per user type", () => {
  it("provider tiers: Free / Pro / Elite", () => {
    expect(getTierDisplayName("free", "provider")).toBe("Free");
    expect(getTierDisplayName("pro", "provider")).toBe("Pro");
    expect(getTierDisplayName("elite", "provider")).toBe("Elite");
  });

  it("client tiers: Free / Premium", () => {
    expect(getTierDisplayName("free", "client")).toBe("Free");
    expect(getTierDisplayName("premium", "client")).toBe("Premium");
  });
});

describe("createDefaultSubscription / createTrialSubscription — shape and features wiring", () => {
  it("default provider subscription is free + active with no dates", () => {
    const s = createDefaultSubscription("provider");
    expect(s.tier).toBe("free");
    expect(s.status).toBe("active");
    expect(s.trialEnd).toBeNull();
    expect(s.features).toEqual(PROVIDER_TIER_FEATURES.free);
  });

  it("default client subscription is free + active with client features", () => {
    const s = createDefaultSubscription("client");
    expect(s.userType).toBe("client");
    expect(s.tier).toBe("free");
    expect(s.features).toEqual(CLIENT_TIER_FEATURES.free);
    expect(s.features.healthTracking).toBe(true); // free clients get basic tracking
  });

  it("trial subscription gets the requested tier's feature set", () => {
    const s = createTrialSubscription("provider", "pro", 14);
    expect(s.status).toBe("trial");
    expect(s.tier).toBe("pro");
    expect(s.features).toEqual(PROVIDER_TIER_FEATURES.pro);
    expect(s.trialEnd).toBeInstanceOf(Date);
  });

  it("trial subscription end is `trialDays` days from now (default 14)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T12:00:00Z"));
    const s = createTrialSubscription();
    // 14 days later
    expect(s.trialEnd?.toISOString().slice(0, 10)).toBe("2026-06-04");
    vi.useRealTimers();
  });

  it("currentPeriodEnd === trialEnd on a fresh trial sub (one date, two pointers)", () => {
    const s = createTrialSubscription("client", "premium", 7);
    expect(s.currentPeriodEnd).toEqual(s.trialEnd);
  });
});

describe("Pricing tables — Pro/Elite yearly = monthly × 12 × 0.80 (20% discount)", () => {
  it("Pro monthly R499 / yearly R4790 (rounded)", () => {
    expect(PROVIDER_TIER_PRICING.pro.monthly).toBe(499);
    expect(PROVIDER_TIER_PRICING.pro.yearly).toBe(Math.round(499 * 12 * 0.80));
  });

  it("Elite monthly R999 / yearly R9590 (rounded)", () => {
    expect(PROVIDER_TIER_PRICING.elite.monthly).toBe(999);
    expect(PROVIDER_TIER_PRICING.elite.yearly).toBe(Math.round(999 * 12 * 0.80));
  });

  it("Client Premium R29/mo, R290/yr (~17% discount)", () => {
    expect(CLIENT_TIER_PRICING.premium.monthly).toBe(29);
    expect(CLIENT_TIER_PRICING.premium.yearly).toBe(290);
  });
});
