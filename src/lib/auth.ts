import { supabase } from "@/integrations/supabase/client";
import { Subscription, createDefaultSubscription, PROVIDER_TIER_FEATURES, CLIENT_TIER_FEATURES } from "./subscription";

export type UserRole = "client" | "provider" | "admin" | "corporate" | "sales_rep";

export interface BioUser {
  id?: string;          // Supabase auth user id (undefined for demo accounts)
  profileId?: string;   // profiles.id — FK used in bookings, messages, bionpoints, etc.
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  /**
   * Profile cover banner. Stored server-side at profiles.cover_image_url so
   * it survives uninstall + cross-device sign-in. localStorage is only a
   * hot cache.
   */
  coverImage?: string;
  /** Stored at profiles.bio. Free-text user bio shown on their profile. */
  bio?: string;
  /** Stored at profiles.phone. */
  phone?: string;
  /** Stored at profiles.location (free text). */
  location?: string;
  /**
   * B1-9: system-wide pseudonym (e.g. B-STNV6S). Used as the default
   * identifier in official artefacts. Always defined for real users
   * (assigned by Postgres trigger on profile insert).
   */
  bionId?: string;
  socialLinks?: {
    website?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
  // Subscription info (for providers)
  subscription?: Subscription;
}

const KEY = "bio_user";

export function getStoredUser(): BioUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: BioUser): void {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function removeUser(): void {
  localStorage.removeItem(KEY);
}

// ── Supabase helpers ────────────────────────────────────────────────

/** Fetch profile + role from DB and return a BioUser */
export async function fetchUserProfile(supabaseUserId: string): Promise<BioUser | null> {
  try {
    // `profile` is reassigned below in the backend-fallback branch; the other
    // two are not, but prefer-const flags individual names in destructuring
    // without seeing the shared `let`. Disable for this line.
    // eslint-disable-next-line prefer-const
    let [{ data: profile }, { data: roleRows }, { data: authData }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, avatar_url, cover_image_url, phone, location, bion_id" as any).eq("user_id", supabaseUserId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", supabaseUserId),
      supabase.auth.getUser(),
    ]);

    // Backend fallback — when the anon-client read returns no profile or
    // a profile with an empty name, the most likely cause is RLS hiding
    // it (or a previous-session full_name that never propagated). Hit
    // the service-role-backed /api/profiles/me endpoint to get the
    // authoritative row. Reported 2026-05-06 by Oko: gate save persisted
    // server-side but the home banner kept saying "display name isn't set".
    const needsFallback = !profile || !((profile as any)?.full_name);
    if (needsFallback) {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const tok = session?.access_token;
        if (tok) {
          const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
          const r = await fetch(`${API}/api/profiles/me`, { headers: { Authorization: `Bearer ${tok}` } });
          const j = await r.json();
          if (j.ok && j.data) {
            profile = j.data;
          }
        }
      } catch { /* network blip — fall through with whatever we had */ }
    }
    // Get the first role from the roles table (admin > provider > client priority)
    const rolePriority = ["admin", "provider", "corporate", "sales_rep", "client"];
    const dbRoles = (roleRows ?? []).map((r: any) => r.role as string);
    const roleRow = { role: rolePriority.find(r => dbRoles.includes(r)) ?? dbRoles[0] };

    // Role priority — DATABASE FIRST.
    // Per architecture review §3.6 (2026-05-05): localStorage is editable
    // by anyone with browser access. While the API rejects unauthorised
    // actions server-side, UI rendering decisions made on localStorage
    // role can reveal admin UI components, enable phishing surfaces, and
    // hint at internal feature architecture. Reversed priority:
    //   1) user_roles table — server source of truth
    //   2) user_metadata.bio_role — signup-time hint, may be stale
    //   3) Stored switched role — UI convenience for known-good roles ONLY,
    //      and only when it's a non-elevated downgrade (e.g. provider-as-
    //      client view). Elevation via localStorage is rejected.
    //   4) fallback to client
    const storedUser = getStoredUser();
    const switchedRole = storedUser?.id === supabaseUserId ? storedUser?.role : undefined;
    const dbRole = roleRow?.role as UserRole | undefined;
    const metaRole = authData.user?.user_metadata?.bio_role as UserRole | undefined;
    // Only honour a switched role if the DB role permits it (i.e. it's a
    // non-elevation). Otherwise the DB role wins. This prevents a user
    // editing localStorage to "promote" themselves to admin / provider
    // UI surfaces. Server-side checks already block actions, but this
    // closes the visual phishing surface.
    const ROLE_RANK: Record<UserRole, number> = {
      client:    0,
      sales_rep: 1,
      corporate: 2,
      provider:  3,
      admin:     4,
    };
    const baseRole: UserRole = dbRole ?? metaRole ?? "client";
    const switchedAllowed = switchedRole && ROLE_RANK[switchedRole] <= ROLE_RANK[baseRole];
    const role: UserRole = switchedAllowed ? switchedRole : baseRole;

    // First-time OAuth users (Google / etc.) have no profile row yet — create
    // one on the fly so hooks that depend on profileId don't crash and so we
    // have a stable identity for bookings, favourites, and wallet lookups.
    let profileId = profile?.id;
    let profileName = profile?.full_name;
    let profileEmail = profile?.email;
    let profileAvatar = profile?.avatar_url;
    const profileCover = (profile as any)?.cover_image_url ?? undefined;

    if (!profile && authData.user) {
      // Google/Apple OAuth provides full_name in user_metadata.
      // If Google doesn't send a name, leave it as an empty string —
      // the Index.tsx banner will prompt them to set it.
      const oauthName = (authData.user.user_metadata?.full_name as string | undefined)
        ?? (authData.user.user_metadata?.name as string | undefined)
        ?? "";
      const fallbackAvatar = (authData.user.user_metadata?.avatar_url as string | undefined)
        ?? (authData.user.user_metadata?.picture as string | undefined);
      try {
        // OAuth users default to client role → immediately verified
        const oauthRole = (authData.user.user_metadata?.bio_role as string) ?? role;
        const providerStatus = oauthRole === "provider" ? "pending_verification" : "verified";
        const { data: created } = await supabase
          .from("profiles")
          .upsert({
            user_id: supabaseUserId,
            full_name: oauthName,
            email: authData.user.email,
            avatar_url: fallbackAvatar,
            provider_status: providerStatus,
          }, { onConflict: "user_id" })
          .select("id, full_name, email, avatar_url")
          .single();
        profileId = (created as any)?.id;
        profileName = (created as any)?.full_name;
        profileEmail = (created as any)?.email;
        profileAvatar = (created as any)?.avatar_url;
      } catch (err) {
        // Don't block sign-in if profile creation fails — caller still gets a
        // usable BioUser and can retry on their next action. Log loud
        // (was dev-only): a failure here means OAuth users land without
        // a profileId and downstream queries silently return nothing.
        console.error("[auth] profile upsert failed:", err);
      }
    }

    // Name resolution — bulletproof against the "stale-cache wipe-out"
    // bug Oko hit 2026-05-06:
    //   1. Prefer profile.full_name (DB / backend fallback).
    //   2. Fall back to auth user_metadata.full_name (OAuth signup hint).
    //   3. NEVER downgrade a non-empty cached name to "" when the same
    //      session user_id is signing in again — that's how the home
    //      banner kept saying "set your name" even though the DB had it.
    const metaName = (authData.user?.user_metadata?.full_name as string | undefined)
      ?? (authData.user?.user_metadata?.name as string | undefined)
      ?? "";
    let resolvedName = (profileName ?? "").trim() || metaName.trim() || "";
    if (!resolvedName && storedUser?.id === supabaseUserId && (storedUser?.name ?? "").trim()) {
      // Last-ditch: keep the cached value rather than overwrite with empty.
      // The eager-refetch effect in AuthContext will retry the backend
      // shortly — until it succeeds, the user sees their real name.
      resolvedName = storedUser.name.trim();
    }

    const user: BioUser = {
      id:         supabaseUserId,
      profileId:  profileId ?? undefined,
      name:       resolvedName,
      email:      profileEmail ?? authData.user?.email ?? "",
      role,
      avatar:     profileAvatar ?? undefined,
      coverImage: profileCover ?? undefined,
      bio:        (profile as any)?.bio ?? undefined,
      phone:      (profile as any)?.phone ?? undefined,
      location:   (profile as any)?.location ?? undefined,
      bionId:     (profile as any)?.bion_id ?? undefined,
    };
    
    // Add subscription based on user role
    if (role === 'provider') {
      user.subscription = createDefaultSubscription('provider');
      
      // Demo accounts get pro tier for showcasing features
      if (user.email.includes('demo') || user.name.includes('Demo')) {
        user.subscription = {
          userType: 'provider',
          tier: 'pro',
          status: 'active',
          currentPeriodEnd: null,
          trialEnd: null,
          features: PROVIDER_TIER_FEATURES.pro
        };
      }
    } else if (role === 'client') {
      user.subscription = createDefaultSubscription('client');
      
      // Demo client accounts get premium tier for showcasing features
      if (user.email.includes('demo') || user.name.includes('Demo')) {
        user.subscription = {
          userType: 'client',
          tier: 'premium',
          status: 'active',
          currentPeriodEnd: null,
          trialEnd: null,
          features: CLIENT_TIER_FEATURES.premium
        };
      }
    }
    
    return user;
  } catch {
    return null;
  }
}

/** Sign in with Supabase email/password */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ user: BioUser | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { user: null, error: error?.message ?? "Login failed" };
  const user = await fetchUserProfile(data.user.id);
  return { user, error: null };
}

/** Sign up with email/password, then create profile + role rows.
 *  Uses backend admin API to create user with email pre-confirmed
 *  (phone OTP already verified the user's identity). */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  role: UserRole,
  phone?: string,
  ageVerified?: boolean,
  dateOfBirth?: string,        // ISO yyyy-mm-dd; required for KYC since 2026-05-06
  country?: string,            // ISO-3166-1 alpha-2; required since 2026-05-06
): Promise<{ user: BioUser | null; error: string | null }> {
  const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

  // Split fullName so we can send firstName / lastName to the backend.
  // Server-side schema applies nameRegex to each piece; passing a single
  // "fullName" used to bypass that check on signup.
  const [firstName, ...restName] = name.trim().split(/\s+/);
  const lastName = restName.join(" ");

  // Create user via backend (email pre-confirmed, no confirmation email needed)
  try {
    const res = await fetch(`${API}/api/profiles/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email, password,
        firstName, lastName,
        fullName: name,                // legacy field — backend ignores if firstName/lastName present
        role, phone,
        ageVerified: ageVerified ?? true,
        dateOfBirth,
        country,
      }),
    });
    const j = await res.json();
    if (!j.ok) return { user: null, error: j.error ?? "Signup failed" };

    // Sign in immediately with the new credentials
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) return { user: null, error: signInError.message };

    const uid = signInData.user?.id ?? j.userId;

    // Fetch the profile ID
    const { data: profileData } = await supabase
      .from("profiles").select("id").eq("user_id", uid).maybeSingle();

    return { user: { id: uid, profileId: profileData?.id ?? j.profileId, name, email, role }, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message ?? "Signup failed" };
  }
}

/** Sign in / sign up with Google OAuth — Supabase handles the redirect.
 *  Errors are surfaced via toast + console so the user (and Sentry) can see
 *  why a click didn't take them to Google. Pre-fix the call was fire-and-
 *  forget; silent failures looked identical to "nothing happened" for
 *  Oko 2026-05-12.
 *
 *  Capacitor native (2026-05-21): the WebView origin is
 *  capacitor://localhost (iOS) or https://localhost (Android). Neither
 *  is registered as an OAuth redirect with Google, so Google rejects
 *  the handshake → "Sign in with Google does not sign in" bug. We pin
 *  redirectTo to the production web origin (which IS registered) and
 *  open the OAuth URL in the system browser via Capacitor's Browser
 *  plugin. The web origin completes the handshake, Supabase sets the
 *  cookie, then the user comes back to the app and the session restores
 *  on next launch via the Supabase storage hook. Not pretty — a deep-
 *  link callback flow would be better — but it stops the silent fail
 *  in one ship. */
export async function signInWithGoogle(): Promise<void> {
  let isNative = false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    isNative = Capacitor.isNativePlatform();
  } catch { /* web — ignore */ }

  const webOrigin = "https://bionhealth.co.za";
  const redirectTo = isNative ? `${webOrigin}/` : `${window.location.origin}/`;

  if (isNative) {
    // Native: ask Supabase to mint the URL but DON'T let it auto-navigate
    // (the in-app WebView would lose the OAuth callback). We open it in
    // the system browser instead so Google trusts the host.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { prompt: "select_account" },
        skipBrowserRedirect: true,
      },
    });
    if (error || !data?.url) {
      console.error("[auth] Google sign-in (native) failed:", error);
      try {
        const { toast } = await import("sonner");
        toast.error(`Google sign-in failed: ${error?.message ?? "no auth URL returned"}`);
      } catch (e: any) { console.warn('[auth.ts] silent catch:', e?.message ?? String(e)); }
      throw error ?? new Error("Google sign-in failed");
    }
    // window.open(url, "_system") on Capacitor opens the system browser
    // (Chrome/Safari) — not an in-app WebView. That's what we want: Google
    // trusts the production host, completes the handshake, and the user
    // returns to the app via the app icon. Avoiding @capacitor/browser
    // here keeps the dependency surface unchanged.
    window.open(data.url, "_system");
    return;
  }

  // Web — standard in-tab redirect flow.
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) {
    console.error("[auth] Google sign-in failed:", error);
    try {
      const { toast } = await import("sonner");
      toast.error(`Google sign-in failed: ${error.message}`);
    } catch { /* sonner not loaded */ }
    throw error;
  }
}

/** Sign in with Apple — required for App Store approval since BION
 *  already offers Google sign-in (App Review Guideline 4.8). Mirrors
 *  the signInWithGoogle flow: web uses an in-tab redirect, Capacitor
 *  native opens the system browser via window.open(..., "_system") so
 *  Apple trusts the host and the OAuth handshake completes properly.
 *
 *  Requires Supabase Auth → Providers → Apple to be configured with
 *  the Service ID, Team ID, Key ID and .p8 private key from Apple
 *  Developer. Without that config the sign-in URL is unreachable and
 *  this function throws — we surface the toast so the failure isn't
 *  silent. */
export async function signInWithApple(): Promise<void> {
  let isNative = false;
  let isIos = false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    isNative = Capacitor.isNativePlatform();
    isIos    = Capacitor.getPlatform() === "ios";
  } catch { /* web — ignore */ }

  // ── iOS native path (best UX) ─────────────────────────────────
  // Uses Apple's system ASAuthorizationController via the
  // @capacitor-community/apple-sign-in plugin. Shows the iOS sheet
  // instead of a Safari redirect. The plugin returns an identityToken
  // we hand to Supabase's signInWithIdToken — no OAuth roundtrip.
  if (isNative && isIos) {
    try {
      const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
      const result = await SignInWithApple.authorize({
        clientId: "co.za.bionhealth.app",        // iOS native uses the App's bundle ID
        redirectURI: "https://bionhealth.co.za/", // unused for native but required field
        scopes: "email name",
        state: crypto.randomUUID(),
      });
      const idToken = (result as { response?: { identityToken?: string } }).response?.identityToken;
      if (!idToken) throw new Error("No identityToken from Apple");
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: idToken,
      });
      if (error) throw error;
      return;
    } catch (err: any) {
      // User cancelled the sheet (Apple returns error code 1001) — silent.
      const msg = err?.message ?? String(err);
      if (msg.includes("1001") || msg.toLowerCase().includes("cancel")) return;
      console.error("[auth] Apple native sign-in failed:", err);
      try {
        const { toast } = await import("sonner");
        toast.error(`Apple sign-in failed: ${msg}`);
      } catch { /* */ }
      throw err;
    }
  }

  // ── Android / web fallback ───────────────────────────────────
  // Android Capacitor + web both route through Supabase's hosted
  // OAuth flow. On Android we open the system browser; on web we
  // do an in-tab redirect.
  const webOrigin = "https://bionhealth.co.za";
  const redirectTo = isNative ? `${webOrigin}/` : `${window.location.origin}/`;

  if (isNative) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) {
      console.error("[auth] Apple sign-in (native fallback) failed:", error);
      try {
        const { toast } = await import("sonner");
        toast.error(`Apple sign-in failed: ${error?.message ?? "no auth URL returned"}`);
      } catch (e: any) { console.warn('[auth.ts] silent catch:', e?.message ?? String(e)); }
      throw error ?? new Error("Apple sign-in failed");
    }
    window.open(data.url, "_system");
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: { redirectTo },
  });
  if (error) {
    console.error("[auth] Apple sign-in failed:", error);
    try {
      const { toast } = await import("sonner");
      toast.error(`Apple sign-in failed: ${error.message}`);
    } catch { /* sonner not loaded */ }
    throw error;
  }
}

/** Sign out from Supabase */
export async function signOutSupabase(): Promise<void> {
  await supabase.auth.signOut();
}

// ── Demo accounts (localStorage-only, no Supabase session) ─────────
// id prefixed "demo_" so isOnboardingComplete() can skip the redirect for them.
// profileId is set to the same id so hooks like useMessages don't crash on undefined.
export const DEMO_ACCOUNTS: BioUser[] = [
  { id: "demo_client",    profileId: "demo_client",    name: "Oko Mthembu",  email: "client@bion.app",    role: "client"    },
  { id: "demo_provider",  profileId: "demo_provider",  name: "James Okafor", email: "provider@bion.app",  role: "provider"  },
  { id: "demo_corporate", profileId: "demo_corporate", name: "Capitec HR",    email: "corporate@bion.app", role: "corporate" },
  { id: "demo_sales_rep", profileId: "demo_sales_rep", name: "Thandi Nkosi", email: "rep@bion.app",       role: "sales_rep" },
];

/** Return a display-safe name — never show email prefixes like "mandolina1955" */
export function safeDisplayName(name?: string | null, fallback = "there"): string {
  if (!name) return fallback;
  const first = name.split(" ")[0];
  // Reject names that look like email prefixes (lowercase+digits, contains @)
  if (first.includes("@")) return fallback;
  if (/^[a-z0-9._-]+\d{2,}$/i.test(first)) return fallback;
  if (/^wa_/.test(first)) return fallback;
  return first;
}
