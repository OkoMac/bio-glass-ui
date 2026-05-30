import { useState, useEffect, useRef } from "react";
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

  // Prefer the HLS manifest URL with a native <video> element. Safari
  // plays HLS natively (no library), Chrome/Brave/Firefox via the small
  // hls.js polyfill we load lazily below. Going direct-HLS instead of
  // the Cloudflare Stream iframe avoids three real problems we hit:
  //   - Safari ITP blocks cookies the iframe relies on → blank white frame
  //   - Brave Shields blocks third-party iframes from cloudflarestream.com
  //   - The iframe ships ~250kB of UI we don't need
  //
  // Source resolution:
  //   1) videoUrl already an HLS .m3u8 → use directly
  //   2) videoUrl is a CF Stream URL pattern → reconstruct the HLS URL from
  //      the parsed code + uid
  //   3) videoId + VITE_CF_STREAM_CUSTOMER_CODE → reconstruct
  //   4) videoUrl is some other http URL → play as direct file (mp4)
  //   5) nothing playable → render placeholder
  const envCustomerCode = import.meta.env.VITE_CF_STREAM_CUSTOMER_CODE as string | undefined;
  const cfMatch = typeof videoUrl === "string"
    ? videoUrl.match(/^https:\/\/customer-([a-z0-9]+)\.cloudflarestream\.com\/([a-f0-9]+)\//i)
    : null;
  const customerCode = cfMatch?.[1] ?? envCustomerCode;
  const uid = cfMatch?.[2] ?? videoId ?? null;

  let hlsSrc: string | null = null;
  if (typeof videoUrl === "string" && /\.m3u8(?:[?#]|$)/i.test(videoUrl)) {
    hlsSrc = videoUrl;
  } else if (customerCode && uid) {
    hlsSrc = `https://customer-${customerCode}.cloudflarestream.com/${uid}/manifest/video.m3u8`;
  }

  const directVideoSrc = !hlsSrc && typeof videoUrl === "string" && videoUrl.startsWith("http")
    ? videoUrl
    : null;

  // hls.js for non-Safari browsers — lazy-loaded only after the user taps
  // Play, so the chunk doesn't ship in the initial bundle.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (!playing || !hlsSrc) return;
    const video = videoRef.current;
    if (!video) return;
    // Safari/iOS plays HLS natively — assign src and go.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsSrc;
      setLoading(false);
      return;
    }
    // Other browsers: dynamic-import hls.js
    let hls: { destroy: () => void } | null = null;
    (async () => {
      try {
        const Hls = (await import("hls.js")).default;
        if (Hls.isSupported()) {
          const inst = new Hls();
          inst.loadSource(hlsSrc);
          inst.attachMedia(video);
          hls = inst as unknown as { destroy: () => void };
          setLoading(false);
        } else {
          // Last-ditch: try src= anyway. If MediaSource isn't available it just won't play.
          video.src = hlsSrc;
          setLoading(false);
        }
      } catch {
        // hls.js failed to load — surface as a play-state false.
        setLoading(false);
      }
    })();
    return () => { if (hls) hls.destroy(); };
  }, [playing, hlsSrc]);

  if (!hlsSrc && !directVideoSrc) {
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
          {/* Background: always render the gradient; layer the thumbnail
             on top via CSS background-image so a failed load (Brave Shields
             blocks cross-origin to cloudflarestream.com by default) doesn't
             show the browser's broken-image icon. */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo/30 via-obsidian to-teal/20" aria-hidden="true" />
          {thumbnailUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity"
              style={{ backgroundImage: `url("${thumbnailUrl}")` }}
              aria-hidden="true"
            />
          )}
          {/* Play button overlay — always visible, z-index above the bg layers. */}
          <div className="relative z-10 flex flex-col items-center gap-2 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 text-black fill-black ml-1" />
            </div>
            {minutes != null && (
              <span className="text-xs text-white font-medium bg-black/60 px-2 py-0.5 rounded">
                {minutes} min
              </span>
            )}
          </div>
        </button>
      ) : hlsSrc ? (
        <>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white/70" />
            </div>
          )}
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            poster={thumbnailUrl ?? undefined}
            className="absolute inset-0 w-full h-full object-contain bg-black"
            onCanPlay={() => setLoading(false)}
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
