import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import CorporateNav from "@/components/CorporateNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, Wallet, AlertTriangle, CheckCircle, ChevronRight, Plus, Minus, Filter, UserPlus, X, Trash2, Mail, Loader2, ArrowLeft, } from "lucide-react";

type EmployeeStatus = "active" | "inactive" | "pending";

interface Employee {
  id: string;
  name: string;
  image: string;
  email: string;
  department: string;
  walletBalance: number;
  monthlyBudget: number;
  sessionsUsed: number;
  status: EmployeeStatus;
  categories: string[];
}

// Employees loaded from backend
const EMPLOYEES: Employee[] = [];

const DEPARTMENTS = ["All", "Engineering", "Product", "Finance", "HR", "Marketing", "Operations", "Legal"];
const STATUS_META: Record<EmployeeStatus, { label: string; cls: string }> = {
  active:  { label: "Active",  cls: "glass-accent-teal text-teal"   },
  inactive:{ label: "Inactive",cls: "glass-accent-amber text-amber"  },
  pending: { label: "Pending", cls: "glass-accent-indigo text-indigo" },
};

export default function CorporateEmployees() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDemo = user?.id?.startsWith("demo_") ?? false;
  const supabaseId = !isDemo && user?.id ? user.id : null;

  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState("");
  const [dept, setDept]           = useState("All");
  const [selected, setSelected]   = useState<Employee | null>(null);
  const [topUpAmount, setTopUpAmount] = useState(500);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", monthly_budget: 1500 });
  const [inviting, setInviting] = useState(false);

  // Load employees from Supabase or localStorage
  useEffect(() => {
    const load = async () => {
      // Try Supabase first for authenticated corporate users
      if (supabaseId) {
        try {
          const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
          const res = await fetch(`${API}/api/corporate/employees`, {
            headers: { Authorization: `Bearer ${supabaseId}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data && data.data.length > 0) {
              setEmployees(data.data.map((e: any) => ({
                id: e.id ?? e.user_id,
                name: e.name ?? e.full_name ?? "Employee",
                image: "",
                email: e.email ?? "",
                department: e.department ?? "",
                walletBalance: e.wallet_balance ?? 0,
                monthlyBudget: e.monthly_budget ?? 1500,
                sessionsUsed: e.sessions_used ?? 0,
                status: e.status ?? "active",
                categories: e.categories ?? [],
              })));
              setLoading(false);
              return;
            }
          }
        } catch { /* fall through to localStorage */ }
      }

      // Fallback: localStorage
      const stored = localStorage.getItem("bion_corp_employees");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Employee[];
          if (parsed.length > 0) setEmployees(parsed);
        } catch { /* ignore */ }
      }
      setLoading(false);
    };
    load();
  }, [supabaseId]);

  // Persist employees to localStorage
  const persistEmployees = (list: Employee[]) => {
    setEmployees(list);
    localStorage.setItem("bion_corp_employees", JSON.stringify(list));
  };

  const handleInvite = () => {
    if (!inviteForm.email.trim() || !inviteForm.name.trim()) return;
    setInviting(true);

    const newEmployee: Employee = {
      id: crypto.randomUUID(),
      name: inviteForm.name,
      email: inviteForm.email,
      image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(inviteForm.name)}`,
      department: "General",
      walletBalance: inviteForm.monthly_budget,
      monthlyBudget: inviteForm.monthly_budget,
      sessionsUsed: 0,
      status: "pending",
      categories: ["Fitness", "Wellness"],
    };

    const updated = [...employees, newEmployee];
    persistEmployees(updated);
    setInviting(false);
    setShowInvite(false);
    setInviteForm({ email: "", name: "", monthly_budget: 1500 });
  };

  const handleRemove = (id: string) => {
    const updated = employees.filter(e => e.id !== id);
    persistEmployees(updated);
    if (selected?.id === id) setSelected(null);
  };

  const filtered = employees.filter(e =>
    (dept === "All" || e.department === dept) &&
    (e.name.toLowerCase().includes(query.toLowerCase()) ||
     e.email.toLowerCase().includes(query.toLowerCase()))
  );

  const totalAllocated = employees.reduce((s, e) => s + e.monthlyBudget, 0);
  const totalUsed      = employees.reduce((s, e) => s + (e.monthlyBudget - e.walletBalance), 0);
  const totalSessions  = employees.reduce((s, e) => s + e.sessionsUsed, 0);

  const topUp = (id: string, amount: number) => {
    setEmployees(prev => prev.map(e =>
      e.id === id ? { ...e, walletBalance: Math.min(e.walletBalance + amount, e.monthlyBudget + 500) } : e
    ));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, walletBalance: Math.min(prev.walletBalance + amount, prev.monthlyBudget + 500) } : null);
  };

  const updateBudget = (id: string, delta: number) => {
    setEmployees(prev => prev.map(e =>
      e.id === id ? { ...e, monthlyBudget: Math.max(0, e.monthlyBudget + delta) } : e
    ));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, monthlyBudget: Math.max(0, prev.monthlyBudget + delta) } : null);
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-3xl xl:max-w-7xl px-4 pt-16 pb-10 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Employees</h1>
            <p className="text-xs text-muted-foreground">
              {employees.filter(e => e.status === "active").length} active ·{" "}
              {employees.filter(e => e.status === "pending").length} invited ·{" "}
              {employees.filter(e => e.status === "inactive").length} inactive
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 rounded-pill px-3 py-2 gradient-indigo text-primary-foreground text-xs font-semibold">
            <UserPlus className="w-3.5 h-3.5" /> Invite Employee
          </motion.button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Budget Allocated", value: `R${totalAllocated.toLocaleString()}`, icon: Wallet,  color: "#F59E0B" },
            { label: "Budget Used",      value: `R${totalUsed.toLocaleString()}`,      icon: Users,   color: "#6366F1" },
            { label: "Sessions MTD",     value: String(totalSessions),                 icon: CheckCircle, color: "#2DD4BF" },
          ].map(k => (
            <GlassCard key={k.label} className="p-3 text-center">
              <k.icon className="w-4 h-4 mx-auto mb-1" style={{ color: k.color }} />
              <p className="text-base font-bold font-data text-foreground">{k.value}</p>
              <p className="text-[10px] text-muted-foreground">{k.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Search + filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search employees…"
              className="w-full h-10 glass-1 rounded-pill pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {DEPARTMENTS.map(d => (
              <button key={d} onClick={() => setDept(d)}
                className={`px-3 py-1.5 rounded-pill text-xs font-medium whitespace-nowrap transition-all ${
                  dept === d ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Employee list */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <GlassCard className="p-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No employees added yet</p>
              <p className="text-xs text-muted-foreground">
                Add employees to start managing their wellness budgets and sessions.
              </p>
            </GlassCard>
          )}
          {filtered.map((e, i) => {
            const usedPct = Math.round(((e.monthlyBudget - e.walletBalance) / e.monthlyBudget) * 100);
            return (
              <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <GlassCard hover className="p-4 cursor-pointer" onClick={() => setSelected(e)}>
                  <div className="flex items-center gap-3">
                    <img src={e.image} alt={e.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{e.name}</p>
                        {e.walletBalance === 0 && <AlertTriangle className="w-3 h-3 text-coral" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{e.department} · {e.email}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-amber" style={{ width: `${Math.min(usedPct, 100)}%` }} />
                        </div>
                        <span className="text-[9px] text-muted-foreground shrink-0">{usedPct}% used</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold font-data text-foreground">R{e.walletBalance.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">balance</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-pill mt-0.5 inline-block ${STATUS_META[e.status].cls}`}>
                        {STATUS_META[e.status].label}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      <button
                        onClick={(ev) => { ev.stopPropagation(); handleRemove(e.id); }}
                        className="p-1 rounded-lg hover:bg-coral/10 transition-all group"
                        title="Remove employee"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground group-hover:text-coral" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Invite Employee Modal */}
      <AnimatePresence>
        {showInvite && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowInvite(false)} className="fixed inset-0 bg-obsidian/70 z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-sm rounded-3xl overflow-hidden"
              style={{ background: "rgba(14,14,22,0.97)", backdropFilter: "blur(60px)" }}>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">Invite Employee</h3>
                  <button onClick={() => setShowInvite(false)} className="p-1 rounded-full hover:bg-white/5">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add an employee to your corporate wellness programme.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Full Name</label>
                    <input
                      value={inviteForm.name}
                      onChange={e => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Jane Smith"
                      className="w-full h-10 glass-1 rounded-xl px-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        value={inviteForm.email}
                        onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="jane@company.co.za"
                        type="email"
                        className="w-full h-10 glass-1 rounded-xl pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Monthly Budget (ZAR)</label>
                    <div className="flex items-center gap-2">
                      {[500, 1000, 1500, 2500].map(amt => (
                        <button key={amt} onClick={() => setInviteForm(prev => ({ ...prev, monthly_budget: amt }))}
                          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                            inviteForm.monthly_budget === amt ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                          }`}>
                          R{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={handleInvite}
                  disabled={inviting || !inviteForm.email.trim() || !inviteForm.name.trim()}
                  className="w-full py-3 gradient-indigo rounded-pill text-sm font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" /> {inviting ? "Inviting..." : "Send Invite"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Employee detail drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)} className="fixed inset-0 bg-obsidian/70 z-50" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] overflow-hidden pb-safe"
              style={{ background: "rgba(14,14,22,0.97)", backdropFilter: "blur(60px)", maxHeight: "90vh" }}>
              <div className="overflow-y-auto" style={{ maxHeight: "90vh" }}>
                <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
                <div className="px-5 pb-8 space-y-5">

                  {/* Identity */}
                  <div className="flex items-center gap-4 pt-2">
                    <img src={selected.image} alt={selected.name} className="w-14 h-14 rounded-2xl object-cover" />
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{selected.name}</h2>
                      <p className="text-xs text-muted-foreground">{selected.email}</p>
                      <p className="text-xs text-muted-foreground">{selected.department}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-pill mt-1 inline-block ${STATUS_META[selected.status].cls}`}>
                        {STATUS_META[selected.status].label}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Balance",   value: `R${selected.walletBalance.toLocaleString()}` },
                      { label: "Budget/Mo", value: `R${selected.monthlyBudget.toLocaleString()}` },
                      { label: "Sessions",  value: String(selected.sessionsUsed)  },
                    ].map(s => (
                      <GlassCard key={s.label} className="p-3 text-center">
                        <p className="text-sm font-bold font-data text-foreground">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                      </GlassCard>
                    ))}
                  </div>

                  {/* Allowed categories */}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Allowed Categories</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Fitness", "Medical", "Beauty", "Wellness", "Professional"].map(cat => (
                        <span key={cat} className={`text-[11px] px-2.5 py-1 rounded-pill border transition-all ${
                          selected.categories.includes(cat)
                            ? "border-indigo/40 bg-indigo/10 text-indigo"
                            : "border-white/5 text-muted-foreground"
                        }`}>{cat}</span>
                      ))}
                    </div>
                  </div>

                  {/* Top-up control */}
                  <div className="glass-1 rounded-2xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground">Top-up Wallet</p>
                    <div className="flex items-center gap-3">
                      {[250, 500, 1000, 1500].map(amt => (
                        <button key={amt} onClick={() => setTopUpAmount(amt)}
                          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                            topUpAmount === amt ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                          }`}>
                          R{amt}
                        </button>
                      ))}
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => topUp(selected.id, topUpAmount)}
                      className="w-full py-3 gradient-indigo rounded-pill text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Add R{topUpAmount} to Wallet
                    </motion.button>
                  </div>

                  {/* Budget adjustment */}
                  <div className="glass-1 rounded-2xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground">Monthly Budget</p>
                    <div className="flex items-center gap-3">
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => updateBudget(selected.id, -250)}
                        className="w-10 h-10 glass-1 rounded-full flex items-center justify-center">
                        <Minus className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                      <div className="flex-1 text-center">
                        <p className="text-2xl font-bold font-data text-foreground">R{selected.monthlyBudget.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">per month</p>
                      </div>
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => updateBudget(selected.id, 250)}
                        className="w-10 h-10 gradient-indigo rounded-full flex items-center justify-center">
                        <Plus className="w-4 h-4 text-white" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BionAssistant />
      <CorporateNav />
    </div>
  );
}
