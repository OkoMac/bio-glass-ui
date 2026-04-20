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
    const [{ data: profile }, { data: roleRow }, { data: authData }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, avatar_url").eq("user_id", supabaseUserId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", supabaseUserId).maybeSingle(),
      supabase.auth.getUser(),
    ]);

    // Role priority: 1) user_metadata.bio_role (set at signup), 2) user_roles table, 3) fallback to client
    const metaRole = authData.user?.user_metadata?.bio_role as UserRole | undefined;
    const dbRole = roleRow?.role as UserRole | undefined;
    const role: UserRole = metaRole ?? dbRole ?? "client";

    // If metaRole exists but DB role doesn't match, trust metaRole (RLS may block user_roles read)
    if (import.meta.env.DEV) console.log(`[auth] User ${supabaseUserId}: metaRole=${metaRole}, dbRole=${dbRole}, resolved=${role}`);

    // First-time OAuth users (Google / etc.) have no profile row yet — create
    // one on the fly so hooks that depend on profileId don't crash and so we
    // have a stable identity for bookings, favourites, and wallet lookups.
    let profileId = profile?.id;
    let profileName = profile?.full_name;
    let profileEmail = profile?.email;
    let profileAvatar = profile?.avatar_url;

    if (!profile && authData.user) {
      const fallbackName = (authData.user.user_metadata?.full_name as string | undefined)
        ?? (authData.user.user_metadata?.name as string | undefined)
        ?? authData.user.email?.split("@")[0]
        ?? "User";
      const fallbackAvatar = (authData.user.user_metadata?.avatar_url as string | undefined)
        ?? (authData.user.user_metadata?.picture as string | undefined);
      try {
        const { data: created } = await supabase
          .from("profiles")
          .upsert({
            user_id: supabaseUserId,
            full_name: fallbackName,
            email: authData.user.email,
            avatar_url: fallbackAvatar,
          }, { onConflict: "user_id" })
          .select("id, full_name, email, avatar_url")
          .single();
        profileId = (created as any)?.id;
        profileName = (created as any)?.full_name;
        profileEmail = (created as any)?.email;
        profileAvatar = (created as any)?.avatar_url;
      } catch (err) {
        // Don't block sign-in if profile creation fails — caller still gets a
        // usable BioUser and can retry on their next action.
        if (import.meta.env.DEV) console.warn("[auth] profile upsert failed:", err);
      }
    }

    const user: BioUser = {
      id:        supabaseUserId,
      profileId: profileId ?? undefined,
      name:      profileName ?? authData.user?.email?.split("@")[0] ?? "User",
      email:     profileEmail ?? authData.user?.email ?? "",
      role,
      avatar:    profileAvatar ?? undefined,
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

/** Sign up with email/password, then create profile + role rows */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  role: UserRole,
): Promise<{ user: BioUser | null; error: string | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, bio_role: role } },
  });
  if (error || !data.user) return { user: null, error: error?.message ?? "Signup failed" };

  const uid = data.user.id;

  // Create profile + role via backend (bypasses RLS, always succeeds)
  const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
  try {
    const session = await supabase.auth.getSession();
    const jwt = session.data.session?.access_token;
    await fetch(`${API}/api/profiles/ensure`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
      body: JSON.stringify({ userId: uid, fullName: name, email, role }),
    });
  } catch {
    // Fallback: try direct upsert (may fail on RLS but worth attempting)
    await supabase.from("profiles").upsert({ user_id: uid, full_name: name, email }).catch(() => {});
  }

  // Ensure user_roles entry
  if (role !== "corporate" && role !== "sales_rep") {
    await supabase.from("user_roles").upsert({
      user_id: uid,
      role: role as "admin" | "provider" | "client",
    }).catch(() => {});
  }

  // Fetch the newly created profile ID
  const { data: profileData } = await supabase
    .from("profiles").select("id").eq("user_id", uid).maybeSingle();

  return { user: { id: uid, profileId: profileData?.id, name, email, role }, error: null };
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
