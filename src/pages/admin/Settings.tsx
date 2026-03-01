import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Check, Shield, Bell, Globe, CreditCard, Database, Zap, Eye, EyeOff, RefreshCw } from "lucide-react";

type Tab = "platform" | "security" | "notifications" | "billing";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-pill relative transition-all ${value ? "bg-indigo" : "bg-white/10"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

export default function AdminSettings() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("platform");
  const [saved, setSaved] = useState(false);

  // Platform settings
  const [platformName, setPlatformName] = useState("BION Platform");
  const [supportEmail, setSupportEmail]  = useState("support@bion.app");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [serveAIEnabled, setServeAIEnabled]   = useState(true);
  const [corpWellness, setCorpWellness]       = useState(true);
  const [maxProviders, setMaxProviders]       = useState("500");

  // Security
  const [mfaRequired, setMfaRequired]     = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [ipWhitelist, setIpWhitelist]       = useState(false);
  const [auditLogs, setAuditLogs]           = useState(true);
  const [apiKey, setApiKey]                 = useState("bio_sk_prod_••••••••••••••••");
  const [showKey, setShowKey]               = useState(false);

  // Notifications
  const [notifNewProvider, setNotifNewProvider]   = useState(true);
  const [notifPayoutFail, setNotifPayoutFail]     = useState(true);
  const [notifFlaggedUser, setNotifFlaggedUser]   = useState(true);
  const [notifPlatformAlert, setNotifPlatformAlert] = useState(true);
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(true);
  const [notifGrowthAlert, setNotifGrowthAlert]   = useState(false);

  // Billing
  const [currentPlan] = useState("Enterprise");
  const [monthlySeats] = useState("12,400");

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs: { key: Tab; label: string; icon: typeof Shield }[] = [
    { key: "platform",      label: "Platform",      icon: Globe    },
    { key: "security",      label: "Security",      icon: Shield   },
    { key: "notifications", label: "Notifications", icon: Bell     },
    { key: "billing",       label: "Billing",       icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-2xl px-4 pt-16 pb-10 md:pt-8 space-y-5">

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

        {/* Tab strip */}
        <div className="flex gap-1 glass-1 rounded-pill p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-pill text-xs font-medium transition-all ${
                tab === t.key ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Platform ── */}
        {tab === "platform" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">General</p>
              {[
                { label: "Platform Name",  value: platformName, set: setPlatformName },
                { label: "Support Email",  value: supportEmail, set: setSupportEmail },
                { label: "Max Providers",  value: maxProviders, set: setMaxProviders, type: "number" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)} type={f.type ?? "text"}
                    className="w-full h-10 glass-1 rounded-xl px-3 text-sm text-foreground bg-transparent outline-none" />
                </div>
              ))}
            </GlassCard>

            <GlassCard className="p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Feature Flags</p>
              {[
                { label: "WhatsApp Bot Integration", sub: "Allow bookings via WhatsApp", value: whatsappEnabled, set: setWhatsappEnabled },
                { label: "ServeAI Assistant",         sub: "AI-powered recommendations",  value: serveAIEnabled,   set: setServeAIEnabled   },
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

        {/* ── Security ── */}
        {tab === "security" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Access Controls</p>
              {[
                { label: "Require 2FA for Admins",     sub: "Force MFA on all admin accounts",  value: mfaRequired,  set: setMfaRequired  },
                { label: "IP Whitelist",               sub: "Restrict admin panel by IP",        value: ipWhitelist,  set: setIpWhitelist  },
                { label: "Full Audit Logs",             sub: "Log all admin actions to S3",       value: auditLogs,    set: setAuditLogs    },
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
                <input value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} type="number"
                  className="w-full h-10 glass-1 rounded-xl px-3 text-sm text-foreground bg-transparent outline-none" />
              </div>
            </GlassCard>

            <GlassCard className="p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">API Key</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input readOnly value={showKey ? "bio_sk_prod_a4f8c2d1e9b3" : apiKey}
                    className="w-full h-10 glass-1 rounded-xl px-3 pr-10 text-xs font-mono text-foreground bg-transparent outline-none" />
                  <button onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <motion.button whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 glass-1 rounded-xl flex items-center justify-center shrink-0"
                  title="Regenerate">
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>
              <p className="text-[10px] text-coral">⚠ Regenerating will invalidate all active integrations</p>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-sm font-semibold text-foreground mb-2">POPIA Compliance</p>
              <div className="space-y-1.5">
                {["Data retention: 3 years (compliant)", "Consent logs: Active", "Right to erasure: Enabled", "Last audit: Jan 15, 2026"].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-teal shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ── Notifications ── */}
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

        {/* ── Billing ── */}
        {tab === "billing" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Current Plan</p>
                <span className="text-xs px-2.5 py-1 rounded-pill gradient-indigo text-primary-foreground font-medium">
                  {currentPlan}
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Active Seats",        value: monthlySeats },
                  { label: "Commission Rate",      value: "8% per booking" },
                  { label: "Payout Frequency",     value: "Weekly" },
                  { label: "Next Invoice",         value: "Mar 1, 2026" },
                  { label: "Estimated Amount",     value: "R48,200" },
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
              <div className="space-y-2">
                {[
                  { month: "January 2026",  amount: "R39,850", status: "Paid"    },
                  { month: "December 2025", amount: "R35,200", status: "Paid"    },
                  { month: "November 2025", amount: "R28,400", status: "Paid"    },
                  { month: "October 2025",  amount: "R22,100", status: "Paid"    },
                ].map(inv => (
                  <div key={inv.month} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-xs font-medium text-foreground">{inv.month}</p>
                      <p className="text-[10px] text-muted-foreground">{inv.amount}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-pill glass-accent-teal text-teal">{inv.status}</span>
                      <button className="text-[10px] text-indigo font-medium">PDF</button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard variant="accent-indigo" className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-indigo mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Platform GMV This Month</p>
                  <p className="text-2xl font-bold font-data text-foreground mt-1">R994,500</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    <span className="text-teal">+18.4%</span> vs January · On track for R1M milestone
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
