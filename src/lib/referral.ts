import { supabase } from "@/integrations/supabase/client";

// ── Ranger share-link attribution ────────────────────────────────────────
//
// Rangers share:   https://bionhealth.co.za/welcome?ref=<CODE>
//
// Helpers below are deliberately independent of the legacy
// `sessionStorage["bion_pending_referral"]` key (used for user-to-user
// refs) so Ranger attribution survives tab switches, OAuth redirects,
// and multi-step signup flows where sessionStorage is wiped.
const RANGER_LS_KEY = "bion_ref_code";

export function getStoredRefCode(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(RANGER_LS_KEY); } catch { return null; }
}

export function setStoredRefCode(code: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(RANGER_LS_KEY, code.trim().toUpperCase()); } catch {}
}

export function clearStoredRefCode(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(RANGER_LS_KEY); } catch {}
}


/**
 * Deterministic referral code based on user name + profile ID.
 * Format: BION-XXX9999 (3 letters + 4 digits)
 * Same user always gets same code.
 */
export function generateReferralCode(userName: string, profileId?: string): string {
  const prefix = (userName || "USR").replace(/[^A-Za-z]/g, "").substring(0, 3).toUpperCase().padEnd(3, "X");
  // Hash profile ID to a 4-digit number for consistency
  if (profileId) {
    let hash = 0;
    for (let i = 0; i < profileId.length; i++) hash = ((hash << 5) - hash) + profileId.charCodeAt(i);
    const rand = Math.abs(hash) % 10000;
    return `BION-${prefix}${rand.toString().padStart(4, "0")}`;
  }
  // Fallback: localStorage
  const KEY = "bion_referral_code";
  const stored = localStorage.getItem(KEY);
  if (stored) return stored;
  const rand = Math.floor(1000 + Math.random() * 9000);
  const code = `BION-${prefix}${rand}`;
  localStorage.setItem(KEY, code);
  return code;
}

export function getOrCreateReferralCode(userName: string, profileId?: string): string {
  return generateReferralCode(userName, profileId);
}

/**
 * Extract referral code from URL query param on page load.
 * Supports ?ref=CODE or ?r=CODE
 * Stores in sessionStorage for use during signup.
 */
export function capturePendingReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const code = (params.get("ref") ?? params.get("r") ?? "").trim();
  if (code) {
    sessionStorage.setItem("bion_pending_referral", code);
    return code;
  }
  return sessionStorage.getItem("bion_pending_referral");
}

export function getPendingReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("bion_pending_referral");
}

export function clearPendingReferralCode(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("bion_pending_referral");
}

/**
 * Parse a referral code to find the referrer's profile ID.
 * Queries Supabase by matching the deterministic hash against all profiles.
 * Returns null if not found.
 */
export async function resolveReferralCode(code: string): Promise<{ profileId: string; name: string } | null> {
  if (!code.startsWith("BION-")) return null;

  // Fetch all profiles — in production this would need a dedicated lookup table
  // For now, iterate through profiles and match generated code
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .limit(10000);

  if (!profiles) return null;

  for (const p of profiles as any[]) {
    if (generateReferralCode(p.full_name, p.id) === code) {
      return { profileId: p.id, name: p.full_name };
    }
  }
  return null;
}

/**
 * Record a referral in the database when a new user signs up with a code.
 * Awards 50 activity points to both referrer and referred.
 * Called after signup is complete.
 */
export async function recordReferralSignup(
  referralCode: string,
  newUserProfileId: string,
): Promise<{ ok: boolean; referrerId?: string; error?: string }> {
  const resolved = await resolveReferralCode(referralCode);
  if (!resolved) return { ok: false, error: "Invalid referral code" };
  if (resolved.profileId === newUserProfileId) return { ok: false, error: "Cannot refer yourself" };

  // Insert referral record
  const { error: refError } = await supabase.from("referrals").insert({
    referrer_id: resolved.profileId,
    referred_id: newUserProfileId,
    referral_code: referralCode,
    signup_bonus_awarded: true,
    subscription_active: false,
  });

  if (refError) {
    // Duplicate key = user was already referred, ignore
    if (refError.code === "23505") return { ok: false, error: "Already referred" };
    return { ok: false, error: refError.message };
  }

  // Award 50 points to both users
  await Promise.all([
    supabase.from("activity_points").insert({
      user_id: resolved.profileId,
      points: 50,
      action: "referral_signup",
      reference_id: newUserProfileId,
    }),
    supabase.from("activity_points").insert({
      user_id: newUserProfileId,
      points: 50,
      action: "signup",
      reference_id: resolved.profileId,
    }),
  ]);

  clearPendingReferralCode();
  return { ok: true, referrerId: resolved.profileId };
}

/**
 * When a referred user subscribes to Premium, activate the subscription flag
 * and start recurring R5.80/month commission for the referrer.
 */
export async function activateReferralSubscription(referredProfileId: string): Promise<void> {
  const { data: referral } = await supabase
    .from("referrals")
    .select("id, referrer_id")
    .eq("referred_id", referredProfileId)
    .maybeSingle();

  if (!referral) return;

  // Mark active
  await supabase.from("referrals").update({ subscription_active: true }).eq("id", (referral as any).id);

  // Create this month's commission entry
  const month = new Date().toISOString().substring(0, 7); // YYYY-MM
  await supabase.from("commission_earnings").insert({
    user_id: (referral as any).referrer_id,
    referral_id: (referral as any).id,
    amount_rand: 5.80,
    month,
    status: "pending",
  });

  // Also credit earnings ledger
  await supabase.from("earnings_transactions").insert({
    user_id: (referral as any).referrer_id,
    amount_rand: 5.80,
    type: "referral_commission",
    reference_id: (referral as any).id,
    source_user_id: referredProfileId,
    description: `Premium subscription commission (${month})`,
  });
}
