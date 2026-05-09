/**
 * useRegisteredProvider — resolve a scraped directory slug (cen_lynette,
 * gp_apisara_kyalami, …) to a BION profile UUID + verification status.
 *
 * Bridges the two-ID-spaces problem: provider URLs use scraped slugs
 * (catalogue is seeded from JHB+PTA JSON), but every economic operation
 * (booking, payout, notification, marketing wallet, BIONPoints) needs
 * the Supabase profile UUID. The backend GET /api/providers/by-slug
 * endpoint (Phase 3 of E2E, c3f5271 backend) does the join across
 * provider_claims (status='linked' → linked_profile_id) and
 * provider_documents (all 3 required types verified).
 *
 * Used by:
 *   • ProviderProfile.tsx — to enable BION-only flows (services list,
 *     programs, real ratings) once the listing is verified
 *   • BookingSheet.tsx — to attach providerId on every addBooking
 *     so the v2.0 economic loop (5% wallet credit, Class A points
 *     attribution, payouts) connects properly
 *
 * Returns null profileId for directory-only providers (no claim or
 * unverified) — caller falls back to the lead-form / pre-bookable path.
 */

import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export interface RegisteredProvider {
  /** BION profile UUID — null if the slug isn't claimed/verified. */
  profileId: string | null;
  /** True if all three KYC documents are verified. */
  isVerified: boolean;
  /** Loading flag — true while the resolve request is in flight. */
  loading: boolean;
}

const EMPTY: RegisteredProvider = {
  profileId:  null,
  isVerified: false,
  loading:    false,
};

export function useRegisteredProvider(slug: string | null | undefined): RegisteredProvider {
  const [state, setState] = useState<RegisteredProvider>(slug ? { ...EMPTY, loading: true } : EMPTY);

  useEffect(() => {
    if (!slug) { setState(EMPTY); return; }
    let cancelled = false;
    setState({ ...EMPTY, loading: true });
    fetch(`${API}/api/providers/by-slug/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j?.ok && j.profile_id) {
          setState({
            profileId:  j.profile_id as string,
            isVerified: Boolean(j.is_verified),
            loading:    false,
          });
        } else {
          setState({ ...EMPTY, loading: false });
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Network blip — don't lock the user into a "directory-only"
        // experience permanently; loading false but no error surface.
        setState({ ...EMPTY, loading: false });
      });
    return () => { cancelled = true; };
  }, [slug]);

  return state;
}
