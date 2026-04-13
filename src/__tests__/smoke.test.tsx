/**
 * BION Smoke Tests
 * Verifies critical components render without crashing.
 * Run: npm test
 */
import { describe, it, expect, vi } from "vitest";

// Mock modules that depend on browser APIs
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: () => Promise.resolve({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }), order: () => ({ limit: () => Promise.resolve({ data: [] }) }) }), order: () => ({ limit: () => Promise.resolve({ data: [] }) }), in: () => Promise.resolve({ data: [] }) }),
      insert: () => Promise.resolve({ data: null }),
      update: () => ({ eq: () => Promise.resolve({ data: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null }) }),
      upsert: () => Promise.resolve({ data: null }),
    }),
    channel: () => ({ on: () => ({ subscribe: () => {} }), subscribe: () => {} }),
    removeChannel: () => {},
    storage: { from: () => ({ upload: () => Promise.resolve({}), createSignedUrl: () => Promise.resolve({ data: { signedUrl: "" } }) }) },
  },
}));

vi.mock("@/data/bion_pretoria_data.json", () => ({
  default: { providers: [], bookings: [] },
}));

describe("BION Smoke Tests", () => {
  it("subscription module exports correctly", async () => {
    const sub = await import("@/lib/subscription");
    expect(sub.PROVIDER_TIER_FEATURES).toBeDefined();
    expect(sub.CLIENT_TIER_FEATURES).toBeDefined();
    expect(sub.PROVIDER_TIER_PRICING.free.monthly).toBe(0);
    expect(sub.PROVIDER_TIER_PRICING.pro.monthly).toBe(499);
    expect(sub.PROVIDER_TIER_PRICING.elite.monthly).toBe(999);
    expect(sub.CLIENT_TIER_PRICING.premium.monthly).toBe(29);
  });

  it("provider free tier has booking enabled", async () => {
    const { PROVIDER_TIER_FEATURES } = await import("@/lib/subscription");
    expect(PROVIDER_TIER_FEATURES.free.bookingManagement).toBe(true);
    expect(PROVIDER_TIER_FEATURES.free.advanceBooking).toBe(true);
  });

  it("client free tier has health tracking enabled", async () => {
    const { CLIENT_TIER_FEATURES } = await import("@/lib/subscription");
    expect(CLIENT_TIER_FEATURES.free.healthTracking).toBe(true);
    expect(CLIENT_TIER_FEATURES.free.mealPlanTracking).toBe(false); // premium only
  });

  it("reminders engine generates without crashing", async () => {
    const { generateReminders, getActiveReminders, getReminderSummary } = await import("@/lib/reminders");
    const reminders = generateReminders();
    expect(Array.isArray(reminders)).toBe(true);

    const active = getActiveReminders();
    expect(Array.isArray(active)).toBe(true);

    const summary = getReminderSummary();
    expect(typeof summary).toBe("string");
  });

  it("WhatsApp URL generation works", async () => {
    const { getBookingConfirmationUrl, getReferralShareUrl } = await import("@/lib/whatsapp");

    const bookingUrl = getBookingConfirmationUrl({
      providerName: "Test Provider",
      serviceName: "PT Session",
      date: "2026-04-15",
      time: "10:00",
    });
    expect(bookingUrl).toContain("wa.me");
    expect(bookingUrl).toContain("Test%20Provider");

    const referralUrl = getReferralShareUrl("BION-TEST1234", "Oko");
    expect(referralUrl).toContain("wa.me");
    expect(referralUrl).toContain("BION-TEST1234");
  });

  it("auth module exports demo accounts", async () => {
    const { DEMO_ACCOUNTS } = await import("@/lib/auth");
    expect(DEMO_ACCOUNTS).toHaveLength(4);
    expect(DEMO_ACCOUNTS[0].id).toBe("demo_client");
    expect(DEMO_ACCOUNTS[0].profileId).toBe("demo_client");
    expect(DEMO_ACCOUNTS[1].role).toBe("provider");
  });

  it("email templates generate valid HTML", async () => {
    const { bookingConfirmationEmail, welcomeEmail, paymentReceiptEmail } = await import("@/lib/emailTemplates");

    const booking = bookingConfirmationEmail({
      clientName: "Test",
      providerName: "Provider",
      service: "PT",
      date: "2026-04-15",
      time: "10:00",
      price: "R300",
      bookingRef: "b123",
    });
    expect(booking.subject).toContain("Booking Confirmed");
    expect(booking.html).toContain("<!DOCTYPE html>");
    expect(booking.html).toContain("Provider");
    expect(booking.html).toContain("bionhealth.co.za");

    const welcome = welcomeEmail({ name: "Oko", role: "client" });
    expect(welcome.subject).toContain("Welcome");
    expect(welcome.html).toContain("Oko");

    const receipt = paymentReceiptEmail({
      clientName: "Test",
      providerName: "Provider",
      service: "PT",
      servicePrice: "R300",
      bookingFee: "R15",
      totalPaid: "R315",
      date: "2026-04-15",
      transactionRef: "txn_123",
    });
    expect(receipt.subject).toContain("R315");
    expect(receipt.html).toContain("R315");
  });

  it("subscription pricing is correct for R29 model", async () => {
    const { CLIENT_TIER_PRICING, PROVIDER_TIER_PRICING } = await import("@/lib/subscription");
    // Client Premium is R29 (not R99 or R100)
    expect(CLIENT_TIER_PRICING.premium.monthly).toBe(29);
    expect(CLIENT_TIER_PRICING.premium.yearly).toBe(290);
    // Provider unchanged
    expect(PROVIDER_TIER_PRICING.pro.monthly).toBe(499);
    expect(PROVIDER_TIER_PRICING.elite.monthly).toBe(999);
  });
});
