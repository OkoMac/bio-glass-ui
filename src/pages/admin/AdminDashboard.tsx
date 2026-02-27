import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, ShieldCheck, Tag, Star, Settings,
  TrendingUp, Plus, Search, ChevronRight, Edit, Trash2, ToggleLeft, ToggleRight,
  BarChart3, Sparkles,
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", key: "overview" },
  { icon: Users, label: "Providers", key: "providers" },
  { icon: Tag, label: "Categories", key: "categories" },
  { icon: Star, label: "Featured", key: "featured" },
  { icon: BarChart3, label: "Analytics", key: "analytics" },
  { icon: Settings, label: "Settings", key: "settings" },
];

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [providers, setProviders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState({ providers: 0, bookings: 0, categories: 0, revenue: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [{ data: provs }, { data: cats }, { count: bookCount }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
    ]);
    setProviders(provs || []);
    setCategories(cats || []);
    const providerCount = (provs || []).length;
    setStats({ providers: providerCount, bookings: bookCount || 0, categories: (cats || []).length, revenue: 0 });
  };

  const toggleCategoryActive = async (id: string, currentActive: boolean) => {
    await supabase.from("categories").update({ is_active: !currentActive }).eq("id", id);
    loadData();
  };

  const toggleProviderActive = async (id: string, currentActive: boolean) => {
    await supabase.from("profiles").update({ is_active: !currentActive }).eq("id", id);
    loadData();
  };

  const toggleProviderFeatured = async (id: string, currentFeatured: boolean) => {
    await supabase.from("profiles").update({ is_featured: !currentFeatured }).eq("id", id);
    loadData();
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen glass-1 border-r border-foreground/5 p-4">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-xl font-bold text-foreground">BIO</span>
            <span className="text-xs px-2 py-0.5 rounded-pill gradient-indigo text-primary-foreground font-medium">Admin</span>
          </div>
          {sidebarItems.map((item) => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 w-full text-left ${
                activeTab === item.key ? "glass-accent-indigo text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              <item.icon className="w-4 h-4" />{item.label}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 max-w-6xl mx-auto w-full">
          {/* Mobile tabs */}
          <div className="lg:hidden flex gap-2 overflow-x-auto scrollbar-none mb-6 -mx-4 px-4">
            {sidebarItems.map((item) => (
              <button key={item.key} onClick={() => setActiveTab(item.key)}
                className={`shrink-0 rounded-pill px-4 py-2 text-xs font-medium ${
                  activeTab === item.key ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                }`}>{item.label}</button>
            ))}
          </div>

          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Providers", value: stats.providers, icon: Users, color: "text-indigo" },
                  { label: "Bookings", value: stats.bookings, icon: BarChart3, color: "text-teal" },
                  { label: "Categories", value: stats.categories, icon: Tag, color: "text-amber" },
                  { label: "Revenue", value: `R${stats.revenue}`, icon: TrendingUp, color: "text-coral" },
                ].map((s) => (
                  <GlassCard key={s.label} className="p-4">
                    <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                    <p className="text-2xl font-bold font-data text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </GlassCard>
                ))}
              </div>

              <GlassCard variant="accent-indigo" className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Platform Health ✦</p>
                    <p className="text-xs text-muted-foreground mt-1">5 new provider signups this week. Client retention is at 82%.</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "providers" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Providers</h1>
                <span className="text-xs text-muted-foreground">{providers.length} total</span>
              </div>
              <div className="glass-1 rounded-pill flex items-center gap-3 px-4 py-2.5">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Search providers..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              </div>
              <div className="space-y-2">
                {providers.map((p) => (
                  <GlassCard key={p.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <BioAvatar src={p.avatar_url || "/placeholder.svg"} alt={p.full_name} size="md" verticalColor={(p.vertical || "indigo") as any} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{p.full_name}</p>
                          {p.is_featured && <Star className="w-3 h-3 text-amber fill-amber" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{p.specialty || "No specialty"} · {p.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleProviderFeatured(p.id, p.is_featured)} title="Toggle featured"
                          className="glass-1 rounded-lg p-1.5">
                          <Star className={`w-3.5 h-3.5 ${p.is_featured ? "text-amber fill-amber" : "text-muted-foreground"}`} />
                        </button>
                        <button onClick={() => toggleProviderActive(p.id, p.is_active)} title="Toggle active"
                          className="glass-1 rounded-lg p-1.5">
                          {p.is_active ? <ToggleRight className="w-3.5 h-3.5 text-teal" /> : <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground" />}
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "categories" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Categories</h1>
                <motion.button whileTap={{ scale: 0.95 }} className="rounded-pill px-4 py-2 text-xs font-semibold gradient-indigo text-primary-foreground">
                  <Plus className="w-3 h-3 inline mr-1" />Add
                </motion.button>
              </div>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <GlassCard key={cat.id} className="p-4 flex items-center gap-3">
                    <span className="text-2xl">{cat.icon || "📁"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.description || "No description"}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => toggleCategoryActive(cat.id, cat.is_active)} className="glass-1 rounded-lg p-1.5">
                        {cat.is_active ? <ToggleRight className="w-3.5 h-3.5 text-teal" /> : <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                      <button className="glass-1 rounded-lg p-1.5"><Edit className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "featured" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Featured Content</h1>
                <motion.button whileTap={{ scale: 0.95 }} className="rounded-pill px-4 py-2 text-xs font-semibold gradient-indigo text-primary-foreground">
                  <Plus className="w-3 h-3 inline mr-1" />Add
                </motion.button>
              </div>
              <GlassCard className="p-6 text-center">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Manage featured providers and promotions here</p>
                <p className="text-xs text-muted-foreground mt-1">Star providers from the Providers tab to feature them</p>
              </GlassCard>
              {providers.filter(p => p.is_featured).map((p) => (
                <GlassCard key={p.id} variant="accent-amber" className="p-4 flex items-center gap-3">
                  <BioAvatar src={p.avatar_url || "/placeholder.svg"} alt={p.full_name} size="md" verticalColor={(p.vertical || "indigo") as any} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">{p.specialty}</p>
                  </div>
                  <Star className="w-4 h-4 text-amber fill-amber" />
                </GlassCard>
              ))}
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GlassCard className="p-4">
                  <p className="text-xs text-muted-foreground">Total Platform Revenue</p>
                  <p className="text-2xl font-bold font-data text-foreground mt-1">R0</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold font-data text-foreground mt-1">{stats.providers}</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold font-data text-foreground mt-1">0%</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs text-muted-foreground">Avg. Booking Value</p>
                  <p className="text-2xl font-bold font-data text-foreground mt-1">R0</p>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
              <div className="space-y-2">
                {[
                  { label: "Allow new provider signups", key: "allow_signups", value: true },
                  { label: "Enable free intro sessions", key: "free_intros", value: true },
                  { label: "Enable BIOPoints rewards", key: "biopoints", value: true },
                  { label: "Maintenance mode", key: "maintenance", value: false },
                ].map((setting) => (
                  <GlassCard key={setting.key} className="p-4 flex items-center justify-between">
                    <p className="text-sm text-foreground">{setting.label}</p>
                    {setting.value ? <ToggleRight className="w-5 h-5 text-teal" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
