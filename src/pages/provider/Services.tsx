import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import { ServiceCoverPicker } from "@/components/ImagePickerOverlay";
import { Plus, Pencil, Trash2, Check, X, Clock, Zap, Loader2 } from "lucide-react";
import { useBookings } from "@/contexts/BookingsContext";
import {
  useProviderServices,
  type Service,
  type ServiceInput,
  type BionVertical,
} from "@/hooks/useProviderServices";

// ── Constants ────────────────────────────────────────────────────────────────
const DURATIONS = [15, 30, 45, 60, 90, 120] as const;

const CATEGORIES: { key: BionVertical; label: string; accent: string }[] = [
  { key: "fitness",      label: "Fitness",      accent: "text-teal" },
  { key: "medical",      label: "Medical",      accent: "text-coral" },
  { key: "beauty",       label: "Beauty",       accent: "text-amber" },
  { key: "mental",       label: "Mental",       accent: "text-violet" },
  { key: "nutrition",    label: "Nutrition",    accent: "text-teal" },
  { key: "wellness",     label: "Wellness",     accent: "text-indigo" },
  { key: "professional", label: "Professional", accent: "text-indigo" },
];

type FormState = {
  title: string;
  description: string;
  price_rand: number;
  duration_minutes: number;
  category: BionVertical;
  active: boolean;
  coverImage?: string;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  price_rand: 0,
  duration_minutes: 60,
  category: "wellness",
  active: true,
  coverImage: "",
};

// ── Validation (mirrors the backend zod schema) ─────────────────────────────
function validateForm(f: FormState): string | null {
  if (f.title.trim().length < 2 || f.title.trim().length > 80) {
    return "Title must be 2–80 characters";
  }
  if (f.price_rand < 0 || f.price_rand > 50_000) {
    return "Price must be between R0 and R50,000";
  }
  if (f.duration_minutes < 15 || f.duration_minutes > 240) {
    return "Duration must be 15–240 minutes";
  }
  return null;
}

export default function ProviderServices() {
  const { bookings } = useBookings();
  const {
    services,
    loading,
    saving,
    error,
    create,
    update,
    remove,
    toggleActive,
  } = useProviderServices();

  const [editId, setEditId]     = useState<string | null>(null);
  const [addOpen, setAddOpen]   = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm]         = useState<FormState>(emptyForm);

  // Surface hook-level errors as toasts rather than inline text; keeps the
  // table clean when a single toggle fails mid-scroll.
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Merge live bookings from context to show per-service stats.
  const serviceStats = useMemo(() => {
    const live: Record<string, { bookings: number; revenue: number }> = {};
    bookings.forEach(b => {
      services.forEach(svc => {
        const first = svc.title.split(" ")[0]?.toLowerCase() ?? "";
        const bSvcFirst = b.service.split(" ")[0]?.toLowerCase() ?? "";
        const nameMatch =
          (first && b.service.toLowerCase().includes(first)) ||
          (bSvcFirst && svc.title.toLowerCase().includes(bSvcFirst));
        if (nameMatch) {
          if (!live[svc.id]) live[svc.id] = { bookings: 0, revenue: 0 };
          live[svc.id].bookings += 1;
          const priceNum = parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
          live[svc.id].revenue += priceNum;
        }
      });
    });
    return live;
  }, [bookings, services]);

  const totalRevenue  = services.reduce(
    (s, svc) => s + (serviceStats[svc.id]?.revenue ?? 0),
    0,
  );
  const totalBookings = services.reduce(
    (s, svc) => s + (serviceStats[svc.id]?.bookings ?? 0),
    0,
  );
  const activeCount = services.filter(s => s.active).length;

  const openEdit = (svc: Service) => {
    setForm({
      title: svc.title,
      description: svc.description ?? "",
      price_rand: svc.price_rand,
      duration_minutes: svc.duration_minutes,
      category: (CATEGORIES.find(c => c.key === svc.category)?.key ?? "wellness") as BionVertical,
      active: svc.active,
      coverImage: "",
    });
    setEditId(svc.id);
    setAddOpen(false);
  };

  const buildInput = (f: FormState): ServiceInput => ({
    title: f.title.trim(),
    description: f.description.trim() || null,
    price_rand: Number(f.price_rand) || 0,
    duration_minutes: f.duration_minutes,
    category: f.category,
    active: f.active,
  });

  const saveEdit = async () => {
    if (!editId) return;
    const err = validateForm(form);
    if (err) { toast.error(err); return; }
    try {
      await update(editId, buildInput(form));
      toast.success("Service updated");
      setEditId(null);
      setForm(emptyForm);
    } catch { /* error toast raised by effect */ }
  };

  const addService = async () => {
    const err = validateForm(form);
    if (err) { toast.error(err); return; }
    try {
      await create(buildInput(form));
      toast.success("Service added");
      setForm(emptyForm);
      setAddOpen(false);
    } catch { /* error toast raised by effect */ }
  };

  const deleteService = async (id: string) => {
    try {
      await remove(id);
      toast.success("Service removed");
      setDeleteId(null);
    } catch { /* error toast raised by effect */ }
  };

  const handleToggle = async (svc: Service) => {
    try {
      await toggleActive(svc.id, !svc.active);
    } catch { /* error toast raised by effect */ }
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Services</h1>
            <p className="text-xs text-muted-foreground">Manage your offerings, pricing and durations</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setAddOpen(true); setEditId(null); setForm(emptyForm); }}
            className="flex items-center gap-1.5 rounded-pill px-3 py-2 gradient-indigo text-primary-foreground text-xs font-semibold shadow-cta"
          >
            <Plus className="w-3.5 h-3.5" /> Add service
          </motion.button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active",   value: String(activeCount),                           color: "#6366F1" },
            { label: "Bookings", value: String(totalBookings),                         color: "#2DD4BF" },
            { label: "Revenue",  value: `R${totalRevenue.toLocaleString()}`,           color: "#FBBF24" },
          ].map(s => (
            <GlassCard key={s.label} className="p-3 text-center">
              <p className="text-lg font-bold font-data" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Add form */}
        <AnimatePresence>
          {addOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <GlassCard className="p-4 space-y-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">New service</p>
                  <button
                    onClick={() => setAddOpen(false)}
                    className="w-7 h-7 glass-1 rounded-full flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
                <ServiceForm
                  form={form}
                  setForm={setForm}
                  onCoverChange={(url) => setForm(p => ({ ...p, coverImage: url }))}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddOpen(false)}
                    className="flex-1 py-2 glass-1 rounded-pill text-xs text-muted-foreground"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={addService}
                    disabled={!form.title.trim() || saving}
                    className="flex-1 py-2 gradient-indigo rounded-pill text-xs font-semibold text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-1"
                  >
                    {saving
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                      : <><Plus className="w-3.5 h-3.5" /> Add service</>}
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {loading && services.length === 0 && (
          <GlassCard className="p-6 rounded-2xl">
            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading services…
            </div>
          </GlassCard>
        )}

        {/* Empty state */}
        {!loading && services.length === 0 && (
          <GlassCard className="p-6 rounded-2xl text-center">
            <p className="text-sm font-semibold text-foreground mb-1">No services yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Add your first service so clients can book you.
            </p>
            <button
              onClick={() => { setAddOpen(true); setForm(emptyForm); }}
              className="inline-flex items-center gap-1.5 rounded-pill px-4 py-2 gradient-indigo text-primary-foreground text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add your first service
            </button>
          </GlassCard>
        )}

        {/* Service list */}
        <div className="space-y-3">
          {services.map((svc, i) => {
            const stats      = serviceStats[svc.id];
            const isEditing  = editId === svc.id;
            const isDeleting = deleteId === svc.id;
            const cat        = CATEGORIES.find(c => c.key === svc.category);

            return (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard className="overflow-hidden rounded-2xl">
                  {isEditing ? (
                    <div className="p-4 space-y-4">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                        Editing: {svc.title}
                      </p>
                      <ServiceForm
                        form={form}
                        setForm={setForm}
                        onCoverChange={(url) => setForm(p => ({ ...p, coverImage: url }))}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditId(null); setForm(emptyForm); }}
                          className="flex-1 py-2 glass-1 rounded-pill text-xs text-muted-foreground"
                        >
                          Cancel
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={saveEdit}
                          disabled={saving}
                          className="flex-1 py-2 gradient-indigo rounded-pill text-xs font-semibold text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-1"
                        >
                          {saving
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                            : "Save changes"}
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-semibold text-foreground">{svc.title}</p>
                            {cat && (
                              <span className={`text-[9px] px-1.5 py-0.5 glass-1 rounded-pill ${cat.accent}`}>
                                {cat.label}
                              </span>
                            )}
                            {svc.price_rand === 0 && (
                              <span className="text-[9px] px-1.5 py-0.5 glass-accent-teal rounded-pill text-teal">
                                Free intro
                              </span>
                            )}
                            {!svc.active && (
                              <span className="text-[9px] px-1.5 py-0.5 glass-1 rounded-pill text-muted-foreground">
                                Inactive
                              </span>
                            )}
                          </div>
                          {svc.description && (
                            <p className="text-[11px] text-muted-foreground mb-1.5 line-clamp-2">
                              {svc.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> {svc.duration_minutes}min
                            </span>
                            <span className="font-data">
                              {svc.price_rand === 0 ? "Free" : `R${svc.price_rand}`}
                            </span>
                            {stats && stats.bookings > 0 && <span>{stats.bookings} bookings</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Active toggle */}
                          <button
                            onClick={() => handleToggle(svc)}
                            aria-label={svc.active ? "Deactivate" : "Activate"}
                            className={`w-10 h-5 rounded-pill relative transition-all ${
                              svc.active ? "bg-teal" : "bg-white/10"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                                svc.active ? "left-5" : "left-0.5"
                              }`}
                            />
                          </button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEdit(svc)}
                            className="flex items-center gap-1 px-2.5 py-1.5 glass-1 rounded-pill text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setDeleteId(svc.id)}
                            className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-coral hover:bg-coral/10 transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Delete confirm */}
                      <AnimatePresence>
                        {isDeleting && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-white/5 flex items-center gap-3"
                          >
                            <p className="flex-1 text-xs text-muted-foreground">Remove this service?</p>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="px-2.5 py-1 glass-1 rounded-pill text-[11px] text-muted-foreground"
                            >
                              Keep
                            </button>
                            <button
                              onClick={() => deleteService(svc.id)}
                              disabled={saving}
                              className="px-2.5 py-1 rounded-pill text-[11px] text-white bg-coral/30 hover:bg-coral/50 transition-colors disabled:opacity-40"
                            >
                              Remove
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Pro tip */}
        <GlassCard variant="accent-indigo" className="p-4 rounded-2xl">
          <div className="flex items-start gap-3">
            <Zap className="w-4 h-4 text-violet shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-violet mb-1">Pro tip</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Providers with a free intro session see <strong className="text-violet">3× more</strong> profile visits
                and <strong className="text-violet">68% higher</strong> first-booking conversion.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <BionAssistant />
      <ProviderNav />
    </div>
  );
}

// ── Service form (shared by add + edit) ──────────────────────────────────────
function ServiceForm({
  form,
  setForm,
  onCoverChange,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onCoverChange: (url: string) => void;
}) {
  return (
    <div className="space-y-3">
      <ServiceCoverPicker coverImage={form.coverImage || undefined} onChange={onCoverChange} />

      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
          Title <span className="text-coral">*</span>
        </label>
        <input
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Deep tissue massage"
          maxLength={80}
          className="w-full h-10 glass-1 rounded-xl px-3 text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">
          Category
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setForm(p => ({ ...p, category: c.key }))}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                form.category === c.key
                  ? "gradient-indigo text-primary-foreground"
                  : "glass-1 text-muted-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">
            Duration
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map(d => (
              <button
                key={d}
                onClick={() => setForm(p => ({ ...p, duration_minutes: d }))}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  form.duration_minutes === d
                    ? "gradient-indigo text-primary-foreground"
                    : "glass-1 text-muted-foreground"
                }`}
              >
                {d < 60 ? `${d}m` : d % 60 === 0 ? `${d / 60}h` : `${Math.floor(d / 60)}h${d % 60}`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">
            Price (ZAR) <span className="text-coral">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R</span>
            <input
              type="number"
              min={0}
              max={50_000}
              step={50}
              value={form.price_rand}
              onChange={e => setForm(p => ({ ...p, price_rand: Number(e.target.value) }))}
              className="w-full h-10 glass-1 rounded-xl pl-7 pr-3 text-sm text-foreground bg-transparent outline-none"
            />
          </div>
          <p className="text-[9px] text-muted-foreground mt-1">R0 for free intro sessions</p>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">
          Description (optional)
        </label>
        <textarea
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          rows={2}
          placeholder="What clients can expect…"
          className="w-full glass-1 rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground resize-none outline-none"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <button
          type="button"
          onClick={() => setForm(p => ({ ...p, active: !p.active }))}
          className={`w-10 h-5 rounded-pill relative transition-all ${form.active ? "bg-teal" : "bg-white/10"}`}
          aria-label={form.active ? "Deactivate" : "Activate"}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
              form.active ? "left-5" : "left-0.5"
            }`}
          />
        </button>
        <span className="text-xs text-muted-foreground">
          {form.active ? "Active — visible to clients" : "Inactive — hidden"}
        </span>
      </label>
    </div>
  );
}

