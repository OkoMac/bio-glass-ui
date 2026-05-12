import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/safeQuery";
import { Save, Check, Shield, Bell, Globe, CreditCard, Database, Zap, Loader2, ArrowLeft, } from "lucide-react";

type Tab = "platform" | "security" | "notifications" | "billing";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-pill relative transition-all ${value ? "bg-indigo" : "bg-white/10"}`} title="onChange(!value)} className= `}>" aria-label="onChange(!value)} className= `}>">
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("platform");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(true);

  // Platform settings
  const [platformName, setPlatformName] = useState("");
  const [supportEmail, setSupportEmail]  = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [bAssistantEnabled, setB_Enabled]   = useState(false);
  const [corpWellness, setCorpWellness]       = useState(false);
  const [maxProviders, setMaxProviders]       = useState("");

  // Security
  const [mfaRequired, setMfaRequired]     = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("");
  const [ipWhitelist, setIpWhitelist]       = useState(false);
  const [auditLogs, setAuditLogs]           = useState(false);

  // Notifications
  const [notifNewProvider, setNotifNewProvider]   = useState(false);
  const [notifPayoutFail, setNotifPayoutFail]     = useState(false);
  const [notifFlaggedUser, setNotifFlaggedUser]   = useState(false);
  const [notifPlatformAlert, setNotifPlatformAlert] = useState(false);
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(false);
  const [notifGrowthAlert, setNotifGrowthAlert]   = useState(false);

  // Billing
  const [totalBookingGmv, setTotalBookingGmv] = useState(0);
  const [activeSeats, setActiveSeats] = useState(0);
  const [loadingBilling, setLoadingBilling] = useState(true);

  useEffect(() => {
    loadSettings();
    loadBillingData();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await withTimeout(
        () => supabase.from("platform_settings").select("key, value"),
        5000,
        { data: null } as any,
      );

      if (data && data.length > 0) {
        const settings: Record<string, string> = {};
        data.forEach(row => { settings[row.key] = row.value; });

        setPlatformName(settings["platform_name"] || "");
        setSupportEmail(settings["support_email"] || "");
        setMaintenanceMode(settings["maintenance_mode"] === "true");
        setWhatsappEnabled(settings["whatsapp_enabled"] === "true");
        setB_Enabled(settings["b_assistant_enabled"] === "true");
        setCorpWellness(settings["corp_wellness"] === "true");
        setMaxProviders(settings["max_providers"] || "");
        setMfaRequired(settings["mfa_required"] === "true");
        setSessionTimeout(settings["session_timeout"] || "");
        setIpWhitelist(settings["ip_whitelist"] === "true");
        setAuditLogs(settings["audit_logs"] === "true");
        setNotifNewProvider(settings["notif_new_provider"] === "true");
        setNotifPayoutFail(settings["notif_payout_fail"] === "true");
        setNotifFlaggedUser(settings["notif_flagged_user"] === "true");
        setNotifPlatformAlert(settings["notif_platform_alert"] === "true");
        setNotifWeeklyReport(settings["notif_weekly_report"] === "true");
        setNotifGrowthAlert(settings["notif_growth_alert"] === "true");
      }
    } catch {
      // platform_settings table may not exist yet
    } finally {
      setLoading(false);
    }
  };

  const loadBillingData = async () => {
    try {
      const [bookingsRes, seatsRes] = await Promise.all([
        withTimeout(() => supabase.from("bookings").select("total_price").eq("status", "completed"), 5000, { data: [], count: 0 } as any),
        withTimeout(() => supabase.from("user_roles").select("user_id", { count: "exact", head: true }), 5000, { data: null, count: 0 } as any),
      ]);
      const gmv = (bookingsRes.data ?? []).reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
      setTotalBookingGmv(gmv);
      setActiveSeats(seatsRes.count ?? 0);
    } catch {
      // bookings or user_roles table may not exist yet
    } finally {
      setLoadingBilling(false);
    }
  };

  const save = async () => {
    try {
      const settingsToSave: Record<string, string> = {
        platform_name: platformName,
        support_email: supportEmail,
        maintenance_mode: String(maintenanceMode),
        whatsapp_enabled: String(whatsappEnabled),
        b_assistant_enabled: String(bAssistantEnabled),
        corp_wellness: String(corpWellness),
        max_providers: maxProviders,
        mfa_required: String(mfaRequired),
        session_timeout: sessionTimeout,
        ip_whitelist: String(ipWhitelist),
        audit_logs: String(auditLogs),
        notif_new_provider: String(notifNewProvider),
        notif_payout_fail: String(notifPayoutFail),
        notif_flagged_user: String(notifFlaggedUser),
        notif_platform_alert: String(notifPlatformAlert),
        notif_weekly_report: String(notifWeeklyReport),
        notif_growth_alert: String(notifGrowthAlert),
      };

      for (const [key, value] of Object.entries(settingsToSave)) {
        await supabase
          .from("platform_settings")
          .upsert({ key, value } as any, { onConflict: "key" });
      }

      setSaved(true);
      setSaveError("");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Failed to save. Make sure the platform_settings table exists in Supabase.");
      setTimeout(() => setSaveError(""), 5000);
    }
  };

  const tabs: { key: Tab; label: string; icon: typeof Shield }[] = [
    { key: "platform",      label: "Platform",      icon: Globe    },
    { key: "security",      label: "Security",      icon: Shield   },
    { key: "notifications", label: "Notifications", icon: Bell     },
    { key: "billing",       label: "Billing",       icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…" aria-label="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…">
        <ArrowLeft className="w-5 h-5" />
      </button>
        <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-24 pb-10 md:pt-8 flex flex-col items-center justify-center gap-3" style={{ minHeight: "60vh" }}>
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
        <AdminNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…" aria-label="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-24 pb-10 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
            <p className="text-xs text-muted-foreground">Signed in as {user?.email}</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={save}
            className={`flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-semibold transition-all ${
              saved ? "glass-accent-teal text-teal" : "gradient-indigo text-primary-foreground"
            }`}>
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save</>}
          </motion.button>
        </div>

        {saved && (
          <div className="glass-accent-teal rounded-xl p-3 text-sm text-teal flex items-center gap-2">
            <Check className="w-4 h-4" /> Settings saved successfully
          </div>
        )}
        {saveError && (
          <div className="glass-accent-coral rounded-xl p-3 text-sm text-coral">
            {saveError}
          </div>
        )}

        {/* Tab strip */}
        <div className="flex gap-1 glass-1 rounded-pill p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-pill text-xs font-medium transition-all ${
                tab === t.key ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"
              }`} title="setTab(t.key)} className= `}>" aria-label="setTab(t.key)} className= `}>">
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Platform */}
        {tab === "platform" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">General</p>
              {[
                { label: "Platform Name",  value: platformName, set: setPlatformName, placeholder: "Enter platform name" },
                { label: "Support Email",  value: supportEmail, set: setSupportEmail, placeholder: "Enter support email" },
                { label: "Max Providers",  value: maxProviders, set: setMaxProviders, type: "number", placeholder: "Enter max providers" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)} type={f.type ?? "text"} placeholder={f.placeholder}
                    min={f.type === "number" ? 0 : undefined}
                    step={f.type === "number" ? 1 : undefined}
                    inputMode={f.type === "number" ? "numeric" : undefined}
                    className="w-full h-10 glass-1 rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none" />
                </div>
              ))}
            </GlassCard>

            <GlassCard className="p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Feature Flags</p>
              {[
                { label: "WhatsApp Bot Integration", sub: "Allow bookings via WhatsApp", value: whatsappEnabled, set: setWhatsappEnabled },
                { label: "B_ Assistant",         sub: "AI-powered recommendations",  value: bAssistantEnabled,   set: setB_Enabled   },
                { label: "Corporate Wellness Portal", sub: "Enable B2B employer access",  value: corpWellness,     set: setCorpWellness     },
                { label: "Maintenance Mode",          sub: "Block all public access",      value: maintenanceMode,  set: setMaintenanceMode, danger: true },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between py-1">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${f.danger ? "text-coral" : "text-foreground"}`}>{f.label}</p>
                    <p className="text-[11px] text-muted-foreground">{f.sub}</p>
                  </div>
                  <Toggle value={f.value} onChange={f.set} />
                </div>
              ))}
            </GlassCard>
          </motion.div>
        )}

        {/* Security */}
        {tab === "security" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Access Controls</p>
              {[
                { label: "Require 2FA for Admins",     sub: "Force MFA on all admin accounts",  value: mfaRequired,  set: setMfaRequired  },
                { label: "IP Whitelist",               sub: "Restrict admin panel by IP",        value: ipWhitelist,  set: setIpWhitelist  },
                { label: "Full Audit Logs",             sub: "Log all admin actions",             value: auditLogs,    set: setAuditLogs    },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between py-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{f.label}</p>
                    <p className="text-[11px] text-muted-foreground">{f.sub}</p>
                  </div>
                  <Toggle value={f.value} onChange={f.set} />
                </div>
              ))}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Session Timeout (minutes)</label>
                <input value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} type="number" placeholder="e.g. 30"
                  className="w-full h-10 glass-1 rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none" />
              </div>
            </GlassCard>

            <GlassCard className="p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">API Key</p>
              <div className="flex items-center justify-center py-4">
                <p className="text-xs text-muted-foreground text-center">
                  API keys are managed via Supabase Dashboard.<br />
                  Navigate to your project settings to manage keys.
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-sm font-semibold text-foreground mb-2">POPIA Compliance</p>
              <div className="space-y-1.5">
                {[
                  "Data retention policy: Configure in Supabase",
                  "Consent logs: Configure in Supabase",
                  "Right to erasure: Configure in Supabase",
                  "Last audit: Not yet performed",
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Database className="w-3 h-3 text-muted-foreground shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Notifications */}
        {tab === "notifications" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Admin Alerts</p>
              {[
                { label: "New Provider Signup",      sub: "Alert when provider registers",         value: notifNewProvider,   set: setNotifNewProvider   },
                { label: "Payout Failure",           sub: "Alert on failed payouts",               value: notifPayoutFail,    set: setNotifPayoutFail    },
                { label: "Flagged User",             sub: "Alert when client or provider flagged",  value: notifFlaggedUser,   set: setNotifFlaggedUser   },
                { label: "Platform Alerts",          sub: "System health and performance",          value: notifPlatformAlert, set: setNotifPlatformAlert },
                { label: "Weekly Growth Report",     sub: "Emailed every Monday 8am",              value: notifWeeklyReport,  set: setNotifWeeklyReport  },
                { label: "GMV Growth Milestone",     sub: "When platform hits R1M milestones",     value: notifGrowthAlert,   set: setNotifGrowthAlert   },
              ].map(n => (
                <div key={n.label} className="flex items-center justify-between py-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.label}</p>
                    <p className="text-[11px] text-muted-foreground">{n.sub}</p>
                  </div>
                  <Toggle value={n.value} onChange={n.set} />
                </div>
              ))}
            </GlassCard>
          </motion.div>
        )}

        {/* Billing */}
        {tab === "billing" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Current Plan</p>
                <span className="text-xs px-2.5 py-1 rounded-pill glass-1 text-muted-foreground font-medium">
                  Not configured
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Active Seats",        value: loadingBilling ? "..." : String(activeSeats) },
                  { label: "Commission Rate",      value: "Configure in platform_settings" },
                  { label: "Payout Frequency",     value: "Configure in platform_settings" },
                  { label: "Next Invoice",         value: "N/A" },
                  { label: "Estimated Amount",     value: "N/A" },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="text-foreground font-medium">{r.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-sm font-semibold text-foreground mb-3">Invoice History</p>
              <div className="flex items-center justify-center py-6">
                <p className="text-xs text-muted-foreground text-center">
                  No invoices yet. Invoice history will appear here once billing is configured.
                </p>
              </div>
            </GlassCard>

            <GlassCard variant="accent-indigo" className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-indigo mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Platform GMV (All Time)</p>
                  <p className="text-2xl font-bold font-data text-foreground mt-1">
                    {loadingBilling ? "..." : `R${totalBookingGmv.toLocaleString()}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Calculated from completed bookings in Supabase
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>

      <AdminNav />
    </div>
  );
}
