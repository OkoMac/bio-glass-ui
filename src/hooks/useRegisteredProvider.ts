import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

type ProfileState = {
  profile: any | null;
  isVerified: boolean;
  loading: boolean;
};

const EMPTY: ProfileState = { profile: null, isVerified: false, loading: true };

/**
 * Fetches a provider by URL slug from /api/providers/by-slug/:slug.
 * Returns { profile, isVerified, loading } for any component that needs
 * the full provider record, not just the snippet from search results.
 */
export function useRegisteredProvider(slug?: string) {
  const params = useParams();
  const s = slug ?? params.slug;
  const [state, setState] = useState<ProfileState>(EMPTY);

  useEffect(() => {
    if (!s) { setState({ ...EMPTY, loading: false }); return; }
    let cancelled = false;
    const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
    fetch(`${API}/api/providers/by-slug/${encodeURIComponent(s)}`)
      .then(r => r.json())
      .then(j => {
        if (cancelled) return;
        if (j?.ok && j.data) {
          setState({
            profile:    j.data,
            isVerified: Boolean(j.is_verified),
            loading:    false,
          });
        } else {
          setState({ ...EMPTY, loading: false });
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        // Network blip — don't lock the user into a "directory-only"
        // experience permanently; loading false but no error surface.
        console.warn("[useRegisteredProvider] fetch provider:", e instanceof Error ? e.message : String(e));
        setState({ ...EMPTY, loading: false });
      });
    return () => { cancelled = true; };
  }, [s]);

  return state;
}
