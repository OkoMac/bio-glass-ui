import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches the set of provider profile IDs that have completed document verification.
 * A provider is "verified" when all 3 required document types are approved:
 * - sa_id (SA ID / Passport)
 * - professional_reg (HPCSA/SANC/etc registration)
 * - qualifications (degree/diploma/certification)
 *
 * Returns a Set for O(1) lookup when rendering provider cards.
 * Caches in localStorage for 5 minutes to avoid repeated queries.
 */

const CACHE_KEY = "bion_verified_providers";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const REQUIRED_TYPES = ["sa_id", "professional_reg", "qualifications"];

export function useVerifiedProviders(): Set<string> {
  const [verified, setVerified] = useState<Set<string>>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ids, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) return new Set(ids);
      }
    } catch { /* ignore */ }
    return new Set();
  });

  useEffect(() => {
    const fetchVerified = async () => {
      try {
        // Query all approved documents grouped by provider.
        // NOTE: the column is `doc_type` (matching the schema in
        // bion-kyc-gates.sql / 20260409_data_persistence.sql); the hook
        // previously queried `document_type` which returned 400 on every
        // /home render.
        const { data, error } = await supabase
          .from("provider_documents" as any)
          .select("provider_id, doc_type, status")
          .eq("status", "verified");

        if (error || !data) return;

        // Group by provider_id and check if all required types are verified
        const providerDocs = new Map<string, Set<string>>();
        (data as any[]).forEach((doc: any) => {
          if (!providerDocs.has(doc.provider_id)) {
            providerDocs.set(doc.provider_id, new Set());
          }
          providerDocs.get(doc.provider_id)!.add(doc.doc_type);
        });

        const verifiedIds = new Set<string>();
        providerDocs.forEach((types, providerId) => {
          if (REQUIRED_TYPES.every(t => types.has(t))) {
            verifiedIds.add(providerId);
          }
        });

        setVerified(verifiedIds);

        // Cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          ids: Array.from(verifiedIds),
          ts: Date.now(),
        }));
      } catch { /* Supabase unavailable — keep cached/empty set */ }
    };

    fetchVerified();
  }, []);

  return verified;
}
