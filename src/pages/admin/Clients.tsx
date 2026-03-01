import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { Search, Users, AlertTriangle, CheckCircle, XCircle, ChevronRight } from "lucide-react";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";

interface AdminClient {
  id: string; name: string; image: string; email: string;
  location: string; joined: string; bookings: number;
  spend: string; status: "active" | "flagged" | "suspended";
}

const CLIENTS: AdminClient[] = [
  { id: "c1", name: "Oko Mthembu",     image: provider1, email: "oko@email.com",    location: "Sandton",  joined: "Jan 2026", bookings: 18, spend: "R8,100",  status: "active"  },
  { id: "c2", name: "Mpho Sithole",    image: provider2, email: "mpho@email.com",   location: "Soweto",   joined: "Jan 2026", bookings: 12, spend: "R5,400",  status: "active"  },
  { id: "c3", name: "Thandi Khumalo",  image: provider3, email: "thandi@email.com", location: "Midrand",  joined: "Dec 2025", bookings: 9,  spend: "R4,050",  status: "active"  },
  { id: "c4", name: "Kobus Pretorius", image: provider4, email: "kobus@email.com",  location: "Pretoria", joined: "Dec 2025", bookings: 7,  spend: "R2,450",  status: "flagged" },
  { id: "c5", name: "Naledi Moyo",     image: provider1, email: "naledi@email.com", location: "JHB CBD",  joined: "Nov 2025", bookings: 4,  spend: "R1,800",  status: "active"  },
  { id: "c6", name: "Amir K.",         image: provider2, email: "amir@email.com",   location: "Centurion",joined: "Oct 2025", bookings: 5,  spend: "R2,250",  status: "active"  },
];

const STATUS_CLS: Record<string, string> = {
  active:    "glass-accent-teal text-teal",
  flagged:   "glass-accent-amber text-amber",
  suspended: "glass-accent-coral text-coral",
};

export default function AdminClients() {
  const [clients, setClients] = useState(CLIENTS);
  const [query, setQuery]     = useState("");
  const [selected, setSelected] = useState<AdminClient | null>(null);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.email.toLowerCase().includes(query.toLowerCase())
  );

  const updateStatus = (id: string, status: AdminClient["status"]) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev);
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-3xl px-4 pt-16 pb-10 md:pt-8 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
            <p className="text-xs text-muted-foreground">
              {clients.filter(c => c.status === "active").length} active ·{" "}
              {clients.filter(c => c.status === "flagged").length} flagged
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search clients…"
            className="w-full h-10 glass-1 rounded-pill pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none" />
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",   value: String(clients.length),                                icon: Users,         color: "#6366F1" },
            { label: "Flagged", value: String(clients.filter(c => c.status === "flagged").length), icon: AlertTriangle, color: "#FBBF24" },
            { label: "Rev (MTD)", value: "R24,050",                                            icon: CheckCircle,  color: "#2DD4BF" },
          ].map(k => (
            <GlassCard key={k.label} className="p-3 text-center">
              <k.icon className="w-4 h-4 mx-auto mb-1" style={{ color: k.color }} />
              <p className="text-base font-bold font-data text-foreground">{k.value}</p>
              <p className="text-[10px] text-muted-foreground">{k.label}</p>
            </GlassCard>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <GlassCard hover className="p-4 cursor-pointer" onClick={() => setSelected(c)}>
                <div className="flex items-center gap-3">
                  <img src={c.image} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{c.name}</p>
                      {c.status === "flagged" && <AlertTriangle className="w-3 h-3 text-amber" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{c.email} · {c.location}</p>
                    <p className="text-[10px] text-muted-foreground">{c.bookings} bookings · {c.spend} lifetime</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-pill ${STATUS_CLS[c.status]}`}>{c.status}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Joined {c.joined}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)} className="fixed inset-0 bg-obsidian/70 z-50" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] pb-safe"
              style={{ background: "rgba(14,14,22,0.97)", backdropFilter: "blur(60px)" }}>
              <div className="px-5 py-6 space-y-4">
                <div className="flex justify-center mb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
                <div className="flex items-center gap-4">
                  <img src={selected.image} alt={selected.name} className="w-14 h-14 rounded-2xl object-cover" />
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selected.name}</h2>
                    <p className="text-xs text-muted-foreground">{selected.email}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-pill mt-1 inline-block ${STATUS_CLS[selected.status]}`}>{selected.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Bookings", value: String(selected.bookings) },
                    { label: "Lifetime spend", value: selected.spend },
                    { label: "Since", value: selected.joined },
                  ].map(s => (
                    <GlassCard key={s.label} className="p-3 text-center">
                      <p className="text-sm font-bold font-data text-foreground">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    </GlassCard>
                  ))}
                </div>
                {selected.status !== "suspended" ? (
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => updateStatus(selected.id, "suspended")}
                    className="w-full py-3 glass-accent-coral rounded-pill text-sm font-medium text-coral flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> Suspend client
                  </motion.button>
                ) : (
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => updateStatus(selected.id, "active")}
                    className="w-full py-3 glass-accent-teal rounded-pill text-sm font-medium text-teal flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Reinstate client
                  </motion.button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AdminNav />
    </div>
  );
}
