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
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeSlug = (file.name.split(".")[0] ?? "img")
          .toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
        const path = `${profileId}/${folder}/${Date.now()}-${safeSlug}.${ext}`;

        setProgress(40);
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
        if (upErr) {
          // Translate Supabase storage errors into something the user can act on.
          const msg = (upErr.message ?? "").toLowerCase();
          if (msg.includes("mime type") || msg.includes("not supported")) {
            throw new Error(`This file type isn't allowed. Please pick a JPEG, PNG, or HEIC image.`);
          }
          if (msg.includes("payload too large") || msg.includes("size") || msg.includes("exceeds")) {
            throw new Error(`File too big — please pick one under ${maxMB} MB.`);
          }
          if (msg.includes("bucket") && msg.includes("not found")) {
            throw new Error("Storage isn't configured yet. Please contact support@bionhealth.co.za.");
          }
          if (msg.includes("row-level security") || msg.includes("permission") || msg.includes("policy")) {
            throw new Error("Permission denied uploading photo — try signing out and back in.");
          }
          // Last resort — surface the raw message so it's diagnosable from a screenshot.
          throw new Error(`Upload failed: ${upErr.message ?? "unknown error"}`);
        }

        setProgress(80);

        if (bucket === "bion-media") {
          // Public URL
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          setProgress(100);
          return data.publicUrl;
        } else {
          // Private — signed URL valid for 1 year
          const { data, error: sErr } = await supabase.storage
            .from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
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
