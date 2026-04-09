import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";

import { ServiceCoverPicker } from "@/components/ImagePickerOverlay";
import { Plus, Pencil, Trash2, Check, X, Star, Clock, Zap } from "lucide-react";
import { useBookings } from "@/contexts/BookingsContext";

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  popular: boolean;
  coverImage?: string;
};

const DURATIONS = [15, 30, 45, 60, 75, 90, 120];

const initialServices: Service[] = [
  { id: "s1", name: "Personal Training Session", duration: 60,  price: 450, description: "Full one-on-one PT session tailored to your goals.", popular: true  },
  { id: "s2", name: "Strength Assessment",        duration: 45,  price: 350, description: "Comprehensive strength and movement evaluation.",   popular: false },
  { id: "s3", name: "Nutrition Consultation",     duration: 30,  price: 250, description: "Personalised meal planning and macro coaching.",    popular: false },
  { id: "s4", name: "Free Intro Session",          duration: 60,  price: 0,   description: "Complimentary session for new clients.",           popular: false },
];

const BASE_STATS: Record<string, { bookings: number; revenue: number }> = {
  s1: { bookings: 47, revenue: 21150 },
  s2: { bookings: 12, revenue: 4200  },
  s3: { bookings: 8,  revenue: 2000  },
  s4: { bookings: 9,  revenue: 0     },
};

const emptyForm = { name: "", duration: 60, price: 0, description: "", popular: false, coverImage: "" };

export default function ProviderServices() {
  const { bookings } = useBookings();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [editId, setEditId]     = useState<string | null>(null);
  const [addOpen, setAddOpen]   = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [savedId, setSavedId]   = useState<string | null>(null);
  const [form, setForm]         = useState(emptyForm);

  // Merge base stats with live bookings from context
  const serviceStats = useMemo(() => {
    const live: Record<string, { bookings: number; revenue: number }> = {};
    bookings.forEach(b => {
      services.forEach(svc => {
        const nameMatch = b.service.toLowerCase().includes(svc.name.split(" ")[0].toLowerCase()) ||
                          svc.name.toLowerCase().includes(b.service.split(" ")[0].toLowerCase());
        if (nameMatch) {
          if (!live[svc.id]) live[svc.id] = { bookings: 0, revenue: 0 };
          live[svc.id].bookings += 1;
          const priceNum = parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
          live[svc.id].revenue += priceNum;
        }
      });
    });
    // Merge live counts on top of base stats
    const result: Record<string, { bookings: number; revenue: number }> = {};
    services.forEach(svc => {
      const base = BASE_STATS[svc.id] ?? { bookings: 0, revenue: 0 };
      const liveData = live[svc.id] ?? { bookings: 0, revenue: 0 };
      result[svc.id] = {
        bookings: base.bookings + liveData.bookings,
        revenue:  base.revenue  + liveData.revenue,
      };
    });
    return result;
  }, [bookings, services]);

  const totalRevenue  = services.reduce((s, svc) => s + (serviceStats[svc.id]?.revenue ?? 0), 0);
  const totalBookings = services.reduce((s, svc) => s + (serviceStats[svc.id]?.bookings ?? 0), 0);

  const openEdit = (svc: Service) => {
    setForm({ name: svc.name, duration: svc.duration, price: svc.price, description: svc.description, popular: svc.popular, coverImage: svc.coverImage ?? "" });
    setEditId(svc.id);
    setAddOpen(false);
  };

  const saveEdit = () => {
    setServices(prev => prev.map(s =>
      s.id === editId ? { ...s, ...form, coverImage: form.coverImage || s.coverImage } : s
    ));
    setSavedId(editId);
    setTimeout(() => { setSavedId(null); setEditId(null); }, 1200);
  };

  const addService = () => {
    if (!form.name.trim()) return;
    const id = `s_${Date.now()}`;
    setServices(prev => [...prev, { id, ...form }]);
    setForm(emptyForm);
    setAddOpen(false);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1500);
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-2xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Services</h1>
            <p className="text-xs text-muted-foreground">Manage your offerings, pricing and durations</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setAddOpen(true); setEditId(null); setForm(emptyForm); }}
            className="flex items-center gap-1.5 rounded-pill px-3 py-2 gradient-indigo text-primary-foreground text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </motion.button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active", value: String(services.length), color: "#6366F1" },
            { label: "Bookings", value: String(totalBookings), color: "#2DD4BF" },
            { label: "Revenue", value: `R${totalRevenue.toLocaleString()}`, color: "#FBBF24" },
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
              <GlassCard className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">New Service</p>
                  <button onClick={() => setAddOpen(false)} className="w-7 h-7 glass-1 rounded-full flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
                <ServiceForm form={form} setForm={setForm} onCoverChange={(url) => setForm(p => ({ ...p, coverImage: url }))} />
                <div className="flex gap-2">
                  <button onClick={() => setAddOpen(false)} className="flex-1 py-2 glass-1 rounded-pill text-xs text-muted-foreground">Cancel</button>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={addService}
                    disabled={!form.name.trim()}
                    className="flex-1 py-2 gradient-indigo rounded-pill text-xs font-semibold text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Service
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Service list */}
        <div className="space-y-3">
          {services.map((svc, i) => {
            const stats     = serviceStats[svc.id];
            const isEditing = editId === svc.id;
            const isSaved   = savedId === svc.id;
            const isDeleting = deleteId === svc.id;
            const sharePct  = stats && totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0;

            return (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard className="overflow-hidden">
                  {isEditing ? (
                    <div className="p-4 space-y-4">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Editing: {svc.name}</p>
                      <ServiceForm form={form} setForm={setForm} onCoverChange={(url) => setForm(p => ({ ...p, coverImage: url }))} />
                      <div className="flex gap-2">
                        <button onClick={() => setEditId(null)} className="flex-1 py-2 glass-1 rounded-pill text-xs text-muted-foreground">Cancel</button>
                        <motion.button whileTap={{ scale: 0.97 }}
                          onClick={saveEdit}
                          className="flex-1 py-2 gradient-indigo rounded-pill text-xs font-semibold text-primary-foreground flex items-center justify-center gap-1">
                          {isSaved ? <><Check className="w-3.5 h-3.5" /> Saved!</> : "Save Changes"}
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Cover image wallpaper */}
                      {svc.coverImage && (
                        <div
                          className="w-full h-24 bg-cover bg-center relative"
                          style={{ backgroundImage: `url(${svc.coverImage})` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                        </div>
                      )}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="text-sm font-semibold text-foreground">{svc.name}</p>
                            {svc.popular && (
                              <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 glass-accent-amber rounded-pill text-amber">
                                <Star className="w-2.5 h-2.5" /> Popular
                              </span>
                            )}
                            {svc.price === 0 && (
                              <span className="text-[9px] px-1.5 py-0.5 glass-accent-teal rounded-pill text-teal">Free Intro</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {svc.duration}min</span>
                            <span className="font-data">{svc.price === 0 ? "Free" : `R${svc.price}`}</span>
                            {stats && <span>{stats.bookings} bookings</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <motion.button whileTap={{ scale: 0.9 }}
                            onClick={() => openEdit(svc)}
                            className="flex items-center gap-1 px-2.5 py-1.5 glass-1 rounded-pill text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                            <Pencil className="w-3 h-3" /> Edit
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.9 }}
                            onClick={() => setDeleteId(svc.id)}
                            className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-coral hover:bg-coral/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Revenue share bar */}
                      {stats && totalRevenue > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <div className="flex justify-between mb-1.5">
                            <span className="text-[10px] text-muted-foreground">Revenue share</span>
                            <span className="text-[10px] text-muted-foreground">
                              {stats.revenue > 0 ? `R${stats.revenue.toLocaleString()} · ` : ""}{Math.round(sharePct)}%
                            </span>
                          </div>
                          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${sharePct}%` }}
                              transition={{ duration: 0.6 }}
                              className="h-full rounded-full gradient-indigo"
                            />
                          </div>
                        </div>
                      )}

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
                            <button onClick={() => setDeleteId(null)} className="px-2.5 py-1 glass-1 rounded-pill text-[11px] text-muted-foreground">Keep</button>
                            <button onClick={() => deleteService(svc.id)} className="px-2.5 py-1 rounded-pill text-[11px] text-white bg-coral/30 hover:bg-coral/50 transition-colors">Remove</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Pro tip */}
        <GlassCard variant="accent-indigo" className="p-4">
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

function ServiceForm({ form, setForm, onCoverChange }: {
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  onCoverChange: (url: string) => void;
}) {
  return (
    <div className="space-y-3">
      <ServiceCoverPicker coverImage={form.coverImage || undefined} onChange={onCoverChange} />
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Service name</label>
        <input
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Deep Tissue Massage"
          className="w-full h-10 glass-1 rounded-xl px-3 text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Duration</label>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map(d => (
              <button key={d} onClick={() => setForm(p => ({ ...p, duration: d }))}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  form.duration === d ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                }`}>
                {d < 60 ? `${d}m` : `${d / 60}h`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Price (ZAR)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R</span>
            <input
              type="number" min={0} step={50}
              value={form.price}
              onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
              className="w-full h-10 glass-1 rounded-xl pl-7 pr-3 text-sm text-foreground bg-transparent outline-none"
            />
          </div>
          <p className="text-[9px] text-muted-foreground mt-1">Set 0 for free intro</p>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Description (optional)</label>
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
          onClick={() => setForm(p => ({ ...p, popular: !p.popular }))}
          className={`w-10 h-5 rounded-pill relative transition-all ${form.popular ? "bg-amber" : "bg-white/10"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.popular ? "left-5" : "left-0.5"}`} />
        </button>
        <span className="text-xs text-muted-foreground">Mark as Popular</span>
      </label>
    </div>
  );
}
