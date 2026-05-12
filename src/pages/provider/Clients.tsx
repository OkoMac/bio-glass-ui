import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import SubscriptionGate from "@/components/SubscriptionGate";
import { Search, MessageSquare, ChevronRight, AlertTriangle, Star, X, Send, UserPlus, ArrowLeft } from "lucide-react";

interface Client {
  id: string; name: string; image: string; vertical: "teal" | "indigo" | "coral" | "amber";
  sessions: number; totalSpend: number; lastVisit: string; nextBooking: string;
  goal: string; risk: string; note: string; tags: string[];
}

const clients: Client[] = [];

const riskBadge: Record<string, { label: string; cls: string }> = {
  low:    { label: "Active",  cls: "glass-accent-teal  text-teal"  },
  medium: { label: "At risk", cls: "glass-accent-amber text-amber" },
  high:   { label: "High risk",cls: "glass-accent-coral text-coral"},
};

export default function ProviderClients() {
  const navigate = useNavigate();
  const [query, setQuery]         = useState("");
  const [selected, setSelected]   = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNote, setInviteNote]   = useState("");
  const [inviteSent, setInviteSent]   = useState(false);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.goal.toLowerCase().includes(query.toLowerCase())
  );

  const detail = clients.find(c => c.id === selected);

  const sendInvite = () => {
    if (!inviteEmail.trim()) return;
    setInviteSent(true);
    setTimeout(() => { setShowInvite(false); setInviteSent(false); setInviteEmail(""); setInviteNote(""); }, 1800);
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <SubscriptionGate feature="clientNotifications" featureName="Client Management" description="View client profiles, track session history, and manage your client relationships. Upgrade to Pro to unlock.">
      <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
            <p className="text-xs text-muted-foreground">{clients.length} total · {clients.filter(c => c.risk !== "low").length} need attention</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 px-3 py-2 gradient-indigo rounded-xl text-xs font-semibold text-primary-foreground"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Client
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search clients…"
            className="w-full h-10 glass-1 rounded-pill pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
          />
        </div>

        {/* Client list */}
        <div className="space-y-2">
          {filtered.length > 0 ? filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <GlassCard hover className="p-4 cursor-pointer" onClick={() => navigate(`/pro/clients/${c.id}`)}>
                <div className="flex items-center gap-3">
                  <BioAvatar src={c.image} alt={c.name} size="md" verticalColor={c.vertical} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{c.name}</p>
                      {c.risk !== "low" && <AlertTriangle className={`w-3.5 h-3.5 ${c.risk === "high" ? "text-coral" : "text-amber"}`} />}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{c.goal}</p>
                    <p className="text-[10px] text-muted-foreground">Last: {c.lastVisit} · {c.sessions} sessions</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-data text-foreground">R{c.totalSpend.toLocaleString()}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-pill ${riskBadge[c.risk]?.cls ?? ""}`}>
                      {riskBadge[c.risk]?.label ?? ""}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto mt-1" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )) : (
            <GlassCard className="p-8 text-center">
              <Search className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No clients yet</p>
              <p className="text-xs text-muted-foreground">Clients will appear here when they book sessions with you.</p>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Client detail drawer */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-obsidian/70 z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] overflow-hidden pb-safe"
              style={{ background: "rgba(14,14,22,0.97)", backdropFilter: "blur(60px)", maxHeight: "88vh" }}
            >
              <div className="overflow-y-auto" style={{ maxHeight: "88vh" }}>
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                <div className="px-5 pb-8 space-y-5">
                  {/* Identity */}
                  <div className="flex items-center gap-4 pt-2">
                    <BioAvatar src={detail.image} alt={detail.name} size="lg" verticalColor={detail.vertical} />
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{detail.name}</h2>
                      <p className="text-xs text-muted-foreground">{detail.goal}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {detail.tags.map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 glass-1 rounded-pill text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Sessions",  value: String(detail.sessions) },
                      { label: "Spent",     value: `R${detail.totalSpend.toLocaleString()}` },
                      { label: "Next",      value: detail.nextBooking },
                    ].map(s => (
                      <GlassCard key={s.label} className="p-3 text-center">
                        <p className="text-sm font-bold font-data text-foreground">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                      </GlassCard>
                    ))}
                  </div>

                  {/* Note */}
                  <GlassCard className="p-3.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Provider Notes</p>
                    <p className="text-xs text-foreground leading-relaxed">{detail.note}</p>
                  </GlassCard>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => { setSelected(null); navigate("/pro/messages"); }}
                      className="flex-1 py-3 gradient-indigo rounded-pill text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Message
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => { setSelected(null); navigate("/pro/bookings"); }}
                      className="flex-1 py-3 glass-1 rounded-pill text-sm font-medium text-foreground flex items-center justify-center gap-2">
                      <Star className="w-4 h-4 text-amber" /> Book Session
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Invite / Add Client modal */}
      <AnimatePresence>
        {showInvite && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowInvite(false)} className="fixed inset-0 bg-obsidian/70 z-50" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] pb-safe"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)" }}
            >
              <div className="px-5 pt-5 pb-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-bold text-foreground">Invite a Client</h3>
                  <button onClick={() => setShowInvite(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>

                {inviteSent ? (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-3">✅</p>
                    <p className="text-sm font-semibold text-foreground">Invite sent!</p>
                    <p className="text-xs text-muted-foreground mt-1">They'll receive a link to create their BION profile and connect with you.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="text-xs text-muted-foreground">Client email or phone</label>
                        <input
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          placeholder="e.g. jane@example.com or 082 555 0000"
                          className="w-full mt-1 glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Personal note (optional)</label>
                        <input
                          value={inviteNote}
                          onChange={e => setInviteNote(e.target.value)}
                          placeholder="e.g. Welcome to BION! Looking forward to your first session."
                          className="w-full mt-1 glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                        />
                      </div>
                    </div>
                    <GlassCard className="p-3 mb-4">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        The client will receive a link via email/SMS to create a BION account and connect with your profile. Once they accept, they'll appear in your client list.
                      </p>
                    </GlassCard>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={sendInvite}
                      className="w-full py-3.5 gradient-indigo rounded-2xl text-sm font-bold text-primary-foreground flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" /> Send Invite
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      </SubscriptionGate>
      <BionAssistant />
      <ProviderNav />
    </div>
  );
}
