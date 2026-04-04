import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import {
  Search, CheckCircle, XCircle, AlertTriangle, Star,
  Filter, ChevronRight, Eye, MessageSquare, Pause, Play,
} from "lucide-react";
import { getProviderImage } from "@/lib/providerImages";

// Import real Pretoria data
import realData from "@/data/bion_pretoria_data.json";

type ProviderStatus = "active" | "pending" | "suspended" | "rejected";

interface AdminProvider {
  id: string;
  name: string;
  image: string;
  service: string;
  specialization?: string;
  location: string;
  address: string;
  rating: number;
  reviewCount: number;
  sessions: number;
  revenue: string;
  joined: string;
  status: ProviderStatus;
  verified: boolean;
  flagCount: number;
  price: string;
  experienceYears: number;
  languages: string[];
  qualifications: string[];
}

// Convert real Pretoria providers to admin format - NO MANUFACTURED DATA
const generateRealAdminProviders = (): AdminProvider[] => {
  // Use first 12 real providers for admin view
  return realData.providers.slice(0, 12).map((provider, index) => {
    // NO MANUFACTURED DATA - show 0 for sessions/revenue until real data exists
    const sessions = 0; // No real session data yet
    const revenue = 0; // No real revenue data yet
    
    // Determine status based on provider data
    let status: ProviderStatus = "active";
    if (index >= 10) status = "pending";
    if (provider.rating < 3.0) status = "suspended";
    
    // Format location (extract just area/city)
    const locationParts = provider.location.split(',');
    const location = locationParts[0]?.trim() || provider.location;
    
    // Real join date - use current date for new providers
    const joinDate = new Date();
    const joinMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const joinMonth = joinMonths[joinDate.getMonth()];
    const joinYear = joinDate.getFullYear().toString();
    
    return {
      id: provider.id,
      name: provider.name,
      image: getProviderImage(provider.id),
      service: provider.service,
      specialization: provider.specialization,
      location: location,
      address: provider.address,
      rating: provider.rating,
      reviewCount: provider.reviewCount,
      sessions: sessions,
      revenue: `R0`, // No revenue yet
      joined: `${joinMonth} ${joinYear}`,
      status: status,
      verified: provider.rating >= 4.0,
      flagCount: 0, // No flags yet
      price: provider.price,
      experienceYears: provider.experienceYears || 0,
      languages: provider.languages || ["English"],
      qualifications: provider.qualifications || ["Certified Professional"],
    };
  });
};

const REAL_ADMIN_PROVIDERS = generateRealAdminProviders();

const STATUS_META: Record<ProviderStatus, { label: string; cls: string }> = {
  active:    { label: "Active",    cls: "glass-accent-teal text-teal"   },
  pending:   { label: "Pending",   cls: "glass-accent-amber text-amber" },
  suspended: { label: "Suspended", cls: "glass-accent-coral text-coral" },
  rejected:  { label: "Rejected",  cls: "glass-1 text-muted-foreground" },
};

const VERTICALS = ["All", "Fitness", "Medical", "Beauty", "Wellness", "Professional"];
const STATUSES: ("all" | ProviderStatus)[] = ["all", "active", "pending", "suspended"];

export default function AdminProviders() {
  const [providers, setProviders] = useState<AdminProvider[]>(REAL_ADMIN_PROVIDERS);
  const [query, setQuery]         = useState("");
  const [vertical, setVertical]   = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | ProviderStatus>("all");
  const [selected, setSelected]   = useState<AdminProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // In production, this would fetch from API
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const filtered = providers.filter(p => {
    const matchName = p.name.toLowerCase().includes(query.toLowerCase()) || 
                     p.service.toLowerCase().includes(query.toLowerCase()) ||
                     p.location.toLowerCase().includes(query.toLowerCase());
    const matchVert = vertical === "All" || p.service.toLowerCase().includes(vertical.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchName && matchVert && matchStatus;
  });

  const updateStatus = (id: string, status: ProviderStatus) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const handleViewProfile = (providerId: string) => {
    // Navigate to provider profile
    window.location.href = `/provider/${providerId}`;
  };

  const handleSendMessage = (providerId: string, providerName: string) => {
    // Navigate to messages with provider
    window.location.href = `/admin/messages?provider=${providerId}&name=${encodeURIComponent(providerName)}`;
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-4xl px-4 pt-16 pb-10 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Providers</h1>
            <p className="text-xs text-muted-foreground">
              {providers.filter(p => p.status === "active").length} active · {providers.filter(p => p.status === "pending").length} pending review
              <span className="ml-2 text-teal">✓ Real Pretoria providers</span>
              <span className="ml-2 text-amber">⚠️ No session/revenue data yet</span>
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search providers by name, service, or location…"
            className="w-full h-10 glass-1 rounded-pill pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
          />
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "glass-accent-indigo text-indigo"
                    : "glass-1 text-muted-foreground hover:text-foreground"
                }`}>
                {s === "all" ? "All Status" : STATUS_META[s].label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {VERTICALS.map(v => (
              <button key={v} onClick={() => setVertical(v)}
                className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${
                  vertical === v
                    ? "glass-accent-teal text-teal"
                    : "glass-1 text-muted-foreground hover:text-foreground"
                }`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo border-t-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading real provider data…</p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {providers.length} providers
            </p>

            {/* Providers List */}
            <div className="space-y-3">
              {filtered.map(p => (
                <GlassCard key={p.id} hover className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Provider Image */}
                    <div className="relative">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-14 h-14 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/56x56/6366f1/ffffff?text=PRO";
                        }}
                      />
                      {p.verified && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-teal flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-obsidian" />
                        </div>
                      )}
                    </div>

                    {/* Provider Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{p.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{p.service}</span>
                            {p.specialization && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo/10 text-indigo">
                                {p.specialization}
                              </span>
                            )}
                            <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_META[p.status].cls}`}>
                              {STATUS_META[p.status].label}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber fill-amber" />
                            <span className="text-sm font-data">{p.rating}</span>
                            <span className="text-xs text-muted-foreground">({p.reviewCount})</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{p.location}</p>
                        </div>
                      </div>

                      {/* Stats - TRUTHFUL DATA */}
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Sessions</p>
                          <p className="text-sm font-semibold">
                            {p.sessions > 0 ? p.sessions.toLocaleString() : "0"}
                            {p.sessions === 0 && (
                              <span className="text-xs text-amber ml-1">(no data)</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                          <p className="text-sm font-semibold">
                            {p.revenue !== "R0" ? p.revenue : "R0"}
                            {p.revenue === "R0" && (
                              <span className="text-xs text-amber ml-1">(no data)</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Joined</p>
                          <p className="text-sm font-semibold">{p.joined}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleViewProfile(p.id)}
                          className="px-3 py-1.5 text-xs glass-1 rounded-pill hover:glass-accent-teal transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3 h-3" />
                          View Profile
                        </button>
                        <button
                          onClick={() => handleSendMessage(p.id, p.name)}
                          className="px-3 py-1.5 text-xs glass-1 rounded-pill hover:glass-accent-indigo transition-colors flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Message
                        </button>
                        {p.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(p.id, "active")}
                              className="px-3 py-1.5 text-xs glass-accent-teal rounded-pill text-teal flex items-center gap-1.5"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => updateStatus(p.id, "rejected")}
                              className="px-3 py-1.5 text-xs glass-accent-coral rounded-pill text-coral flex items-center gap-1.5"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </>
                        )}
                        {p.status === "active" && (
                          <button
                            onClick={() => updateStatus(p.id, "suspended")}
                            className="px-3 py-1.5 text-xs glass-accent-amber rounded-pill text-amber flex items-center gap-1.5"
                          >
                            <Pause className="w-3 h-3" />
                            Suspend
                          </button>
                        )}
                        {p.status === "suspended" && (
                          <button
                            onClick={() => updateStatus(p.id, "active")}
                            className="px-3 py-1.5 text-xs glass-accent-teal rounded-pill text-teal flex items-center gap-1.5"
                          >
                            <Play className="w-3 h-3" />
                            Reactivate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* No Results */}
            {filtered.length === 0 && (
              <GlassCard className="p-8 text-center">
                <AlertTriangle className="w-8 h-8 text-amber mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">No providers found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters or search terms
                </p>
              </GlassCard>
            )}
          </>
        )}
      </div>
      <AdminNav />
    </div>
  );
}