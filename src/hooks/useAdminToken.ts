import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "bion_admin_token";
const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

/**
 * Auto-resolves the admin token for admin users.
 * - If user.role === "admin", fetches the token from the backend automatically
 * - Falls back to localStorage prompt for non-admin or if fetch fails
 * - Returns { token, loading } — no more manual paste prompts for admins
 */
export function useAdminToken(): { token: string; loading: boolean } {
  const { user } = useAuth();
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) ?? ""; } catch { return ""; }
  });
  const [loading, setLoading] = useState(!token && user?.role === "admin");

  useEffect(() => {
    if (token || user?.role !== "admin") return;

    // Admin user without token — fetch it via the backend using their JWT
    const resolve = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { setLoading(false); return; }

        const res = await fetch(`${API}/api/admin-setup/token`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const j = await res.json();
        if (j.ok && j.token) {
          localStorage.setItem(STORAGE_KEY, j.token);
          setToken(j.token);
        }
      } catch { /* fall back to manual entry */ }
      setLoading(false);
    };
    resolve();
  }, [user?.role, token]);

  return { token, loading };
}
