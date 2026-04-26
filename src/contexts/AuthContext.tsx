import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BioUser, UserRole,
  getStoredUser, storeUser, removeUser,
  fetchUserProfile, signOutSupabase,
} from "@/lib/auth";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface AuthContextType {
  user: BioUser | null;
  loading: boolean;
  login: (user: BioUser) => void;           // demo / direct set
  logout: () => void;
  switchRole: (role: UserRole) => void | Promise<void>;  // switches active role via backend
  updateAvatar: (url: string) => void;      // profile photo update
  availableRoles: UserRole[];               // all roles the user holds
  isClient:    boolean;
  isProvider:  boolean;
  isAdmin:     boolean;
  isCorporate: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Synchronously read stored user, but discard a demo-mode user when the
  // Supabase SDK already has a session cached in localStorage (indicating a
  // real sign-in). This prevents the "stale demo flash" where demo role
  // briefly decides route guards before the real session resolves.
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  const [user, setUser] = useState<BioUser | null>(() => {
    const stored = getStoredUser();
    if (!stored) return null;
    if (stored.id?.startsWith("demo_")) {
      try {
        const sbKey = Object.keys(localStorage).find(k => k.includes("-auth-token"));
        if (sbKey && localStorage.getItem(sbKey)) return null;  // real session exists → ignore demo
      } catch { /* */ }
    }
    return stored;
  });
  const [loading, setLoading] = useState(true);

  // ── Sync with Supabase session ──────────────────────────────────
  useEffect(() => {
    let mounted = true;
    let resolved = false;

    const finish = () => {
      if (mounted && !resolved) { resolved = true; setLoading(false); }
    };

    // A real Supabase session always beats a stale demo user stored from a
    // previous "Try as client/provider" preview. Clear demo identity before
    // the async profile fetch resolves so no admin/role-gated page picks up
    // the demo role in the gap.
    const clearDemoIfPresent = () => {
      const cur = getStoredUser();
      if (cur?.id?.startsWith("demo_")) {
        removeUser();
        if (mounted) setUser(null);
      }
    };

    // Safety timeout — never spin forever
    const timeout = setTimeout(finish, 5000);

    // Check for an existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        clearDemoIfPresent();
        try {
          const profile = await fetchUserProfile(session.user.id);
          if (mounted && profile) { storeUser(profile); setUser(profile); }
        } catch (e) {
          // Profile fetch failed — use stored user if available
        }
      }
      finish();
    }).catch(() => finish());

    // Listen to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      // Password recovery: Supabase fires PASSWORD_RECOVERY when a user clicks
      // a recovery email link. We must navigate them to /reset-password so they
      // can set a new password — otherwise they land on home as if signed in
      // and have no obvious way to set the password the link was for.
      if (event === "PASSWORD_RECOVERY") {
        if (window.location.pathname !== "/reset-password") {
          window.location.replace("/reset-password");
        }
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        if (session?.user) {
          clearDemoIfPresent();
          try {
            const profile = await fetchUserProfile(session.user.id);
            if (mounted && profile) {
              storeUser(profile);
              setUser(profile);
              // Magic-link / new-device fix: if the user has a real DB profile,
              // they're an existing user — mark onboarding done so RequireAuth
              // doesn't loop them back to /onboarding/* on a fresh browser.
              // The previous logic only checked localStorage, which is empty
              // on first login from any new device/browser.
              if (profile.id && !profile.id.startsWith("demo_") && profile.profileId) {
                try { localStorage.setItem(`bion_onboarding_done_${profile.id}`, "1"); } catch { /* */ }
              }
            }
            // Increment login count for Layer 3 deeper dive (SIGNED_IN only, not token refresh)
            if (event === "SIGNED_IN" && profile?.profileId) {
              supabase.from("profiles").select("login_count").eq("id", profile.profileId).maybeSingle()
                .then(({ data }) => {
                  const count = ((data?.login_count as number) ?? 0) + 1;
                  supabase.from("profiles").update({ login_count: count, last_login_at: new Date().toISOString() } as any)
                    .eq("id", profile.profileId).catch(() => {});
                }).catch(() => {});
            }
          } catch (e) {
            // Use stored user as fallback
          }
        }
        finish();
      } else if (event === "SIGNED_OUT") {
        removeUser();
        setUser(null);
        finish();
      }
    });

    return () => { mounted = false; clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  // ── Fetch available roles when user is set ──────────────────────
  useEffect(() => {
    if (!user || user.id?.startsWith("demo_")) {
      setAvailableRoles(user ? [user.role] : []);
      return;
    }
    const fetchRoles = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch(`${API}/api/account/roles`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (json.ok && Array.isArray(json.roles)) {
          setAvailableRoles(json.roles as UserRole[]);
        } else {
          setAvailableRoles([user.role]);
        }
      } catch {
        setAvailableRoles([user.role]);
      }
    };
    fetchRoles();
  }, [user?.id]);

  // ── Demo / direct-set login (no Supabase session) ──────────────
  const login = useCallback((userData: BioUser) => {
    storeUser(userData);
    setUser(userData);
  }, []);

  // ── Logout (Supabase + localStorage) ───────────────────────────
  const logout = useCallback(() => {
    removeUser();
    setUser(null);
    signOutSupabase().catch(() => {});
    // Full reload clears all in-memory state (contexts, caches)
    window.location.replace("/");
  }, []);

  // ── Role switch — uses backend API for real users, local for demo ──
  const switchRole = useCallback(async (role: UserRole) => {
    if (!user) return;

    // Update local state first so it persists across reload
    const updated = { ...user, role };
    storeUser(updated);
    setUser(updated);

    // Demo accounts: done — no backend call needed
    if (user.id?.startsWith("demo_")) return;

    // Real users: call the backend to persist (non-blocking)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        fetch(`${API}/api/account/switch-role`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        }).catch(() => {});
      }
    } catch { /* non-blocking */ }
  }, [user]);

  // ── Avatar update — persists to localStorage (+ Supabase in prod) ──
  const updateAvatar = useCallback((url: string) => {
    if (!user) return;
    const updated = { ...user, avatar: url };
    storeUser(updated);
    setUser(updated);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      switchRole,
      updateAvatar,
      availableRoles,
      isClient:    user?.role === "client",
      isProvider:  user?.role === "provider",
      isAdmin:     user?.role === "admin",
      isCorporate: user?.role === "corporate",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
