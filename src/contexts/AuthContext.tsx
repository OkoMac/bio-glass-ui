import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  BioUser, UserRole,
  getStoredUser, storeUser, removeUser,
  fetchUserProfile, signOutSupabase,
} from "@/lib/auth";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface AuthContextType {
  user: BioUser | null;
  session: Session | null;
  loading: boolean;
  login: (user: BioUser) => void;           // demo / direct set
  logout: () => void;
  switchRole: (role: UserRole) => void | Promise<void>;  // switches active role via backend
  updateAvatar: (url: string) => Promise<void>;      // profile photo update — writes to profiles.avatar_url
  updateCoverImage: (url: string) => Promise<void>;  // profile banner — writes to profiles.cover_image_url
  updateProfileFields: (fields: { bio?: string; phone?: string; location?: string; name?: string }) => Promise<void>;
  /** Force-refresh the cached user from the DB (skips localStorage,
   *  bypasses the 5s visibility-change debounce, useful when the UI
   *  knows the cache is stale — e.g. an empty user.name on /home). */
  refetchUser: () => Promise<void>;
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
    // Cache-coherence: if Supabase has a session for a DIFFERENT user
    // than the cached bio_user (e.g. another account signed in on the
    // same browser, or the cache is from a previous device sync), drop
    // the cache rather than render somebody else's name/avatar.
    try {
      const sbKey = Object.keys(localStorage).find(k => k.includes("-auth-token"));
      if (sbKey) {
        const raw = localStorage.getItem(sbKey);
        const sess = raw ? JSON.parse(raw) : null;
        const sessionUserId: string | undefined = sess?.user?.id ?? sess?.currentSession?.user?.id;
        if (sessionUserId && stored.id && sessionUserId !== stored.id) {
          removeUser();
          return null;
        }
      }
    } catch { /* */ }
    return stored;
  });
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  // Tracks the timestamp of the most recent local write (avatar / cover).
  // Prevents the visibility-change refetch from clobbering a fresh upload
  // before the Supabase write has propagated. Set by updateAvatar /
  // updateCoverImage; checked by the visibilitychange handler.
  const lastLocalWriteAt = useRef<number>(0);

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
    supabase.auth.getSession().then(async ({ data: { session: sbSession } }: any /* TODO(types) */) => {
      if (!mounted) return;
      if (sbSession?.user) {
        setSession(sbSession);
        clearDemoIfPresent();
        try {
          const profile = await fetchUserProfile(sbSession.user.id);
          if (mounted && profile) {
            storeUser(profile);
            setUser(profile);
            // 2026-05-19 (Lee bug): the SIGNED_IN handler (below) already
            // stamps the onboarding-done flag for returning users with a
            // real profile row, so they don't get force-redirected to
            // /onboarding/* on a fresh browser. But this initial-mount
            // path — which fires when a user opens the PWA / a new tab
            // with a still-valid session — was missing that stamp. Net
            // effect: every "open BION in a new tab" or "tap the PWA
            // icon" looked like a fresh device and bounced the user
            // through onboarding even when their server state said done.
            // Mirror the same stamp here.
            if (profile.id && !profile.id.startsWith("demo_") && profile.profileId) {
              try { localStorage.setItem(`bion_onboarding_done_${profile.id}`, "1"); } catch { /* */ }
            }
          }
        } catch (e) {
          // Profile fetch failed — use stored user if available
        }
      } else {
        // Zombie-state recovery: bio_user persisted in localStorage but
        // the Supabase session is gone (auto-purged because expired >1
        // day OR user cleared cookies but PWA localStorage survived).
        // In that state, every supabase.from() call goes out with the
        // anon JWT — auth.uid() is NULL — and every RLS-gated INSERT
        // fails with 42501. Catalogs.tsx failed to create on 2026-05-16;
        // same class of bug for user_habits, anything else with RLS.
        // Clear the stale bio_user and let RequireAuth bounce them to
        // /welcome, where a fresh login restores both tokens together.
        const stored = getStoredUser();
        if (stored && !stored.id?.startsWith("demo_")) {
          console.warn("[auth] zombie state: bio_user present but no supabase session — clearing stored user");
          removeUser();
          if (mounted) setUser(null);
        }
      }
      finish();
    }).catch(() => finish());

    // Listen to future auth changes
    const { data: { subscription } } =    supabase.auth.onAuthStateChange(async (event: any /* TODO(types) */, sbSession: any /* TODO(types) */) => {
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
        if (sbSession?.user) {
          setSession(sbSession);
          clearDemoIfPresent();
          try {
            const profile = await fetchUserProfile(sbSession.user.id);
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
                .then(({ data }: any /* TODO(types) */) => {
                  const count = ((data?.login_count as number) ?? 0) + 1;
                  supabase.from("profiles").update({ login_count: count, last_login_at: new Date().toISOString() } as any)
                    .eq("id", profile.profileId).catch((err) => console.warn("[AuthContext] eq failed:", err?.message));
                }).catch((err) => console.warn("[AuthContext] <unknown> failed:", err?.message));
            }
          } catch (e) {
            // Use stored user as fallback
          }
        }
        finish();
      } else if (event === "SIGNED_OUT") {
        removeUser();
        setUser(null);
        setSession(null);
        finish();
      }
    });

    // Cross-instance sync: when the tab returns to visibility, refetch the
    // profile from the server. Closes Lee's bug (2026-05-01): "I am logged
    // in via app and browser. They don't update each other." If another
    // instance updated avatar_url or cover_image_url server-side, this
    // instance picks it up the moment the user comes back to the tab.
    let lastHidden: number | null = null;
    const onVisibilityChange = async () => {
      if (document.visibilityState === "hidden") {
        lastHidden = Date.now();
        return;
      }
      // Only refetch if hidden for >5s (skip transient focus loss)
      if (!lastHidden || Date.now() - lastHidden < 5000) return;
      lastHidden = null;
      // Skip refetch if the user just made a local write (avatar / cover).
      // iOS file picker briefly hides the tab; without this guard, the
      // refetch fires on return and overwrites the fresh upload before
      // the supabase write has had time to propagate.
      const sinceWrite = Date.now() - lastLocalWriteAt.current;
      if (sinceWrite < 8000) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || !mounted) return;
        const fresh = await fetchUserProfile(session.user.id);
        if (mounted && fresh) {
          storeUser(fresh);
          setUser(fresh);
        }
      } catch { /* network blip — ignore, next visibility tick will retry */ }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
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
        if (!res.ok) {
          console.warn('[auth] roles fetch failed:', res.status);
          setAvailableRoles([user.role]);
          return;
        }
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
    signOutSupabase().catch((err) => {
      console.warn("[auth] signOutSupabase failed (non-fatal, will re-auth on next visit):", err);
    });
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
        }).catch((err) => console.warn("[AuthContext] <unknown> failed:", err?.message));
      }
    } catch { /* non-blocking */ }
  }, [user]);

  // ── Avatar update — server-side persistence with race protection ──
  // Bug fix 2026-05-01: previous version wrote ONLY to localStorage + React
  // state. The next TOKEN_REFRESHED event re-fetched the profile from the
  // server (where avatar_url was null) and clobbered the local update.
  // Now writes to profiles.avatar_url so the source-of-truth survives
  // token refreshes, uninstall, and cross-device sign-in.
  //
  // Race protection (2026-05-01 follow-up): on iOS the file picker briefly
  // hides the tab, which can fire visibilitychange. The refetch on return
  // could overwrite the local update before the supabase write completes.
  // Solution: stamp lastLocalWriteAt BEFORE the optimistic local set; the
  // visibility handler checks this and skips refetch within 5s of any
  // write. Plus: rollback local state if the supabase write fails.
  const updateAvatar = useCallback(async (url: string) => {
    if (!user) return;
    const previousAvatar = user.avatar;
    lastLocalWriteAt.current = Date.now();
    const updated = { ...user, avatar: url };
    storeUser(updated);
    setUser(updated);
    if (user.profileId && !user.id?.startsWith("demo_")) {
      try {
        const { error } = await supabase.from("profiles")
          .update({ avatar_url: url } as any)
          .eq("id", user.profileId);
        if (error) throw error;
        // Refresh write-stamp after success — covers slow links where the
        // initial 5s buffer would have elapsed already.
        lastLocalWriteAt.current = Date.now();
      } catch (err) {
        // Rollback so local state matches the server (which still has the
        // old value). Without rollback, user sees the new image briefly
        // and is confused when it reverts after the next session refresh.
        console.error("[auth] avatar persist failed — rolling back:", err);
        const rolled = { ...user, avatar: previousAvatar };
        storeUser(rolled);
        setUser(rolled);
      }
    }
  }, [user]);

  // ── Profile field batch update (bio, phone, location, name) ─────
  // Same race-protection + rollback pattern as updateAvatar/updateCoverImage.
  // Lets the Profile.tsx edit modal save several fields in one round-trip
  // and have them all persist to profiles. localStorage is hot cache.
  const updateProfileFields = useCallback(async (fields: { bio?: string; phone?: string; location?: string; name?: string }) => {
    if (!user) throw new Error("Not signed in");
    const previous = { bio: user.bio, phone: user.phone, location: user.location, name: user.name };
    lastLocalWriteAt.current = Date.now();
    const updated: BioUser = {
      ...user,
      ...(fields.bio !== undefined ? { bio: fields.bio } : {}),
      ...(fields.phone !== undefined ? { phone: fields.phone } : {}),
      ...(fields.location !== undefined ? { location: fields.location } : {}),
      ...(fields.name !== undefined ? { name: fields.name } : {}),
    };
    storeUser(updated);
    setUser(updated);

    // No DB write for demo accounts (local-only state is intentional).
    if (user.id?.startsWith("demo_")) return;

    // Guard: silent skip on missing profileId was a silent failure. Reported
    // Lee Grant 2026-05-14: "Saved my number" but phone field stayed empty —
    // the user had a session without profileId hydrated, so this whole
    // block was skipped, local state updated, then next refresh reverted
    // from the DB (which never saw the write).
    if (!user.profileId) {
      // Roll back local state so the input doesn't lie about being saved.
      const rolled: BioUser = { ...user, ...previous };
      storeUser(rolled);
      setUser(rolled);
      throw new Error("Profile still loading — please refresh and try again");
    }

    try {
      const dbPatch: Record<string, unknown> = {};
      if (fields.bio !== undefined)      dbPatch.bio = fields.bio;
      if (fields.phone !== undefined)    dbPatch.phone = fields.phone;
      if (fields.location !== undefined) dbPatch.location = fields.location;
      if (fields.name !== undefined)     dbPatch.full_name = fields.name;
      if (Object.keys(dbPatch).length === 0) return;
      const { error } = await supabase.from("profiles").update(dbPatch as any).eq("id", user.profileId);
      if (error) throw error;
      lastLocalWriteAt.current = Date.now();
    } catch (err: any /* TODO(types) */) {
      // Roll back the optimistic local update so the input doesn't show a
      // value that didn't reach the DB.
      const rolled: BioUser = { ...user, ...previous };
      storeUser(rolled);
      setUser(rolled);
      // RE-THROW — previously this was swallowed. Settings.save() needs to
      // see the failure so it can toast the actual Postgrest error to the
      // user, instead of flashing a green "Saved!" on top of a silent fail.
      console.error("[auth] profile fields persist failed — rolled back:", {
        code: err?.code, message: err?.message, details: err?.details, hint: err?.hint,
      });
      throw new Error(err?.message ?? "Couldn't save profile to the server");
    }
  }, [user]);

  // ── Cover image update — same shape as updateAvatar ─────────────
  const updateCoverImage = useCallback(async (url: string) => {
    if (!user) return;
    const previousCover = user.coverImage;
    lastLocalWriteAt.current = Date.now();
    const updated = { ...user, coverImage: url };
    storeUser(updated);
    setUser(updated);
    if (user.profileId && !user.id?.startsWith("demo_")) {
      try {
        const { error } = await supabase.from("profiles")
          .update({ cover_image_url: url } as any)
          .eq("id", user.profileId);
        if (error) throw error;
        lastLocalWriteAt.current = Date.now();
      } catch (err) {
        console.error("[auth] cover persist failed — rolling back:", err);
        const rolled = { ...user, coverImage: previousCover };
        storeUser(rolled);
        setUser(rolled);
      }
    }
  }, [user]);

  // Force-refresh from the DB. Bypasses the visibility-change debounce
  // and ignores the local-write guard — used when callers KNOW the
  // cache is stale (e.g. /home banner when user.name is empty).
  const refetchUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const fresh = await fetchUserProfile(session.user.id);
      if (fresh) {
        storeUser(fresh);
        setUser(fresh);
      }
    } catch {/* swallow */}
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      login,
      logout,
      switchRole,
      updateAvatar,
      updateCoverImage,
      updateProfileFields,
      refetchUser,
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
