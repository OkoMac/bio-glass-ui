import { useRef } from "react";
import { Upload, Loader2, X, Link as LinkIcon } from "lucide-react";
import { useImageUpload, type UploadBucket } from "@/hooks/useUpload";
import { toast } from "sonner";

interface Props {
  value?: string | null;
  onChange: (url: string | null) => void;
  bucket?: UploadBucket;
  folder?: string;
  maxMB?: number;
  label?: string;
  hint?: string;
  allowUrl?: boolean;          // show a "or paste URL" fallback
  className?: string;
  compact?: boolean;
}

/**
 * Reusable image uploader — drag/drop + click-to-browse + URL fallback.
 * Drops into any form field that previously accepted a pasted URL.
 *
 * Usage:
 *   <ImageUpload value={form.image_url} onChange={(url) => setForm({...form, image_url: url})}
 *                folder="catalogs" label="Cover image" />
 */
export default function ImageUpload({
  value, onChange, bucket = "bion-media", folder = "misc", maxMB = 10,
  label, hint, allowUrl = true, className = "", compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, progress } = useImageUpload({ bucket, folder, maxMB });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const url = await upload(files[0]);
      onChange(url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {label}
          {hint && <span className="text-muted-foreground/70 ml-2">· {hint}</span>}
        </label>
      )}

      {value ? (
        <div className={`relative rounded-xl overflow-hidden border border-white/10 mt-1 ${compact ? "h-20" : "h-40"}`}>
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur flex items-center justify-center text-white"
            aria-label="Remove image"
           title="onChange(null)} className='absolute top-2 right-2 w-7 h-7 rounded-full bg-bla…">
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 text-[10px] bg-black/60 hover:bg-black/80 text-white px-2 py-1 rounded-full"
            disabled={uploading}
           title="inputRef.current?.click()} className='absolute bottom-2 right-2 text-[10px] b…" aria-label="inputRef.current?.click()} className='absolute bottom-2 right-2 text-[10px] b…">
            Replace
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); }}
          className={`mt-1 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo/40 hover:bg-white/[0.02] cursor-pointer transition-colors flex flex-col items-center justify-center text-center ${
            compact ? "h-20 p-3" : "h-40 p-4"
          }`}
        >
          {uploading ? (
            <div className="space-y-2 w-full max-w-[200px]">
              <Loader2 className="w-5 h-5 animate-spin text-indigo mx-auto" />
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-indigo transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground">{progress}%</p>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-2">
                <Upload className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-foreground font-medium">Drop image or click to browse</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, WebP · up to {maxMB}MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {allowUrl && !value && !uploading && (
        <UrlFallback onSet={(url) => onChange(url)} />
      )}
    </div>
  );
}

function UrlFallback({ onSet }: { onSet: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <details className="mt-2 group">
      <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground inline-flex items-center gap-1 list-none">
        <LinkIcon className="w-2.5 h-2.5" />
        Or paste a URL
      </summary>
      <div className="flex gap-2 mt-1.5">
        <input
          ref={ref}
          placeholder="https://..."
          className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-foreground focus:outline-none focus:border-indigo/50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && ref.current?.value) {
              onSet(ref.current.value);
              ref.current.value = "";
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (ref.current?.value) { onSet(ref.current.value); ref.current.value = ""; }
          }}
          className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-foreground hover:bg-white/10"
         title="}} className='px-3 py-1.5 rounded-lg bg-white/5 text-xs text-foreground hover…" aria-label="}} className='px-3 py-1.5 rounded-lg bg-white/5 text-xs text-foreground hover…">
          Use
        </button>
      </div>
    </details>
  );
}

