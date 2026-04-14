import { useState, useEffect, useRef, forwardRef } from "react";
import { useParams, Link } from "react-router-dom";
import HTMLFlipBook from "react-pageflip";
import { useCatalogByShortUrl, type CatalogPage, type CatalogTheme } from "@/hooks/useCatalogs";
import {
  ChevronLeft, ChevronRight, Share2, BookOpen, Loader2, ExternalLink,
  ArrowLeft, Home, Maximize2, Minimize2, Volume2, VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { playFlipSound, isCatalogMuted, setCatalogMuted } from "@/lib/flipSound";

const THEME_BG: Record<CatalogTheme, string> = {
  indigo:     "radial-gradient(ellipse at top,#2e1065 0%,#0f0c29 50%,#000 100%)",
  teal:       "radial-gradient(ellipse at top,#134e4a 0%,#0f2027 50%,#000 100%)",
  coral:      "radial-gradient(ellipse at top,#7c2d12 0%,#1a0f0a 50%,#000 100%)",
  amber:      "radial-gradient(ellipse at top,#78350f 0%,#1c1410 50%,#000 100%)",
  monochrome: "radial-gradient(ellipse at top,#374151 0%,#000 50%,#000 100%)",
};

const THEME_ACCENT: Record<CatalogTheme, string> = {
  indigo: "#818cf8", teal: "#5eead4", coral: "#fb923c",
  amber: "#fbbf24", monochrome: "#e5e7eb",
};

/**
 * A real FlippingBook-style viewer.
 * react-pageflip renders a two-page spread with realistic corner-curl
 * on drag, page shadows, and a proper book spine. On mobile it switches
 * to single-page portrait mode automatically.
 */
export default function CatalogViewer() {
  const { shortUrl } = useParams<{ shortUrl: string }>();
  const { catalog, pages, loading, notFound } = useCatalogByShortUrl(shortUrl ?? null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted] = useState(() => isCatalogMuted());
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null);

  const flip = (delta: number) => {
    if (!bookRef.current) return;
    const inst = bookRef.current.pageFlip();
    if (!inst) return;
    if (delta > 0) inst.flipNext();
    else inst.flipPrev();
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); flip(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); flip(-1); }
      if (e.key === "Home" && bookRef.current?.pageFlip) { e.preventDefault(); bookRef.current.pageFlip().flip(0); }
      if (e.key === "End"  && bookRef.current?.pageFlip) { e.preventDefault(); bookRef.current.pageFlip().flip(totalPages - 1); }
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "Escape" && document.fullscreenElement) document.exitFullscreen();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen();
  };

  const toggleMuted = () => {
    setMuted((prev) => {
      const next = !prev;
      setCatalogMuted(next);
      return next;
    });
  };

  const share = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: catalog?.title ?? "Catalog", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success("Link copied"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (notFound || !catalog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white text-center px-6">
        <BookOpen className="w-12 h-12 text-white/30 mb-4" />
        <p className="text-xl font-semibold">Catalog not found</p>
        <p className="text-sm text-white/60 mt-1">It may have been unpublished or the link is wrong.</p>
        <Link to="/" className="mt-6 px-5 py-2 rounded-pill bg-white/10 text-sm">
          <Home className="w-3 h-3 inline mr-1" /> Home
        </Link>
      </div>
    );
  }

  const bg = THEME_BG[catalog.theme];
  const accent = THEME_ACCENT[catalog.theme];
  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col relative overflow-hidden select-none"
      style={{ background: bg }}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 z-30">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ background: accent, width: `${progress}%` }}
        />
      </div>

      {/* Top bar */}
      <header className="flex items-center justify-between p-4 z-10 relative">
        <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white text-xs">
          <ArrowLeft className="w-4 h-4" /> BION
        </Link>
        <div className="text-center flex-1 min-w-0 px-2">
          <p className="text-white/90 text-sm font-semibold truncate">{catalog.title}</p>
          <p className="text-white/40 text-[10px]">
            {totalPages > 0 ? `${currentPage + 1} / ${totalPages}` : "…"}
            <span className="mx-1.5">·</span>
            <span className="hidden md:inline">drag the corner · ← → keys</span>
            <span className="md:hidden">swipe or tap corners</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleMuted} title={muted ? "Unmute page-flip sound" : "Mute page-flip sound"}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white">
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={toggleFullscreen} title="Toggle fullscreen"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white">
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={share} className="flex items-center gap-1 text-white/80 hover:text-white text-xs px-3 py-1.5 rounded-pill bg-white/5 hover:bg-white/10">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </header>

      {/* FlippingBook viewport */}
      <main className="flex-1 flex items-center justify-center p-2 md:p-4 relative">
        {pages.length === 0 ? (
          <div className="text-center text-white/60">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">This catalog has no pages yet.</p>
          </div>
        ) : (
          <>
            <button
              onClick={() => flip(-1)}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/5 backdrop-blur hover:bg-white/15 items-center justify-center transition-all hover:scale-110"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <HTMLFlipBook
              ref={bookRef}
              width={550}
              height={720}
              size="stretch"
              minWidth={315}
              maxWidth={700}
              minHeight={420}
              maxHeight={1000}
              maxShadowOpacity={0.5}
              drawShadow
              showCover
              usePortrait
              mobileScrollSupport
              useMouseEvents
              clickEventForward
              showPageCorners
              flippingTime={800}
              startPage={0}
              startZIndex={0}
              autoSize
              swipeDistance={30}
              disableFlipByClick={false}
              className="shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)]"
              style={{}}
              onFlip={(e: { data: number }) => {
                setCurrentPage(e.data);
                if (!muted) playFlipSound();
              }}
              onInit={(e: { data: { page: number } }) => {
                setTotalPages(pages.length);
                setCurrentPage(e.data?.page ?? 0);
              }}
            >
              {pages.map((p, i) => (
                <Page key={p.id} number={i + 1} page={p} accent={accent} total={pages.length} />
              ))}
            </HTMLFlipBook>

            <button
              onClick={() => flip(1)}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/5 backdrop-blur hover:bg-white/15 items-center justify-center transition-all hover:scale-110"
              aria-label="Next page"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </main>

      {/* Page thumbnails */}
      {pages.length > 1 && totalPages > 0 && (
        <footer className="relative z-10 pb-4 px-4">
          <div className="flex items-center justify-center gap-1 max-w-3xl mx-auto overflow-x-auto scrollbar-none">
            {pages.map((p, i) => (
              <button
                key={p.id}
                onClick={() => bookRef.current?.pageFlip?.().flip(i)}
                className={`shrink-0 rounded-md transition-all ${
                  i === currentPage ? "h-8" : "h-6 opacity-50 hover:opacity-80"
                }`}
                style={{
                  width: i === currentPage ? 24 : 6,
                  background: i === currentPage ? accent : "rgba(255,255,255,0.35)",
                }}
                aria-label={`Jump to page ${i + 1}`}
                title={p.title ?? `Page ${i + 1}`}
              />
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}

/**
 * Single page — must be a forwardRef so StPageFlip can attach refs to
 * measure/animate it. Renders content based on layout.
 */
const Page = forwardRef<HTMLDivElement, { number: number; page: CatalogPage; accent: string; total: number }>(
  function Page({ number, page, accent, total }, ref) {
    const isCover = number === 1;
    const isBack = number === total;
    // Cover + back cover get `data-density=hard` so StPageFlip renders them as rigid covers
    const density = isCover || isBack ? "hard" : "soft";

    return (
      <div
        ref={ref}
        data-density={density}
        className="relative w-full h-full overflow-hidden bg-white"
        style={{
          background: page.background_color ?? "#0a0a0f",
        }}
      >
        <PageContent page={page} accent={accent} />
        {/* Paper texture + corner peel hint */}
        <div className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 100% 0%, rgba(0,0,0,0.12) 0%, transparent 60px)`,
          }}
        />
      </div>
    );
  }
);

function PageContent({ page, accent }: { page: CatalogPage; accent: string }) {
  // full_image layout — edge-to-edge hero
  if (page.layout === "full_image" && page.image_url) {
    return (
      <div className="relative w-full h-full">
        <img src={page.image_url} alt={page.title ?? ""} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
          {page.title && <h1 className="text-3xl md:text-5xl font-bold leading-tight">{page.title}</h1>}
          {page.subtitle && <p className="text-base md:text-lg text-white/85 mt-2">{page.subtitle}</p>}
          {page.cta_text && page.cta_link && (
            <a href={page.cta_link} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-pill font-semibold text-sm"
              style={{ background: accent, color: "#000" }}>
              {page.cta_text} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // two_column — image left, copy right
  if (page.layout === "two_column" && page.image_url) {
    return (
      <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 text-white">
        <img src={page.image_url} alt={page.title ?? ""} className="w-full h-full object-cover" />
        <div className="p-6 md:p-8 flex flex-col justify-center bg-[#0a0a0f]">
          {page.title && <h2 className="text-2xl md:text-3xl font-bold leading-tight">{page.title}</h2>}
          {page.subtitle && <p className="text-xs md:text-sm text-white/70 mt-1">{page.subtitle}</p>}
          {page.body && (
            <div className="mt-3 text-xs md:text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{page.body}</div>
          )}
          {page.cta_text && page.cta_link && (
            <a href={page.cta_link} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-pill font-semibold text-xs w-fit"
              style={{ background: accent, color: "#000" }}>
              {page.cta_text} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // gallery — grid of images
  if (page.layout === "gallery" && page.gallery_images.length > 0) {
    return (
      <div className="w-full h-full p-6 md:p-8 flex flex-col text-white bg-[#0a0a0f]">
        {page.title && <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-1">{page.title}</h2>}
        {page.subtitle && <p className="text-xs md:text-sm text-white/70 mb-3">{page.subtitle}</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 flex-1">
          {page.gallery_images.map((img, i) => (
            <img key={i} src={img} alt=""
              className="w-full h-full object-cover rounded-lg cursor-pointer hover:brightness-110 transition-all"
            />
          ))}
        </div>
      </div>
    );
  }

  // default / text_only / content
  return (
    <div className="w-full h-full p-6 md:p-12 flex flex-col justify-center text-white bg-[#0a0a0f]">
      {page.image_url && page.layout !== "text_only" && (
        <img src={page.image_url} alt=""
          className="w-full max-h-56 object-cover rounded-xl mb-5"
        />
      )}
      {page.title && (
        <h2 className="text-3xl md:text-4xl font-bold leading-tight">{page.title}</h2>
      )}
      {page.subtitle && (
        <p className="text-sm md:text-base text-white/70 mt-2">{page.subtitle}</p>
      )}
      {page.body && (
        <div className="mt-5 text-sm md:text-base text-white/85 leading-relaxed whitespace-pre-wrap">{page.body}</div>
      )}
      {page.cta_text && page.cta_link && (
        <a href={page.cta_link} target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-pill font-semibold w-fit text-sm"
          style={{ background: accent, color: "#000" }}>
          {page.cta_text} <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
