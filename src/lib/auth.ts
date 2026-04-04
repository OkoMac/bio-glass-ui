import { supabase } from "@/integrations/supabase/client";
import { Subscription, createDefaultSubscription, PROVIDER_TIER_FEATURES, CLIENT_TIER_FEATURES } from "./subscription";

export type UserRole = "client" | "provider" | "admin" | "corporate";

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

    // corporate role is stored in user_metadata.bio_role (not in the DB enum)
    const metaRole = authData.user?.user_metadata?.bio_role as UserRole | undefined;
    const role: UserRole = metaRole ?? (roleRow?.role as UserRole) ?? "client";

    const user: BioUser = {
      id:        supabaseUserId,
      profileId: profile?.id ?? undefined,
      name:      profile?.full_name ?? authData.user?.email?.split("@")[0] ?? "User",
      email:     profile?.email ?? authData.user?.email ?? "",
      role,
      avatar:    profile?.avatar_url ?? undefined,
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
  await supabase.from("profiles").upsert({ user_id: uid, full_name: name, email });

  // corporate stays in user_metadata; only DB-enum roles go into user_roles
  if (role !== "corporate") {
    await supabase.from("user_roles").upsert({
      user_id: uid,
      role: role as "admin" | "provider" | "client",
    });
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
export const DEMO_ACCOUNTS: BioUser[] = [
  { id: "demo_client",    name: "Oko Mthembu",  email: "client@bion.app",    role: "client"    },
  { id: "demo_provider",  name: "James Okafor", email: "provider@bion.app",  role: "provider"  },
  { id: "demo_admin",     name: "Admin",         email: "admin@bion.app",     role: "admin"     },
  { id: "demo_corporate", name: "Capitec HR",    email: "corporate@bion.app", role: "corporate" },
];
