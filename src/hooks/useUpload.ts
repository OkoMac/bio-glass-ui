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
      if (!user?.profileId) throw new Error("Not signed in");
      if (!file.type.startsWith("image/")) throw new Error("File must be an image");
      if (file.size > maxMB * 1024 * 1024) throw new Error(`Max ${maxMB} MB`);

      setUploading(true);
      setProgress(10);

      try {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeSlug = (file.name.split(".")[0] ?? "img")
          .toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
        const path = `${user.profileId}/${folder}/${Date.now()}-${safeSlug}.${ext}`;

        setProgress(40);
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
        if (upErr) throw upErr;

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
