import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AdminNav from "@/components/AdminNav";
import GlassCard from "@/components/GlassCard";
import { useBionCatalogs } from "@/hooks/useBionCatalogs";
import type { CatalogTheme } from "@/hooks/useCatalogs";
import {
  BookOpen, Plus, Eye, Share2, Loader2, X, Globe, Lock,
  Link as LinkIcon, Building2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const THEME_SWATCHES: { id: CatalogTheme; gradient: string }[] = [
  { id: "indigo",      gradient: "linear-gradient(135deg,#312e81,#6366f1)" },
  { id: "teal",        gradient: "linear-gradient(135deg,#134e4a,#14b8a6)" },
  { id: "coral",       gradient: "linear-gradient(135deg,#7c2d12,#f05a28)" },
  { id: "amber",       gradient: "linear-gradient(135deg,#78350f,#f59e0b)" },
  { id: "monochrome",  gradient: "linear-gradient(135deg,#1f2937,#6b7280)" },
];

export default function AdminCatalogs() {
  const { catalogs, loading, createCatalog, publishCatalog, deleteCatalog } = useBionCatalogs();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState<CatalogTheme>("indigo");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Title required"); return; }
    try {
      setSubmitting(true);
      const cat = await createCatalog({ title: title.trim(), description: description.trim() || undefined, theme });
      setCreating(false); setTitle(""); setDescription(""); setTheme("indigo");
      toast.success("BION catalog created");
      // Editor currently lives under /pro/catalogs — same editor works for BION catalogs
      navigate(`/pro/catalogs/${cat.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setSubmitting(false); }
  };

  const copyLink = (shortUrl: string) => {
    const url = `${window.location.origin}/catalog/${shortUrl}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Share link copied"));
  };

  const totalViews = catalogs.reduce((sum, c) => sum + (c.view_count ?? 0), 0);
  const totalShares = catalogs.reduce((sum, c) => sum + (c.share_count ?? 0), 0);
  const liveCount = catalogs.filter((c) => c.published).length;

  return (
    <div className="min-h-screen bg-background md:pl-56 pb-24 md:pb-8">
      <AdminNav />
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 pt-20 md:pt-8">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6 text-coral" /> BION Catalogs
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Platform-owned flipbooks · pitch decks, investor one-pagers, corporate wellness proposals
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-pill gradient-indigo text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> New BION catalog
          </button>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Live</p>
            <p className="text-2xl font-bold text-teal font-data mt-1">{liveCount}</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total views</p>
            <p className="text-2xl font-bold text-indigo font-data mt-1">{totalViews.toLocaleString()}</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Shares</p>
            <p className="text-2xl font-bold text-amber font-data mt-1">{totalShares.toLocaleString()}</p>
          </GlassCard>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : catalogs.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">No BION catalogs yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Build pitch decks for provider outreach, investor briefs, corporate wellness proposals — all as flippable brochures.
            </p>
            <button
              onClick={() => setCreating(true)}
              className="mt-4 px-4 py-2 rounded-pill gradient-indigo text-white text-sm font-semibold inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Create your first
            </button>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalogs.map((c) => {
              const themeGradient = THEME_SWATCHES.find(t => t.id === c.theme)?.gradient ?? THEME_SWATCHES[0].gradient;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="glass-1 rounded-2xl overflow-hidden flex flex-col"
                >
                  <button
                    onClick={() => navigate(`/pro/catalogs/${c.id}`)}
                    className="h-40 relative flex items-end p-4 text-left"
                    style={{ background: c.cover_image_url ? `url(${c.cover_image_url}) center/cover` : themeGradient }}
                  >
                    {c.cover_image_url && <div className="absolute inset-0 bg-black/40" />}
                    <div className="relative z-10">
                      <p className="text-lg font-bold text-white leading-tight">{c.title}</p>
                      {c.description && (
                        <p className="text-xs text-white/80 line-clamp-1 mt-1">{c.description}</p>
                      )}
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-coral/20 text-coral text-[10px] font-semibold">
                        BION
                      </span>
                      {c.published ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal/20 text-teal text-[10px] font-semibold">
                          <Globe className="w-2.5 h-2.5" /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-semibold">
                          <Lock className="w-2.5 h-2.5" /> Draft
                        </span>
                      )}
                    </div>
                  </button>

                  <div className="p-3 flex items-center justify-between gap-2 border-t border-white/5">
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {c.view_count}</span>
                      <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {c.share_count}</span>
                    </div>
                    <div className="flex gap-1">
                      {c.short_url && (
                        <button
                          onClick={(e) => { e.stopPropagation(); copyLink(c.short_url!); }}
                          title="Copy share link"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          try { await publishCatalog(c.id, !c.published); toast.success(c.published ? "Unpublished" : "Published"); }
                          catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold ${
                          c.published ? "bg-white/5 text-muted-foreground hover:text-foreground"
                                      : "bg-indigo text-white"
                        }`}
                      >
                        {c.published ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm("Delete this catalog permanently?")) return;
                          try { await deleteCatalog(c.id); toast.success("Deleted"); }
                          catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-coral/20 text-muted-foreground hover:text-coral transition-colors"
                        title="Delete"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => !submitting && setCreating(false)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg bg-background border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin · Platform-owned</p>
                  <h3 className="text-base font-bold text-foreground">New BION catalog</h3>
                </div>
                <button onClick={() => setCreating(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Title</label>
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. BION for Providers · 2026 Pitch"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-indigo/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Short description</label>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Everything a provider needs to know about joining BION"
                  rows={2}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-indigo/50 resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Theme</label>
                <div className="flex gap-2 mt-1.5">
                  {THEME_SWATCHES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`w-10 h-10 rounded-xl border-2 transition-all ${
                        theme === t.id ? "border-foreground scale-110" : "border-white/10"
                      }`}
                      style={{ background: t.gradient }}
                      title={t.id}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreate} disabled={submitting || !title.trim()}
                className="w-full py-3 rounded-xl gradient-indigo text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create BION catalog
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
