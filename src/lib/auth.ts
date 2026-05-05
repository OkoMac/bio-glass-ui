import { supabase } from "@/integrations/supabase/client";
import { Subscription, createDefaultSubscription, PROVIDER_TIER_FEATURES, CLIENT_TIER_FEATURES } from "./subscription";

export type UserRole = "client" | "provider" | "admin" | "corporate" | "sales_rep";

export interface BioUser {
  id?: string;          // Supabase auth user id (undefined for demo accounts)
  profileId?: string;   // profiles.id — FK used in bookings, messages, biopoints, etc.
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
    const [{ data: profile }, { data: roleRows }, { data: authData }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, avatar_url, cover_image_url, bio, phone, location, bion_id" as any).eq("user_id", supabaseUserId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", supabaseUserId),
      supabase.auth.getUser(),
    ]);
    // Get the first role from the roles table (admin > provider > client priority)
    const rolePriority = ["admin", "provider", "corporate", "sales_rep", "client"];
    const dbRoles = (roleRows ?? []).map((r: any) => r.role as string);
    const roleRow = { role: rolePriority.find(r => dbRoles.includes(r)) ?? dbRoles[0] };

    // Role priority:
    // 1) Stored switched role (user explicitly chose this via role switcher)
    // 2) user_roles table (source of truth for assigned roles)
    // 3) user_metadata.bio_role (set at signup — may be stale)
    // 4) fallback to client
    const storedUser = getStoredUser();
    const switchedRole = storedUser?.id === supabaseUserId ? storedUser?.role : undefined;
    const dbRole = roleRow?.role as UserRole | undefined;
    const metaRole = authData.user?.user_metadata?.bio_role as UserRole | undefined;
    const role: UserRole = switchedRole ?? dbRole ?? metaRole ?? "client";

    // First-time OAuth users (Google / etc.) have no profile row yet — create
    // one on the fly so hooks that depend on profileId don't crash and so we
    // have a stable identity for bookings, favourites, and wallet lookups.
    let profileId = profile?.id;
    let profileName = profile?.full_name;
    let profileEmail = profile?.email;
    let profileAvatar = profile?.avatar_url;
    let profileCover = (profile as any)?.cover_image_url ?? undefined;

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

    const user: BioUser = {
      id:         supabaseUserId,
      profileId:  profileId ?? undefined,
      name:       profileName ?? "",
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
): Promise<{ user: BioUser | null; error: string | null }> {
  const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

  // Create user via backend (email pre-confirmed, no confirmation email needed)
  try {
    const res = await fetch(`${API}/api/profiles/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName: name, role, phone, ageVerified: ageVerified ?? true }),
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

/** Sign in / sign up with Google OAuth — Supabase handles the redirect */
export async function signInWithGoogle(): Promise<void> {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: { prompt: "select_account" },
    },
  });
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
