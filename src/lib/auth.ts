import { supabase } from "@/integrations/supabase/client";

export type UserRole = "client" | "provider" | "admin" | "corporate";

export interface BioUser {
  id?: string;          // Supabase auth user id (undefined for demo accounts)
  profileId?: string;   // profiles.id — FK used in bookings, messages, biopoints, etc.
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
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

    return {
      id:        supabaseUserId,
      profileId: profile?.id ?? undefined,
      name:      profile?.full_name ?? authData.user?.email?.split("@")[0] ?? "User",
      email:     profile?.email ?? authData.user?.email ?? "",
      role,
      avatar:    profile?.avatar_url ?? undefined,
    };
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

/** Sign out from Supabase */
export async function signOutSupabase(): Promise<void> {
  await supabase.auth.signOut();
}

// ── Demo accounts (localStorage-only, no Supabase session) ─────────
export const DEMO_ACCOUNTS: BioUser[] = [
  { name: "Oko Mthembu",    email: "client@bion.app",    role: "client"    },
  { name: "James Okafor",   email: "provider@bion.app",  role: "provider"  },
  { name: "Admin",          email: "admin@bion.app",     role: "admin"     },
  { name: "Capitec HR",     email: "corporate@bion.app", role: "corporate" },
];
