import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import RepNav from "@/components/RepNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users, ArrowLeft, MapPin, TrendingUp, Search,
} from "lucide-react";

interface RepProvider {
  id: string;
  name: string;
  service: string;
  location: string;
  status: "active" | "pending";
  monthlyRevenue: number;
  monthlyCommission: number;
  signedDate: string;
}

function getRepProviders(): RepProvider[] {
  try {
    const raw = localStorage.getItem("bion_rep_providers");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export default function RepProviders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [providers, setProviders] = useState<RepProvider[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setProviders(getRepProviders());
  }, []);

  const filtered = providers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.service.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase())
  );

  const totalCommission = filtered
    .filter(p => p.status === "active")
    .reduce((sum, p) => sum + p.monthlyCommission, 0);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow">
      <div className="mx-auto max-w-3xl px-4 pt-20 pb-28 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/rep/dashboard")}
            className="w-9 h-9 rounded-xl glass-1 flex items-center justify-center text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-foreground">My Providers</h1>
            <p className="text-xs text-muted-foreground">
              {providers.length} provider{providers.length !== 1 ? "s" : ""} signed up
            </p>
          </div>
        </div>

        {/* Search */}
        {providers.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search providers..."
              className="w-full glass-1 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
            />
          </div>
        )}

        {/* Summary card */}
        {providers.length > 0 && (
          <GlassCard variant="accent-teal" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">Monthly Commission (Active)</p>
                <p className="text-xl font-bold font-data text-foreground">R{totalCommission.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </GlassCard>
        )}

        {/* Provider list */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-8 text-center">
              <Users className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
              <h2 className="text-base font-semibold text-foreground mb-1">
                {search ? "No results found" : "No providers signed up yet"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {search
                  ? "Try a different search term."
                  : "Share your referral code with health & wellness providers to start earning commissions."}
              </p>
              {!search && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/rep/dashboard")}
                  className="mt-5 px-6 py-2.5 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
                >
                  Get Referral Code
                </motion.button>
              )}
            </GlassCard>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard hover className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-base font-bold shrink-0">
                      {p.name[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-pill font-medium shrink-0 ${
                          p.status === "active"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-amber-500/15 text-amber-400"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.service}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-muted-foreground/50" />
                        <span className="text-[10px] text-muted-foreground">{p.location}</span>
                      </div>

                      {/* Revenue row */}
                      <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-white/5">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Monthly Revenue</p>
                          <p className="text-xs font-semibold text-foreground">R{p.monthlyRevenue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Your Commission</p>
                          <p className="text-xs font-semibold text-emerald-400">R{p.monthlyCommission.toLocaleString()}</p>
                        </div>
                        <div className="ml-auto">
                          <p className="text-[10px] text-muted-foreground">Signed</p>
                          <p className="text-xs text-foreground">{p.signedDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <RepNav />
    </div>
  );
}
