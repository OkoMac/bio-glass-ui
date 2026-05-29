import { useState } from "react";
import { Play, Loader2 } from "lucide-react";

interface Props {
  /** Cloudflare Stream uid OR full iframe URL OR HLS manifest URL. */
  videoUrl: string;
  /** CF Stream uid — used to build the iframe src + thumbnail URL. */
  videoId?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  provider?: string | null;
  title?: string;
}

/**
 * Bicademy video player. Lazy-loads the iframe (or HLS source) only after
 * the user taps Play, so the lesson page doesn't pay a network round-trip
 * to Cloudflare on every visit. The poster image + play button render
 * instantly; the embed cost happens on user intent.
 *
 * Provider-aware:
 *  - `cloudflare_stream` (default) — embeds via customer-<code>.cloudflarestream.com
 *    iframe which handles HLS, captions, autoplay rules.
 *  - any other provider — falls back to a native <video> element pointed
 *    at videoUrl (works for direct mp4 / HLS that Safari can play natively).
 */
export default function BicademyVideoPlayer({
  videoUrl,
  videoId,
  thumbnailUrl,
  durationSeconds,
  title,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const isCloudflareStream = (provider ?? "cloudflare_stream") === "cloudflare_stream";

  // Build the Cloudflare Stream iframe embed URL — that's what plays the
  // video in a browser, NOT the raw HLS manifest URL. We try in order:
  //   1) extract customer code + uid from videoUrl if it's a CF Stream URL
  //   2) use the explicit videoId prop + VITE_CF_STREAM_CUSTOMER_CODE
  //   3) fall back to the raw videoUrl as <video> source (mp4 / direct file)
  //
  // videoUrl may also be null on legacy rows — render a placeholder then.
  const envCustomerCode = import.meta.env.VITE_CF_STREAM_CUSTOMER_CODE as string | undefined;

  // Pattern: https://customer-<code>.cloudflarestream.com/<uid>/...
  const cfMatch = typeof videoUrl === "string"
    ? videoUrl.match(/^https:\/\/customer-([a-z0-9]+)\.cloudflarestream\.com\/([a-f0-9]+)\//i)
    : null;
  const customerCode = cfMatch?.[1] ?? envCustomerCode;
  const uid = cfMatch?.[2] ?? videoId ?? null;
  const isCfStream = !!(customerCode && uid);

  const iframeSrc = isCfStream
    ? `https://customer-${customerCode}.cloudflarestream.com/${uid}/iframe${thumbnailUrl ? `?poster=${encodeURIComponent(thumbnailUrl)}` : ""}`
    : null;

  const directVideoSrc = !isCfStream && typeof videoUrl === "string" && videoUrl.startsWith("http")
    ? videoUrl
    : null;

  if (!iframeSrc && !directVideoSrc) {
    // Nothing playable. Render a small placeholder instead of crashing.
    return (
      <div className="rounded-2xl bg-black/40 border border-white/[0.08] aspect-video flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Video unavailable</p>
      </div>
    );
  }

  const minutes = durationSeconds != null ? Math.max(1, Math.round(durationSeconds / 60)) : null;

  const handlePlay = () => {
    setLoading(true);
    setPlaying(true);
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-black border border-white/[0.08] aspect-video relative">
      {!playing ? (
        <button
          type="button"
          onClick={handlePlay}
          className="w-full h-full flex items-center justify-center relative group"
          aria-label={title ? `Play ${title}` : "Play tutorial"}
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title ?? "Tutorial thumbnail"}
              className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo/20 via-black to-teal/10" />
          )}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 text-black fill-black ml-1" />
            </div>
            {minutes != null && (
              <span className="text-xs text-white/90 font-medium bg-black/40 px-2 py-0.5 rounded">
                {minutes} min
              </span>
            )}
          </div>
        </button>
      ) : iframeSrc ? (
        <>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white/70" />
            </div>
          )}
          <iframe
            src={iframeSrc}
            title={title ?? "Tutorial video"}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            onLoad={() => setLoading(false)}
          />
        </>
      ) : directVideoSrc ? (
        <video
          src={directVideoSrc}
          controls
          autoPlay
          playsInline
          poster={thumbnailUrl ?? undefined}
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
      ) : null}
    </div>
  );
}
