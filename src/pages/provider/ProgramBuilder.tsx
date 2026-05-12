import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Check,
  ArrowLeft, Loader2, Lock, CreditCard, Send, Rocket, Pencil,
} from "lucide-react";

type Vertical = "fitness" | "nutrition" | "rehab" | "care" | "mental" | "wellness" | "beauty";

interface ProgramDay {
  id?: string;
  day_number: number;
  title: string;
  body_markdown: string;
  media_urls?: string[];
}

interface Program {
  id: string;
  slug?: string;
  title: string;
  description: string | null;
  vertical: Vertical;
  duration_days: number;
  price_rand: number;
  cover_image_url: string | null;
  active: boolean;
  published_at: string | null;
  days?: ProgramDay[];
}

const API = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://bion-backend.onrender.com";

const VERTICAL_OPTIONS: { key: Vertical; label: string; gradient: string }[] = [
  { key: "fitness",   label: "Fitness",   gradient: "gradient-indigo" },
  { key: "nutrition", label: "Nutrition", gradient: "gradient-teal" },
  { key: "rehab",     label: "Rehab",     gradient: "gradient-coral" },
  { key: "care",      label: "Care",      gradient: "gradient-coral" },
  { key: "mental",    label: "Mental",    gradient: "gradient-indigo" },
  { key: "wellness",  label: "Wellness",  gradient: "gradient-teal" },
  { key: "beauty",    label: "Beauty",    gradient: "gradient-coral" },
];

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  return fetch(`${API}${path}`, { ...init, headers });
}

// ── Day editor ──────────────────────────────────────────────────────────
function DayEditor({
  day,
  onChange,
  onSave,
  onDelete,
  saving,
}: {
  day: ProgramDay;
  onChange: (d: ProgramDay) => void;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
}) {
  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Day {day.day_number}
        </p>
        <button
          onClick={onDelete}
          className="text-muted-foreground/50 hover:text-coral transition-colors"
          aria-label="Remove day"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <input
        value={day.title}
        onChange={e => onChange({ ...day, title: e.target.value })}
        placeholder="Day title (e.g. Foundation — Upper Body)"
        className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground bg-transparent outline-none"
      />
      <textarea
        value={day.body_markdown}
        onChange={e => onChange({ ...day, body_markdown: e.target.value })}
        placeholder="Day content (Markdown). Use **bold**, - bullets, ## headings..."
        rows={7}
        className="w-full glass-1 rounded-xl px-3 py-2 text-xs text-foreground bg-transparent outline-none placeholder:text-muted-foreground/50 resize-y font-mono"
      />
      <div className="flex justify-end">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSave}
          disabled={saving || !day.title.trim() || !day.body_markdown.trim()}
          className="rounded-pill px-4 py-1.5 text-[11px] font-semibold gradient-indigo text-white disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Save day
        </motion.button>
      </div>
    </GlassCard>
  );
}

// ── New program form ────────────────────────────────────────────────────
function NewProgramForm({
  onCreate,
  onCancel,
  busy,
}: {
  onCreate: (p: {
    title: string;
    description: string;
    vertical: Vertical;
    duration_days: number;
    price_rand: number;
  }) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vertical, setVertical] = useState<Vertical>("fitness");
  const [durationDays, setDurationDays] = useState(21);
  const [priceRand, setPriceRand] = useState(499);

  const canSave = title.trim().length >= 2 && durationDays > 0 && priceRand >= 0;

  return (
    <GlassCard className="p-4 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">New program</h2>
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. 21-Day Pretoria Reset"
          className="w-full mt-1 glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground bg-transparent outline-none"
        />
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          placeholder="Short sales pitch — who it's for, what they get."
          className="w-full mt-1 glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground bg-transparent outline-none resize-none"
        />
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Vertical</label>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {VERTICAL_OPTIONS.map(v => (
            <button
              key={v.key}
              onClick={() => setVertical(v.key)}
              className={`rounded-pill px-3 py-1.5 text-[11px] font-medium ${
                vertical === v.key ? `${v.gradient} text-primary-foreground` : "glass-1 text-muted-foreground"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Duration (days)</label>
          <input
            type="number"
            min={1}
            max={365}
            value={durationDays}
            onChange={e => setDurationDays(Math.max(1, Math.min(365, Number(e.target.value))))}
            className="w-full mt-1 glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground bg-transparent outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Price (R)</label>
          <input
            type="number"
            min={0}
            value={priceRand}
            onChange={e => setPriceRand(Math.max(0, Number(e.target.value)))}
            className="w-full mt-1 glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground bg-transparent outline-none"
          />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        You keep 90% per sale — BION takes a 10% platform fee, same as bookings.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 glass-1 rounded-pill py-3 text-sm text-muted-foreground"
        >
          Cancel
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => canSave && onCreate({ title, description, vertical, duration_days: durationDays, price_rand: priceRand })}
          disabled={!canSave || busy}
          className="flex-1 gradient-indigo rounded-pill py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create
        </motion.button>
      </div>
    </GlassCard>
  );
}

// ── Program editor (selected program) ───────────────────────────────────
function ProgramEditor({
  program,
  onClose,
  onReload,
}: {
  program: Program;
  onClose: () => void;
  onReload: () => void;
}) {
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [meta, setMeta] = useState({
    title: program.title,
    description: program.description ?? "",
    price_rand: program.price_rand,
    duration_days: program.duration_days,
    vertical: program.vertical,
  });
  const [savingMeta, setSavingMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Seed the day list with any already-saved days + pad to duration_days
    const seeded = Array.from({ length: program.duration_days }, (_, i) => {
      const existing = (program.days ?? []).find(d => d.day_number === i + 1);
      return (
        existing ?? {
          day_number: i + 1,
          title: `Day ${i + 1}`,
          body_markdown: "",
          media_urls: [],
        }
      );
    });
    setDays(seeded);
  }, [program.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMeta = async () => {
    setSavingMeta(true);
    setError(null);
    try {
      const res = await authFetch(`/api/programs/${program.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: meta.title,
          description: meta.description,
          price_rand: meta.price_rand,
          duration_days: meta.duration_days,
          vertical: meta.vertical,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Save failed");
      onReload();
    } catch (err: any) {
      setError(err.message ?? "Could not save");
    } finally {
      setSavingMeta(false);
    }
  };

  const saveDay = async (idx: number) => {
    const day = days[idx];
    if (!day) return;
    setSavingDay(day.day_number);
    setError(null);
    try {
      const res = await authFetch(`/api/programs/${program.id}/days`, {
        method: "POST",
        body: JSON.stringify({
          day_number: day.day_number,
          title: day.title,
          body_markdown: day.body_markdown,
          media_urls: day.media_urls ?? [],
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Save failed");
    } catch (err: any) {
      setError(err.message ?? "Could not save day");
    } finally {
      setSavingDay(null);
    }
  };

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const res = await authFetch(`/api/programs/${program.id}/publish`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Publish failed");
      onReload();
    } catch (err: any) {
      setError(err.message ?? "Could not publish");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="w-9 h-9 glass-1 rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{program.title || "Untitled program"}</h1>
          <p className="text-[11px] text-muted-foreground">
            {program.published_at ? "Published" : "Draft"} · {program.vertical} · {program.duration_days}d · R{program.price_rand}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={publish}
          disabled={publishing || !!program.published_at}
          className={`rounded-pill px-4 py-2 text-xs font-semibold flex items-center gap-1.5 ${
            program.published_at
              ? "glass-1 text-muted-foreground"
              : "gradient-indigo text-primary-foreground"
          } disabled:opacity-60`}
        >
          {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
          {program.published_at ? "Live" : "Publish"}
        </motion.button>
      </div>

      {error && (
        <div className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
          {error}
        </div>
      )}

      <GlassCard className="p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Details</h2>
        <input
          value={meta.title}
          onChange={e => setMeta({ ...meta, title: e.target.value })}
          className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground bg-transparent outline-none"
          placeholder="Program title"
        />
        <textarea
          value={meta.description}
          onChange={e => setMeta({ ...meta, description: e.target.value })}
          rows={2}
          className="w-full glass-1 rounded-xl px-3 py-2 text-xs text-foreground bg-transparent outline-none resize-none"
          placeholder="Short description"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">Duration (days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={meta.duration_days}
              onChange={e => setMeta({ ...meta, duration_days: Math.max(1, Math.min(365, Number(e.target.value))) })}
              className="w-full mt-0.5 glass-1 rounded-xl px-3 py-2 text-sm text-foreground bg-transparent outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Price (R)</label>
            <input
              type="number"
              min={0}
              value={meta.price_rand}
              onChange={e => setMeta({ ...meta, price_rand: Math.max(0, Number(e.target.value)) })}
              className="w-full mt-0.5 glass-1 rounded-xl px-3 py-2 text-sm text-foreground bg-transparent outline-none"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VERTICAL_OPTIONS.map(v => (
            <button
              key={v.key}
              onClick={() => setMeta({ ...meta, vertical: v.key })}
              className={`rounded-pill px-3 py-1.5 text-[11px] font-medium ${
                meta.vertical === v.key ? `${v.gradient} text-primary-foreground` : "glass-1 text-muted-foreground"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={saveMeta}
            disabled={savingMeta}
            className="rounded-pill px-4 py-2 text-xs font-semibold gradient-indigo text-white disabled:opacity-60 flex items-center gap-1.5"
          >
            {savingMeta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save details
          </motion.button>
        </div>
      </GlassCard>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">Day-by-day content</h2>
        <div className="space-y-2">
          {days.map((d, idx) => (
            <DayEditor
              key={d.day_number}
              day={d}
              saving={savingDay === d.day_number}
              onChange={(next) => {
                setDays(prev => prev.map((x, i) => (i === idx ? next : x)));
              }}
              onSave={() => saveDay(idx)}
              onDelete={() => {
                // Just clear the content; duration_days governs actual count
                setDays(prev => prev.map((x, i) => (i === idx ? { ...x, title: `Day ${x.day_number}`, body_markdown: "" } : x)));
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────
export default function ProgramBuilder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDemo = user?.id?.startsWith("demo_") ?? false;
  const { requiresUpgrade, getUpgradeUrl, tierDisplayName } = useSubscription();
  const needsUpgrade = requiresUpgrade("basicAnalytics");

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [creatingBusy, setCreatingBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editingProgram = useMemo(
    () => programs.find(p => p.id === editingId) ?? null,
    [programs, editingId],
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/programs/my");
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not load programs");
      setPrograms(((json.data ?? []) as Program[]));
    } catch (err: any) {
      if (!isDemo) setError(err.message ?? "Could not load programs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!needsUpgrade) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsUpgrade]);

  const createProgram = async (input: {
    title: string;
    description: string;
    vertical: Vertical;
    duration_days: number;
    price_rand: number;
  }) => {
    setCreatingBusy(true);
    setError(null);
    try {
      const res = await authFetch("/api/programs", {
        method: "POST",
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Create failed");
      const created = json.data as Program;
      setPrograms(prev => [created, ...prev]);
      setShowNew(false);
      setEditingId(created.id);
    } catch (err: any) {
      setError(err.message ?? "Could not create program");
    } finally {
      setCreatingBusy(false);
    }
  };

  if (needsUpgrade) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
        <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-20 space-y-5">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-9 h-9 glass-1 rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Programs</h1>
              <p className="text-xs text-muted-foreground">Upgrade required to build programs</p>
            </div>
          </div>
          <GlassCard className="p-6 text-center">
            <Lock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Program Builder Requires Pro
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your plan ({tierDisplayName()}) doesn't include program creation.
              Upgrade to sell day-by-day programs to your clients.
            </p>
            <button
              onClick={() => navigate(getUpgradeUrl())}
              className="w-full gradient-indigo rounded-pill py-3.5 text-sm font-semibold text-white flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Upgrade to Pro
            </button>
          </GlassCard>
          <ProviderNav />
        </div>
      </div>
    );
  }

  if (editingProgram) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
        <div className="mx-auto max-w-2xl xl:max-w-3xl px-4 pt-20">
          <ProgramEditor
            program={editingProgram}
            onClose={() => setEditingId(null)}
            onReload={load}
          />
        </div>
        <BionAssistant />
        <ProviderNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
      <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-20 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-9 h-9 glass-1 rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Programs</h1>
              <p className="text-xs text-muted-foreground">
                {programs.length} program{programs.length === 1 ? "" : "s"} · 90/10 revenue share
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNew(s => !s)}
            className="gradient-indigo rounded-pill px-4 py-2 text-xs font-semibold text-primary-foreground flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> {showNew ? "Close" : "New program"}
          </motion.button>
        </div>

        {error && (
          <div className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
            {error}
          </div>
        )}

        <AnimatePresence>
          {showNew && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <NewProgramForm
                busy={creatingBusy}
                onCancel={() => setShowNew(false)}
                onCreate={createProgram}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <GlassCard className="p-8 text-center">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading your programs…</p>
          </GlassCard>
        ) : programs.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Send className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No programs yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Build your first day-by-day program to sell to clients.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {programs.map(p => (
              <GlassCard key={p.id} hover className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] glass-accent-indigo rounded-pill px-2 py-0.5 text-indigo capitalize">
                        {p.vertical}
                      </span>
                      {p.published_at ? (
                        <span className="text-[10px] text-teal flex items-center gap-1">
                          <Check className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Draft</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">{p.title || "Untitled"}</p>
                    {p.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span>{p.duration_days} days</span>
                      <span>R{p.price_rand}</span>
                      <span>{(p.days?.length ?? 0)} day{(p.days?.length ?? 0) === 1 ? "" : "s"} authored</span>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditingId(p.id)}
                    className="w-8 h-8 glass-1 rounded-full flex items-center justify-center"
                    aria-label="Edit program"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </motion.button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          Revenue share: you keep 90%, BION takes 10% — same as bookings.
        </p>
      </div>
      <BionAssistant />
      <ProviderNav />
    </div>
  );
}
