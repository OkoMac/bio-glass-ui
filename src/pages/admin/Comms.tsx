/**
 * /admin/comms — Comms Console (B3-1).
 *
 * Lets admins (admin_ops scope) edit transactional templates, the
 * cadence + audience filter for scheduled drips, and read the send
 * log. Backend at /api/admin/comms/* (admin-comms.ts). All writes
 * are MFA-gated via mfaProtectedFetch — the hook handles the
 * 401 mfa_required → modal → verify → retry round-trip.
 *
 * No X-Admin-Token. Pure JWT + admin_ops role.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Save, Loader2, Search, Inbox, FileText, Calendar, History,
  Mail, MessageSquare, Bell, Phone, AlertCircle, CheckCircle2,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";
import GlassCard from "@/components/GlassCard";
import { AdminMfaProvider, useAdminMfa } from "@/hooks/useAdminMfa";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

// ── Types ──────────────────────────────────────────────────────────
type Channel = "email" | "whatsapp" | "push" | "sms";

interface TemplateRow {
  template_key: string;
  channel: Channel;
  subject: string | null;
  preview_text: string | null;
  enabled: boolean;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

interface TemplateDetail extends TemplateRow {
  body_template: string;
}

interface ScheduleRow {
  template_key: string;
  cadence: string | null;
  cadence_offset_d: number | null;
  audience_filter: Record<string, unknown> | null;
  channels_enabled: Channel[];
  enabled: boolean;
  description: string | null;
  updated_at: string;
}

interface SendLogRow {
  id: string;
  profile_id: string;
  template_key: string;
  channel: Channel;
  sent_at: string;
  status: "queued" | "sent" | "delivered" | "failed";
  error_message: string | null;
}

const CHANNEL_ICON: Record<Channel, typeof Mail> = {
  email: Mail,
  whatsapp: MessageSquare,
  push: Bell,
  sms: Phone,
};

// ── Outer wrapper (mounts the MFA provider) ────────────────────────
export default function AdminComms() {
  return (
    <AdminMfaProvider>
      <Inner />
    </AdminMfaProvider>
  );
}

// ── Inner component ─────────────────────────────────────────────────
function Inner() {
  const navigate = useNavigate();
  const { mfaProtectedFetch } = useAdminMfa();
  const [tab, setTab] = useState<"templates" | "schedules" | "log">("templates");

  const authHeader = useCallback(async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  }, []);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <AdminNav />
      <div className="md:ml-56 mx-auto max-w-5xl px-4 pt-12 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="md:hidden w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Comms Console</h1>
            <p className="text-xs text-muted-foreground">
              Transactional templates, drip schedules, and the send log. Edits take effect on the next cron tick.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {([
            { k: "templates", label: "Templates", icon: FileText },
            { k: "schedules", label: "Schedules", icon: Calendar },
            { k: "log",       label: "Send Log", icon: History },
          ] as const).map(({ k, label, icon: Icon }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-1.5 rounded-pill text-xs font-medium flex items-center gap-1.5 transition-colors ${
                tab === k ? "gradient-indigo text-white" : "glass-1 text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {tab === "templates" && <TemplatesTab authHeader={authHeader} mfaFetch={mfaProtectedFetch} />}
        {tab === "schedules" && <SchedulesTab authHeader={authHeader} mfaFetch={mfaProtectedFetch} />}
        {tab === "log"       && <SendLogTab   authHeader={authHeader} />}
      </div>
    </div>
  );
}

// ── Templates ───────────────────────────────────────────────────────
function TemplatesTab({
  authHeader, mfaFetch,
}: {
  authHeader: () => Promise<Record<string, string>>;
  mfaFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}) {
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ key: string; channel: Channel } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authHeader();
      const res = await fetch(`${API}/api/admin/comms/templates`, { headers });
      const json = await res.json();
      if (json.ok) setRows(json.data ?? []);
      else toast.error(json.error ?? "Failed to load templates");
    } catch (err: any) {
      toast.error(err.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) return <Loading />;

  if (editing) {
    return (
      <TemplateEditor
        templateKey={editing.key}
        channel={editing.channel}
        authHeader={authHeader}
        mfaFetch={mfaFetch}
        onClose={() => { setEditing(null); refresh(); }}
      />
    );
  }

  // Group by template_key so each row shows all its channels at a glance
  const byKey = rows.reduce<Record<string, TemplateRow[]>>((acc, r) => {
    if (!acc[r.template_key]) acc[r.template_key] = [];
    acc[r.template_key]!.push(r);
    return acc;
  }, {});

  if (Object.keys(byKey).length === 0) {
    return <Empty msg="No templates yet. Run the comms-console migration first." />;
  }

  return (
    <div className="space-y-3">
      {Object.entries(byKey).map(([key, variants]) => (
        <GlassCard key={key} className="p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground font-mono">{key}</p>
              {variants[0]?.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5">{variants[0].description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map(v => {
              const Icon = CHANNEL_ICON[v.channel] ?? Mail;
              return (
                <button
                  key={`${key}:${v.channel}`}
                  onClick={() => setEditing({ key, channel: v.channel })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[11px] font-medium border transition-colors ${
                    v.enabled
                      ? "border-teal/30 bg-teal/10 text-teal"
                      : "border-white/10 bg-white/[0.03] text-muted-foreground"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {v.channel}
                  {v.enabled ? null : <span className="opacity-60">· paused</span>}
                </button>
              );
            })}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function TemplateEditor({
  templateKey, channel, authHeader, mfaFetch, onClose,
}: {
  templateKey: string;
  channel: Channel;
  authHeader: () => Promise<Record<string, string>>;
  mfaFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  onClose: () => void;
}) {
  const [tpl, setTpl] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [body, setBody] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [description, setDescription] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const headers = await authHeader();
        const res = await fetch(`${API}/api/admin/comms/templates/${templateKey}/${channel}`, { headers });
        const json = await res.json();
        if (json.ok && json.data) {
          const d = json.data as TemplateDetail;
          setTpl(d);
          setSubject(d.subject ?? "");
          setPreviewText(d.preview_text ?? "");
          setBody(d.body_template ?? "");
          setEnabled(d.enabled);
          setDescription(d.description ?? "");
        } else {
          toast.error(json.error ?? "Failed to load template");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [templateKey, channel, authHeader]);

  const save = async () => {
    setSaving(true);
    try {
      const headers = { "Content-Type": "application/json", ...(await authHeader()) };
      const res = await mfaFetch(
        `${API}/api/admin/comms/templates/${templateKey}/${channel}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            subject: subject || null,
            preview_text: previewText || null,
            body_template: body,
            enabled,
            description: description || null,
          }),
        },
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Save failed");
      toast.success(`${templateKey} (${channel}) saved`);
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (!tpl) return <Empty msg="Template not found" />;

  const subjectOnly = channel === "email" || channel === "push";
  const Icon = CHANNEL_ICON[channel] ?? Mail;

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Template</p>
            <p className="text-sm font-semibold text-foreground font-mono flex items-center gap-2">
              <Icon className="w-3.5 h-3.5" /> {templateKey} · {channel}
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
            className="w-4 h-4 rounded accent-indigo"
          />
          Enabled
        </label>
      </div>

      <div className="space-y-3">
        <Field label="Description (admin notes)">
          <input
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 500))}
            placeholder="What this template is for…"
            className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground outline-none border border-white/[0.08] focus:border-indigo/40"
          />
        </Field>

        {subjectOnly && (
          <Field label="Subject">
            <input
              value={subject}
              onChange={e => setSubject(e.target.value.slice(0, 200))}
              className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground outline-none border border-white/[0.08] focus:border-indigo/40"
            />
          </Field>
        )}

        {channel === "email" && (
          <Field label="Preview text (inbox preview / pre-header)">
            <input
              value={previewText}
              onChange={e => setPreviewText(e.target.value.slice(0, 200))}
              className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground outline-none border border-white/[0.08] focus:border-indigo/40"
            />
          </Field>
        )}

        <Field label={`Body template — supports {{tokens}} (${body.length} / 20000)`}>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value.slice(0, 20_000))}
            rows={channel === "email" ? 18 : 8}
            className="w-full glass-1 rounded-xl px-3 py-2 text-xs text-foreground outline-none border border-white/[0.08] focus:border-indigo/40 font-mono leading-relaxed"
            placeholder={channel === "email" ? "<h1>{{first_name}}</h1>…" : "Hi {{first_name}}, your booking…"}
          />
        </Field>

        <div className="text-[10px] text-muted-foreground leading-relaxed">
          Last updated: {new Date(tpl.updated_at).toLocaleString("en-ZA")}
          {tpl.updated_by && <span> · by {tpl.updated_by.slice(0, 8)}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <button
          onClick={save}
          disabled={saving || !body.trim()}
          className="flex-1 py-2.5 rounded-xl gradient-indigo text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save (MFA required)
        </button>
        <button onClick={onClose} className="px-5 py-2.5 glass-1 rounded-xl text-sm text-foreground">Cancel</button>
      </div>
    </GlassCard>
  );
}

// ── Schedules ───────────────────────────────────────────────────────
function SchedulesTab({
  authHeader, mfaFetch,
}: {
  authHeader: () => Promise<Record<string, string>>;
  mfaFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}) {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authHeader();
      const res = await fetch(`${API}/api/admin/comms/schedules`, { headers });
      const json = await res.json();
      if (json.ok) setRows(json.data ?? []);
      else toast.error(json.error ?? "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => { refresh(); }, [refresh]);

  const updateLocal = (key: string, patch: Partial<ScheduleRow>) => {
    setRows(prev => prev.map(r => r.template_key === key ? { ...r, ...patch } : r));
  };

  const save = async (row: ScheduleRow) => {
    setSavingKey(row.template_key);
    try {
      const headers = { "Content-Type": "application/json", ...(await authHeader()) };
      const res = await mfaFetch(`${API}/api/admin/comms/schedules/${row.template_key}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          cadence: row.cadence ?? "",
          cadence_offset_d: row.cadence_offset_d,
          channels_enabled: row.channels_enabled,
          enabled: row.enabled,
          description: row.description,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Save failed");
      toast.success(`${row.template_key} schedule saved`);
    } catch (err: any) {
      toast.error(err.message ?? "Save failed");
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <Loading />;
  if (rows.length === 0) return <Empty msg="No schedules yet." />;

  const allChannels: Channel[] = ["email", "whatsapp", "push", "sms"];

  return (
    <div className="space-y-3">
      {rows.map(row => (
        <GlassCard key={row.template_key} className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground font-mono">{row.template_key}</p>
              {row.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5">{row.description}</p>
              )}
            </div>
            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={e => updateLocal(row.template_key, { enabled: e.target.checked })}
                className="w-4 h-4 rounded accent-indigo"
              />
              Enabled
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cadence (cron / 'daily' / 'weekly')">
              <input
                value={row.cadence ?? ""}
                onChange={e => updateLocal(row.template_key, { cadence: e.target.value.slice(0, 60) })}
                placeholder="e.g. daily, weekly, 0 9 * * *"
                className="w-full glass-1 rounded-xl px-3 py-2 text-xs text-foreground outline-none border border-white/[0.08] focus:border-indigo/40"
              />
            </Field>
            <Field label="Offset (days from trigger)">
              <input
                type="number"
                min={0}
                max={3650}
                value={row.cadence_offset_d ?? ""}
                onChange={e => updateLocal(row.template_key, { cadence_offset_d: e.target.value === "" ? null : parseInt(e.target.value, 10) })}
                className="w-full glass-1 rounded-xl px-3 py-2 text-xs text-foreground outline-none border border-white/[0.08] focus:border-indigo/40"
              />
            </Field>
          </div>

          <Field label="Channels enabled">
            <div className="flex flex-wrap gap-2">
              {allChannels.map(ch => {
                const on = row.channels_enabled.includes(ch);
                const Icon = CHANNEL_ICON[ch];
                return (
                  <button
                    key={ch}
                    onClick={() => {
                      const next = on
                        ? row.channels_enabled.filter(c => c !== ch)
                        : [...row.channels_enabled, ch];
                      if (next.length === 0) return; // backend min(1)
                      updateLocal(row.template_key, { channels_enabled: next });
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[11px] font-medium border transition-colors ${
                      on
                        ? "border-indigo/40 bg-indigo/15 text-indigo"
                        : "border-white/10 bg-white/[0.03] text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-3 h-3" /> {ch}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <button
              onClick={() => save(row)}
              disabled={savingKey === row.template_key}
              className="px-4 py-2 rounded-xl gradient-indigo text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-1.5"
            >
              {savingKey === row.template_key ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save (MFA)
            </button>
            <span className="text-[10px] text-muted-foreground">
              Last updated {new Date(row.updated_at).toLocaleString("en-ZA")}
            </span>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

// ── Send log ────────────────────────────────────────────────────────
function SendLogTab({ authHeader }: { authHeader: () => Promise<Record<string, string>> }) {
  const [rows, setRows] = useState<SendLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authHeader();
      const url = `${API}/api/admin/comms/send-log${filter ? `?template=${encodeURIComponent(filter)}` : ""}`;
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (json.ok) setRows(json.data ?? []);
      else toast.error(json.error ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [authHeader, filter]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter by template_key (e.g. booking_confirmation)"
            className="w-full glass-1 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground outline-none border border-white/[0.08] focus:border-indigo/40"
          />
        </div>
        <button onClick={refresh} className="px-3 py-2 glass-1 rounded-xl text-xs text-foreground">Refresh</button>
      </div>

      {loading ? <Loading /> :
       rows.length === 0 ? <Empty msg="No sends recorded yet." /> :
       (
         <GlassCard className="overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-xs">
               <thead className="bg-white/[0.02]">
                 <tr>
                   <Th>Sent</Th>
                   <Th>Template</Th>
                   <Th>Channel</Th>
                   <Th>Status</Th>
                   <Th>Error</Th>
                 </tr>
               </thead>
               <tbody>
                 {rows.map(r => {
                   const Icon = CHANNEL_ICON[r.channel] ?? Mail;
                   return (
                     <tr key={r.id} className="border-t border-white/5">
                       <Td>{new Date(r.sent_at).toLocaleString("en-ZA")}</Td>
                       <Td><span className="font-mono text-foreground">{r.template_key}</span></Td>
                       <Td><span className="inline-flex items-center gap-1"><Icon className="w-3 h-3" /> {r.channel}</span></Td>
                       <Td>
                         {r.status === "failed" ? (
                           <span className="inline-flex items-center gap-1 text-coral"><AlertCircle className="w-3 h-3" /> failed</span>
                         ) : r.status === "delivered" || r.status === "sent" ? (
                           <span className="inline-flex items-center gap-1 text-teal"><CheckCircle2 className="w-3 h-3" /> {r.status}</span>
                         ) : (
                           <span className="text-muted-foreground">{r.status}</span>
                         )}
                       </Td>
                       <Td>{r.error_message ? <span className="text-coral">{r.error_message.slice(0, 80)}</span> : "—"}</Td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
         </GlassCard>
       )}
    </div>
  );
}

// ── Tiny helpers ────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">{label}</p>
      {children}
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-3 py-2">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 text-xs text-muted-foreground align-top">{children}</td>;
}
function Loading() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-6 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading…
    </div>
  );
}
function Empty({ msg }: { msg: string }) {
  return (
    <GlassCard className="p-6 text-center">
      <Inbox className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-foreground">{msg}</p>
    </GlassCard>
  );
}
