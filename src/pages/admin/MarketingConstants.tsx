/**
 * /admin/marketing-constants — tune the runtime knobs without a deploy.
 *
 * The marketing_constants table holds compliance-tunable values for
 * the voucher + marketing-wallet machinery (architecture review §3.3
 * + §3.8): voucher minimum, expiry windows, referral caps, etc. Live
 * in production since the marketing-wallet migration but no admin UI
 * existed — values could only be changed by hand-editing the row in
 * Supabase. This page closes that gap.
 *
 * Each row is read-only except for current_value. Update goes via
 * PATCH /api/admin/marketing-constants/:key. Backend records the prior
 * value + admin user in the audit log on every change.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { authFetch } from "@/lib/authFetch";
import { toast } from "sonner";
import { Save, Loader2, ArrowLeft, Edit2, Check, X } from "lucide-react";

interface Constant {
  key: string;
  current_value: number;
  description: string;
  updated_at: string;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-ZA", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

function ConstantRow({ row, onSaved }: { row: Constant; onSaved: (updated: Constant) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(row.current_value));
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setEditing(false);
    setDraft(String(row.current_value));
  };

  const save = async () => {
    const parsed = parseFloat(draft);
    if (!isFinite(parsed) || parsed < 0) {
      toast.error("Value must be a non-negative number");
      return;
    }
    if (parsed === row.current_value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`/api/admin/marketing-constants/${row.key}`, {
        method: "PATCH",
        body: JSON.stringify({ current_value: parsed }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Update failed");
      onSaved(j.data as Constant);
      setEditing(false);
      toast.success(`${row.key} updated to ${parsed}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono text-foreground truncate">{row.key}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{row.description}</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 text-xs text-indigo hover:text-indigo/70 flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="number"
              step="0.01"
              min="0"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/10 focus:border-indigo/50 outline-none"
              autoFocus
            />
            <button
              onClick={save}
              disabled={saving}
              className="text-xs text-teal font-semibold flex items-center gap-1 px-3 py-2 rounded-lg glass-1 hover:bg-white/5 disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save
            </button>
            <button
              onClick={reset}
              disabled={saving}
              className="text-xs text-muted-foreground px-3 py-2 rounded-lg glass-1 hover:bg-white/5"
             aria-label="Close" title="Close">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <p className="font-data text-lg font-bold text-foreground">{row.current_value}</p>
        )}
        <p className="text-[10px] text-muted-foreground shrink-0">
          Updated {fmtDate(row.updated_at)}
        </p>
      </div>
    </GlassCard>
  );
}

export default function AdminMarketingConstants() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Constant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/admin/marketing-constants");
        const j = await res.json();
        if (cancelled) return;
        if (!j.ok) throw new Error(j.error ?? "Failed to load");
        setRows(j.data as Constant[]);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onSaved = (updated: Constant) => {
    setRows(prev => prev.map(r => r.key === updated.key ? updated : r));
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-32">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto px-4 pt-6 pb-8 space-y-5"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
            aria-label="Back to admin dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Marketing constants</h1>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Runtime-tunable knobs for the voucher + marketing-wallet system.
          Changes apply immediately — no deploy needed. Every change is
          recorded in the audit log with your admin id.
        </p>

        {error && (
          <GlassCard className="p-4 text-sm text-rose-400 border-rose-500/20 bg-rose-500/5">
            {error}
          </GlassCard>
        )}

        {loading ? (
          <GlassCard className="p-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {rows.map(r => (
              <ConstantRow key={r.key} row={r} onSaved={onSaved} />
            ))}
            {rows.length === 0 && (
              <GlassCard className="p-6 text-sm text-muted-foreground text-center">
                No constants found.
              </GlassCard>
            )}
          </div>
        )}
      </motion.div>

      <AdminNav />
    </div>
  );
}
