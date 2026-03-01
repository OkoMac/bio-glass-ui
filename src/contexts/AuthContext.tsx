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
    // Check for an existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (profile) { storeUser(profile); setUser(profile); }
      }
      setLoading(false);
    });

    // Listen to future auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (profile) { storeUser(profile); setUser(profile); }
      } else if (event === "SIGNED_OUT") {
        removeUser();
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Demo / direct-set login (no Supabase session) ──────────────
  const login = useCallback((userData: BioUser) => {
    storeUser(userData);
    setUser(userData);
  }, []);

  // ── Logout (Supabase + localStorage) ───────────────────────────
  const logout = useCallback(async () => {
    await signOutSupabase();
    removeUser();
    setUser(null);
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
