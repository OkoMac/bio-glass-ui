import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { useCatalogByShortUrl, type CatalogPage, type CatalogTheme } from "@/hooks/useCatalogs";
import {
  ChevronLeft, ChevronRight, Share2, BookOpen, Loader2, ExternalLink,
  ArrowLeft, Home, Maximize2, Minimize2,
} from "lucide-react";
import { toast } from "sonner";

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

const SWIPE_THRESHOLD = 70;      // px to trigger page flip
const VELOCITY_THRESHOLD = 500;  // px/s — faster swipes trigger even below distance threshold

export default function CatalogViewer() {
  const { shortUrl } = useParams<{ shortUrl: string }>();
  const { catalog, pages, loading, notFound } = useCatalogByShortUrl(shortUrl ?? null);
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag state
  const dragX = useMotionValue(0);
  const rotateY = useTransform(dragX, [-200, 0, 200], [-25, 0, 25]);
  const shadowOpacity = useTransform(dragX, [-200, 0, 200], [0.6, 0.25, 0.6]);

  // Keyboard nav
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      if (e.key === "Home")  { e.preventDefault(); setDirection(-1); setIdx(0); }
      if (e.key === "End")   { e.preventDefault(); setDirection(1); setIdx(pages.length - 1); }
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "Escape" && document.fullscreenElement) document.exitFullscreen();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, pages.length]);

  // Track fullscreen state
  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const go = (dir: number) => {
    const next = idx + dir;
    if (next < 0 || next >= pages.length) return;
    setDirection(dir);
    setIdx(next);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const dx = info.offset.x;
    const vx = info.velocity.x;
    const flip = Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > VELOCITY_THRESHOLD;
    if (flip) {
      if (dx < 0) go(1);
      else if (dx > 0) go(-1);
    }
    dragX.set(0);
  };

  // Tap-zone navigation — left half back, right half forward (but not on CTA links)
  const handleTapZone = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.35) go(-1);
    else if (x > rect.width * 0.65) go(1);
  };

  const share = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: catalog?.title ?? "Catalog", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success("Link copied"));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen();
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
  const page = pages[idx];
  const progress = pages.length > 0 ? ((idx + 1) / pages.length) * 100 : 0;

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col relative overflow-hidden select-none"
      style={{ background: bg }}>
      {/* Top-edge progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 z-30">
        <motion.div
          className="h-full"
          style={{ background: accent }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Top bar */}
      <header className="flex items-center justify-between p-4 z-10 relative">
        <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white text-xs">
          <ArrowLeft className="w-4 h-4" /> BION
        </Link>
        <div className="text-center">
          <p className="text-white/90 text-sm font-semibold">{catalog.title}</p>
          <p className="text-white/40 text-[10px]">
            {pages.length > 0 ? `Page ${idx + 1} of ${pages.length}` : "no pages"}
            <span className="mx-1.5">·</span>
            <span className="hidden md:inline">← → to flip · F for fullscreen</span>
            <span className="md:hidden">swipe to flip</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleFullscreen} title="Toggle fullscreen"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white">
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={share} className="flex items-center gap-1 text-white/80 hover:text-white text-xs px-3 py-1.5 rounded-pill bg-white/5 hover:bg-white/10">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </header>

      {/* Page viewport */}
      <main className="flex-1 flex items-center justify-center p-4 relative" onClick={handleTapZone}>
        {pages.length === 0 ? (
          <div className="text-center text-white/60">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">This catalog has no pages yet.</p>
          </div>
        ) : (
          <>
            {/* Ambient prev page shadow peek */}
            {idx > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/5 backdrop-blur hover:bg-white/15 items-center justify-center transition-all hover:scale-110"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}

            <div
              className="relative w-full max-w-3xl h-[600px] md:h-[700px]"
              style={{ perspective: "1800px" }}
            >
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={page.id}
                  custom={direction}
                  drag="x"
                  dragConstraints={{ left: -300, right: 300 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  style={{ x: dragX, rotateY, transformStyle: "preserve-3d", cursor: "grab" }}
                  whileDrag={{ cursor: "grabbing" }}
                  initial={{
                    rotateY: direction > 0 ? 90 : direction < 0 ? -90 : 0,
                    opacity: 0,
                    scale: 0.9,
                  }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  exit={{
                    rotateY: direction > 0 ? -90 : 90,
                    opacity: 0,
                    scale: 0.9,
                  }}
                  transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute inset-0"
                >
                  <motion.div className="w-full h-full" style={{
                    boxShadow: shadowOpacity ? `0 25px 50px -12px rgba(0,0,0,0.6)` : undefined,
                  }}>
                    <PageRender page={page} accent={accent} />
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {/* Spine shadow — hints at the book binding */}
              <div className="absolute top-0 bottom-0 left-1/2 w-1 -translate-x-1/2 pointer-events-none"
                style={{ background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.4) 50%, transparent 100%)" }}
              />
            </div>

            {idx < pages.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); go(1); }}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/5 backdrop-blur hover:bg-white/15 items-center justify-center transition-all hover:scale-110"
                aria-label="Next page"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}
          </>
        )}
      </main>

      {/* Page thumbnails */}
      {pages.length > 1 && (
        <footer className="relative z-10 pb-4 px-4">
          <div className="flex items-center justify-center gap-1 max-w-3xl mx-auto overflow-x-auto scrollbar-none">
            {pages.map((p, i) => (
              <button
                key={p.id}
                onClick={(e) => { e.stopPropagation(); setDirection(i > idx ? 1 : -1); setIdx(i); }}
                className={`shrink-0 rounded-md transition-all ${
                  i === idx ? "w-6 h-8" : "w-2 h-8 hover:w-4 opacity-60"
                }`}
                style={{
                  background: i === idx ? accent : "rgba(255,255,255,0.25)",
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
 * Page render — all layout variants rendered as interactive cards.
 * Images fade in, Ken Burns pan on full_image, body text animates up.
 */
function PageRender({ page, accent }: { page: CatalogPage; accent: string }) {
  const pageStyle: React.CSSProperties = {
    background: page.background_color ?? "rgba(20,20,30,0.7)",
    backdropFilter: "blur(24px) saturate(140%)",
    WebkitBackdropFilter: "blur(24px) saturate(140%)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  if (page.layout === "full_image" && page.image_url) {
    return (
      <div className="w-full h-full rounded-3xl overflow-hidden relative shadow-2xl">
        <motion.img
          src={page.image_url}
          alt={page.title ?? ""}
          className="w-full h-full object-cover"
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white"
        >
          {page.title && <h1 className="text-4xl md:text-6xl font-bold leading-tight">{page.title}</h1>}
          {page.subtitle && <p className="text-lg md:text-xl text-white/85 mt-3">{page.subtitle}</p>}
          {page.cta_text && page.cta_link && (
            <a href={page.cta_link} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-pill font-semibold hover:scale-105 transition-transform"
              style={{ background: accent, color: "#000" }}>
              {page.cta_text} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </motion.div>
      </div>
    );
  }

  if (page.layout === "two_column" && page.image_url) {
    return (
      <div className="w-full h-full rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl" style={pageStyle}>
        <motion.img src={page.image_url} alt={page.title ?? ""} className="w-full h-full object-cover"
          initial={{ scale: 1.08, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2 }} />
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="p-8 md:p-10 flex flex-col justify-center text-white"
        >
          {page.title && <h2 className="text-2xl md:text-3xl font-bold leading-tight">{page.title}</h2>}
          {page.subtitle && <p className="text-sm md:text-base text-white/70 mt-1">{page.subtitle}</p>}
          {page.body && (
            <div className="mt-4 text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{page.body}</div>
          )}
          {page.cta_text && page.cta_link && (
            <a href={page.cta_link} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-pill font-semibold text-sm w-fit hover:scale-105 transition-transform"
              style={{ background: accent, color: "#000" }}>
              {page.cta_text} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </motion.div>
      </div>
    );
  }

  if (page.layout === "gallery" && page.gallery_images.length > 0) {
    return (
      <div className="w-full h-full rounded-3xl overflow-hidden p-8 md:p-10 flex flex-col text-white shadow-2xl" style={pageStyle}>
        {page.title && (
          <motion.h2
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold leading-tight"
          >
            {page.title}
          </motion.h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4 flex-1">
          {page.gallery_images.map((img, i) => (
            <motion.img
              key={i} src={img} alt=""
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.03 }}
              className="w-full h-full object-cover rounded-xl cursor-pointer"
            />
          ))}
        </div>
      </div>
    );
  }

  // default / text_only / content
  return (
    <div className="w-full h-full rounded-3xl overflow-hidden p-8 md:p-14 flex flex-col justify-center text-white shadow-2xl" style={pageStyle}>
      {page.image_url && page.layout !== "text_only" && (
        <motion.img
          src={page.image_url} alt=""
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-h-64 object-cover rounded-2xl mb-6"
        />
      )}
      {page.title && (
        <motion.h2
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-3xl md:text-5xl font-bold leading-tight"
        >
          {page.title}
        </motion.h2>
      )}
      {page.subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="text-base md:text-lg text-white/70 mt-2"
        >
          {page.subtitle}
        </motion.p>
      )}
      {page.body && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-6 text-sm md:text-base text-white/85 leading-relaxed whitespace-pre-wrap"
        >
          {page.body}
        </motion.div>
      )}
      {page.cta_text && page.cta_link && (
        <motion.a
          href={page.cta_link} target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-pill font-semibold w-fit"
          style={{ background: accent, color: "#000" }}
        >
          {page.cta_text} <ExternalLink className="w-3.5 h-3.5" />
        </motion.a>
      )}
    </div>
  );
}
