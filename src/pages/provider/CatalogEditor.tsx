import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ProviderNav from "@/components/ProviderNav";
import GlassCard from "@/components/GlassCard";
import {
  ArrowLeft, Trash2, GripVertical, Eye, Save, Loader2,
  FileText, Tag, Phone, Star, Flag, ArrowUp, ArrowDown,
  Globe, Lock, Link as LinkIcon,
} from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { useCatalog, useMyCatalogs, type CatalogPage, type PageType, type PageLayout } from "@/hooks/useCatalogs";
import { toast } from "sonner";

const PAGE_TYPE_META: Record<PageType, { label: string; icon: typeof FileText; hint: string }> = {
  cover:   { label: "Cover",   icon: Star,     hint: "First impression — hero image + title" },
  content: { label: "Content", icon: FileText, hint: "Paragraphs, lists, general copy" },
  product: { label: "Product", icon: Tag,      hint: "Feature one service/product with CTA" },
  feature: { label: "Feature", icon: Flag,     hint: "Highlight a benefit or USP" },
  contact: { label: "Contact", icon: Phone,    hint: "How to reach you · WhatsApp, email" },
  cta:     { label: "CTA",     icon: Flag,     hint: "Last page — book now / share" },
};

export default function CatalogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { catalog, pages, loading, addPage, updatePage, deletePage, reorderPage, refresh } = useCatalog(id ?? null);
  const { publishCatalog } = useMyCatalogs();
  const [selected, setSelected] = useState<CatalogPage | null>(null);
  const [addingType, setAddingType] = useState<PageType | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!catalog) {
    return (
      <div className="min-h-screen bg-background md:pl-56 flex items-center justify-center">
        <ProviderNav />
        <p className="text-sm text-muted-foreground">Catalog not found</p>
      </div>
    );
  }

  const handleAdd = async (page_type: PageType) => {
    try {
      const p = await addPage({
        page_type,
        layout: page_type === "cover" ? "full_image" : "default",
        title: page_type === "cover" ? catalog.title : `${PAGE_TYPE_META[page_type].label} page`,
      });
      setSelected(p);
      setAddingType(null);
      toast.success("Page added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="min-h-screen bg-background md:pl-56 pb-24 md:pb-8">
      <ProviderNav />
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 pt-20 md:pt-8">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => navigate("/pro/catalogs")}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex-1 min-w-0 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
              {catalog.published ? (
                <><Globe className="w-3 h-3 text-teal" /> <span className="text-teal">Live</span></>
              ) : (
                <><Lock className="w-3 h-3" /> Draft</>
              )}
            </p>
            <h1 className="text-lg font-bold text-foreground truncate">{catalog.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {catalog.short_url && (
              <>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/catalog/${catalog.short_url}`;
                    navigator.clipboard.writeText(url).then(() => toast.success("Share link copied"));
                  }}
                  title="Copy share link"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => window.open(`/catalog/${catalog.short_url}`, "_blank")}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
              </>
            )}
            <button
              onClick={async () => {
                if (!catalog.published && pages.length === 0) {
                  toast.error("Add at least one page before publishing");
                  return;
                }
                try { await publishCatalog(catalog.id, !catalog.published); await refresh(); toast.success(catalog.published ? "Unpublished" : "Published — share away"); }
                catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
              }}
              className={`px-4 py-2 rounded-pill text-xs font-semibold ${
                catalog.published ? "bg-white/5 text-muted-foreground hover:text-foreground" : "gradient-indigo text-white"
              }`}
            >
              {catalog.published ? "Unpublish" : "Publish"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
          {/* Pages list */}
          <aside className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Pages ({pages.length})</p>
            </div>

            <div className="space-y-1">
              {pages.map((p) => {
                const Meta = PAGE_TYPE_META[p.page_type];
                return (
                  <div
                    key={p.id}
                    className={`group flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all ${
                      selected?.id === p.id ? "bg-indigo/10 border border-indigo/30" : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]"
                    }`}
                    onClick={() => setSelected(p)}
                  >
                    <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
                    <Meta.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {p.page_number}. {p.title || Meta.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{Meta.label}</p>
                    </div>
                    <div className="flex flex-col md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); if (p.page_number > 1) reorderPage(p.id, p.page_number - 1); }}
                        className="p-0.5 hover:text-foreground"
                        disabled={p.page_number === 1}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (p.page_number < pages.length) reorderPage(p.id, p.page_number + 1); }}
                        className="p-0.5 hover:text-foreground"
                        disabled={p.page_number === pages.length}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add page types */}
            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Add a page</p>
              <div className="grid grid-cols-2 gap-1">
                {(Object.keys(PAGE_TYPE_META) as PageType[]).map((t) => {
                  const M = PAGE_TYPE_META[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setAddingType(t)}
                      className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] text-xs text-foreground text-left"
                    >
                      <M.icon className="w-3 h-3 text-muted-foreground" />
                      {M.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Page editor */}
          <section>
            {selected ? (
              <PageEditor
                key={selected.id}
                page={selected}
                onUpdate={async (patch) => {
                  try { await updatePage(selected.id, patch); toast.success("Saved"); }
                  catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
                }}
                onDelete={async () => {
                  if (!confirm("Delete this page?")) return;
                  await deletePage(selected.id); setSelected(null); toast.success("Page deleted");
                }}
              />
            ) : (
              <GlassCard className="p-12 text-center">
                <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Select a page to edit, or add a new one</p>
              </GlassCard>
            )}
          </section>
        </div>
      </div>

      {/* Confirm add-type modal */}
      <AnimatePresence>
        {addingType && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setAddingType(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-sm w-full bg-background border border-white/10 rounded-2xl p-5 space-y-4"
            >
              <div>
                <p className="text-xs text-muted-foreground">Add page type</p>
                <h3 className="text-base font-bold text-foreground mt-0.5">
                  {PAGE_TYPE_META[addingType].label}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{PAGE_TYPE_META[addingType].hint}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAddingType(null)} className="flex-1 py-2 rounded-xl bg-white/5 text-xs text-muted-foreground">
                  Cancel
                </button>
                <button onClick={() => handleAdd(addingType)} className="flex-1 py-2 rounded-xl gradient-indigo text-white text-xs font-semibold">
                  Add page
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PageEditor({ page, onUpdate, onDelete }: {
  page: CatalogPage;
  onUpdate: (patch: Partial<CatalogPage>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: page.title ?? "",
    subtitle: page.subtitle ?? "",
    body: page.body ?? "",
    image_url: page.image_url ?? "",
    cta_text: page.cta_text ?? "",
    cta_link: page.cta_link ?? "",
    background_color: page.background_color ?? "",
    layout: page.layout,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({
      title: form.title || null,
      subtitle: form.subtitle || null,
      body: form.body || null,
      image_url: form.image_url || null,
      cta_text: form.cta_text || null,
      cta_link: form.cta_link || null,
      background_color: form.background_color || null,
      layout: form.layout,
    });
    setSaving(false);
  };

  const Meta = PAGE_TYPE_META[page.page_type];

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Meta.icon className="w-4 h-4 text-indigo" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Page {page.page_number} · {Meta.label}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="text-xs text-coral hover:text-coral/80 flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" /> Delete
        </button>
      </div>

      <Field label="Title">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Page heading"
          className="input"
        />
      </Field>

      <Field label="Subtitle">
        <input
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          placeholder="Short tagline"
          className="input"
        />
      </Field>

      <Field label="Body" hint="Markdown allowed">
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          placeholder="Longer description, bullet points, etc."
          rows={5}
          className="input resize-none"
        />
      </Field>

      <ImageUpload
        label="Image"
        hint="Drop or click to upload · or paste a URL"
        folder="catalogs"
        value={form.image_url}
        onChange={(url) => setForm({ ...form, image_url: url ?? "" })}
      />

      <Field label="Layout">
        <div className="flex flex-wrap gap-1.5">
          {(["default", "two_column", "full_image", "gallery", "text_only"] as PageLayout[]).map((l) => (
            <button
              key={l}
              onClick={() => setForm({ ...form, layout: l })}
              className={`px-3 py-1.5 rounded-pill text-[11px] font-semibold transition-all ${
                form.layout === l ? "gradient-indigo text-white" : "bg-white/5 text-muted-foreground"
              }`}
            >
              {l.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </Field>

      {(page.page_type === "product" || page.page_type === "cta" || page.page_type === "contact") && (
        <>
          <Field label="CTA button text">
            <input
              value={form.cta_text}
              onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
              placeholder="Book now"
              className="input"
            />
          </Field>
          <Field label="CTA link">
            <input
              value={form.cta_link}
              onChange={(e) => setForm({ ...form, cta_link: e.target.value })}
              placeholder="https://wa.me/27..."
              className="input"
            />
          </Field>
        </>
      )}

      <button
        onClick={handleSave} disabled={saving}
        className="w-full py-3 rounded-xl gradient-indigo text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save page
      </button>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.75rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: hsl(var(--foreground));
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { border-color: rgba(99,102,241,0.5); }
        .input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
    </GlassCard>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</label>
      {hint && <span className="text-[10px] text-muted-foreground/70 ml-2">· {hint}</span>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

