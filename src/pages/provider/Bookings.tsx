import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import { useBookings, BookingStatus } from "@/contexts/BookingsContext";
import {
  CheckCircle, XCircle, MessageSquare, Search,
  AlertTriangle, Clock, ChevronRight,
} from "lucide-react";

type Tab = "requests" | "upcoming" | "past";

const STATUS_LABEL: Partial<Record<BookingStatus, { label: string; cls: string }>> = {
  confirmed: { label: "Confirmed", cls: "glass-accent-teal text-teal"   },
  completed: { label: "Completed", cls: "glass-1 text-muted-foreground" },
  no_show:   { label: "No-show",   cls: "glass-accent-coral text-coral" },
  declined:  { label: "Declined",  cls: "glass-accent-coral text-coral" },
};

export default function ProviderBookings() {
  const navigate = useNavigate();
  const { getByStatus, confirm, decline, markNoShow, pendingCount } = useBookings();
  const [tab, setTab]   = useState<Tab>("requests");
  const [query, setQuery] = useState("");

  const pending  = getByStatus("pending");
  const upcoming = getByStatus("confirmed");
  const past     = getByStatus(["completed", "no_show", "declined"]);

  const filteredUpcoming = upcoming.filter(b =>
    b.clientName.toLowerCase().includes(query.toLowerCase()) ||
    b.service.toLowerCase().includes(query.toLowerCase())
  );

  const TAB_COUNTS: Record<Tab, number> = {
    requests: pending.length,
    upcoming: upcoming.length,
    past:     past.length,
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-2xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
          <p className="text-xs text-muted-foreground">
            {pendingCount > 0 ? `${pendingCount} request${pendingCount > 1 ? "s" : ""} awaiting response` : "No pending requests"}
          </p>
        </div>

        {/* Tab bar */}
        <div className="glass-1 rounded-pill p-1 flex">
          {(["requests","upcoming","past"] as Tab[]).map(t => (
            <motion.button key={t} whileTap={{ scale: 0.95 }} onClick={() => setTab(t)}
              className={`flex-1 rounded-pill py-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5 capitalize ${
                tab === t ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"
              }`}>
              {t === "requests" ? "Requests" : t === "upcoming" ? "Upcoming" : "Past"}
              {TAB_COUNTS[t] > 0 && (
                <span className={`text-[9px] px-1 py-0.5 rounded-full ${tab === t ? "bg-white/20" : "glass-1"}`}>
                  {TAB_COUNTS[t]}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── REQUESTS ── */}
          {tab === "requests" && (
            <motion.div key="req" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {pending.length === 0 ? (
                <div className="py-16 text-center">
                  <CheckCircle className="w-10 h-10 text-teal mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">No pending requests right now.</p>
                </div>
              ) : pending.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={b.clientImage} alt={b.clientName} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{b.clientName}</p>
                        <p className="text-[11px] text-muted-foreground">{b.service}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{b.date} · {b.time} · {b.duration}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold font-data text-foreground">{b.price}</p>
                        <span className="text-[9px] glass-accent-amber text-amber px-1.5 py-0.5 rounded-pill">Pending</span>
                      </div>
                    </div>
                    {b.note && (
                      <p className="text-[11px] text-muted-foreground italic glass-1 rounded-xl px-3 py-2 mb-3">"{b.note}"</p>
                    )}
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => confirm(b.id)}
                        className="flex-1 py-2.5 glass-accent-teal rounded-pill text-xs font-semibold text-teal flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Accept
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => decline(b.id)}
                        className="flex-1 py-2.5 glass-accent-coral rounded-pill text-xs font-medium text-coral flex items-center justify-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/pro/messages")}
                        className="p-2.5 glass-1 rounded-pill text-muted-foreground">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── UPCOMING ── */}
          {tab === "upcoming" && (
            <motion.div key="up" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search upcoming…"
                  className="w-full h-10 glass-1 rounded-pill pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none" />
              </div>
              {filteredUpcoming.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">No upcoming bookings</p>
              ) : filteredUpcoming.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <GlassCard hover className="p-4 cursor-pointer" onClick={() => navigate("/pro/clients")}>
                    <div className="flex items-center gap-3">
                      <img src={b.clientImage} alt={b.clientName} className="w-9 h-9 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{b.clientName}</p>
                        <p className="text-[11px] text-muted-foreground">{b.service} · {b.date}</p>
                        <p className="text-[10px] text-muted-foreground">{b.time} · {b.duration}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold font-data text-foreground">{b.price}</p>
                        <span className="text-[9px] glass-accent-teal text-teal px-1.5 py-0.5 rounded-pill">Confirmed</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-1" />
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── PAST ── */}
          {tab === "past" && (
            <motion.div key="past" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              {past.map((b, i) => {
                const meta = STATUS_LABEL[b.status];
                return (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <GlassCard className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={b.clientImage} alt={b.clientName} className="w-9 h-9 rounded-full object-cover opacity-70" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{b.clientName}</p>
                          <p className="text-[11px] text-muted-foreground">{b.service} · {b.date}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-data text-muted-foreground">{b.price}</p>
                          {meta && <span className={`text-[9px] px-1.5 py-0.5 rounded-pill ${meta.cls}`}>{meta.label}</span>}
                        </div>
                        {b.status === "no_show" && <AlertTriangle className="w-4 h-4 text-coral ml-1 shrink-0" />}
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BionAssistant />
      <ProviderNav />
    </div>
  );
}
