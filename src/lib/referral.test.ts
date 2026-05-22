/**
 * Referral helpers — pure-logic tests for code generation and the
 * localStorage / sessionStorage round-trips.
 *
 * resolveReferralCode / recordReferralSignup / activateReferralSubscription
 * are DB-coupled (call supabase) and are out of scope here.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  generateReferralCode,
  capturePendingReferralCode,
  getPendingReferralCode,
  clearPendingReferralCode,
  getStoredRefCode,
  setStoredRefCode,
  clearStoredRefCode,
} from "./referral";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  // Reset jsdom URL so capturePendingReferralCode starts clean each test
  window.history.replaceState({}, "", "/");
});

describe("generateReferralCode — deterministic with profileId", () => {
  it("same name + profileId always produces the same code", () => {
    const a = generateReferralCode("Oko Macanda", "profile-abc-123");
    const b = generateReferralCode("Oko Macanda", "profile-abc-123");
    expect(a).toBe(b);
  });

  it("format is BION-XXX9999 (BION dash, 3 letters, 4 digits)", () => {
    const code = generateReferralCode("Oko Macanda", "profile-abc-123");
    expect(code).toMatch(/^BION-[A-Z]{3}\d{4}$/);
  });

  it("name prefix uses first 3 letters, uppercased, non-letters stripped", () => {
    const code = generateReferralCode("Oko-Macanda 2.0", "profile-xyz");
    expect(code.slice(0, 8)).toBe("BION-OKO");
  });

  it("short names get padded with X to make 3 letters", () => {
    const code = generateReferralCode("Al", "profile-1");
    expect(code.slice(5, 8)).toBe("ALX");
  });

  it("empty name falls back to 'USR'", () => {
    const code = generateReferralCode("", "profile-2");
    expect(code.slice(5, 8)).toBe("USR");
  });

  it("non-empty but all-non-letter name strips to empty then pads with XXX", () => {
    const code = generateReferralCode("12345", "profile-2");
    // `userName || "USR"` returns "12345" (truthy), then replace strips all
    // → empty string, substring(0,3) → "", padEnd(3,"X") → "XXX".
    expect(code.slice(5, 8)).toBe("XXX");
  });

  it("different profileIds produce different suffix digits (in general)", () => {
    const a = generateReferralCode("Oko", "profile-a");
    const b = generateReferralCode("Oko", "profile-b");
    // Both share the OKO prefix; suffix should usually differ.
    // Not a hard rule (4-digit hash can collide), but it should hold
    // for distinct seed strings of this length.
    expect(a).not.toBe(b);
  });
});

describe("generateReferralCode — localStorage fallback when no profileId", () => {
  it("first call without profileId stores a code, subsequent calls return the same one", () => {
    const a = generateReferralCode("Oko");
    const b = generateReferralCode("Oko");
    expect(a).toBe(b);
    expect(localStorage.getItem("bion_referral_code")).toBe(a);
  });

  it("fallback code matches BION-XXX9999 format too", () => {
    const code = generateReferralCode("Oko");
    expect(code).toMatch(/^BION-[A-Z]{3}\d{4}$/);
  });
});

describe("capturePendingReferralCode — reads ?ref / ?r from URL into sessionStorage", () => {
  it("captures ?ref=CODE on initial visit", () => {
    window.history.replaceState({}, "", "/?ref=BION-OKO1234");
    expect(capturePendingReferralCode()).toBe("BION-OKO1234");
    expect(sessionStorage.getItem("bion_pending_referral")).toBe("BION-OKO1234");
  });

  it("captures the short alias ?r=CODE", () => {
    window.history.replaceState({}, "", "/?r=BION-ABC4321");
    expect(capturePendingReferralCode()).toBe("BION-ABC4321");
  });

  it("with no URL param, returns whatever is already in sessionStorage (persist across nav)", () => {
    sessionStorage.setItem("bion_pending_referral", "BION-OLD1111");
    window.history.replaceState({}, "", "/no-param");
    expect(capturePendingReferralCode()).toBe("BION-OLD1111");
  });

  it("with neither URL param nor stored value, returns null", () => {
    window.history.replaceState({}, "", "/");
    expect(capturePendingReferralCode()).toBeNull();
  });

  it("getPendingReferralCode reads what capture stored", () => {
    window.history.replaceState({}, "", "/?ref=BION-XYZ5555");
    capturePendingReferralCode();
    expect(getPendingReferralCode()).toBe("BION-XYZ5555");
  });

  it("clearPendingReferralCode removes the stored value", () => {
    sessionStorage.setItem("bion_pending_referral", "BION-OLD1111");
    clearPendingReferralCode();
    expect(getPendingReferralCode()).toBeNull();
  });
});

describe("setStoredRefCode / getStoredRefCode (Ranger attribution, localStorage)", () => {
  it("set → get round-trips the code", () => {
    setStoredRefCode("BION-OKO1234");
    expect(getStoredRefCode()).toBe("BION-OKO1234");
  });

  it("setStoredRefCode trims whitespace and uppercases", () => {
    setStoredRefCode("  bion-oko1234  ");
    expect(getStoredRefCode()).toBe("BION-OKO1234");
  });

  it("clearStoredRefCode removes the value", () => {
    setStoredRefCode("BION-OKO1234");
    clearStoredRefCode();
    expect(getStoredRefCode()).toBeNull();
  });

  it("getStoredRefCode returns null when nothing is stored", () => {
    expect(getStoredRefCode()).toBeNull();
  });
});
