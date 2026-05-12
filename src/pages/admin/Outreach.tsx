import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminToken } from "@/hooks/useAdminToken";
import AdminNav from "@/components/AdminNav";
import AdminTokenGate from "@/components/AdminTokenGate";
import GlassCard from "@/components/GlassCard";
import { toast } from "sonner";
import { authFetch } from "@/lib/authFetch";
import {
  ArrowLeft, Send, MessageSquare, Mail, Phone, Clock,
  Users, TrendingUp, CheckCircle, AlertCircle, Loader2,
  RefreshCw, Calendar, } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface OutreachStats {
  totalSent: number;
  crmPipeline: Record<string, number>;
}

interface WAStatus {
  template: { name: string; status: string };
  providers: { total: number; withPhone: number; alreadySent: number };
  remaining: number;
  scheduled: Array<{ id: string; scheduled_at: string; status: string; message: string }>;
}

interface OutreachLog {
  id: string;
  provider_id: string;
  provider_name: string;
  email: string | null;
  status: string;
  campaign: string;
  opened_at: string | null;
  replied_at: string | null;
  created_at: string;
}

export default function AdminOutreach() {
  const navigate = useNavigate();
  const { token, loading: tokenLoading } = useAdminToken();
  const [tab, setTab] = useState<"overview" | "email" | "whatsapp" | "logs">("overview");
  const [stats, setStats] = useState<OutreachStats | null>(null);
  const [waStatus, setWAStatus] = useState<WAStatus | null>(null);
  const [logs, setLogs] = useState<OutreachLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  // Bulk-send confirm modal — guards the 50-message WhatsApp blast.
  const [confirmBlast, setConfirmBlast] = useState(false);

  async function fetchAll() {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, waRes] = await Promise.all([
        authFetch(`/api/campaigns/outreach-stats`),
        authFetch(`/api/campaigns/whatsapp-outreach/status`),
      ]);
      const [statsData, waData] = await Promise.all([statsRes.json(), waRes.json()]);
      if (statsData.ok) setStats(statsData);
      if (waData.ok) setWAStatus(waData);
    } catch {}
    setLoading(false);
  }

  async function fetchLogs() {
    if (!token) return;
    try {
      const res = await authFetch(`/api/campaigns/outreach-stats`);
      const data = await res.json();
      if (data.ok) setStats(data);
    } catch {}
  }

  async function triggerWhatsAppNow() {
    if (!token) return;
    setSending(true);
    try {
      const res = await authFetch(`/api/campaigns/whatsapp-outreach`, {
        method: "POST",
        body: JSON.stringify({ dryRun: false, limit: 50 }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Sent ${data.stats?.sent ?? 0} WhatsApp messages`);
        setConfirmBlast(false);
        fetchAll();
      } else {
        toast.error(data.error ?? "Failed");
      }
    } catch { toast.error("Send failed"); }
    finally { setSending(false); }
  }

  useEffect(() => { if (token) fetchAll(); }, [token]);

  if (!token) return <AdminTokenGate tokenLoading={tokenLoading} />;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-32">
      <AdminNav />
      <div className="w-full px-4 md:px-8 xl:px-12 pt-24 md:pt-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/dashboard")} className="w-9 h-9 glass-2 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Provider Outreach</h1>
            <p className="text-xs text-muted-foreground">Email & WhatsApp campaigns to onboard providers</p>
          </div>
          <button onClick={fetchAll} className="w-9 h-9 glass-2 rounded-full flex items-center justify-center" aria-label="Refresh" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["overview", "whatsapp", "email", "logs"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors ${
                tab === t ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "overview" ? "Overview" : t === "whatsapp" ? "WhatsApp" : t === "email" ? "Email" : "Activity Log"}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <GlassCard className="p-4 text-center">
                <Mail className="w-5 h-5 text-indigo mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{stats?.totalSent ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Emails Sent</p>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <Phone className="w-5 h-5 text-teal mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{waStatus?.providers?.alreadySent ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">WhatsApps Sent</p>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <Users className="w-5 h-5 text-amber mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{waStatus?.providers?.withPhone ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Contactable Providers</p>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <TrendingUp className="w-5 h-5 text-rose mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{waStatus?.remaining ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">WA Remaining</p>
              </GlassCard>
            </div>

            {/* CRM Pipeline */}
            {stats?.crmPipeline && Object.keys(stats.crmPipeline).length > 0 && (
              <GlassCard className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">CRM Pipeline</h3>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(stats.crmPipeline).map(([stage, count]) => (
                    <div key={stage} className="px-3 py-2 glass-1 rounded-xl text-center min-w-[80px]">
                      <p className="text-lg font-bold text-foreground">{count}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{stage.replace(/_/g, " ")}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Scheduled Jobs */}
            {waStatus?.scheduled && waStatus.scheduled.length > 0 && (
              <GlassCard className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber" /> Scheduled Sends
                </h3>
                {waStatus.scheduled.map(job => (
                  <div key={job.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">
                        WhatsApp outreach — {new Date(job.scheduled_at).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{job.status}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-pill text-[9px] font-bold ${
                      job.status === "pending" ? "bg-amber/20 text-amber" : "bg-teal/20 text-teal"
                    }`}>
                      {job.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </GlassCard>
            )}

            {/* Quick Actions */}
            <GlassCard className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => navigate("/admin/whatsapp")}
                  className="p-3 glass-1 rounded-xl text-center hover:bg-white/[0.06] transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-teal mx-auto mb-1" />
                  <p className="text-[10px] text-foreground">WhatsApp Inbox</p>
                </button>
                <button
                  onClick={() => navigate("/admin/rangers")}
                  className="p-3 glass-1 rounded-xl text-center hover:bg-white/[0.06] transition-colors"
                >
                  <Users className="w-5 h-5 text-indigo mx-auto mb-1" />
                  <p className="text-[10px] text-foreground">Rangers CRM</p>
                </button>
                <button
                  onClick={() => navigate("/admin/campaigns")}
                  className="p-3 glass-1 rounded-xl text-center hover:bg-white/[0.06] transition-colors"
                >
                  <Send className="w-5 h-5 text-amber mx-auto mb-1" />
                  <p className="text-[10px] text-foreground">Campaigns</p>
                </button>
                <button
                  onClick={() => navigate("/admin/broadcasts")}
                  className="p-3 glass-1 rounded-xl text-center hover:bg-white/[0.06] transition-colors"
                >
                  <Mail className="w-5 h-5 text-rose mx-auto mb-1" />
                  <p className="text-[10px] text-foreground">Broadcasts</p>
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {/* WhatsApp Tab */}
        {tab === "whatsapp" && (
          <div className="space-y-4">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">WhatsApp Template</h3>
                <span className={`px-2 py-0.5 rounded-pill text-[10px] font-bold ${
                  waStatus?.template?.status === "APPROVED" ? "bg-teal/20 text-teal" : "bg-amber/20 text-amber"
                }`}>
                  {waStatus?.template?.status ?? "UNKNOWN"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Template: <code className="text-foreground">{waStatus?.template?.name ?? "provider_outreach"}</code></p>
              <p className="text-xs text-muted-foreground">
                {waStatus?.providers?.withPhone ?? 0} providers have phone numbers · {waStatus?.providers?.alreadySent ?? 0} already sent · {waStatus?.remaining ?? 0} remaining
              </p>
            </GlassCard>

            <div className="flex gap-2">
              <button
                onClick={() => setConfirmBlast(true)}
                disabled={sending || (waStatus?.template?.status !== "APPROVED") || (waStatus?.remaining ?? 0) === 0}
                className="flex-1 py-3 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send 50 Now
              </button>
              <button
                onClick={() => navigate("/admin/whatsapp")}
                className="px-4 py-3 rounded-pill text-sm font-semibold glass-2 text-foreground flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> View Replies
              </button>
            </div>

            {waStatus?.scheduled && waStatus.scheduled.length > 0 && (
              <GlassCard className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Scheduled</h3>
                {waStatus.scheduled.map(job => (
                  <div key={job.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(job.scheduled_at).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}</span>
                    <span className="px-1.5 py-0.5 rounded-pill text-[9px] bg-amber/20 text-amber font-bold">{job.status}</span>
                  </div>
                ))}
              </GlassCard>
            )}
          </div>
        )}

        {/* Email Tab */}
        {tab === "email" && (
          <div className="space-y-4">
            <GlassCard className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Email Outreach</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Branded emails sent via <code className="text-foreground">sales@bionhealth.co.za</code> to providers with scraped contact emails.
              </p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{stats?.totalSent ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">Total Sent</p>
                </div>
                <div className="flex-1 h-2 glass-1 rounded-full overflow-hidden">
                  <div className="h-full gradient-indigo rounded-full" style={{ width: `${Math.min(100, ((stats?.totalSent ?? 0) / 200) * 100)}%` }} />
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs text-muted-foreground">
                Provider replies arrive at <strong className="text-foreground">sales@bionhealth.co.za</strong>. Check that inbox to engage directly. Future: unified inbox will pull email threads here.
              </p>
            </GlassCard>
          </div>
        )}

        {/* Activity Log Tab */}
        {tab === "logs" && (
          <div className="space-y-4">
            <GlassCard className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Recent Outreach Activity</h3>
              <p className="text-xs text-muted-foreground">
                {stats?.totalSent ?? 0} providers contacted via email. WhatsApp outreach scheduled for tomorrow 07:30 SAST ({waStatus?.remaining ?? 0} providers).
              </p>
            </GlassCard>

            {stats?.crmPipeline && Object.keys(stats.crmPipeline).length > 0 ? (
              <GlassCard className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Lead Stages</h3>
                {Object.entries(stats.crmPipeline).map(([stage, count]) => (
                  <div key={stage} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-xs text-foreground capitalize">{stage.replace(/_/g, " ")}</span>
                    <span className="text-xs font-bold text-foreground">{count}</span>
                  </div>
                ))}
              </GlassCard>
            ) : (
              <GlassCard className="p-6 text-center">
                <CheckCircle className="w-6 h-6 text-teal mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Outreach sent. Responses will appear in the{" "}
                  <button onClick={() => navigate("/admin/whatsapp")} className="text-indigo underline">WhatsApp inbox</button>
                  {" "}and{" "}
                  <button onClick={() => navigate("/admin/rangers")} className="text-indigo underline">Rangers CRM</button>.
                </p>
              </GlassCard>
            )}
          </div>
        )}
      </div>

      {/* Bulk-blast confirmation — names exactly how many messages, the
          template, and the remaining quota so the admin can sanity-check
          before triggering. */}
      {confirmBlast && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-obsidian/70 backdrop-blur-sm"
          onClick={() => !sending && setConfirmBlast(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm WhatsApp blast">
          <div className="w-full max-w-md glass-2 rounded-2xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber" />
              <h3 className="text-base font-bold text-foreground">Send WhatsApp blast?</h3>
            </div>
            <div className="text-sm space-y-2">
              <p className="text-muted-foreground">
                This will queue up to <span className="text-foreground font-semibold">50 WhatsApp messages</span> using
                the <span className="text-foreground font-semibold">{waStatus?.template?.name ?? "approved"}</span> template.
              </p>
              <p className="text-muted-foreground">
                {waStatus?.providers?.withPhone ?? 0} providers eligible · {waStatus?.providers?.alreadySent ?? 0} already
                contacted · <span className="text-foreground font-semibold">{waStatus?.remaining ?? 0} remaining</span> in this run.
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setConfirmBlast(false)}
                disabled={sending}
                className="rounded-pill px-4 py-2 text-xs font-semibold glass-1 text-muted-foreground hover:text-foreground disabled:opacity-50">
                Cancel
              </button>
              <button onClick={triggerWhatsAppNow}
                disabled={sending}
                className="rounded-pill px-4 py-2 text-xs font-semibold gradient-indigo text-primary-foreground disabled:opacity-50">
                {sending ? "Sending…" : "Send 50"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
