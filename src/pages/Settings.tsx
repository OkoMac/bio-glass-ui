import { useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell, CreditCard, Eye, User, ChevronLeft, Save, Check,
  Smartphone, Mail, Shield, Trash2, Plus,
} from "lucide-react";

type Tab = "notifications" | "payment" | "privacy" | "account";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-pill relative transition-all ${value ? "gradient-indigo" : "bg-white/10"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

const TABS: { id: Tab; label: string; icon: typeof Bell }[] = [
  { id: "notifications", label: "Alerts",   icon: Bell       },
  { id: "payment",       label: "Payment",  icon: CreditCard },
  { id: "privacy",       label: "Privacy",  icon: Eye        },
  { id: "account",       label: "Account",  icon: User       },
];

export default function Settings() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const initialTab = (params.get("tab") as Tab | null) ?? "notifications";
  const [tab, setTab]     = useState<Tab>(initialTab);
  const [saved, setSaved] = useState(false);

  /* ── Notification prefs ── */
  const [pushBookingReminder, setPushReminder]   = useState(true);
  const [pushNewMessage, setPushMessage]         = useState(true);
  const [pushPromotion, setPushPromo]            = useState(false);
  const [pushStreakAlert, setPushStreak]          = useState(true);
  const [emailReceipts, setEmailReceipts]        = useState(true);
  const [emailWeeklyReport, setEmailWeekly]      = useState(false);
  const [emailMarketing, setEmailMarketing]      = useState(false);

  /* ── Payment ── */
  const savedCards = [
    { id: "c1", last4: "4521", brand: "Visa",       expiry: "09/27" },
    { id: "c2", last4: "9012", brand: "Mastercard", expiry: "03/26" },
  ];
  const [defaultCard, setDefaultCard] = useState("c1");

  /* ── Privacy ── */
  const [shareProgressWithProviders, setShareProgress] = useState(true);
  const [allowAnonymousAnalytics, setAllowAnalytics]  = useState(true);
  const [hideProfileFromSearch, setHideProfile]        = useState(false);
  const [twoFactorEnabled, set2FA]                    = useState(false);

  /* ── Account ── */
  const [name,  setName]  = useState(user?.name  ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-12 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full glass-1 flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold gradient-indigo text-primary-foreground"
          >
            {saved ? <><Check className="w-3.5 h-3.5" />Saved!</> : <><Save className="w-3.5 h-3.5" />Save</>}
          </motion.button>
        </div>

        {/* Tab bar */}
        <div className="glass-1 rounded-pill p-0.5 flex gap-0.5">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-pill text-xs font-medium transition-all ${
                  tab === t.id ? "gradient-indigo text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Notifications ── */}
        {tab === "notifications" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="w-4 h-4 text-indigo" />
                <h2 className="text-sm font-semibold text-foreground">Push Notifications</h2>
              </div>
              {[
                { label: "Booking reminders",     sub: "24h and 1h before your session",          val: pushBookingReminder, set: setPushReminder },
                { label: "New messages",          sub: "Notify when a provider messages you",      val: pushNewMessage,      set: setPushMessage  },
                { label: "Streak alerts",         sub: "Daily reminder to keep your streak alive", val: pushStreakAlert,      set: setPushStreak   },
                { label: "Promotions & offers",   sub: "Deals and featured provider offers",       val: pushPromotion,       set: setPushPromo    },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{row.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{row.sub}</p>
                  </div>
                  <Toggle value={row.val} onChange={row.set} />
                </div>
              ))}
            </GlassCard>

            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-teal" />
                <h2 className="text-sm font-semibold text-foreground">Email Notifications</h2>
              </div>
              {[
                { label: "Booking receipts",   sub: "Confirmation and payment receipts",     val: emailReceipts,      set: setEmailReceipts },
                { label: "Weekly wellness recap", sub: "Summary of your week's activity",   val: emailWeeklyReport,  set: setEmailWeekly  },
                { label: "Marketing & tips",   sub: "Wellness content and platform updates", val: emailMarketing,     set: setEmailMarketing },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{row.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{row.sub}</p>
                  </div>
                  <Toggle value={row.val} onChange={row.set} />
                </div>
              ))}
            </GlassCard>
          </motion.div>
        )}

        {/* ── Payment ── */}
        {tab === "payment" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground mb-1">Saved Cards</h2>
              {savedCards.map(card => (
                <div
                  key={card.id}
                  onClick={() => setDefaultCard(card.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    defaultCard === card.id ? "border-indigo/40 bg-indigo/5" : "border-white/5 glass-1"
                  }`}
                >
                  <div className="w-9 h-6 rounded-md bg-white/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{card.brand} •••• {card.last4}</p>
                    <p className="text-[10px] text-muted-foreground">Expires {card.expiry}</p>
                  </div>
                  {defaultCard === card.id && (
                    <span className="text-[10px] px-2 py-0.5 rounded-pill glass-accent-teal text-teal font-medium">Default</span>
                  )}
                </div>
              ))}
              <button className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/15 text-xs text-muted-foreground hover:text-foreground hover:border-white/30 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Add new card
              </button>
            </GlassCard>

            <GlassCard className="p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground mb-1">BIONWallet</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold font-data text-teal">R1,250</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Available balance</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold gradient-indigo text-primary-foreground"
                >
                  Top Up
                </motion.button>
              </div>
              <div className="pt-2 border-t border-white/5">
                <p className="text-[10px] text-muted-foreground">
                  BIONWallet credits are used for session payments. Unused credits roll over monthly.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ── Privacy ── */}
        {tab === "privacy" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-teal" />
                <h2 className="text-sm font-semibold text-foreground">Data & Privacy</h2>
              </div>
              {[
                { label: "Share progress with providers", sub: "Providers can view your tracked metrics",     val: shareProgressWithProviders, set: setShareProgress },
                { label: "Anonymous analytics",           sub: "Help improve BION with anonymised usage data", val: allowAnonymousAnalytics,    set: setAllowAnalytics },
                { label: "Hide profile from search",     sub: "Prevent your name appearing in provider search", val: hideProfileFromSearch,  set: setHideProfile },
                { label: "Two-factor authentication",   sub: "Require OTP on each login",                    val: twoFactorEnabled,          set: set2FA },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{row.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{row.sub}</p>
                  </div>
                  <Toggle value={row.val} onChange={row.set} />
                </div>
              ))}
            </GlassCard>

            <GlassCard className="p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Your Data</h2>
              <button
                onClick={() => window.alert("Your data export will be emailed to you.")}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl glass-1 text-sm text-foreground hover:bg-white/5 transition-colors"
              >
                <span>Download my data</span>
                <ChevronLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
              </button>
              <button className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl glass-1 text-sm text-foreground hover:bg-white/5 transition-colors">
                <span>Request data deletion</span>
                <ChevronLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
              </button>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Your data is protected under POPIA. All health-related data is end-to-end encrypted
                and anonymised at aggregate reporting level.
              </p>
            </GlassCard>

            <GlassCard className="p-4 border border-coral/15">
              <div className="flex items-start gap-3">
                <Trash2 className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-coral">Delete Account</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                    Permanently delete your BION account and all associated data. This cannot be undone.
                  </p>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="mt-2 text-[11px] text-coral font-medium underline underline-offset-2"
                    >
                      Request account deletion
                    </button>
                  ) : (
                    <div className="mt-3 p-3 rounded-xl border border-coral/20 bg-coral/5 space-y-2">
                      <p className="text-xs text-foreground font-medium">Are you sure? This action is permanent and cannot be undone.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            logout();
                            navigate("/welcome");
                          }}
                          className="flex-1 rounded-xl py-2 text-xs font-semibold bg-coral text-white"
                        >
                          Yes, delete my account
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 rounded-xl py-2 text-xs font-semibold glass-1 text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ── Account ── */}
        {tab === "account" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-indigo" />
                <h2 className="text-sm font-semibold text-foreground">Profile Details</h2>
              </div>
              {[
                { label: "Full Name",     value: name,  set: setName,  type: "text"  },
                { label: "Email Address", value: email, set: setEmail, type: "email" },
                { label: "Phone Number",  value: phone, set: setPhone, type: "tel"   },
              ].map(field => (
                <div key={field.label}>
                  <label className="text-[10px] text-muted-foreground">{field.label}</label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    className="w-full mt-1 glass-1 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none border border-white/5 bg-transparent"
                  />
                </div>
              ))}
            </GlassCard>

            <GlassCard className="p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Security</h2>
              <button className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl glass-1 text-sm text-foreground hover:bg-white/5 transition-colors">
                <span>Change Password</span>
                <ChevronLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
              </button>
              <button className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl glass-1 text-sm text-foreground hover:bg-white/5 transition-colors">
                <span>Linked Social Accounts</span>
                <ChevronLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
              </button>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-[10px] text-muted-foreground">
                Member since <span className="text-foreground font-medium">January 2026</span> ·
                Role: <span className="text-indigo font-medium capitalize">{user?.role ?? "client"}</span>
              </p>
            </GlassCard>
          </motion.div>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
