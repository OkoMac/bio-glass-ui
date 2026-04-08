import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BioUser, UserRole,
  getStoredUser, storeUser, removeUser,
  fetchUserProfile, signOutSupabase,
} from "@/lib/auth";

interface AuthContextType {
  user: BioUser | null;
  loading: boolean;
  login: (user: BioUser) => void;           // demo / direct set
  logout: () => void;
  switchRole: (role: UserRole) => void;     // dev/demo only
  updateAvatar: (url: string) => void;      // profile photo update
  isClient:    boolean;
  isProvider:  boolean;
  isAdmin:     boolean;
  isCorporate: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<BioUser | null>(getStoredUser);
  const [loading, setLoading] = useState(true);

  // ── Sync with Supabase session ──────────────────────────────────
  useEffect(() => {
    let mounted = true;
    let resolved = false;

    const finish = () => {
      if (mounted && !resolved) { resolved = true; setLoading(false); }
    };

    // Safety timeout — never spin forever
    const timeout = setTimeout(finish, 5000);

    // Check for an existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
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
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        if (session?.user) {
          try {
            const profile = await fetchUserProfile(session.user.id);
            if (mounted && profile) { storeUser(profile); setUser(profile); }
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
    window.location.href = "/";
  }, []);

  // ── Demo-only role switch (doesn't touch DB) ───────────────────
  const switchRole = useCallback((role: UserRole) => {
    if (!user) return;
    const updated = { ...user, role };
    storeUser(updated);
    setUser(updated);
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
