import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import ServiceAreaCard from "@/components/provider/ServiceAreaCard";
import BankConnectSection from "@/components/provider/BankConnectSection";
import { ImagePickerOverlay } from "@/components/ImagePickerOverlay";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderAvailability, type AvailabilitySlot } from "@/hooks/useProviderAvailability";
import {
  User, Bell, CreditCard, Shield, ChevronRight,
  CheckCircle, Globe, Clock, Percent, MessageSquare, Sparkles,
  CalendarClock, Loader2, ArrowLeft,
} from "lucide-react";

import { getProviderImage } from "@/lib/providerImages";

type Tab = "profile" | "billing" | "notifications" | "privacy";

const VERTICALS = ["Fitness", "Medical", "Beauty", "Wellness", "Professional", "Vet"];
const CANCEL_POLICIES = [
  { id: "flexible", label: "Standard (BION default)", desc: "Client cancels 24h+ before: full refund to wallet. <24h: 50% fee, 50% refund." },
  { id: "moderate", label: "Moderate", desc: "Client cancels 48h+ before: full refund to wallet. <48h: 50% fee, 50% refund." },
  { id: "strict",   label: "Strict",   desc: "Client cancels 72h+ before: full refund to wallet. <72h: 50% fee, 50% refund." },
];

export default function ProviderSettings() {
  const navigate = useNavigate();
  const { user, updateAvatar } = useAuth();
  const [searchParams] = useSearchParams();
  // Start on whichever tab the URL requested (?tab=billing is how the
  // verification-success email drives newly-verified providers straight to
  // the bank-connection form). Default to "profile".
  const qsTab = searchParams.get("tab");
  const initialTab: Tab =
    qsTab === "billing" || qsTab === "notifications" || qsTab === "privacy" ? qsTab : "profile";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [saved, setSaved] = useState(false);

  // Profile state — derive from the signed-in provider so we don't leak
  // "James Okafor / Sandton" defaults to every new provider. Fields start
  // empty (or from user.name / user.email) and the provider fills them in.
  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-practice";
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [tagline, setTagline]         = useState("");
  const [bio, setBio]                 = useState("");
  const [vertical, setVertical]       = useState("Fitness");
  const [location, setLocation]       = useState("");
  const [sessionLength, setSessionLength] = useState("60");
  const [cancelPolicy, setCancelPolicy]   = useState("moderate");
  const [miniSiteUrl, setMiniSiteUrl]     = useState(
    user?.name ? `bion.app/${slugify(user.name)}` : "bion.app/",
  );

  // Billing — plan / payouts come from the backend once wired up.
  const [plan] = useState("Starter");
  const [nextBilling] = useState("—");
  const payouts: { month: string; amount: string; status: string }[] = [];

  // Notifications
  const [notifs, setNotifs] = useState({
    newBooking:    true,
    cancellation:  true,
    reminder:      true,
    payment:       true,
    serveAI:       false,
    marketing:     false,
  });

  const toggleNotif = (key: keyof typeof notifs) =>
    setNotifs(n => ({ ...n, [key]: !n[key] }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile",       label: "Profile",       icon: <User className="w-3.5 h-3.5" /> },
    { id: "billing",       label: "Billing",        icon: <CreditCard className="w-3.5 h-3.5" /> },
    { id: "notifications", label: "Notifications",  icon: <Bell className="w-3.5 h-3.5" /> },
    { id: "privacy",       label: "Privacy",        icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground">Manage your provider account</p>
          </div>
          {tab === "profile" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={save}
              className={`px-4 py-2 rounded-pill text-sm font-semibold transition-all flex items-center gap-1.5 ${
                saved ? "bg-teal/20 text-teal" : "gradient-indigo text-primary-foreground"
              }`}
            >
              {saved ? <><CheckCircle className="w-3.5 h-3.5" /> Saved</> : "Save changes"}
            </motion.button>
          )}
        </div>

        {/* Tab bar */}
        <div className="glass-1 rounded-pill p-1 flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.id ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t.icon} {t.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── PROFILE ── */}
          {tab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Avatar */}
              <GlassCard className="p-4 flex items-center gap-4">
                <ImagePickerOverlay onChange={updateAvatar} className="shrink-0">
                  <img
                    src={user?.avatar ?? getProviderImage(user?.id ?? "provider", user?.name ?? "Provider")}
                    alt="Profile"
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                </ImagePickerOverlay>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{tagline}</p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="text-[9px] px-2 py-0.5 glass-accent-teal text-teal rounded-pill">NASM Certified</span>
                    <span className="text-[9px] px-2 py-0.5 glass-1 text-muted-foreground rounded-pill">Verified</span>
                  </div>
                </div>
              </GlassCard>

              {/* Public profile fields */}
              <GlassCard className="p-4 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Public Profile</p>

                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Display name</p>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full bg-white/5 text-foreground text-sm rounded-xl px-3 py-2.5 outline-none border border-white/10 focus:border-indigo/50 transition-colors"
                  />
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Tagline</p>
                  <input
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    className="w-full bg-white/5 text-foreground text-sm rounded-xl px-3 py-2.5 outline-none border border-white/10 focus:border-indigo/50 transition-colors"
                  />
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Bio</p>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 text-foreground text-sm rounded-xl px-3 py-2.5 outline-none border border-white/10 focus:border-indigo/50 transition-colors resize-none"
                  />
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5">Service vertical</p>
                  <div className="flex flex-wrap gap-1.5">
                    {VERTICALS.map(v => (
                      <button
                        key={v}
                        onClick={() => setVertical(v)}
                        className={`text-[10px] px-2.5 py-1 rounded-pill transition-all ${
                          vertical === v ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Location</p>
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-white/5 text-foreground text-sm rounded-xl px-3 py-2.5 outline-none border border-white/10 focus:border-indigo/50 transition-colors"
                  />
                </div>
              </GlassCard>

              {/* Service area — drives acquisition voucher visibility */}
              <ServiceAreaCard />

              {/* Business rules */}
              <GlassCard className="p-4 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Rules</p>

                <div>
                  <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Default session length (minutes)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["30","45","60","90","120"].map(l => (
                      <button
                        key={l}
                        onClick={() => setSessionLength(l)}
                        className={`text-[10px] px-2.5 py-1 rounded-pill transition-all ${
                          sessionLength === l ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                        }`}
                      >
                        {l} min
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1"><Percent className="w-3 h-3" /> Cancellation policy</p>
                  <div className="space-y-2">
                    {CANCEL_POLICIES.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setCancelPolicy(p.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          cancelPolicy === p.id ? "border-indigo/40 glass-accent-indigo" : "border-white/5 glass-1"
                        }`}
                      >
                        <p className="text-sm font-medium text-foreground">{p.label}</p>
                        <p className="text-[11px] text-muted-foreground">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Mini-site URL */}
              <GlassCard className="p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Your BION mini-site</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10">
                    <p className="text-[10px] text-muted-foreground">Public URL</p>
                    <p className="text-sm font-medium text-foreground">{miniSiteUrl}</p>
                  </div>
                  <button className="glass-1 rounded-xl p-2.5" onClick={() => navigator.clipboard?.writeText(`https://${miniSiteUrl}`)}>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </GlassCard>

              {/* Calendar Sync */}
              <CalendarSyncSection />

              {/* B_ toggle */}
              <GlassCard className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl glass-accent-indigo flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-indigo" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">B_ booking assistant</p>
                  <p className="text-[11px] text-muted-foreground">Let B_ handle client enquiries and bookings</p>
                </div>
                <button className="w-9 h-5 rounded-full bg-indigo-500 flex items-center px-0.5">
                  <motion.div animate={{ x: 16 }} className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </GlassCard>

              {/* Availability — weekly working hours */}
              <AvailabilitySection />
            </motion.div>
          )}

          {/* ── BILLING ── */}
          {tab === "billing" && (
            <motion.div key="billing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Current plan */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Current plan</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">{plan}</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 glass-accent-teal text-teal rounded-pill">Active</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: "Commission", value: "8%" },
                    { label: "Clients",    value: "Unlimited" },
                    { label: "Next bill",  value: nextBilling },
                  ].map(i => (
                    <div key={i.label} className="glass-1 rounded-xl p-2.5 text-center">
                      <p className="text-xs font-bold text-foreground">{i.value}</p>
                      <p className="text-[10px] text-muted-foreground">{i.label}</p>
                    </div>
                  ))}
                </div>
                <button className="w-full py-2.5 glass-1 rounded-pill text-sm text-muted-foreground font-medium">
                  Upgrade to Pro →
                </button>
              </GlassCard>

              {/* Payout history */}
              <GlassCard className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Payout History</p>
                <div className="space-y-2">
                  {payouts.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No payouts yet. Your first payout appears here after your first paid booking is completed.</p>
                  ) : payouts.map(p => (
                    <div key={p.month} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.month}</p>
                        <p className="text-[10px] text-teal capitalize">{p.status}</p>
                      </div>
                      <p className="text-sm font-bold font-data text-foreground">{p.amount}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Payout bank — real Paystack subaccount integration */}
              <BankConnectSection />
            </motion.div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === "notifications" && (
            <motion.div key="notifs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <GlassCard className="p-4 space-y-1">
                {[
                  { key: "newBooking",   label: "New booking request",   desc: "When a client books a session" },
                  { key: "cancellation", label: "Cancellation",           desc: "When a client cancels" },
                  { key: "reminder",     label: "Session reminders",      desc: "1 hour before each session" },
                  { key: "payment",      label: "Payout processed",       desc: "When funds are transferred" },
                  { key: "serveAI",      label: "B_ activity",       desc: "AI handled a booking for you" },
                  { key: "marketing",    label: "Tips & promotions",       desc: "Platform updates and offers" },
                ] .map((item, i) => (
                  <div key={item.key} className={`flex items-center justify-between py-3 ${i > 0 ? "border-t border-white/5" : ""}`}>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleNotif(item.key as keyof typeof notifs)}
                      className={`w-9 h-5 rounded-full transition-all flex items-center px-0.5 shrink-0 ${
                        notifs[item.key as keyof typeof notifs] ? "bg-indigo-500" : "bg-white/10"
                      }`}
                    >
                      <motion.div
                        animate={{ x: notifs[item.key as keyof typeof notifs] ? 16 : 0 }}
                        className="w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </button>
                  </div>
                ))}
              </GlassCard>
            </motion.div>
          )}

          {/* ── PRIVACY ── */}
          {tab === "privacy" && (
            <motion.div key="privacy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <GlassCard className="p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data & Privacy</p>
                {[
                  { label: "Download my data", desc: "Export all your data as JSON" },
                  { label: "Delete my account", desc: "Permanently remove your account and data" },
                  { label: "POPIA compliance report", desc: "View data processing log" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </GlassCard>

              <GlassCard className="p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> WhatsApp Integration</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">+27 82 000 0000</p>
                    <p className="text-[11px] text-teal">Connected</p>
                  </div>
                  <button className="glass-1 rounded-pill px-3 py-1.5 text-xs text-muted-foreground">Disconnect</button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProviderNav />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Availability sub-section — lives under the Profile tab. Lets a provider
// toggle each weekday on/off and set start/end times. Saves via the
// useProviderAvailability hook which hits /api/providers/availability.
// ────────────────────────────────────────────────────────────────────

// Mon=1 ... Sat=6, Sun=0 — matches backend day_of_week convention.
const WEEKDAYS: { key: number; label: string }[] = [
  { key: 1, label: "Mon" },
  { key: 2, label: "Tue" },
  { key: 3, label: "Wed" },
  { key: 4, label: "Thu" },
  { key: 5, label: "Fri" },
  { key: 6, label: "Sat" },
  { key: 0, label: "Sun" },
];

interface DayState { enabled: boolean; start: string; end: string }

function trimTime(t: string | undefined): string {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function AvailabilitySection() {
  const { slots, loading, saving, error, saveSlots } = useProviderAvailability();
  const [days, setDays] = useState<Record<number, DayState>>({});
  const [saved, setSaved] = useState(false);

  // Seed local state from server slots (first matching block per day wins)
  useEffect(() => {
    const next: Record<number, DayState> = {};
    for (const d of WEEKDAYS) {
      next[d.key] = { enabled: false, start: "09:00", end: "17:00" };
    }
    for (const s of slots as AvailabilitySlot[]) {
      const existing = next[s.day_of_week];
      if (!existing || !existing.enabled) {
        next[s.day_of_week] = {
          enabled: true,
          start: trimTime(s.start_time) || "09:00",
          end:   trimTime(s.end_time)   || "17:00",
        };
      }
    }
    setDays(next);
  }, [slots]);

  const setDay = (k: number, patch: Partial<DayState>) =>
    setDays(prev => ({ ...prev, [k]: { ...prev[k], ...patch } }));

  const handleSave = async () => {
    // Only include enabled days with a valid window
    const payload: AvailabilitySlot[] = WEEKDAYS
      .map(d => ({ k: d.key, s: days[d.key] }))
      .filter(x => x.s?.enabled && x.s.start && x.s.end && x.s.end > x.s.start)
      .map(x => ({
        day_of_week: x.k,
        start_time: x.s!.start,
        end_time: x.s!.end,
      }));

    const ok = await saveSlots(payload);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" /> Availability
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving || loading}
          className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all flex items-center gap-1.5 ${
            saved ? "bg-teal/20 text-teal" : "gradient-indigo text-primary-foreground"
          } ${saving || loading ? "opacity-60" : ""}`}
        >
          {saving ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Saving</>
          ) : saved ? (
            <><CheckCircle className="w-3 h-3" /> Saved</>
          ) : (
            "Save"
          )}
        </motion.button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Set the weekly hours clients can book you. Toggle a day off to mark it closed.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {WEEKDAYS.map(d => {
            const state = days[d.key] ?? { enabled: false, start: "09:00", end: "17:00" };
            return (
              <div
                key={d.key}
                className="flex items-center gap-2 glass-1 rounded-xl p-2.5"
              >
                <button
                  onClick={() => setDay(d.key, { enabled: !state.enabled })}
                  className={`w-9 h-5 rounded-full transition-all flex items-center px-0.5 shrink-0 ${
                    state.enabled ? "bg-indigo-500" : "bg-white/10"
                  }`}
                  aria-label={`Toggle ${d.label}`}
                >
                  <motion.div
                    animate={{ x: state.enabled ? 16 : 0 }}
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
                <span className="text-xs font-medium text-foreground w-9">{d.label}</span>
                {state.enabled ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                    <input
                      type="time"
                      value={state.start}
                      onChange={e => setDay(d.key, { start: e.target.value })}
                      className="flex-1 min-w-0 bg-white/5 text-foreground text-xs rounded-lg px-2 py-1 outline-none border border-white/10 focus:border-indigo/50 transition-colors"
                    />
                    <span className="text-[10px] text-muted-foreground">to</span>
                    <input
                      type="time"
                      value={state.end}
                      onChange={e => setDay(d.key, { end: e.target.value })}
                      className="flex-1 min-w-0 bg-white/5 text-foreground text-xs rounded-lg px-2 py-1 outline-none border border-white/10 focus:border-indigo/50 transition-colors"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground flex-1">Closed</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-[11px] text-coral">{error}</p>
      )}
    </GlassCard>
  );
}

// ────────────────────────────────────────────────────────────────────
// Calendar Sync — shows the provider's iCal URL so they can subscribe
// in Google Calendar, Apple Calendar, or Outlook.
// ────────────────────────────────────────────────────────────────────

function CalendarSyncSection() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Build iCal URL from provider profile
  const API = (import.meta.env.VITE_API_URL as string) ?? "https://bion-backend.onrender.com";
  const profileId = user?.profileId ?? user?.id ?? "";

  // The ical_token is stored alongside the provider profile. For now we
  // derive a deterministic token from the profile ID — the backend can
  // validate it. A proper token would come from the profiles table.
  const icalToken = profileId ? btoa(profileId).replace(/[+/=]/g, "").slice(0, 24) : "";
  const icalUrl = profileId
    ? `${API}/api/providers/${profileId}/calendar.ics?token=${icalToken}`
    : "";

  const copyUrl = () => {
    if (!icalUrl) return;
    navigator.clipboard.writeText(icalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!profileId) return null;

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarClock className="w-4 h-4 text-indigo" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Calendar Sync</p>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Subscribe to your BION bookings in any calendar app. New bookings appear
        automatically — no manual entry needed.
      </p>

      {/* iCal URL field */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10 overflow-hidden">
          <p className="text-[10px] text-muted-foreground mb-0.5">iCal Feed URL</p>
          <p className="text-[11px] font-data text-foreground truncate">{icalUrl}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={copyUrl}
          className={`shrink-0 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            copied ? "bg-teal/20 text-teal" : "gradient-indigo text-primary-foreground"
          }`}
        >
          {copied ? <><CheckCircle className="w-3 h-3" /> Copied</> : "Copy Link"}
        </motion.button>
      </div>

      {/* Instructions */}
      <div className="glass-1 rounded-xl p-3 space-y-2">
        <p className="text-[11px] font-medium text-foreground">How to subscribe:</p>
        <div className="space-y-1.5 text-[11px] text-muted-foreground leading-relaxed">
          <p>
            <span className="text-foreground font-medium">Google Calendar:</span>{" "}
            Other calendars (+) → From URL → paste the link above
          </p>
          <p>
            <span className="text-foreground font-medium">Apple Calendar:</span>{" "}
            File → New Calendar Subscription → paste the link above
          </p>
          <p>
            <span className="text-foreground font-medium">Outlook:</span>{" "}
            Add calendar → From internet → paste the link above
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

