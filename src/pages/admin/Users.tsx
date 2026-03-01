import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import {
  Search, Shield, ShieldCheck, ShieldOff, ChevronRight,
  Plus, X, Eye, EyeOff, CheckCircle, AlertTriangle, User, Users
} from "lucide-react";

type UserRole = "client" | "provider" | "admin" | "corporate";
type UserStatus = "active" | "suspended" | "pending_verification";

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  lastActive: string;
  verified: boolean;
  permissions: Record<string, boolean>;
  plan?: string;
}

const USERS: PlatformUser[] = [
  {
    id: "u1", name: "Mpho Sithole", email: "mpho@example.com",
    role: "client", status: "active", joinedAt: "Jun 2024", lastActive: "Today",
    verified: true,
    permissions: { book: true, wallet: true, chat: true, challenges: true, passport: true },
  },
  {
    id: "u2", name: "Lisa Dlamini", email: "lisa@example.com",
    role: "provider", status: "active", joinedAt: "Jan 2025", lastActive: "Today",
    verified: true, plan: "Pro",
    permissions: { create_services: true, manage_clients: true, analytics: true, billing: true, challenges: true },
  },
  {
    id: "u3", name: "Naledi Moyo", email: "naledi@example.com",
    role: "client", status: "active", joinedAt: "Mar 2024", lastActive: "Today",
    verified: true,
    permissions: { book: true, wallet: true, chat: true, challenges: true, passport: true },
  },
  {
    id: "u4", name: "Dr. Kagiso Sithole", email: "kagiso@example.com",
    role: "provider", status: "active", joinedAt: "Nov 2024", lastActive: "Yesterday",
    verified: true, plan: "Elite",
    permissions: { create_services: true, manage_clients: true, analytics: true, billing: true, challenges: true, medical_prescriptions: true },
  },
  {
    id: "u5", name: "Thabo Mokoena", email: "thabo@example.com",
    role: "provider", status: "suspended", joinedAt: "Dec 2024", lastActive: "14 Feb",
    verified: true, plan: "Starter",
    permissions: { create_services: false, manage_clients: true, analytics: false, billing: true, challenges: false },
  },
  {
    id: "u6", name: "Dr. Zanele Dlamini", email: "zanele@example.com",
    role: "provider", status: "pending_verification", joinedAt: "Feb 2026", lastActive: "—",
    verified: false, plan: "Pro",
    permissions: { create_services: false, manage_clients: false, analytics: false, billing: false, challenges: false },
  },
  {
    id: "u7", name: "FNB Wellness", email: "wellness@fnb.co.za",
    role: "corporate", status: "active", joinedAt: "Oct 2024", lastActive: "Today",
    verified: true,
    permissions: { manage_employees: true, wallet_topup: true, analytics: true, category_restrictions: true },
  },
  {
    id: "u8", name: "Admin User", email: "admin@bio.health",
    role: "admin", status: "active", joinedAt: "Jan 2024", lastActive: "Today",
    verified: true,
    permissions: { approve_providers: true, manage_users: true, view_analytics: true, manage_settings: true, impersonate: false },
  },
];

const ROLE_META: Record<UserRole, { label: string; color: string; icon: typeof User }> = {
  client:    { label: "Client",    color: "text-indigo bg-indigo/10 border-indigo/20",  icon: User     },
  provider:  { label: "Provider",  color: "text-teal   bg-teal/10   border-teal/20",   icon: ShieldCheck },
  admin:     { label: "Admin",     color: "text-coral  bg-coral/10  border-coral/20",  icon: Shield   },
  corporate: { label: "Corporate", color: "text-amber  bg-amber/10  border-amber/20",  icon: Users    },
};

const STATUS_META: Record<UserStatus, { label: string; dot: string }> = {
  active:               { label: "Active",     dot: "bg-teal"  },
  suspended:            { label: "Suspended",  dot: "bg-coral" },
  pending_verification: { label: "Pending",    dot: "bg-amber" },
};

const PERMISSION_LABELS: Record<string, string> = {
  book: "Book sessions", wallet: "BIONWallet", chat: "Messaging",
  challenges: "Challenges", passport: "Health Passport",
  create_services: "Create services", manage_clients: "CRM access",
  analytics: "Analytics", billing: "Billing", medical_prescriptions: "Medical prescriptions",
  manage_employees: "Manage employees", wallet_topup: "Wallet top-up",
  category_restrictions: "Category restrictions",
  approve_providers: "Approve providers", manage_users: "Manage users",
  view_analytics: "View analytics", manage_settings: "Platform settings",
  impersonate: "Impersonate users",
};

export default function AdminUsers() {
  const [users, setUsers]       = useState<PlatformUser[]>(USERS);
  const [query, setQuery]       = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [selected, setSelected] = useState<PlatformUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add user form
  const [newName, setNewName]   = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole]   = useState<UserRole>("client");
  const [addDone, setAddDone]   = useState(false);

  const filtered = users.filter(u => {
    const matchQ = u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase());
    const matchR = roleFilter === "all" || u.role === roleFilter;
    return matchQ && matchR;
  });

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u
    ));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: prev.status === "active" ? "suspended" : "active" } : null);
  };

  const togglePermission = (userId: string, perm: string) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, permissions: { ...u.permissions, [perm]: !u.permissions[perm] } } : u
    ));
    if (selected?.id === userId) {
      setSelected(prev => prev ? { ...prev, permissions: { ...prev.permissions, [perm]: !prev.permissions[perm] } } : null);
    }
  };

  const addUser = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    const newUser: PlatformUser = {
      id: Date.now().toString(),
      name: newName.trim(), email: newEmail.trim(),
      role: newRole, status: "pending_verification",
      joinedAt: "Today", lastActive: "—",
      verified: false,
      permissions: {},
    };
    setUsers(prev => [newUser, ...prev]);
    setAddDone(true);
    setTimeout(() => { setShowAddModal(false); setAddDone(false); setNewName(""); setNewEmail(""); setNewRole("client"); }, 1800);
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-4xl px-4 pt-16 pb-10 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users & Permissions</h1>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.role === "client").length} clients ·{" "}
              {users.filter(u => u.role === "provider").length} providers ·{" "}
              {users.filter(u => u.status === "suspended").length} suspended
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 gradient-indigo rounded-xl text-xs font-semibold text-primary-foreground">
            <Plus className="w-3.5 h-3.5" /> Add User
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full h-10 glass-1 rounded-pill pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none" />
        </div>

        {/* Role filter */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(["all", "client", "provider", "admin", "corporate"] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-pill text-xs font-medium capitalize whitespace-nowrap transition-all ${
                roleFilter === r ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
              }`}>
              {r === "all" ? "All roles" : r}
            </button>
          ))}
        </div>

        {/* User list */}
        <div className="space-y-2">
          {filtered.map((u, i) => {
            const meta = ROLE_META[u.role];
            const statusMeta = STATUS_META[u.status];
            return (
              <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <GlassCard hover className="p-4 cursor-pointer" onClick={() => setSelected(u)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{u.name}</p>
                        {!u.verified && <AlertTriangle className="w-3 h-3 text-amber shrink-0" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-pill border capitalize ${meta.color}`}>
                        {meta.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                        <span className="text-[10px] text-muted-foreground">{statusMeta.label}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* User detail drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)} className="fixed inset-0 bg-obsidian/70 z-50" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] overflow-hidden pb-safe"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", maxHeight: "90vh" }}
            >
              <div className="overflow-y-auto" style={{ maxHeight: "90vh" }}>
                <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
                <div className="px-5 pb-8 space-y-5">
                  {/* Identity */}
                  <div className="flex items-center gap-4 pt-2">
                    <div className="w-14 h-14 rounded-2xl gradient-indigo flex items-center justify-center text-xl font-bold text-white">
                      {selected.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selected.name}</h2>
                      <p className="text-xs text-muted-foreground">{selected.email}</p>
                      <div className="flex gap-2 mt-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-pill border capitalize ${ROLE_META[selected.role].color}`}>
                          {ROLE_META[selected.role].label}
                        </span>
                        {selected.plan && (
                          <span className="text-[10px] px-2 py-0.5 rounded-pill glass-accent-amber text-amber">{selected.plan} Plan</span>
                        )}
                        {!selected.verified && (
                          <span className="text-[10px] px-2 py-0.5 rounded-pill glass-accent-amber text-amber">Unverified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Joined",      value: selected.joinedAt   },
                      { label: "Last active", value: selected.lastActive },
                    ].map(s => (
                      <GlassCard key={s.label} className="p-3">
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5">{s.value}</p>
                      </GlassCard>
                    ))}
                  </div>

                  {/* Permissions */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Permissions</p>
                    <div className="space-y-2">
                      {Object.entries(selected.permissions).map(([perm, enabled]) => (
                        <div key={perm} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <span className="text-sm text-foreground">{PERMISSION_LABELS[perm] ?? perm}</span>
                          <button
                            onClick={() => togglePermission(selected.id, perm)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? "bg-teal/40" : "bg-white/10"}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${enabled ? "left-[22px] bg-teal" : "left-0.5 bg-white/30"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => toggleStatus(selected.id)}
                      className={`flex-1 py-3 rounded-pill text-sm font-semibold flex items-center justify-center gap-2 ${
                        selected.status === "active"
                          ? "glass-accent-coral text-coral"
                          : "glass-accent-teal text-teal"
                      }`}>
                      {selected.status === "active" ? <><ShieldOff className="w-4 h-4" /> Suspend</> : <><ShieldCheck className="w-4 h-4" /> Reinstate</>}
                    </motion.button>
                    {!selected.verified && (
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => { setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, verified: true } : u)); setSelected(prev => prev ? { ...prev, verified: true } : null); }}
                        className="flex-1 py-3 gradient-indigo rounded-pill text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Verify
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add user modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-obsidian/70 z-50" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] pb-safe"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)" }}
            >
              <div className="px-5 pt-5 pb-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-bold text-foreground">Add New User</h3>
                  <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>

                {addDone ? (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-3">✅</p>
                    <p className="text-sm font-semibold text-foreground">User created!</p>
                    <p className="text-xs text-muted-foreground mt-1">An invite email has been dispatched.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-5">
                      <div>
                        <label className="text-xs text-muted-foreground">Full name</label>
                        <input value={newName} onChange={e => setNewName(e.target.value)}
                          placeholder="e.g. Jane Smith"
                          className="w-full mt-1 glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Email address</label>
                        <input value={newEmail} onChange={e => setNewEmail(e.target.value)}
                          placeholder="e.g. jane@example.com"
                          className="w-full mt-1 glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Role</label>
                        <div className="flex gap-2 mt-1">
                          {(["client","provider","admin","corporate"] as UserRole[]).map(r => (
                            <button key={r} onClick={() => setNewRole(r)}
                              className={`flex-1 py-2 rounded-xl text-[11px] font-medium capitalize border transition-all ${
                                newRole === r ? `${ROLE_META[r].color}` : "border-white/08 glass-1 text-muted-foreground"
                              }`}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={addUser}
                      className="w-full py-3.5 gradient-indigo rounded-2xl text-sm font-bold text-primary-foreground">
                      Create User & Send Invite
                    </motion.button>
                  </>
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
