import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import CorporateNav from "@/components/CorporateNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2, Users, Bell, CreditCard, Save, Check,
  Shield, Zap, ChevronDown,
ArrowLeft, } from "lucide-react";

/* ─── helpers ───────────────────────────────────────────────────────────── */
type Tab = "company" | "wellness" | "notifications" | "billing";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-pill relative transition-all ${value ? "bg-amber" : "bg-white/10"}`} title="onChange(!value)} className= `}>" aria-label="onChange(!value)} className= `}>">
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-5" : "left-0.5"}`}/>
    </button>
  );
}

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id:"company",       label:"Company",       icon: Building2  },
  { id:"wellness",      label:"Wellness",      icon: Users      },
  { id:"notifications", label:"Alerts",        icon: Bell       },
  { id:"billing",       label:"Billing",       icon: CreditCard },
];

const ALL_CATEGORIES = ["Fitness", "Medical", "Beauty", "Mental Health", "Nutrition", "Wellness", "Professional"];

/* ─── CorporateSettings ─────────────────────────────────────────────────── */
export default function CorporateSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab]     = useState<Tab>("company");
  const [saved, setSaved] = useState(false);

  // Company settings
  const [companyName, setCompanyName]   = useState("Capitec Bank");
  const [industry, setIndustry]         = useState("Financial Services");
  const [hrEmail, setHrEmail]           = useState("hr@capitec.co.za");
  const [hrPhone, setHrPhone]           = useState("+27 21 809 5000");
  const [headcount, setHeadcount]       = useState("240");

  // Wellness program settings
  const [monthlyBudget, setMonthlyBudget] = useState("500");
  const [rolloverEnabled, setRollover]    = useState(false);
  const [freeIntroEnabled, setFreeIntro]  = useState(true);
  const [enabledCategories, setEnabledCategories] = useState<string[]>(
    ["Fitness", "Medical", "Mental Health", "Nutrition", "Wellness"]
  );
  const [requireApproval, setRequireApproval] = useState(false);
  const [maxSessionsPerMonth, setMaxSessions] = useState("4");

  const toggleCategory = (cat: string) => {
    setEnabledCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Notification settings
  const [notifLowBudget, setNotifLowBudget]   = useState(true);
  const [notifMonthlyReport, setNotifMonthly] = useState(true);
  const [notifNewSession, setNotifSession]    = useState(false);
  const [notifBookingCancel, setNotifCancel]  = useState(true);
  const [notifWellnessScore, setNotifScore]   = useState(true);
  const [budgetThreshold, setBudgetThreshold] = useState("20");

  // Billing
  const [invoiceEmail, setInvoiceEmail] = useState("finance@capitec.co.za");
  const [vatNumber, setVatNumber]       = useState("4700123456");
  const [paymentMethod] = useState("Corporate Card ending 4521");

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-4xl xl:max-w-7xl px-4 pt-20 pb-10 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground">Manage your corporate wellness program</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold gradient-indigo text-primary-foreground">
            {saved ? <><Check className="w-3.5 h-3.5"/>Saved!</> : <><Save className="w-3.5 h-3.5"/>Save</>}
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="glass-1 rounded-pill p-0.5 flex gap-0.5">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-pill text-xs font-medium transition-all ${
                  tab === t.id ? "gradient-indigo text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`} title="setTab(t.id)} className= `}>" aria-label="setTab(t.id)} className= `}>">
                <Icon className="w-3.5 h-3.5 shrink-0"/>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Company tab */}
        {tab === "company" && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-amber"/>
                <h2 className="text-sm font-semibold text-foreground">Company Details</h2>
              </div>
              {[
                { label:"Company Name",   value:companyName,  set:setCompanyName },
                { label:"Industry",       value:industry,     set:setIndustry    },
                { label:"HR Contact Email", value:hrEmail,    set:setHrEmail     },
                { label:"HR Phone",       value:hrPhone,      set:setHrPhone     },
                { label:"Employee Headcount", value:headcount, set:setHeadcount  },
              ].map(field => (
                <div key={field.label}>
                  <label className="text-[10px] text-muted-foreground">{field.label}</label>
                  <input
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    className="w-full mt-1 glass-1 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none border border-white/5 bg-transparent"
                  />
                </div>
              ))}
            </GlassCard>

            <GlassCard className="p-4 flex items-start gap-3">
              <Shield className="w-4 h-4 text-teal shrink-0 mt-0.5"/>
              <div>
                <p className="text-xs font-semibold text-foreground">POPIA Compliance</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Employee wellness data is stored in compliance with the Protection of Personal Information Act.
                  All session data is anonymised at aggregate level. Your employees control their own health data.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Wellness tab */}
        {tab === "wellness" && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-amber"/>
                <h2 className="text-sm font-semibold text-foreground">Budget & Limits</h2>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground">Monthly Budget per Employee (R)</label>
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={e => setMonthlyBudget(e.target.value)}
                  className="w-full mt-1 glass-1 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none border border-white/5 bg-transparent"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Total: R{(Number(monthlyBudget) * Number(headcount)).toLocaleString()} / month across {headcount} employees
                </p>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground">Max Sessions per Employee per Month</label>
                <input
                  type="number"
                  value={maxSessionsPerMonth}
                  onChange={e => setMaxSessions(e.target.value)}
                  className="w-full mt-1 glass-1 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none border border-white/5 bg-transparent"
                />
              </div>

              {[
                { label:"Roll over unused budget", sub:"Unspent credits carry to next month (max 2 months)", val:rolloverEnabled, set:setRollover },
                { label:"Allow free intro sessions", sub:"Employees can book provider intro sessions at no cost", val:freeIntroEnabled, set:setFreeIntro },
                { label:"Require HR approval for bookings", sub:"Each booking must be approved before confirmed", val:requireApproval, set:setRequireApproval },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{row.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{row.sub}</p>
                  </div>
                  <Toggle value={row.val} onChange={row.set}/>
                </div>
              ))}
            </GlassCard>

            <GlassCard className="p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Allowed Service Categories</h2>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map(cat => {
                  const on = enabledCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all border ${
                        on
                          ? "bg-amber/15 border-amber/40 text-amber"
                          : "glass-1 border-white/5 text-muted-foreground hover:text-foreground"
                      }`} title="toggleCategory(cat)} className= `}>" aria-label="toggleCategory(cat)} className= `}>">
                      {cat}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">
                {enabledCategories.length} of {ALL_CATEGORIES.length} categories enabled
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* Notifications tab */}
        {tab === "notifications" && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4 text-amber"/>
                <h2 className="text-sm font-semibold text-foreground">HR Admin Alerts</h2>
              </div>

              {[
                { label:"Low budget warning",         sub:"Notify when employee wallet drops below threshold", val:notifLowBudget,   set:setNotifLowBudget   },
                { label:"Monthly wellness report",    sub:"Auto-send summary PDF at month end",                val:notifMonthlyReport, set:setNotifMonthly   },
                { label:"New session completed",      sub:"Real-time notification per session",                val:notifNewSession,  set:setNotifSession     },
                { label:"Booking cancellations",      sub:"Notify when an employee cancels a booking",         val:notifBookingCancel, set:setNotifCancel    },
                { label:"Wellness score changes",     sub:"Alert when company score shifts ±5 points",         val:notifWellnessScore, set:setNotifScore     },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{row.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{row.sub}</p>
                  </div>
                  <Toggle value={row.val} onChange={row.set}/>
                </div>
              ))}

              <div>
                <label className="text-[10px] text-muted-foreground">Low Balance Alert Threshold (%)</label>
                <input
                  type="number"
                  value={budgetThreshold}
                  onChange={e => setBudgetThreshold(e.target.value)}
                  className="w-full mt-1 glass-1 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none border border-white/5 bg-transparent"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Alert when wallet falls below {budgetThreshold}% of monthly budget
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Billing tab */}
        {tab === "billing" && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-amber"/>
                <h2 className="text-sm font-semibold text-foreground">Billing Details</h2>
              </div>

              {[
                { label:"Invoice Email",  value:invoiceEmail, set:setInvoiceEmail },
                { label:"VAT Number",     value:vatNumber,    set:setVatNumber    },
              ].map(field => (
                <div key={field.label}>
                  <label className="text-[10px] text-muted-foreground">{field.label}</label>
                  <input
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    className="w-full mt-1 glass-1 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none border border-white/5 bg-transparent"
                  />
                </div>
              ))}

              <div>
                <label className="text-[10px] text-muted-foreground">Payment Method</label>
                <div className="mt-1 glass-1 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <p className="text-sm text-foreground">{paymentMethod}</p>
                  <button onClick={() => alert("Payment method management coming soon.")} className="text-[10px] text-amber font-medium" title="alert('Payment method management coming soon.')} className='text-[10px] text-…" aria-label="alert('Payment method management coming soon.')} className='text-[10px] text-…">Change</button>
                </div>
              </div>
            </GlassCard>

            {/* Invoice history */}
            <GlassCard className="p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Invoice History</h2>
              <div className="space-y-2">
                {/* Invoice history is populated from real billing data — empty until first subscription */}
                {([] as Array<{ period: string; amount: string; status: string; date: string }>).map((inv, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm text-foreground">{inv.period}</p>
                      <p className="text-[10px] text-muted-foreground">{inv.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-data text-foreground">{inv.amount}</p>
                      <span className="text-[10px] text-teal font-medium">{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Current plan */}
            <GlassCard className="p-4 border border-amber/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-amber font-semibold">ENTERPRISE PLAN</p>
                  <p className="text-sm font-bold text-foreground mt-1">R9,500 / month</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Unlimited employees · Full analytics · Dedicated HR support</p>
                </div>
                <button
                  onClick={() => alert("Plan upgrade coming soon. Contact sales@bionhealth.co.za.")}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                 title="alert('Plan upgrade coming soon. Contact sales@bionhealth.co.za.')} className…" aria-label="alert('Plan upgrade coming soon. Contact sales@bionhealth.co.za.')} className…">
                  Upgrade
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}

      </div>
      <BionAssistant />
      <CorporateNav/>
    </div>
  );
}
