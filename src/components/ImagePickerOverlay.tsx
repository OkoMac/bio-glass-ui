import { useRef } from "react";
import { Camera, ImagePlus } from "lucide-react";

// ─── Image compression ────────────────────────────────────────────────────────
// Compresses the selected file to a JPEG data-URL small enough for localStorage.
// maxPx caps the longer edge so avatars stay < 40 KB and covers < 80 KB.

async function compressImage(file: File, maxPx = 400): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** QA audit M-5 (2026-04-28): on Capacitor native, the HTML <input
 *  type="file" accept="image/*"> picker can only open the gallery —
 *  it can't trigger Camera.app directly. @capacitor/camera was already
 *  installed but never wired. This helper detects native + uses
 *  Camera.getPhoto() when available, falling back to null on web so
 *  the existing file-input path runs. Returns a JPEG data URL sized
 *  to maxPx, matching compressImage()'s contract. */
async function pickViaCapacitorCamera(maxPx: number): Promise<string | null> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return null;
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // user picks Camera or Gallery
      quality: 82,
      width: maxPx,
      allowEditing: false,
    });
    return photo.dataUrl ?? null;
  } catch (err: any) {
    // User cancelled or plugin unavailable — fall back to nothing,
    // and the HTML file input is still wired as a secondary path.
    if (err?.message && !/cancel/i.test(err.message)) {
      console.warn("[ImagePicker] Capacitor camera failed:", err.message);
    }
    return null;
  }
}

// ─── Avatar overlay ───────────────────────────────────────────────────────────
// Wraps any image/avatar element with a camera badge. Clicking anywhere on
// the element opens the file picker.

interface AvatarPickerProps {
  onChange: (dataUrl: string) => void;
  children: React.ReactNode;
  /** Extra classes on the wrapper (e.g. shrink-0) */
  className?: string;
  /** Camera badge position */
  badgePosition?: "bottom-right" | "bottom-left";
}

export function ImagePickerOverlay({
  onChange,
  children,
  className = "",
  badgePosition = "bottom-right",
}: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const compressed = await compressImage(file, 400);
    onChange(compressed);
  };

  const handleClick = async () => {
    // Native path first — Camera.getPhoto returns a dataUrl directly
    // (already sized + compressed by the plugin). Falls through to the
    // file input on web or if the user cancels.
    const native = await pickViaCapacitorCamera(400);
    if (native) {
      onChange(native);
      return;
    }
    inputRef.current?.click();
  };

  const badgeClass =
    badgePosition === "bottom-right"
      ? "absolute -bottom-1 -right-1"
      : "absolute -bottom-1 -left-1";

  return (
    <div
      className={`relative inline-block cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      {children}
      <div className={badgeClass}>
        <div className="w-6 h-6 rounded-full gradient-indigo flex items-center justify-center shadow-md pointer-events-none">
          <Camera className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Service cover / wallpaper picker ────────────────────────────────────────
// A full-width banner that shows the cover photo (if set) or an upload prompt.
// Used inside the service edit form.

interface CoverPickerProps {
  coverImage?: string;
  onChange: (dataUrl: string) => void;
}

export function ServiceCoverPicker({ coverImage, onChange }: CoverPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const compressed = await compressImage(file, 900);
    onChange(compressed);
  };

  const handleClick = async () => {
    const native = await pickViaCapacitorCamera(900);
    if (native) {
      onChange(native);
      return;
    }
    inputRef.current?.click();
  };

  return (
    <div>
      <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">
        Cover photo (wallpaper)
      </label>
      <div
        onClick={handleClick}
        className="relative w-full h-24 rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-white/10 hover:border-indigo/40 transition-all flex items-center justify-center group"
        style={
          coverImage
            ? { backgroundImage: `url(${coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }
            : {}
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
        {coverImage ? (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1.5 text-white text-xs font-medium">
              <Camera className="w-4 h-4" /> Change wallpaper
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
            <ImagePlus className="w-5 h-5" />
            <p className="text-[10px]">Add cover photo</p>
          </div>
        )}
      </div>
    </div>
  );
}
