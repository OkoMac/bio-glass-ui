import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/safeQuery";
import { Search, Users, AlertTriangle, CheckCircle, XCircle, ChevronRight, Loader2 } from "lucide-react";

interface AdminClient {
  id: string;
  name: string;
  email: string;
  location: string;
  joined: string;
  status: "active" | "flagged" | "suspended";
}

const STATUS_CLS: Record<string, string> = {
  active:    "glass-accent-teal text-teal",
  flagged:   "glass-accent-amber text-amber",
  suspended: "glass-accent-coral text-coral",
};

export default function AdminClients() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState("");
  const [selected, setSelected] = useState<AdminClient | null>(null);

  useEffect(() => {
    loadClients().catch(() => setLoading(false));
  }, []);

  const loadClients = async () => {
    try {
      const { data: roleData, error: roleErr } = await withTimeout(
        () => supabase.from("user_roles").select("user_id").eq("role", "client"),
        5000,
        { data: null, error: { message: "timeout" } } as any,
      );

      if (roleErr || !roleData || roleData.length === 0) {
        setClients([]);
        return;
      }

      const clientUserIds = roleData.map(r => r.user_id);

      const { data: profileData } = await withTimeout(
        () => supabase.from("profiles").select("id, user_id, full_name, email, location, is_active, created_at").in("user_id", clientUserIds).order("created_at", { ascending: false }),
        5000,
        { data: null } as any,
      );

      const mapped: AdminClient[] = (profileData ?? []).map(p => ({
        id: p.id ?? p.user_id,
        name: p.full_name || "Unknown",
        email: p.email || "",
        location: p.location || "Not set",
        joined: p.created_at ? new Date(p.created_at).toLocaleDateString("en-ZA", { month: "short", year: "numeric" }) : "Unknown",
        status: p.is_active === false ? "suspended" : "active",
      }));
      setClients(mapped);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.email.toLowerCase().includes(query.toLowerCase())
  );

  const updateStatus = async (id: string, status: AdminClient["status"]) => {
    const isActive = status !== "suspended";
    await supabase.from("profiles").update({ is_active: isActive } as any).eq("id", id);
    setClients(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
        <div className="mx-auto max-w-3xl xl:max-w-7xl px-4 pt-16 pb-10 md:pt-8 flex flex-col items-center justify-center gap-3" style={{ minHeight: "60vh" }}>
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading clients...</p>
        </div>
        <AdminNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-3xl xl:max-w-7xl px-4 pt-16 pb-10 md:pt-8 space-y-5">
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
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search clients..."
            className="w-full h-10 glass-1 rounded-pill pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none" />
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",   value: String(clients.length),                                    icon: Users,         color: "#6366F1" },
            { label: "Flagged", value: String(clients.filter(c => c.status === "flagged").length), icon: AlertTriangle, color: "#FBBF24" },
            { label: "Active",  value: String(clients.filter(c => c.status === "active").length),  icon: CheckCircle,   color: "#2DD4BF" },
          ].map(k => (
            <GlassCard key={k.label} className="p-3 text-center">
              <k.icon className="w-4 h-4 mx-auto mb-1" style={{ color: k.color }} />
              <p className="text-base font-bold font-data text-foreground">{k.value}</p>
              <p className="text-[10px] text-muted-foreground">{k.label}</p>
            </GlassCard>
          ))}
        </div>

        {filtered.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No clients found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {query ? "Try a different search term." : "No client accounts exist yet."}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {filtered.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <GlassCard hover className="p-4 cursor-pointer" onClick={() => setSelected(c)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{c.name}</p>
                        {c.status === "flagged" && <AlertTriangle className="w-3 h-3 text-amber" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{c.email} · {c.location}</p>
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
        )}
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
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-xl font-bold text-foreground">
                    {selected.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selected.name}</h2>
                    <p className="text-xs text-muted-foreground">{selected.email}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-pill mt-1 inline-block ${STATUS_CLS[selected.status]}`}>{selected.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Location", value: selected.location },
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
