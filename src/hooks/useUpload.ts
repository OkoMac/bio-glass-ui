import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UploadBucket = "bion-media" | "bion-evidence";

interface UploadOptions {
  bucket?: UploadBucket;
  /** Sub-folder within the user's namespace (e.g. "catalogs", "products", "avatars") */
  folder?: string;
  /** Max megabytes — defaults to 10 */
  maxMB?: number;
}

/**
 * Upload a single image file to Supabase storage.
 * Path: <profileId>/<folder>/<timestamp>-<slug>.<ext>
 * Returns the publicUrl for public buckets, or a signed URL for private.
 */
export function useImageUpload(opts: UploadOptions = {}) {
  const { user } = useAuth();
  const { bucket = "bion-media", folder = "misc", maxMB = 10 } = opts;
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (file: File): Promise<string> => {
      if (!file.type.startsWith("image/")) throw new Error("File must be an image");
      if (file.size > maxMB * 1024 * 1024) throw new Error(`Max ${maxMB} MB`);

      // Resolve profileId. Pre-fix: relied solely on the AuthContext
      // user.profileId, which can be undefined for users whose auto-create
      // profile flow silently failed at first sign-in. Result: every
      // upload threw "Not signed in" even though the user was signed in.
      // Now: if AuthContext doesn't have it, look it up from the live
      // Supabase session as a fallback. Last resort: clear, actionable
      // error pointing at support, not the misleading "Not signed in".
      let profileId = user?.profileId;
      if (!profileId) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) throw new Error("Please sign in again to upload — your session expired.");
          const { data: profileRow, error: pErr } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", authUser.id)
            .maybeSingle();
          if (pErr) throw new Error(`Couldn't load your profile (${pErr.message}). Email support@bionhealth.co.za with this message.`);
          if (!profileRow) {
            // Auth user exists but no profile row — the auto-create at
            // signup must have failed. Try once via the anon client; if
            // RLS/NOT-NULL blocks it, fall through to the backend repair
            // endpoint which uses the service-role admin client.
            const anonAttempt = await supabase
              .from("profiles")
              .upsert(
                { user_id: authUser.id, email: authUser.email },
                { onConflict: "user_id" },
              )
              .select("id")
              .single();
            if (!anonAttempt.error && anonAttempt.data?.id) {
              profileId = anonAttempt.data.id as string;
            } else {
              // Backend repair — admin client bypasses RLS, supplies
              // sensible defaults for any NOT NULL columns. Idempotent.
              const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://bion-backend.onrender.com";
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.access_token) {
                throw new Error("Sign-in expired. Please sign in again.");
              }
              const repairRes = await fetch(`${API_URL}/api/profiles/me/repair`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
              });
              const repairJson = await repairRes.json().catch(() => ({}));
              if (!repairRes.ok || !repairJson?.ok || !repairJson?.profileId) {
                throw new Error(`Couldn't restore your profile (${repairJson?.error ?? `HTTP ${repairRes.status}`}). Email support@bionhealth.co.za.`);
              }
              profileId = repairJson.profileId as string;
            }
          } else {
            profileId = (profileRow as { id: string }).id;
          }
        } catch (err: any) {
          throw new Error(err?.message ?? "Could not verify your account. Please refresh.");
        }
      }

      setUploading(true);
      setProgress(10);

      try {
        // §4.4 (2026-05-05): UUID-based storage paths. Reserve a media
        // row server-side first; backend returns a one-shot signed
        // upload URL pointing at <media_id>/<filename>. The path no
        // longer exposes profile_id, so a leaked or scraped URL can't
        // be used to enumerate users. Profile_id is preserved in
        // public.media for ownership checks.
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeSlug = (file.name.split(".")[0] ?? "img")
          .toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
        const filename = `${Date.now()}-${safeSlug}.${ext}`;

        setProgress(25);

        const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://bion-backend.onrender.com";
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Sign-in expired. Please sign in again.");

        const reserveRes = await fetch(`${API_URL}/api/media/reserve`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ bucket, folder, filename, contentType: file.type, sizeBytes: file.size }),
        });
        const reserveJson = await reserveRes.json().catch(() => ({}));
        if (!reserveRes.ok || !reserveJson?.ok || !reserveJson?.signedUploadUrl || !reserveJson?.storagePath) {
          throw new Error(reserveJson?.error ?? `Couldn't reserve upload slot (HTTP ${reserveRes.status})`);
        }

        const { mediaId, storagePath, signedUploadUrl } = reserveJson as {
          mediaId: string; storagePath: string; signedUploadUrl: string;
        };

        setProgress(50);

        // PUT to the signed upload URL — Supabase signed URLs accept the
        // file body directly. Content-Type matters for the bucket's MIME
        // allowlist.
        const putRes = await fetch(signedUploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type, "x-upsert": "false" },
          body: file,
        });
        if (!putRes.ok) {
          const errorText = await putRes.text().catch(() => "");
          const lower = errorText.toLowerCase();
          if (lower.includes("mime") || lower.includes("not supported")) {
            throw new Error("This file type isn't allowed. Please pick a JPEG, PNG, WEBP, or HEIC image.");
          }
          if (lower.includes("size") || lower.includes("payload too large") || lower.includes("exceeds")) {
            throw new Error(`File too big — please pick one under ${maxMB} MB.`);
          }
          throw new Error(`Upload failed (HTTP ${putRes.status}). ${errorText.slice(0, 120)}`);
        }

        setProgress(80);

        // Mark the media row as uploaded — best-effort. If finalize
        // fails the file's still up; the row just stays pending and a
        // backfill cron can reconcile.
        try {
          await fetch(`${API_URL}/api/media/${mediaId}/finalize`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ sizeBytes: file.size }),
          });
        } catch { /* */ }

        if (bucket === "bion-media") {
          // Public URL — uses the same storage_path the signed URL targeted.
          const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
          setProgress(100);
          return data.publicUrl;
        } else {
          // Private — signed read URL valid for 1 year.
          const { data, error: sErr } = await supabase.storage
            .from(bucket).createSignedUrl(storagePath, 60 * 60 * 24 * 365);
          if (sErr) throw sErr;
          setProgress(100);
          return data.signedUrl;
        }
      } finally {
        setUploading(false);
        setTimeout(() => setProgress(0), 500);
      }
    },
    [bucket, folder, maxMB, user?.profileId]
  );

  return { upload, uploading, progress };
}
